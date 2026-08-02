// lib/seo/template-content.test.ts
// 面包屑结构化数据契约：Google 要求 itemListElement 除末位外都必须带 item（URL），
// 且各语言版本必须指向对应 locale 的规范 URL。
import { describe, it, expect } from "vitest";
import {
  templateBreadcrumbJsonLd,
  templateFaqJsonLd,
  templateUniqueFaqs,
  splitSeoIntro,
  MIN_FAQ_FOR_SCHEMA,
} from "@/lib/seo/template-content";
import { getDictionary } from "@/lib/i18n/dictionaries";
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

// ---- 详情页去同质化（PR 2）----
// 背景：52 套模板 × 2 语言曾共用同一套 4 条 FAQ 与同一段 whoFor，且 FAQPage 结构化
// 数据跟着重复 104 份。以下断言锁住「模板级独有内容」这条线不再退回通用句式。
describe("模板级独有问答", () => {
  it("每套模板都有足够进 schema 的独有问答", () => {
    for (const t of TEMPLATES) {
      const faqs = templateUniqueFaqs(t, "en");
      expect(faqs.length, `${t.id} 独有问答数`).toBeGreaterThanOrEqual(MIN_FAQ_FOR_SCHEMA);
    }
  });

  it.each(locales)("%s 独有问答跨模板不重复（否则又是一套通用 FAQ）", (locale) => {
    const questions = TEMPLATES.flatMap((t) => templateUniqueFaqs(t, locale).map((f) => f.q));
    expect(new Set(questions).size).toBe(questions.length);
    const answers = TEMPLATES.flatMap((t) => templateUniqueFaqs(t, locale).map((f) => f.a));
    expect(new Set(answers).size).toBe(answers.length);
  });

  it.each(locales)("%s 独有问答不留空", (locale) => {
    for (const t of TEMPLATES) {
      for (const f of templateUniqueFaqs(t, locale)) {
        expect(f.q.trim(), `${t.id}`).not.toBe("");
        expect(f.a.trim(), `${t.id}`).not.toBe("");
      }
    }
  });
});

describe("FAQPage 输出门槛", () => {
  it("不足门槛返回 null，调用方据此不渲染", () => {
    expect(templateFaqJsonLd([])).toBeNull();
    expect(templateFaqJsonLd([{ q: "只有一条", a: "答案" }])).toBeNull();
    expect(templateFaqJsonLd([{ q: "一", a: "1" }, { q: "二", a: "2" }])).not.toBeNull();
  });

  it.each(locales)("%s 每套模板的 FAQPage 只含独有问答，且各页两两不同", (locale) => {
    const seen = new Set<string>();
    for (const t of TEMPLATES) {
      const jsonLd = templateFaqJsonLd(templateUniqueFaqs(t, locale));
      expect(jsonLd, `${t.id} 应输出 schema`).not.toBeNull();
      const mainEntity = jsonLd!.mainEntity as { name: string }[];
      const fingerprint = mainEntity.map((q) => q.name).join("|");
      expect(seen.has(fingerprint), `${t.id} 的 FAQPage 与另一页完全相同`).toBe(false);
      seen.add(fingerprint);
    }
  });

  it.each(locales)("%s 通用问答不得混进 schema", (locale) => {
    const generic = getDictionary(locale).templateContent.faqs.map((f) => f.q);
    for (const t of TEMPLATES) {
      const jsonLd = templateFaqJsonLd(templateUniqueFaqs(t, locale))!;
      const names = (jsonLd.mainEntity as { name: string }[]).map((q) => q.name);
      // 通用问题带 {name} 占位符，此处只需确认没有整条照搬。
      for (const g of generic) expect(names).not.toContain(g);
    }
  });
});

describe("whoFor 来自 seoIntro 末句", () => {
  it.each(locales)("%s 全部模板都能拆出适用人群末句", (locale) => {
    for (const t of TEMPLATES) {
      const { body, whoFor } = splitSeoIntro(t, locale);
      expect(whoFor, `${t.id} 未能拆出 whoFor 末句`).toBeTruthy();
      expect(body, `${t.id} 拆完正文不应为空`).not.toBe("");
    }
  });

  it.each(locales)("%s 正文不再重复包含适用人群末句", (locale) => {
    for (const t of TEMPLATES) {
      const { body, whoFor } = splitSeoIntro(t, locale);
      expect(body.includes(whoFor!), `${t.id} 正文与 whoFor 重复`).toBe(false);
    }
  });

  it.each(locales)("%s whoFor 跨模板不重复（已是模板级而非通用句式）", (locale) => {
    const values = TEMPLATES.map((t) => splitSeoIntro(t, locale).whoFor);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("seoIntro 去骨架化", () => {
  it("英文开场骨架不得再由单一句式垄断", () => {
    // 改造前：52 套里 27 套以 "X is a discovery-capture template for Y" 开场。
    const skeleton = (s: string) => s.replace(/^.*? is an? /, "").split(",")[0].replace(/ for .*/, " for X");
    const counts = new Map<string, number>();
    for (const t of TEMPLATES) {
      const k = skeleton(t.seoIntro!.en);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const top = Math.max(...counts.values());
    expect(top, `最高频开场骨架出现 ${top} 次`).toBeLessThanOrEqual(6);
  });

  it("英文简介不得再由单一中段句式垄断", () => {
    const n = TEMPLATES.filter((t) => /turning ad (traffic|clicks) into/i.test(t.seoIntro!.en)).length;
    expect(n, `含 "turning ad traffic into" 的模板数 ${n}`).toBeLessThanOrEqual(12);
  });
});
