// landing-editor/lib/contactIssues.ts
// 联系方式可达性：CTA 若指向假号 / 空值，访客点了没人收、线索静默流失。两道防线：
//  1) 模板实例化时 blankTemplateContacts 清空全部渠道值——模板里的号码和邮箱都是
//     虚构的，用户在联系方式面板里看到空输入框自然会填自己的；
//  2) 发布门槛 collectContactIssues 校验主渠道有值、且各 CTA 引用的渠道都能解析出链接。
//
// 占位号全文扫描（PLACEHOLDER_CONTACTS）已删除：号码只存在 contact 一处且实例化即清空，
// 占位号无处可藏，那道兜底扫描没有对象可拦了。
import { defaultIssuesDict, type IssuesDict } from "./validate";
import type { CtaTarget, LandingPageDraft } from "@/types/schema.draft";
import type { PublishIssue } from "./validate";

/**
 * 模板实例化时清空全部渠道值。深拷贝，不改原对象。
 *
 * 清全部而不只是主渠道：模板里的号码和邮箱都是虚构的（wa.me/1555…、
 * hello@lumora-dental.com），留着任何一个都可能被原样发布出去。典型的坑是
 * b2b-sourcing——主渠道是表单，但悬浮按钮钉在 whatsapp 上，只清主渠道的话
 * 那个按钮就指着假号码。
 *
 * primary 本身保留：它是模板对「这个行业通常怎么接客户」的建议，
 * 用户可以在面板里改，但不该一上来就没有默认值。
 */
export function blankTemplateContacts(draft: LandingPageDraft): LandingPageDraft {
  const clone = JSON.parse(JSON.stringify(draft)) as LandingPageDraft;
  for (const channel of ["whatsapp", "phone", "email", "telegram"] as const) {
    delete clone.contact[channel];
  }
  return clone;
}

/**
 * 渠道展示名。WhatsApp / Telegram 是产品名不译；其余取字典（editor.issues.channels）。
 */
function channelLabel(channel: string, t: IssuesDict): string {
  if (channel === "whatsapp") return "WhatsApp";
  if (channel === "telegram") return "Telegram";
  return t.channels[channel as keyof IssuesDict["channels"]] ?? channel;
}

/**
 * 落点可达性：该 CTA 引用的渠道有没有值。
 * 指向表单时表单必须真的启用，否则访客点了原地不动。
 * 返回 issue 文案；落点有效则返回 null。
 */
function targetIssue(target: CtaTarget, draft: LandingPageDraft, what: string, t: IssuesDict): string | null {
  if (target.kind === "url") {
    return target.url.trim() ? null : t.emptyLink(what);
  }
  const channel = target.kind === "primary" ? draft.contact.primary : target.channel;
  if (channel === "form") {
    return draft.leadForm?.enabled
      ? null
      : t.formNotEnabled(what);
  }
  return draft.contact[channel]?.trim()
    ? null
    : t.channelMissing(what, channelLabel(channel, t));
}

/**
 * 发布门槛（结构化）：主渠道必须有值、各 CTA 引用的渠道必须能解析出链接、文案不得为空。
 * 悬浮按钮可选，不存在则不校验。
 */
export function collectContactIssueItems(draft: LandingPageDraft, t: IssuesDict = defaultIssuesDict): PublishIssue[] {
  const issues: PublishIssue[] = [];

  const heroIssue = draft.hero?.cta ? targetIssue(draft.hero.cta.target, draft, t.heroCta, t) : null;
  if (heroIssue) {
    // 落点指向联系方式面板而不是 hero：用户要改的是号码，不是按钮本身
    issues.push({ message: heroIssue, target: { kind: "fixed", id: "contact" } });
  }
  if (!draft.hero?.cta?.text?.trim()) {
    issues.push({
      message: t.heroCtaTextEmpty,
      target: { kind: "fixed", id: "hero" },
    });
  }

  if (draft.floatingButton) {
    if (!draft.floatingButton.text?.trim()) {
      issues.push({
        message: t.floatingTextEmpty,
        target: { kind: "fixed", id: "floatingButton" },
      });
    }
    const floatIssue = targetIssue(draft.floatingButton.target, draft, t.blocks.floatingButton, t);
    if (floatIssue) {
      issues.push({ message: floatIssue, target: { kind: "fixed", id: "contact" } });
    }
  }

  return issues;
}

/** 发布门槛：同 collectContactIssueItems，仅返回文案（服务端与既有消费方使用）。 */
export function collectContactIssues(draft: LandingPageDraft, t: IssuesDict = defaultIssuesDict): string[] {
  return collectContactIssueItems(draft, t).map((i) => i.message);
}
