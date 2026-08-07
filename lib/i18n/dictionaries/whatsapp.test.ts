// WhatsApp 产品页文案的守卫。
//
// 这一页是全站最容易写错计数口径的地方：通篇在讲 WhatsApp，顺手就会把
// 「WhatsApp 点击」写成「WhatsApp 线索」。而口径铁律是——**线索只指表单线索**，
// WhatsApp / 电话只统计点击（平台看不到对话内容，无从知道对方是否开口）。
// 这条口径在别处已复发过多次，故在此以测试钉死。
//
// ⚠️ 刻意不做「禁词表」：文案里存在大量**正确的否定表述**
// （"counted as clicks, not leads"），一张粗糙的禁词表会把它们全判为违规——
// 这个坑踩过。下面的 matcher 只匹配「WhatsApp 紧邻 lead/线索」这类肯定搭配，
// 并且用已知坏样本反向验证过 matcher 本身确实会报，避免变成永真断言。
import { describe, it, expect } from "vitest";
import { en } from "./en";
import { zh } from "./zh";
import { fillTemplateCounts } from "@/lib/templates/counts";
import { GUIDE_SLUGS } from "@/app/guides/_content";

/** 把字典切片里的所有字符串摊平，供整体扫描。 */
function texts(node: unknown): string[] {
  if (typeof node === "string") return [node];
  if (Array.isArray(node)) return node.flatMap(texts);
  if (node && typeof node === "object") return Object.values(node).flatMap(texts);
  return [];
}

/**
 * 检出「把 WhatsApp / 电话点击当成线索」的肯定搭配。
 * 只看 WhatsApp 与 lead|线索 之间不超过 12 个字符的紧邻组合。
 *
 * 两处刻意的豁免，都是被真文案打出来的：
 * ① **否定形式**（"counted as clicks, not leads" / "不计为线索"）是正确表述，
 *    见下方 offendingPhrases 里的 not/不 判断；
 * ② **lead 作定语**——"WhatsApp lead page" 里 lead 修饰 page，说的是「留资页」
 *    这种页面类型（那篇 guide 的 slug 就叫 whatsapp-lead-landing-page），
 *    不是在声称 WhatsApp 产出线索。故 lead 后紧跟 page/landing 时放行。
 *    注意 "lead lands"、"leads" 不受此豁免影响，仍会被抓。
 */
const BAD_PATTERNS = [
  /whats ?app[^.。]{0,12}\blead(?!\s+(page|landing))/i,
  /\blead(?!\s+(page|landing))[^.。]{0,12}whats ?app/i,
  /whats ?app[^。]{0,8}线索/i,
  /线索[^。]{0,8}whats ?app/i,
];

function offendingPhrases(all: string[]): string[] {
  const hits: string[] = [];
  for (const text of all) {
    for (const re of BAD_PATTERNS) {
      const m = text.match(re);
      if (!m) continue;
      // 否定形式是正确表述，放行："counted as clicks, not leads" / "不计为线索"
      if (/\bnot\b|不计|不是|非/i.test(m[0])) continue;
      hits.push(m[0]);
    }
  }
  return hits;
}

describe("WhatsApp 页计数口径", () => {
  it("matcher 本身有效——已知坏样本会被检出（防止永真断言）", () => {
    expect(
      offendingPhrases(["Every WhatsApp lead lands in your inbox."]),
    ).not.toEqual([]);
    expect(offendingPhrases(["WhatsApp 线索会进入收件箱"])).not.toEqual([]);
  });

  it("matcher 不误伤正确的否定表述", () => {
    expect(
      offendingPhrases(["WhatsApp and phone taps are counted as clicks, not leads."]),
    ).toEqual([]);
    expect(offendingPhrases(["WhatsApp 和电话点击计为点击，不计为线索。"])).toEqual([]);
  });

  it("matcher 不误伤 lead 作定语的页面类型名，但仍抓得住作名词的用法", () => {
    // lead 修饰 page —— 说的是「留资页」这种页面，放行
    expect(offendingPhrases(["Read the WhatsApp lead page guide"])).toEqual([]);
    expect(offendingPhrases(["structuring WhatsApp lead landing pages"])).toEqual([]);
    // lead 作名词 —— 声称 WhatsApp 产出线索，必须抓住
    expect(offendingPhrases(["Every WhatsApp lead lands in your inbox."])).not.toEqual([]);
    expect(offendingPhrases(["WhatsApp leads sync to your CRM."])).not.toEqual([]);
  });

  it("英文文案不把 WhatsApp 点击说成线索", () => {
    expect(offendingPhrases(texts(en.whatsapp))).toEqual([]);
  });

  it("中文文案不把 WhatsApp 点击说成线索", () => {
    expect(offendingPhrases(texts(zh.whatsapp))).toEqual([]);
  });

  it("口径澄清段必须存在——它是这页的防线，删掉即失守", () => {
    for (const dict of [en.whatsapp, zh.whatsapp]) {
      expect(dict.measurement.points.length).toBeGreaterThanOrEqual(3);
      const joined = dict.measurement.points.join(" ");
      // 必须同时出现「点击」与「线索」两个概念，否则这段没在做区分
      expect(/click|点击/i.test(joined)).toBe(true);
      expect(/lead|线索/i.test(joined)).toBe(true);
    }
  });

  it("中英文口径条目数一致", () => {
    expect(zh.whatsapp.measurement.points.length).toBe(en.whatsapp.measurement.points.length);
  });
});

describe("WhatsApp 页数量占位符", () => {
  const STATS = { templates: 54, industries: 12, whatsappTemplates: 47, whatsappIndustries: 11 };

  it("替换后不残留任何占位符", () => {
    for (const dict of [en.whatsapp, zh.whatsapp]) {
      const leftover = texts(dict)
        .map((t) => fillTemplateCounts(t, STATS))
        .filter((t) => /\{whatsappTemplates\}|\{whatsappIndustries\}|\{templates\}|\{industries\}/.test(t));
      expect(leftover).toEqual([]);
    }
  });

  it("确实替换出了真实数字（防止替换整个失效而测试仍绿）", () => {
    expect(en.whatsapp.templates.title).toContain("{whatsappTemplates}");
    expect(fillTemplateCounts(en.whatsapp.templates.title, STATS)).toContain("47");
    expect(fillTemplateCounts(zh.whatsapp.templates.desc, STATS)).toContain("11");
  });

  it("数量不得写死在文案里——只允许占位符", () => {
    // 全库模板数一旦被硬编码，加模板时必然脱节（历史上文案长期停在 "30+"）。
    for (const dict of [en.whatsapp, zh.whatsapp]) {
      for (const t of texts(dict)) {
        expect(t, t).not.toMatch(/\b(47|54)\s*(templates|套)/i);
      }
    }
  });
});

describe("WhatsApp 页与指南的互链", () => {
  it("指向的 guide slug 真实存在", () => {
    expect(GUIDE_SLUGS).toContain("whatsapp-lead-landing-page");
  });
});
