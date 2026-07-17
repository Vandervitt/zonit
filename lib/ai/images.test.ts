import { describe, it, expect, beforeAll } from "vitest";
import {
  deriveImageSlots,
  mergeImages,
  buildImageQueryPrompt,
  buildImageReplacements,
  MAX_AUTO_IMAGES,
} from "@/lib/ai/images";
import type { ImageReplacement, ImageSlot, FilledImage } from "@/lib/ai/images";
import type { LandingPageDraft } from "@/types/schema.draft";
import { loadTemplateDraft } from "@/landing-editor/samples/registry.drafts";

describe("deriveImageSlots / mergeImages", () => {
  let solar: LandingPageDraft;
  beforeAll(async () => {
    solar = await loadTemplateDraft("solar");
  });

  it("枚举 hero 与 section 背景/展示/流程图，均标 kind=generic", () => {
    const slots = deriveImageSlots(solar);
    const ids = slots.map((s) => s.id);
    // hero 背景图应在内
    expect(ids).toContain("hero.backgroundImage");
    // 每个槽都带 role / path / kind
    for (const s of slots) {
      expect(s.role).toBeTruthy();
      expect(Array.isArray(s.path)).toBe(true);
      expect(s.kind).toBeTruthy();
    }
    // 普通背景/展示图 kind=generic
    expect(slots.find((s) => s.id === "hero.backgroundImage")!.kind).toBe("generic");
  });

  it("limit 截断数量", () => {
    const all = deriveImageSlots(solar);
    const capped = deriveImageSlots(solar, 2);
    expect(capped.length).toBeLessThanOrEqual(2);
    expect(capped.length).toBeLessThanOrEqual(all.length);
  });

  it("MAX_AUTO_IMAGES 为正整数", () => {
    expect(Number.isInteger(MAX_AUTO_IMAGES)).toBe(true);
    expect(MAX_AUTO_IMAGES).toBeGreaterThan(0);
  });

  it("mergeImages 写回 src/alt，不改原对象，未知 id 忽略", () => {
    const slots = deriveImageSlots(solar);
    const target = slots.find((s) => s.id === "hero.backgroundImage")!;
    const repl: ImageReplacement[] = [
      { id: target.id, src: "https://blob.example/new.jpg", alt: "新图 alt" },
      { id: "sections.999.data.nope", src: "https://x/y.jpg" }, // 未知 id → 忽略
    ];
    const merged = mergeImages(solar, repl);
    const after = deriveImageSlots(merged).find((s) => s.id === target.id);
    // 读回节点
    const node = (merged.hero.backgroundImage as unknown as { src: string; alt?: string });
    expect(node.src).toBe("https://blob.example/new.jpg");
    expect(node.alt).toBe("新图 alt");
    expect(after).toBeTruthy();
    // 原对象未被改动
    expect((solar.hero.backgroundImage as { src: string }).src).not.toBe("https://blob.example/new.jpg");
  });

  it("mergeImages 仅写字符串字段：src/alt 缺失或非字符串时不覆盖原值", () => {
    const orig = (solar.hero.backgroundImage as { src: string }).src;
    const merged = mergeImages(solar, [
      { id: "hero.backgroundImage", alt: "只改 alt" }, // 无 src → 保留原 src
    ]);
    const node = merged.hero.backgroundImage as unknown as { src: string; alt?: string };
    expect(node.src).toBe(orig);
    expect(node.alt).toBe("只改 alt");
  });

  it("buildImageReplacements：同词去重、alt 回退、无结果跳过", async () => {
    const slots: ImageSlot[] = [
      { id: "a", path: ["hero", "backgroundImage"], role: "hero.backgroundImage", context: "", kind: "generic" },
      { id: "b", path: ["hero", "showcase"], role: "hero.showcase", context: "", kind: "generic" },
      { id: "c", path: ["sections", 0, "data", "backgroundImage"], role: "stats.backgroundImage", context: "", kind: "generic" },
      { id: "d", path: ["sections", 1, "data", "backgroundImage"], role: "story.backgroundImage", context: "", kind: "generic" },
    ];
    const plan: FilledImage[] = [
      { id: "a", query: "clean home", alt: "模型 alt A" }, // 有模型 alt
      { id: "b", query: "clean home" }, // 同词（去重），无模型 alt → 回退 resolve alt
      { id: "c", query: "no result" }, // resolve 返回 null → 跳过
      { id: "d", query: "  " }, // 空 query → 跳过
    ];
    const calls: string[] = [];
    const resolve = async (q: string) => {
      calls.push(q);
      if (q === "no result") return null;
      return { src: `blob://${q}`, alt: `resolve alt ${q}` };
    };

    const repl = await buildImageReplacements(slots, plan, resolve);

    // 同词 "clean home" 只解析一次
    expect(calls.filter((q) => q === "clean home")).toHaveLength(1);
    // a、b 命中；c（null）、d（空）跳过
    expect(repl.map((r) => r.id)).toEqual(["a", "b"]);
    expect(repl.find((r) => r.id === "a")!.alt).toBe("模型 alt A"); // 用模型 alt
    expect(repl.find((r) => r.id === "b")!.alt).toBe("resolve alt clean home"); // 回退 resolve alt
    expect(repl.every((r) => r.src === "blob://clean home")).toBe(true);
  });

  it("buildImageQueryPrompt 含全部 id 且要求覆盖", () => {
    const slots = deriveImageSlots(solar, 3);
    const prompt = buildImageQueryPrompt(
      { productName: "FreshNest", description: "Home cleaning", language: "English" },
      slots,
    );
    for (const s of slots) expect(prompt).toContain(s.id);
    expect(prompt).toContain("必须覆盖全部 id");
  });
});

describe("对比图与评价头像（before/after + avatar）", () => {
  let dental: LandingPageDraft;
  beforeAll(async () => {
    dental = await loadTemplateDraft("dental");
  });

  it("枚举含 before/after（成对、带 pairId）与 avatar，排除 content.image", () => {
    const slots = deriveImageSlots(dental);
    const before = slots.filter((s) => s.kind === "before");
    const after = slots.filter((s) => s.kind === "after");
    const avatars = slots.filter((s) => s.kind === "avatar");

    // dental 模板：2 组对比 + 3 个头像
    expect(before.length).toBe(2);
    expect(after.length).toBe(2);
    expect(avatars.length).toBe(3);

    // before/after id 指向真实字段
    expect(before.every((s) => s.id.endsWith(".beforeImage"))).toBe(true);
    expect(after.every((s) => s.id.endsWith(".afterImage"))).toBe(true);
    expect(avatars.every((s) => s.id.endsWith(".avatar"))).toBe(true);

    // 同一 item 的 before 与 after 共享 pairId；不同 item 的 pairId 不同
    for (const b of before) {
      const a = after.find((x) => x.pairId === b.pairId);
      expect(a).toBeTruthy();
      expect(b.pairId).toBeTruthy();
    }
    expect(new Set(before.map((s) => s.pairId)).size).toBe(2);

    // 评价内容配图 content.image 不纳入
    expect(slots.some((s) => s.id.endsWith(".content.image"))).toBe(false);
  });

  it("成对安全截断：任意 limit 下 before/after 对要么整对进、要么都不进", () => {
    const full = deriveImageSlots(dental);
    const pairIds = [...new Set(full.filter((s) => s.pairId).map((s) => s.pairId!))];
    for (let limit = 1; limit <= full.length + 1; limit++) {
      const capped = deriveImageSlots(dental, limit);
      expect(capped.length).toBeLessThanOrEqual(limit);
      for (const pid of pairIds) {
        const fullCount = full.filter((s) => s.pairId === pid).length;
        const cappedCount = capped.filter((s) => s.pairId === pid).length;
        expect(cappedCount === 0 || cappedCount === fullCount).toBe(true);
      }
    }
  });

  it("buildImageReplacements：avatar 不进去重缓存，相同检索词也逐个解析", async () => {
    const slots: ImageSlot[] = [
      { id: "av0", path: ["sections", 0, "data", "items", 0, "avatar"], role: "reviews.avatar", context: "", kind: "avatar" },
      { id: "av1", path: ["sections", 0, "data", "items", 1, "avatar"], role: "reviews.avatar", context: "", kind: "avatar" },
    ];
    const plan: FilledImage[] = [
      { id: "av0", query: "portrait person", alt: "客户 A 肖像" },
      { id: "av1", query: "portrait person", alt: "客户 B 肖像" }, // 同词
    ];
    const calls: { q: string; kind?: string }[] = [];
    const resolve = async (q: string, slot?: ImageSlot) => {
      calls.push({ q, kind: slot?.kind });
      // 用调用次序模拟结果池不同结果，保证不撞脸
      return { src: `blob://${q}#${calls.length}`, alt: `resolve ${q}` };
    };

    const repl = await buildImageReplacements(slots, plan, resolve);

    // 头像不去重：同词 "portrait person" 解析两次
    expect(calls.filter((c) => c.q === "portrait person")).toHaveLength(2);
    // resolve 收到 slot（可据 kind 分流）
    expect(calls.every((c) => c.kind === "avatar")).toBe(true);
    // 两个头像拿到不同 src（不撞脸）
    expect(repl.map((r) => r.src)).toEqual(["blob://portrait person#1", "blob://portrait person#2"]);
    expect(repl.map((r) => r.alt)).toEqual(["客户 A 肖像", "客户 B 肖像"]);
  });

  it("buildImageQueryPrompt：含成对约束与人像约束、标注对比组", () => {
    const slots: ImageSlot[] = [
      { id: "sections.0.data.items.0.beforeImage", path: [], role: "beforeAfter.beforeImage", context: "牙齿矫正案例", kind: "before", pairId: "sections.0.data.items.0" },
      { id: "sections.0.data.items.0.afterImage", path: [], role: "beforeAfter.afterImage", context: "牙齿矫正案例", kind: "after", pairId: "sections.0.data.items.0" },
      { id: "sections.1.data.items.0.avatar", path: [], role: "reviews.avatar", context: "Camila · Portugal", kind: "avatar" },
    ];
    const prompt = buildImageQueryPrompt(
      { productName: "Bright Dental", description: "Cosmetic dentistry", language: "English" },
      slots,
    );
    // 成对：同一主体/场景，只在问题态→结果态上不同
    expect(prompt).toContain("同一主体");
    // 人像：每个头像不同的人
    expect(prompt).toContain("头像");
    expect(prompt).toContain("不同的人");
    // 标注对比组，供模型识别成对关系
    expect(prompt).toContain("对比组");
    expect(prompt).toContain("sections.0.data.items.0");
  });
});
