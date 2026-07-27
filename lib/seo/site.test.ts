import { describe, it, expect } from "vitest";
import { marketingMetadata, siteStructuredData, SITE_URL, siteDescription } from "./site";

describe("marketingMetadata", () => {
  it("英文页 canonical 无前缀，中文页带 /zh", () => {
    const en = marketingMetadata({ locale: "en", title: "T", description: "D", path: "/" });
    const zh = marketingMetadata({ locale: "zh", title: "T", description: "D", path: "/" });
    expect(en.alternates?.canonical).toBe(`${SITE_URL}/`);
    expect(zh.alternates?.canonical).toBe(`${SITE_URL}/zh`);
  });

  it("已国际化路由的两种语言都输出完整 hreflang，且 x-default 指向英文", () => {
    for (const locale of ["en", "zh"] as const) {
      const m = marketingMetadata({ locale, title: "T", description: "D", path: "/" });
      const langs = m.alternates?.languages as Record<string, string>;
      expect(langs["en"]).toBe(`${SITE_URL}/`);
      expect(langs["zh-Hans"]).toBe(`${SITE_URL}/zh`);
      expect(langs["x-default"]).toBe(`${SITE_URL}/`);
    }
  });

  it("尚未国际化的页面不输出 hreflang——否则两条 alternate 会指向同一 URL", () => {
    const m = marketingMetadata({ locale: "zh", title: "T", description: "D", path: "/pricing" });
    expect(m.alternates?.canonical).toBe(`${SITE_URL}/pricing`);
    expect(m.alternates?.languages).toBeUndefined();
  });

  it("og:locale 随语言变化", () => {
    expect(
      marketingMetadata({ locale: "en", title: "T", description: "D", path: "/" }).openGraph?.locale,
    ).toBe("en_US");
    expect(
      marketingMetadata({ locale: "zh", title: "T", description: "D", path: "/" }).openGraph?.locale,
    ).toBe("zh_CN");
  });

  it("openGraph.url 与 canonical 一致，不会指回英文页", () => {
    const zh = marketingMetadata({ locale: "zh", title: "T", description: "D", path: "/" });
    expect(zh.openGraph?.url).toBe(`${SITE_URL}/zh`);
  });
});

describe("siteStructuredData", () => {
  const graphNode = (locale: "en" | "zh", type: string) =>
    (siteStructuredData(locale)["@graph"] as Record<string, unknown>[]).find(
      (n) => n["@type"] === type,
    )!;

  it("inLanguage 随语言变化", () => {
    expect(graphNode("en", "WebSite").inLanguage).toBe("en");
    expect(graphNode("zh", "WebSite").inLanguage).toBe("zh-Hans");
  });

  it("Organization 描述随语言变化", () => {
    expect(graphNode("en", "Organization").description).toBe(siteDescription.en);
    expect(graphNode("zh", "Organization").description).toBe(siteDescription.zh);
    expect(siteDescription.en).not.toBe(siteDescription.zh);
  });
});
