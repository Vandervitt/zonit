import { describe, it, expect } from "vitest";
import { resolvePageMeta } from "./resolve";
import type { LandingPageDraft } from "@/types/schema.draft";

function draft(over: Partial<LandingPageDraft> = {}): LandingPageDraft {
  return {
    hero: {
      title: "首屏标题\n换行", subtitle: "首屏副标题",
      cta: { text: "咨询", link: "" },
      backgroundImage: { src: "https://img/bg.jpg" },
    },
    sections: [],
    footer: { brandName: "Brand", copyrightYear: "2026", contactEmail: "", privacyPolicy: "", termsOfService: "" },
    ...over,
  } as LandingPageDraft;
}

describe("resolvePageMeta", () => {
  it("无 seo：回退 hero（title 去换行、desc=subtitle、og=背景图、noindex=false）", () => {
    const r = resolvePageMeta(draft());
    expect(r.title).toBe("首屏标题 换行");
    expect(r.description).toBe("首屏副标题");
    expect(r.ogImage).toBe("https://img/bg.jpg");
    expect(r.noindex).toBe(false);
  });
  it("seo 覆盖：用覆盖值", () => {
    const r = resolvePageMeta(draft({ seo: { metaTitle: "自定义标题", metaDescription: "自定义描述", ogImage: "https://img/og.jpg", noindex: true } }));
    expect(r.title).toBe("自定义标题");
    expect(r.description).toBe("自定义描述");
    expect(r.ogImage).toBe("https://img/og.jpg");
    expect(r.noindex).toBe(true);
  });
  it("seo 字段空白：回退 hero", () => {
    const r = resolvePageMeta(draft({ seo: { metaTitle: "   ", metaDescription: "" } }));
    expect(r.title).toBe("首屏标题 换行");
    expect(r.description).toBe("首屏副标题");
  });
  it("showcase 图作 og 兜底（无背景图）", () => {
    const d = draft();
    delete (d.hero as { backgroundImage?: unknown }).backgroundImage;
    d.hero.showcase = { type: "image", src: "https://img/show.jpg" };
    expect(resolvePageMeta(d).ogImage).toBe("https://img/show.jpg");
  });
});
