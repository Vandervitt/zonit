import { describe, it, expect } from "vitest";
import { loginMetadata, registerMetadata } from "./auth-metadata";
import { SITE_URL } from "./site";
import { getDictionary } from "@/lib/i18n/dictionaries";

// 登录/注册页曾是全站唯二只写 title、不走 marketingMetadata 的营销页：
// 无 canonical 使 /login 与 /zh/login 互相稀释，无 description 让搜索结果摘要由引擎自行拼凑。
describe("auth 页 metadata", () => {
  const cases = [
    { name: "login", build: loginMetadata, path: "/login" },
    { name: "register", build: registerMetadata, path: "/register" },
  ] as const;

  for (const { name, build, path } of cases) {
    describe(name, () => {
      it("canonical 按语言派生，不再让两种语言竞争同一页面", () => {
        expect(build("en").alternates?.canonical).toBe(`${SITE_URL}${path}`);
        expect(build("zh").alternates?.canonical).toBe(`${SITE_URL}/zh${path}`);
      });

      it("两种语言互挂 hreflang，x-default 指向英文", () => {
        for (const locale of ["en", "zh"] as const) {
          const langs = build(locale).alternates?.languages as Record<string, string>;
          expect(langs["en"]).toBe(`${SITE_URL}${path}`);
          expect(langs["zh-Hans"]).toBe(`${SITE_URL}/zh${path}`);
          expect(langs["x-default"]).toBe(`${SITE_URL}${path}`);
        }
      });

      it("title 与 description 取自对应语言字典", () => {
        for (const locale of ["en", "zh"] as const) {
          const t = getDictionary(locale).auth[name];
          expect(build(locale).title).toBe(t.metaTitle);
          expect(build(locale).description).toBe(t.metaDescription);
        }
      });

      it("中英文 description 不同——照抄一份等于没做国际化", () => {
        expect(build("en").description).not.toBe(build("zh").description);
      });

      it("openGraph.url 与 canonical 一致", () => {
        const zh = build("zh");
        expect(zh.openGraph?.url).toBe(zh.alternates?.canonical);
      });
    });
  }
});
