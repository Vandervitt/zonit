import type { LandingPageDraft } from "@/types/schema.draft";
import type { Slot, FilledSlot } from "./types";

/**
 * 这些键不是营销文案，连同其子树一并跳过：图片/链接/枚举/标识/图标/时间。
 * `alt` 为图片辅助文字，随图片一起编辑，不开放 AI 单独改写。
 */
const NON_TEXT_KEYS = new Set([
  "src", "link", "poster", "id", "provider", "type",
  "endsAt", "alt", "icon", "emoji", "channel",
]);

/** 递归抽取所有营销文案字段。 */
export function deriveSlots(draft: LandingPageDraft): Slot[] {
  const slots: Slot[] = [];

  const walk = (value: unknown, path: (string | number)[]) => {
    if (typeof value === "string") {
      const key = String(path[path.length - 1] ?? "");
      if (NON_TEXT_KEYS.has(key)) return;
      slots.push({ id: path.join("."), path: [...path], label: key, text: value });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, [...path, i]));
      return;
    }
    if (value !== null && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) {
        if (NON_TEXT_KEYS.has(k)) continue; // 黑名单键跳过整棵子树，与字符串分支语义一致
        walk(v, [...path, k]);
      }
    }
  };

  walk(draft as unknown, []);
  return slots;
}

/** 把回填文案合并回 draft（深拷贝，不改原对象）。未知 id 忽略。 */
export function mergeSlots(
  draft: LandingPageDraft,
  filled: Array<Slot | FilledSlot>,
): LandingPageDraft {
  const clone: LandingPageDraft = structuredClone(draft);
  const byId = new Map<string, (string | number)[]>(
    deriveSlots(draft).map((s) => [s.id, s.path]),
  );

  for (const f of filled) {
    const path = "path" in f ? f.path : byId.get(f.id);
    if (!path) continue;

    // 取回填文案：正常在 f.text。但 json_object 模式的模型偶发把值放到「字段 label」键
    // （如 {id:"hero.title", title:"..."}）而非 schema 约定的 text 键；此时 f.text 为
    // undefined，若直写会把必填字段置空（JSON 序列化丢键）→ 渲染崩溃。故做两点防御：
    //   1) text 缺失时，从该对象其余字符串键回收值（跳过 id/path）；
    //   2) 仍取不到字符串时跳过本槽，保留原文，绝不写入 undefined。
    const text = resolveFilledText(f);
    if (typeof text !== "string") continue;

    let cur: Record<string, unknown> | unknown[] = clone as unknown as Record<string, unknown>;
    for (let i = 0; i < path.length - 1; i++) {
      const segment = path[i];
      if (Array.isArray(cur)) {
        cur = (cur as unknown[])[segment as number] as Record<string, unknown> | unknown[];
      } else {
        cur = (cur as Record<string, unknown>)[segment as string] as Record<string, unknown> | unknown[];
      }
      if (cur === null || typeof cur !== "object") break;
    }

    if (cur !== null && typeof cur === "object") {
      const lastKey = path[path.length - 1];
      if (Array.isArray(cur)) {
        (cur as unknown[])[lastKey as number] = text;
      } else {
        (cur as Record<string, unknown>)[lastKey as string] = text;
      }
    }
  }
  return clone;
}

/**
 * 从回填对象取文案：优先 text；缺失时回收其余字符串键的值（跳过 id/path），
 * 容忍模型把值错放到字段 label 键的情况。取不到字符串则返回 undefined（调用方跳过该槽）。
 */
function resolveFilledText(f: Slot | FilledSlot): string | undefined {
  const rec = f as unknown as Record<string, unknown>;
  if (typeof rec.text === "string") return rec.text;
  for (const [k, v] of Object.entries(rec)) {
    if (k === "id" || k === "path" || k === "text") continue;
    if (typeof v === "string") return v;
  }
  return undefined;
}
