// 超管一对一邮件模板。英文：收件人是海外客户。
// 口径（10-08 回访邮件定稿）：真名 Witt 署名、只求回一行、不放链接（冷启动期送达率优先）。
// 这些是起草用的初稿，发送前在弹窗里可以任意改。

const SIGNATURE = "Thanks,\nWitt\nFounder, Urgizat";

// Google 显示名常是公司名（如 IRSA SYSTEMS），拿来称呼人会很别扭。
const COMPANY_HINT = /\b(inc|llc|ltd|limited|co|corp|company|systems?|group|agency|studio|solutions?|tech)\b/i;

function greeting(name: string | null): string {
  const n = name?.trim() ?? "";
  const looksLikeCompany = !n || COMPANY_HINT.test(n) || (n === n.toUpperCase() && /[A-Z]/.test(n) && n.includes(" "));
  return looksLikeCompany ? "Hi there," : `Hi ${n},`;
}

export const ADMIN_EMAIL_TEMPLATES = {
  stuck_check_in: {
    label: "回访：注册后未建页",
    subject: "Quick question about Urgizat",
    body: `I'm Witt, the founder of Urgizat. I noticed you signed up but haven't built a page yet. I'm not following up to sell you anything. When someone stops before the first page, it usually means we got something wrong.

Would you mind telling me in one line what happened? For example:
- you were just looking around,
- it wasn't clear where to start,
- it didn't fit what you needed, or
- something else.

A one-word reply is fine, and I read every one myself.`,
  },
  no_lead_check_in: {
    label: "回访：已发布但没线索",
    subject: "How is your page doing?",
    body: `I'm Witt, the founder of Urgizat. Your page has been live for a while, and I noticed it hasn't received a form submission yet.

If you tell me where the traffic is coming from (Facebook ads, Google, organic, not started yet), I'll take a look at the page myself and reply with two or three concrete changes. No charge, I just want to see it work.`,
  },
  trial_ending: {
    label: "提醒：试用即将到期",
    subject: "Your Urgizat Pro access ends soon",
    body: `I'm Witt, the founder of Urgizat. A quick heads-up: your Pro access ends in a few days.

If you need more time to get your first page live, just reply to this email and I'll extend it. If something is blocking you, tell me what it is and I'll help.`,
  },
  blank: { label: "空白", subject: "", body: "" },
} as const;

export type AdminEmailTemplateId = keyof typeof ADMIN_EMAIL_TEMPLATES;

export function fillAdminEmailTemplate(
  id: AdminEmailTemplateId,
  { name }: { name: string | null },
): { subject: string; body: string } {
  const t = ADMIN_EMAIL_TEMPLATES[id];
  const middle = t.body ? `${t.body}\n\n` : "\n\n";
  return { subject: t.subject, body: `${greeting(name)}\n\n${middle}${SIGNATURE}` };
}
