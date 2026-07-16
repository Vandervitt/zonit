import { describe, it, expect } from "vitest";
import { reducer } from "./editorStore";
import { fromDraft } from "../sampleDraft";
import type { LandingPageDraft } from "@/types/schema.draft";

const oldDraft: LandingPageDraft = {
  hero: { title: "Old Headline", cta: { text: "C", link: "https://wa.me/1" } },
  sections: [],
  footer: {
    brandName: "Old",
    copyrightYear: "2026",
    contactEmail: "hi@old.com",
    privacyPolicy: "p",
    termsOfService: "t",
  },
};

const newDraft: LandingPageDraft = {
  hero: { title: "New Headline", cta: { text: "Go", link: "https://wa.me/2" } },
  sections: [
    { type: "features", data: { title: "A", items: [] } },
    { type: "trust", data: { title: "B", items: [] } },
  ] as unknown as LandingPageDraft["sections"],
  footer: {
    brandName: "New",
    copyrightYear: "2026",
    contactEmail: "hi@new.com",
    privacyPolicy: "p",
    termsOfService: "t",
  },
};

describe("reducer replaceDraft", () => {
  it("整页替换：hero/footer/sections 全部换成新草稿，选中回到 Hero", () => {
    const initial = fromDraft(oldDraft);
    const next = reducer(initial, { kind: "replaceDraft", draft: newDraft });
    expect(next.hero.title).toBe("New Headline");
    expect(next.footer.brandName).toBe("New");
    expect(next.sections.map((s) => s.type)).toEqual(["features", "trust"]);
    expect(next.selectedId).toBe("hero");
  });

  it("为新 sections 补稳定且唯一的 _key", () => {
    const next = reducer(fromDraft(oldDraft), { kind: "replaceDraft", draft: newDraft });
    const keys = next.sections.map((s) => s._key);
    expect(keys.every((k) => typeof k === "string" && k.length > 0)).toBe(true);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("缺省 tracking/branding/seo 回退默认值，不为空", () => {
    const next = reducer(fromDraft(oldDraft), { kind: "replaceDraft", draft: newDraft });
    expect(next.tracking).toBeTruthy();
    expect(next.branding).toBeTruthy();
    expect(next.seo).toBeTruthy();
  });
});
