// lib/ai/images.ts
// AI 一键成页「自动配图」的纯逻辑：从 draft 枚举可换图的图片槽、构造给模型的检索词+alt
// 提示，以及把结果写回 draft。网络（Unsplash 检索 / Blob 落库）在路由层完成，本模块不触网。
import type { LandingPageDraft } from "@/types/schema.draft";
import type { GenerationBrief } from "./types";

/**
 * 图片槽类别：
 * - generic：普通背景/展示/流程图，随机图即可；按检索词去重。
 * - before / after：前后对比对里的两张，须成对可信（同主体、仅问题态→结果态不同），共享 pairId。
 * - avatar：评价区真人头像，须逐个不同（避免撞脸），不参与按检索词的去重。
 */
export type ImageKind = "generic" | "avatar" | "before" | "after";

/** 单个可换图的图片槽。 */
export interface ImageSlot {
  id: string;
  path: (string | number)[];
  role: string; // 供模型判断配图方向，如 hero.backgroundImage / process.image / stats.backgroundImage
  context: string; // 邻近文本（标题 / 名称 / 标签），提升检索相关性
  kind: ImageKind;
  pairId?: string; // 仅 before/after：同一 BeforeAfterItem 的分组键（item 路径）
}

/** 模型为每个图片槽产出的检索词与替代文字。 */
export interface FilledImage {
  id: string;
  query: string; // Unsplash 英文检索词
  alt?: string; // 按生成语言的图片替代文字
}

/** 单张换图的落地结果（由路由层填入）。 */
export interface ImageReplacement {
  id: string;
  src?: string;
  alt?: string;
}

/** 一次自动配图最多替换的图片数，控制时延 / Unsplash 配额 / Blob 存储增长。 */
export const MAX_AUTO_IMAGES = 8;

// 通用递归 walk 跳过的图片字段：视频封面（无合适随机图），以及在通用段里出现的头像/对比图
// （beforeAfter / reviews 段由专用采集器按 kind 处理，通用 walk 不应重复枚举）。
const SKIP_KEYS = new Set(["avatar", "beforeImage", "afterImage", "poster"]);
// 由专用采集器处理的整段类型：reviews（仅头像）、beforeAfter（成对对比）；通用 walk 跳过。
const SPECIAL_SECTION_TYPES = new Set(["reviews", "beforeAfter"]);

/** 取对象里可作检索上下文的邻近文本。 */
function contextOf(node: Record<string, unknown>, fallback: string): string {
  for (const k of ["title", "name", "label", "value"]) {
    const v = node[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return fallback;
}

/** 是否图片节点（含 ImageRef 与 Media-image）；视频（type==='video'）不算。 */
function isImageNode(node: unknown): node is { src: string; type?: string } {
  return (
    typeof node === "object" &&
    node !== null &&
    typeof (node as { src?: unknown }).src === "string" &&
    (node as { type?: unknown }).type !== "video"
  );
}

/**
 * 枚举可换图的图片槽（hero 优先，其后按 section 顺序）。
 * limit 缺省不限；路由层用 MAX_AUTO_IMAGES 截断，mergeImages 用默认（不限）建映射。
 */
export function deriveImageSlots(draft: LandingPageDraft, limit = Infinity): ImageSlot[] {
  const slots: ImageSlot[] = [];

  const walk = (
    value: unknown,
    path: (string | number)[],
    sectionType: string | null,
    ctx: string,
    key: string,
  ) => {
    if (isImageNode(value)) {
      if (SKIP_KEYS.has(key)) return;
      slots.push({
        id: path.join("."),
        path: [...path],
        role: `${sectionType ?? "hero"}.${key}`,
        context: ctx,
        kind: "generic",
      });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, [...path, i], sectionType, ctx, key));
      return;
    }
    if (value !== null && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      const nextCtx = contextOf(obj, ctx);
      for (const [k, v] of Object.entries(obj)) {
        if (SKIP_KEYS.has(k)) continue; // 跳过整棵子树
        walk(v, [...path, k], sectionType, nextCtx, k);
      }
    }
  };

  walk(draft.hero, ["hero"], null, typeof draft.hero.title === "string" ? draft.hero.title : "", "hero");

  draft.sections.forEach((section, i) => {
    const base = ["sections", i, "data"];
    if (section.type === "beforeAfter") {
      collectBeforeAfter(section.data, base, slots);
      return;
    }
    if (section.type === "reviews") {
      collectAvatars(section.data, base, slots);
      return;
    }
    if (SPECIAL_SECTION_TYPES.has(section.type)) return; // 兜底：其余特殊段不走通用 walk
    walk(section.data, base, section.type, "", "data");
  });

  return capSlots(slots, limit);
}

/** 取 items 数组（beforeAfter / reviews 段共用）。 */
function itemsOf(data: unknown): Record<string, unknown>[] {
  const items = (data as { items?: unknown } | null)?.items;
  if (!Array.isArray(items)) return [];
  return items.filter((it): it is Record<string, unknown> => it !== null && typeof it === "object");
}

/** 前后对比段：枚举每个 item 的 before/after 两张，标 kind 并共享 pairId（item 路径）。 */
function collectBeforeAfter(data: unknown, base: (string | number)[], slots: ImageSlot[]) {
  itemsOf(data).forEach((it, idx) => {
    const pairId = [...base, "items", idx].join(".");
    // 用案例描述作检索上下文（缺失回退案例来源名），指导「同一场景」的画面。
    const ctx =
      typeof it.caseDescription === "string" && it.caseDescription.trim()
        ? it.caseDescription
        : typeof it.crmName === "string"
          ? it.crmName
          : "";
    for (const key of ["beforeImage", "afterImage"] as const) {
      if (!isImageNode(it[key])) continue;
      slots.push({
        id: [...base, "items", idx, key].join("."),
        path: [...base, "items", idx, key],
        role: `beforeAfter.${key}`,
        context: ctx,
        kind: key === "beforeImage" ? "before" : "after",
        pairId,
      });
    }
  });
}

/** 评价段：仅枚举 avatar（真人头像）；content.image 等评价配图不纳入。 */
function collectAvatars(data: unknown, base: (string | number)[], slots: ImageSlot[]) {
  itemsOf(data).forEach((it, idx) => {
    if (!isImageNode(it.avatar)) return;
    // 用评价人姓名 + 地区作人设上下文，指导头像风格。
    const parts = [it.name, it.location, it.channel].filter((v): v is string => typeof v === "string" && !!v.trim());
    slots.push({
      id: [...base, "items", idx, "avatar"].join("."),
      path: [...base, "items", idx, "avatar"],
      role: "reviews.avatar",
      context: parts.join(" · "),
      kind: "avatar",
    });
  });
}

/**
 * 数量截断：受 limit 约束，但 before/after 对成对进出——
 * 一对整体放不下则整对跳过（不产生只填 before 不填 after 的破碎观感），继续尝试后续更小的槽。
 */
function capSlots(slots: ImageSlot[], limit: number): ImageSlot[] {
  if (!Number.isFinite(limit) || slots.length <= limit) return slots.slice(0, limit);
  const out: ImageSlot[] = [];
  const decidedPairs = new Set<string>();
  for (const s of slots) {
    if (s.pairId) {
      if (decidedPairs.has(s.pairId)) continue;
      decidedPairs.add(s.pairId);
      const pair = slots.filter((x) => x.pairId === s.pairId);
      if (out.length + pair.length <= limit) out.push(...pair);
      continue;
    }
    if (out.length < limit) out.push(s);
  }
  return out;
}

/** 把换图结果写回 draft（深拷贝，不改原对象）。仅写入字符串型 src / alt，未知 id 忽略。 */
export function mergeImages(draft: LandingPageDraft, replacements: ImageReplacement[]): LandingPageDraft {
  const clone: LandingPageDraft = structuredClone(draft);
  const byId = new Map<string, (string | number)[]>(deriveImageSlots(draft).map((s) => [s.id, s.path]));

  for (const r of replacements) {
    const path = byId.get(r.id);
    if (!path) continue;
    let cur: unknown = clone;
    for (const seg of path) {
      if (cur === null || typeof cur !== "object") {
        cur = null;
        break;
      }
      cur = (cur as Record<string | number, unknown>)[seg];
    }
    if (cur === null || typeof cur !== "object") continue;
    const node = cur as Record<string, unknown>;
    if (typeof r.src === "string" && r.src) node.src = r.src;
    if (typeof r.alt === "string" && r.alt) node.alt = r.alt;
  }
  return clone;
}

/**
 * 编排换图（网络依赖以 resolve 注入，便于测试）：按槽取模型检索词，同词只解析一次（去重），
 * alt 优先用模型产出、缺失回退 resolve 返回的 alt；resolve 返回 null（无结果/失败）则跳过该图。
 */
export async function buildImageReplacements(
  slots: ImageSlot[],
  plan: FilledImage[],
  resolve: (query: string, slot: ImageSlot) => Promise<{ src: string; alt?: string } | null>,
): Promise<ImageReplacement[]> {
  const byId = new Map(plan.map((p) => [p.id, p]));
  const cache = new Map<string, { src: string; alt?: string } | null>();
  const out: ImageReplacement[] = [];

  for (const slot of slots) {
    const p = byId.get(slot.id);
    const query = typeof p?.query === "string" ? p.query.trim() : "";
    if (!query) continue;

    // 头像不按检索词去重：同词也逐个解析，让不同评价人拿到不同的脸（由 resolve 侧取不同结果）。
    let resolved: { src: string; alt?: string } | null;
    if (slot.kind === "avatar") {
      resolved = await resolve(query, slot);
    } else {
      const key = query.toLowerCase();
      if (!cache.has(key)) cache.set(key, await resolve(query, slot));
      resolved = cache.get(key) ?? null;
    }
    if (!resolved) continue;

    const alt = typeof p?.alt === "string" && p.alt.trim() ? p.alt : resolved.alt;
    out.push({ id: slot.id, src: resolved.src, alt });
  }
  return out;
}

/** OpenAI Structured Outputs：图片检索词 + alt schema。 */
export function imageQueryJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      images: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            query: { type: "string" },
            alt: { type: "string" },
          },
          required: ["id", "query", "alt"],
        },
      },
    },
    required: ["images"],
  } as const;
}

/** 构造图片检索词 + alt 的用户提示：检索词英文，alt 按生成语言。 */
export function buildImageQueryPrompt(brief: GenerationBrief, slots: ImageSlot[]): string {
  const lang = brief.language || "English";
  const briefLine = `产品/公司：${brief.productName}｜介绍：${brief.description}${
    brief.targetAudience ? `｜目标客户：${brief.targetAudience}` : ""
  }`;
  const slotLines = slots
    .map((s) => {
      const parts = [`- id="${s.id}"`, `位置="${s.role}"`];
      if (s.pairId) parts.push(`对比组="${s.pairId}"`); // 标注成对关系，供模型识别 before/after 同组
      if (s.context) parts.push(`邻近文案="${s.context}"`);
      return parts.join(" ");
    })
    .join("\n");
  return [
    "为下列落地页图片位挑选配图检索词，并撰写图片替代文字（alt）。",
    "规则：",
    "1) query 用 2-4 个具体的英文关键词，贴合产品行业与该图位置；不要含品牌名、人名、文字水印类词。",
    `2) alt 用「${lang}」，一句话客观描述该图应呈现的画面，供 SEO/无障碍使用。`,
    "3) 每个 id 都要产出，保持 id 原样。",
    "4) 前后对比图（位置含 beforeAfter，且「对比组」相同的两个 id）：两个 query 必须描绘同一主体、",
    "   同一场景，仅在「问题状态 → 改善后状态」上不同（如 messy desk ↔ tidy desk / dull skin ↔ glowing skin），",
    "   保持画面主体与构图一致、可信；不要选到互不相关的画面。",
    "5) 评价头像（位置=reviews.avatar）：query 用人物正面头像 / portrait headshot 关键词，贴合该评价人设定；",
    "   每个头像必须是不同的人（避免所有评价人撞脸）；alt 客观描述为一位客户的肖像。",
    "",
    "【Brief】",
    briefLine,
    "",
    "【图片位】",
    slotLines,
    "",
    "返回 JSON：{ images: [{ id, query, alt }, ...] }，必须覆盖全部 id。",
  ].join("\n");
}
