// lib/seo/template-content.test.ts
// 面包屑结构化数据契约：Google 要求 itemListElement 除末位外都必须带 item（URL），
// 且各语言版本必须指向对应 locale 的规范 URL。
import { describe, it, expect } from "vitest";
import { templateBreadcrumbJsonLd } from "@/lib/seo/template-content";
import { TEMPLATES } from "@/landing-editor/samples/registry";
import { locales } from "@/lib/i18n/config";

interface ListItem {
  "@type": string;
  position: number;
  name: string;
  item?: string;
}

function items(jsonLd: Record<string, unknown>): ListItem[] {
  return jsonLd.itemListElement as ListItem[];
}

describe("templateBreadcrumbJsonLd", () => {
  it("每个 ListItem 都带 item URL（GSC「未填写字段 item」）", () => {
    for (const locale of locales) {
      for (const t of TEMPLATES) {
        for (const li of items(templateBreadcrumbJsonLd(t, locale))) {
          expect(li.item, `${locale}/${t.id} position ${li.position}`).toMatch(/^https?:\/\//);
        }
      }
    }
  });

  it("position 连续且从 1 开始", () => {
    const list = items(templateBreadcrumbJsonLd(TEMPLATES[0], "en"));
    expect(list.map((li) => li.position)).toEqual(list.map((_, i) => i + 1));
  });

  it("中文页输出 /zh 前缀的 URL", () => {
    const list = items(templateBreadcrumbJsonLd(TEMPLATES[0], "zh"));
    for (const li of list) {
      expect(li.item).toMatch(/\/zh\//);
    }
  });

  it("英文页不带 /zh 前缀", () => {
    const list = items(templateBreadcrumbJsonLd(TEMPLATES[0], "en"));
    for (const li of list) {
      expect(li.item).not.toMatch(/\/zh(\/|$)/);
    }
  });
});
