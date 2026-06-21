import { describe, it, expect, beforeAll } from "vitest";
import { deriveSlots, mergeSlots } from "@/lib/ai/slots";
import type { FilledSlot } from "@/lib/ai/types";
import type { LandingPageDraft } from "@/types/schema.draft";
import { TEMPLATES } from "@/landing-editor/samples/registry";
import { loadTemplateDraft } from "@/landing-editor/samples/registry.drafts";

describe("deriveSlots / mergeSlots", () => {
  // 草稿体现按需异步加载，测试前一次性把全部模板草稿载入。
  let drafts: LandingPageDraft[];
  let draft0: LandingPageDraft;
  beforeAll(async () => {
    drafts = await Promise.all(TEMPLATES.map((t) => loadTemplateDraft(t.id)));
    draft0 = drafts[0];
  });

  it("round-trip：抽取再合并等于原 draft（所有模板）", () => {
    for (const draft of drafts) {
      const slots = deriveSlots(draft);
      const rebuilt = mergeSlots(draft, slots);
      expect(rebuilt).toEqual(draft);
    }
  });

  it("只抽文案，不抽图片/链接/类型等字段", () => {
    const slots = deriveSlots(draft0);
    const ids = slots.map((s) => s.id);
    expect(ids).toContain("hero.title");
    expect(ids.some((id) => id.endsWith(".src"))).toBe(false);
    expect(ids.some((id) => id.endsWith(".link"))).toBe(false);
    expect(ids.some((id) => id.endsWith(".type"))).toBe(false);
  });

  it("mergeSlots 写回新文案且不改原对象", () => {
    const draft = draft0;
    const slots = deriveSlots(draft);
    const merged = mergeSlots(draft, [{ id: slots[0].id, path: slots[0].path, label: slots[0].label, text: "新标题XYZ" }]);
    const titleSlot = deriveSlots(merged).find((s) => s.id === slots[0].id);
    expect(titleSlot?.text).toBe("新标题XYZ");
    expect(draft).toEqual(mergeSlots(draft, deriveSlots(draft)));
  });

  it("FilledSlot（仅 id+text，无 path）经 byId 映射回填——AI 返回的生产路径", () => {
    const draft = draft0;
    const slots = deriveSlots(draft);
    const filled: FilledSlot[] = [{ id: slots[0].id, text: "AI 写的标题" }];
    const merged = mergeSlots(draft, filled);
    const found = deriveSlots(merged).find((s) => s.id === slots[0].id);
    expect(found?.text).toBe("AI 写的标题");
  });
});
