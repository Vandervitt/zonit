import { describe, it, expect } from "vitest";
import { templateDetailMetadata } from "./TemplateDetail";
import { templateIndustryMetadata } from "./TemplateIndustry";
import { templateGalleryMetadata } from "./TemplateGallery";

// NOINDEX_PATHS 的三处接线测试：详情页、行业页、画廊首页的 metadata 是否
// 真的对名单里的 URL 输出 robots noindex（仍 follow），名单外的照常收录。
describe("最弱模板页输出 robots noindex", () => {
  it("模板详情：英文侧在名单里 noindex，中文侧不在名单里照常", async () => {
    const en = await templateDetailMetadata("phone-case", "en");
    expect(en.robots).toEqual({ index: false, follow: true });
    const zh = await templateDetailMetadata("phone-case", "zh");
    expect(zh.robots).toBeUndefined();
  });

  it("模板详情：两侧都在名单里的，两侧都 noindex", async () => {
    expect((await templateDetailMetadata("plus-size", "en")).robots).toEqual({
      index: false,
      follow: true,
    });
    expect((await templateDetailMetadata("plus-size", "zh")).robots).toEqual({
      index: false,
      follow: true,
    });
  });

  it("模板详情：不在名单里的照常收录", async () => {
    expect((await templateDetailMetadata("skincare", "en")).robots).toBeUndefined();
    expect((await templateDetailMetadata("skincare", "zh")).robots).toBeUndefined();
  });

  it("行业页：supplement 英文侧 noindex，中文侧照常", async () => {
    expect((await templateIndustryMetadata("supplement", "en")).robots).toEqual({
      index: false,
      follow: true,
    });
    expect((await templateIndustryMetadata("supplement", "zh")).robots).toBeUndefined();
  });

  it("行业页：模板数达标且不在名单里的照常收录", async () => {
    expect((await templateIndustryMetadata("education", "en")).robots).toBeUndefined();
  });

  it("画廊首页：中英文都 noindex", () => {
    expect(templateGalleryMetadata("en").robots).toEqual({ index: false, follow: true });
    expect(templateGalleryMetadata("zh").robots).toEqual({ index: false, follow: true });
  });
});
