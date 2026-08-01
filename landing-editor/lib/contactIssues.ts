// landing-editor/lib/contactIssues.ts
// 联系方式可达性：主 CTA 若指向假号 / 为空，访客点了没人收、线索静默流失。两道防线：
//  1) 新建 / AI 生成模板时 blankPrimaryCtaLinks 把主联系 CTA（首屏主按钮 + 悬浮按钮）置空
//     —— 渠道无关（不看具体值），用户开局即被迫填自己的真实联系方式；二级 / 社交 / 锚点链接不动；
//  2) 发布门槛 collectContactIssues 校验首屏主 CTA 非空（格式由 validate.ts 的 validateLink 负责），
//     并兜底扫模板占位号（覆盖遗留页，或 section 级残留）。
import type { CtaTarget, LandingPageDraft } from "@/types/schema.draft";
import type { PublishIssue } from "./validate";

// 模板样例反复出现的占位假号（US 格式 1555…，故意不可拨打）。仅用于发布兜底扫描。
export const PLACEHOLDER_CONTACTS = ["15551234567", "15553219876", "15557654321"];

/**
 * 模板实例化时清空联系方式值，逼用户填自己的真实号码。深拷贝，不改原对象。
 *
 * 改造前是逐个置空 hero.cta.link / floatingButton.link；现在号码只存在 contact 一处，
 * 清一次即可，且覆盖全部落点——改造前有 13 处模板占位号漏在 sections 里没被清掉。
 *
 * 表单不清：它没有「用户自己的值」可填，主渠道是表单时页面开箱即用。
 * 阶段 2 本函数整体删除，改由「新建页面默认选中联系方式面板 + 发布门槛」承接。
 */
export function blankPrimaryCtaLinks(draft: LandingPageDraft): LandingPageDraft {
  const clone = JSON.parse(JSON.stringify(draft)) as LandingPageDraft;
  // 只清主渠道，与改造前「只置空主 CTA 链接」一一对应。
  // 其余渠道（典型是页脚业务邮箱）改造前从不清空，这里也不能顺手清掉。
  // 表单不清：它没有「用户自己的值」可填，主渠道是表单的模板开箱即用。
  if (clone.contact.primary !== "form") delete clone.contact[clone.contact.primary];
  return clone;
}

/** 渠道展示名（发布门槛提示用）。 */
const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  phone: "电话",
  email: "邮箱",
  telegram: "Telegram",
  form: "留资表单",
};

/**
 * 落点可达性：该 CTA 引用的渠道有没有值。
 * 指向表单时表单必须真的启用，否则访客点了原地不动。
 * 返回 issue 文案；落点有效则返回 null。
 */
function targetIssue(target: CtaTarget, draft: LandingPageDraft, what: string): string | null {
  if (target.kind === "url") {
    return target.url.trim() ? null : `${what}链接为空，访客点击不会有任何反应`;
  }
  const channel = target.kind === "primary" ? draft.contact.primary : target.channel;
  if (channel === "form") {
    return draft.leadForm?.enabled
      ? null
      : `${what}指向留资表单，但该页的留资表单未启用，访客点击不会有任何反应——请启用留资表单，或改用其他联系方式`;
  }
  return draft.contact[channel]?.trim()
    ? null
    : `${what}指向${CHANNEL_LABELS[channel]}，但你还没填这个联系方式，访客点击无法联系你`;
}

/**
 * 发布门槛（结构化）：主联系 CTA（首屏主按钮 + 悬浮按钮）链接与文案均不得为空
 * （与 blankPrimaryCtaLinks 置空的范围一一对应，置空即强制填回）；
 * 占位号兜底扫全文（无固定落点）。悬浮按钮可选，不存在则不校验。
 */
export function collectContactIssueItems(draft: LandingPageDraft): PublishIssue[] {
  const issues: PublishIssue[] = [];

  const heroIssue = draft.hero?.cta ? targetIssue(draft.hero.cta.target, draft, "首屏 CTA 按钮") : null;
  if (heroIssue) {
    issues.push({ message: heroIssue, target: { kind: "fixed", id: "hero" } });
  }
  if (!draft.hero?.cta?.text?.trim()) {
    issues.push({
      message: "首屏 CTA 按钮文案为空，请填写行动引导语（如 Chat on WhatsApp）",
      target: { kind: "fixed", id: "hero" },
    });
  }

  if (draft.floatingButton) {
    if (!draft.floatingButton.text?.trim()) {
      issues.push({
        message: "悬浮按钮文案为空，请填写行动引导语，或关闭该按钮",
        target: { kind: "fixed", id: "floatingButton" },
      });
    }
    const floatIssue = targetIssue(draft.floatingButton.target, draft, "悬浮按钮");
    if (floatIssue) {
      issues.push({ message: floatIssue, target: { kind: "fixed", id: "floatingButton" } });
    }
  }

  if (PLACEHOLDER_CONTACTS.some((n) => JSON.stringify(draft).includes(n))) {
    issues.push({
      message: "联系方式仍是模板占位号码（如 WhatsApp wa.me/1555…），请改成你的真实号码，否则收不到线索",
    });
  }

  return issues;
}

/** 发布门槛：同 collectContactIssueItems，仅返回文案（服务端与既有消费方使用）。 */
export function collectContactIssues(draft: LandingPageDraft): string[] {
  return collectContactIssueItems(draft).map((i) => i.message);
}
