// landing-editor/lib/contactIssues.ts
// 联系方式可达性：主 CTA 若指向假号 / 为空，访客点了没人收、线索静默流失。两道防线：
//  1) 新建 / AI 生成模板时 blankPrimaryCtaLinks 把主联系 CTA（首屏主按钮 + 悬浮按钮）置空
//     —— 渠道无关（不看具体值），用户开局即被迫填自己的真实联系方式；二级 / 社交 / 锚点链接不动；
//  2) 发布门槛 collectContactIssues 校验首屏主 CTA 非空（格式由 validate.ts 的 validateLink 负责），
//     并兜底扫模板占位号（覆盖遗留页，或 section 级残留）。
import type { LandingPageDraft } from "@/types/schema.draft";

// 模板样例反复出现的占位假号（US 格式 1555…，故意不可拨打）。仅用于发布兜底扫描。
export const PLACEHOLDER_CONTACTS = ["15551234567", "15553219876", "15557654321"];

/**
 * 模板实例化时把主联系 CTA（首屏主按钮 + 悬浮按钮）的链接置空。渠道无关：不管模板默认用
 * WhatsApp / Telegram / 电话，一律清空，逼用户填自己的真实联系方式。深拷贝，不改原对象。
 */
export function blankPrimaryCtaLinks(draft: LandingPageDraft): LandingPageDraft {
  const clone = JSON.parse(JSON.stringify(draft)) as LandingPageDraft;
  if (clone.hero?.cta) clone.hero.cta.link = "";
  if (clone.floatingButton) clone.floatingButton.link = "";
  return clone;
}

/** 发布门槛：首屏主 CTA 不得为空；并兜底扫占位号（遗留 / section 残留）。为空即通过。 */
export function collectContactIssues(draft: LandingPageDraft): string[] {
  const issues: string[] = [];

  const heroCtaLink = draft.hero?.cta?.link?.trim() ?? "";
  if (!heroCtaLink) {
    issues.push("首屏 CTA 按钮链接为空，访客点击无法联系你，请填入 WhatsApp / Telegram / tel: / 邮箱 等联系方式");
  }

  if (PLACEHOLDER_CONTACTS.some((n) => JSON.stringify(draft).includes(n))) {
    issues.push("联系方式仍是模板占位号码（如 WhatsApp wa.me/1555…），请改成你的真实号码，否则收不到线索");
  }

  return issues;
}
