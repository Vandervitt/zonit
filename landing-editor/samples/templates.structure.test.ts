// landing-editor/samples/templates.structure.test.ts
//
// 全库模板结构回归：模板是核心资产，一旦某套样稿与 schema 或元数据漂移，
// 用户建出来的页面就是坏的。这里对**每一套**模板断言：
//  1) 可排序区块满足 schema 的必须性 / 唯一性约束；
//  2) 字段级格式校验零问题（链接协议、图片 URL、页脚邮箱），且不含交易语义；
//  3) 页脚合规字段齐全（隐私政策 / 服务条款 / 联系邮箱）；
//  4) registry 的 conversion 标签与样稿实际转化路径一致——标了 form 就必须真有
//     启用的 leadForm，否则画廊按「表单」筛选会筛出没有表单的模板；
//  5) 启用了 leadForm 的模板至少收集一个可联系字段（name 单独不构成线索）。
import { describe, it, expect } from "vitest";
import { TEMPLATES } from "./registry";
import { loadTemplateDraft } from "./registry.drafts";
import {
  validateSections,
  isLandingPageStructureValid,
  LEAD_CONTACT_FIELDS,
  type LandingPageDraft,
} from "@/types/schema.draft";
import { collectFieldIssues } from "../lib/validate";

/**
 * 模板实例化后的草稿——与用户真正拿到的一致。
 * 注意 loadTemplateDraft 会把非锚点的主 CTA 置空（逼用户填自己的联系方式），
 * 故本文件不断言主 CTA 链接非空，只断言结构、格式与元数据一致性。
 */
async function instantiated(id: string): Promise<LandingPageDraft> {
  return loadTemplateDraft(id);
}

describe("模板库结构完整性", () => {
  it("注册表与草稿加载器一一对应", async () => {
    for (const t of TEMPLATES) {
      const draft = await instantiated(t.id);
      expect(draft, `${t.id} 没有对应的草稿加载器`).toBeTruthy();
      expect(draft.hero?.title, `${t.id} 缺少首屏标题`).toBeTruthy();
    }
  });

  it.each(TEMPLATES.map((t) => [t.id, t] as const))(
    "%s 满足 schema 与合规约束",
    async (id, meta) => {
      const draft = await instantiated(id);

      // 1) 区块必须性 / 唯一性
      const v = validateSections(draft.sections);
      expect(v.missingRequired, `${id} 缺少必须区块`).toEqual([]);
      expect(v.unsatisfiedGroups, `${id} 未满足「至少其一」分组`).toEqual([]);
      expect(v.duplicatedSingletons, `${id} 存在重复的单例区块`).toEqual([]);
      expect(isLandingPageStructureValid(draft)).toBe(true);

      // 2) 字段级格式（含交易语义链接拦截）
      expect(collectFieldIssues(draft), `${id} 存在字段格式问题`).toEqual([]);

      // 3) 页脚合规字段
      expect(draft.footer.brandName, `${id} 页脚缺品牌名`).toBeTruthy();
      expect(draft.contact.email, `${id} 缺联系邮箱`).toBeTruthy();
      expect(draft.footer.privacyPolicy, `${id} 页脚缺隐私政策`).toBeTruthy();
      expect(draft.footer.termsOfService, `${id} 页脚缺服务条款`).toBeTruthy();

      // 4) 元数据与样稿一致：标签含 form ⇒ 必须真有启用的留资表单
      if (meta.tags.conversion.includes("form")) {
        expect(draft.leadForm?.enabled, `${id} 标签含 form 但样稿无启用的 leadForm`).toBe(true);
      }

      // 5) 留资表单至少收集一个可联系字段
      if (draft.leadForm?.enabled) {
        const reachable = LEAD_CONTACT_FIELDS.some((f) => draft.leadForm!.fields[f]?.enabled);
        expect(reachable, `${id} 的留资表单没有任何可联系字段`).toBe(true);
      }
    },
  );

  it("双语元数据齐备（行业 / 一句话简介 / SEO 首段）", () => {
    for (const t of TEMPLATES) {
      for (const locale of ["en", "zh"] as const) {
        expect(t.industry[locale], `${t.id} 缺 ${locale} 行业文案`).toBeTruthy();
        expect(t.tagline[locale], `${t.id} 缺 ${locale} 一句话简介`).toBeTruthy();
        expect(t.seoIntro?.[locale], `${t.id} 缺 ${locale} SEO 首段`).toBeTruthy();
      }
    }
  });

  it("表单主转化的模板：实例化后锚点 CTA 仍指向留资表单", async () => {
    // 表单主转化的模板开箱即用：blankPrimaryCtaLinks 只清联系方式值，
    // 而表单没有「用户自己的值」可填，所以主 CTA 一建出来就是活的——
    // 否则用户还会被发布门槛要求填一个他根本不需要的联系方式。
    const anchored = TEMPLATES.filter((t) => t.tags.conversion[0] === "form");
    expect(anchored.length, "应至少有一套以表单为主转化的模板").toBeGreaterThan(0);
    for (const t of anchored) {
      const draft = await instantiated(t.id);
      expect(draft.contact.primary, `${t.id} 主渠道应为表单`).toBe("form");
      expect(draft.hero.cta.target, `${t.id} 主 CTA 应跟随主渠道`).toEqual({ kind: "primary" });
      expect(draft.leadForm?.enabled, `${t.id} 主 CTA 指向表单但表单未启用`).toBe(true);
    }
  });

  it("模板 id 唯一", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("画廊封面图不重复", () => {
    // 封面在画廊里并排显示，两套模板用同一张图一眼就能看出来，观感等同于「没做完」。
    // 新增模板时很容易从既有模板复制一条 meta 却忘了换 thumbnail，故用测试兜住。
    const byPhoto = new Map<string, string[]>();
    for (const t of TEMPLATES) {
      const photo = t.thumbnail.match(/photo-[0-9a-f-]+/)?.[0] ?? t.thumbnail;
      byPhoto.set(photo, [...(byPhoto.get(photo) ?? []), t.id]);
    }
    const duplicated = [...byPhoto]
      .filter(([, ids]) => ids.length > 1)
      .map(([photo, ids]) => `${photo} 被 ${ids.join(" / ")} 共用`);
    expect(duplicated).toEqual([]);
  });
});
