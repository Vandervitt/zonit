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

  it("枚举 hero 与 section 背景/展示/流程图，排除头像与前后对比对", () => {
    const slots = deriveImageSlots(solar);
    const ids = slots.map((s) => s.id);
    // hero 背景图应在内
    expect(ids).toContain("hero.backgroundImage");
    // 前后对比、评价头像不应出现
    expect(ids.some((id) => id.includes("beforeImage") || id.includes("afterImage"))).toBe(false);
    expect(ids.some((id) => id.endsWith(".avatar"))).toBe(false);
    // 每个槽都带 role 与 path
    for (const s of slots) {
      expect(s.role).toBeTruthy();
      expect(Array.isArray(s.path)).toBe(true);
    }
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
      { id: "a", path: ["hero", "backgroundImage"], role: "hero.backgroundImage", context: "" },
      { id: "b", path: ["hero", "showcase"], role: "hero.showcase", context: "" },
      { id: "c", path: ["sections", 0, "data", "backgroundImage"], role: "stats.backgroundImage", context: "" },
      { id: "d", path: ["sections", 1, "data", "backgroundImage"], role: "story.backgroundImage", context: "" },
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
