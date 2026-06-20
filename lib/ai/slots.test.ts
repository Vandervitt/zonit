import { describe, it, expect } from "vitest";
import { deriveSlots, mergeSlots } from "@/lib/ai/slots";
import { TEMPLATES } from "@/landing-editor/samples/registry";

describe("deriveSlots / mergeSlots", () => {
  it("round-trip：抽取再合并等于原 draft（所有模板）", () => {
    for (const t of TEMPLATES) {
      const slots = deriveSlots(t.draft);
      const rebuilt = mergeSlots(t.draft, slots);
      expect(rebuilt).toEqual(t.draft);
    }
  });

  it("只抽文案，不抽图片/链接/类型等字段", () => {
    const slots = deriveSlots(TEMPLATES[0].draft);
    const ids = slots.map((s) => s.id);
    expect(ids).toContain("hero.title");
    expect(ids.some((id) => id.endsWith(".src"))).toBe(false);
    expect(ids.some((id) => id.endsWith(".link"))).toBe(false);
    expect(ids.some((id) => id.endsWith(".type"))).toBe(false);
  });

  it("mergeSlots 写回新文案且不改原对象", () => {
    const draft = TEMPLATES[0].draft;
    const slots = deriveSlots(draft);
    const merged = mergeSlots(draft, [{ id: slots[0].id, path: slots[0].path, label: slots[0].label, text: "新标题XYZ" }]);
    const titleSlot = deriveSlots(merged).find((s) => s.id === slots[0].id);
    expect(titleSlot?.text).toBe("新标题XYZ");
    expect(draft).toEqual(mergeSlots(draft, deriveSlots(draft)));
  });
});
