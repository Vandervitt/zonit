import { describe, it, expect } from "vitest";
import { toDraft, type EditorState } from "./editorStore";
import { fromDraft } from "../sampleDraft";
import type { LandingPageDraft } from "@/types/schema.draft";

const baseDraft: LandingPageDraft = {
  hero: { title: "T", cta: { text: "C", link: "https://wa.me/1" } },
  sections: [],
  footer: {
    brandName: "B",
    copyrightYear: "2026",
    contactEmail: "hi@b.com",
    privacyPolicy: "p",
    termsOfService: "t",
  },
};

describe("editor variantSeed 往返", () => {
  it("fromDraft 携带 variantSeed", () => {
    const state = fromDraft({ ...baseDraft, variantSeed: "seed-x" });
    expect(state.variantSeed).toBe("seed-x");
  });

  it("缺省 variantSeed 为 undefined，toDraft 不写空字段", () => {
    const state = fromDraft(baseDraft);
    expect(state.variantSeed).toBeUndefined();
    expect("variantSeed" in toDraft(state)).toBe(false);
  });

  it("toDraft 回写已设置的 variantSeed", () => {
    const state: EditorState = { ...fromDraft(baseDraft), variantSeed: "seed-y" };
    expect(toDraft(state).variantSeed).toBe("seed-y");
  });
});
