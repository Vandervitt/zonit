// 外贸询盘落地页（/rfq-landing-page）文案与配置的守卫。
//
// 这页的卖点全部落在产品现有能力上，守的是三件容易在改文案时悄悄破掉的事：
// ① 模板数量不写死——由注册表按「B2B 询价型」实时计算；
// ② 线索口径——只有表单提交算线索，WhatsApp / 电话只算点击；
// ③ 生成页非交易——询价（quote / enquiry）可以，下单、购物车、结账不行。
import { describe, it, expect } from "vitest";
import { en } from "./en";
import { zh } from "./zh";
import { fillTemplateCounts } from "@/lib/templates/counts";
import { TEMPLATE_STATS } from "@/lib/templates/stats";
import { TEMPLATES } from "@/landing-editor/samples/registry";
import { GUIDE_SLUGS } from "@/app/guides/_content";
import { RFQ_GUIDE_SLUG, RFQ_PRIMARY_TEMPLATE, isRfqTemplate } from "@/lib/marketing/rfq";

function texts(node: unknown): string[] {
  if (typeof node === "string") return [node];
  if (Array.isArray(node)) return node.flatMap(texts);
  if (node && typeof node === "object") return Object.values(node).flatMap(texts);
  return [];
}

function shape(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(shape);
  if (node && typeof node === "object") {
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, shape(v)]));
  }
  return typeof node;
}

const TRANSACTION = [/\b(check ?out|shopping cart|add to cart|place (an|your) order|purchase order)\b/i, /下单|购物车|结账|订单/];
const transactionHits = (all: string[]) => all.filter((s) => TRANSACTION.some((re) => re.test(s)));

const CLICK_AS_LEAD = [
  /(whats ?app|phone|call)[^.。]{0,12}\bleads?\b/i,
  /(whats ?app|电话)[^。]{0,8}线索/i,
];
const clickAsLeadHits = (all: string[]) =>
  all.filter((s) => CLICK_AS_LEAD.some((re) => {
    const m = s.match(re);
    return m && !/\bnot\b|不算|不计|只统计/.test(m[0]);
  }));

describe("外贸询盘页文案", () => {
  it("中英字典结构一致", () => {
    expect(shape(zh.rfq)).toEqual(shape(en.rfq));
  });

  it("数量占位符全部可被替换，不残留花括号", () => {
    for (const dict of [en.rfq, zh.rfq]) {
      const leftovers = texts(dict).map((s) => fillTemplateCounts(s, TEMPLATE_STATS)).filter((s) => /\{\w+\}/.test(s));
      expect(leftovers).toEqual([]);
    }
  });

  it("交易用语 matcher 有效（坏样本会报），且两种语言文案都不含交易用语", () => {
    expect(transactionHits(["Add to cart and check out"])).not.toEqual([]);
    expect(transactionHits(["询价后直接下单"])).not.toEqual([]);
    expect(transactionHits(texts(en.rfq))).toEqual([]);
    expect(transactionHits(texts(zh.rfq))).toEqual([]);
  });

  it("口径 matcher 有效（坏样本会报、否定句放行），且文案不把 WhatsApp/电话说成线索", () => {
    expect(clickAsLeadHits(["Every WhatsApp lead lands in your inbox"])).not.toEqual([]);
    expect(clickAsLeadHits(["WhatsApp 线索直接进收件箱"])).not.toEqual([]);
    expect(clickAsLeadHits(["WhatsApp and phone taps count as clicks, not leads"])).toEqual([]);
    expect(clickAsLeadHits(texts(en.rfq))).toEqual([]);
    expect(clickAsLeadHits(texts(zh.rfq))).toEqual([]);
  });
});

// 中文面借用目标人群自己的词「独立站」（福步建站板块的需求帖都这么说），但产品是单页，
// 不带产品目录、多栏目和 SEO 架构——每处「独立站」必须在同一句里带「单页」限定，否则就是超卖。
const UNQUALIFIED_SITE = (s: string) => /独立站/.test(s) && !/单页/.test(s);

describe("中文「独立站」说法不超卖", () => {
  it("matcher 有效，且中文文案里的「独立站」都带「单页」限定", () => {
    expect(UNQUALIFIED_SITE("生成你的外贸独立站")).toBe(true);
    expect(UNQUALIFIED_SITE("外贸询盘独立站（单页版）")).toBe(false);
    expect(texts(zh.rfq).filter(UNQUALIFIED_SITE)).toEqual([]);
  });
});

describe("外贸询盘页引用的配置真实存在", () => {
  it("主 CTA 的模板在注册表里，且是询价型模板", () => {
    const tpl = TEMPLATES.find((t) => t.id === RFQ_PRIMARY_TEMPLATE);
    expect(tpl).toBeDefined();
    expect(isRfqTemplate(tpl!)).toBe(true);
  });

  it("指向的指南存在", () => {
    expect(GUIDE_SLUGS).toContain(RFQ_GUIDE_SLUG);
  });

  it("{rfqTemplates} 等于注册表里 B2B 询价型模板数，且每一套都带询价表单", () => {
    const rfq = TEMPLATES.filter(isRfqTemplate);
    expect(TEMPLATE_STATS.rfqTemplates).toBe(rfq.length);
    expect(rfq.length).toBeGreaterThan(0);
    expect(rfq.every((t) => t.tags.conversion.includes("form"))).toBe(true);
  });

  it("SaaS 演示类不算外贸询价模板", () => {
    expect(TEMPLATES.filter(isRfqTemplate).map((t) => t.id)).not.toContain("saas-demo");
  });
});
