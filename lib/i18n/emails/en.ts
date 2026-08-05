// 平台发出的事务邮件文案（英文，事实源）。
//
// ⚠️ 与 lib/i18n/admin 分开：邮件只在服务端渲染，没必要进任何客户端 bundle。
// 收件人的语言取自 users.locale，随各自的候选查询一起从 DB 带出——
// 邮件是异步发送的，没有请求上下文可读 cookie。
export const emails = {
  otp: {
    subject: (code: string) => `Zap Bridge sign-in code: ${code}`,
    heading: "Your sign-in code",
    intro: "Use this code to sign in to Zap Bridge. It's valid for 10 minutes — don't share it with anyone.",
    ignore: "If you didn't try to sign in, ignore this email; your account is safe.",
  },

  welcome: {
    subject: "Welcome to Zap Bridge — your first lead-gen page in 3 steps",
    heading: (greeting: string) => `Welcome, ${greeting} 👋`,
    fallbackGreeting: "there",
    intro:
      "Zap Bridge gets you a landing page that runs ads and captures leads in minutes, no code required. Three steps to the whole loop:",
    steps: [
      ["1. Build it", "pick an industry template, or let AI write the page from one sentence"],
      ["2. Publish it", "start on a platform address, or connect your own brand domain for more credible campaigns"],
      ["3. Run traffic", "set up your pixel and collect WhatsApp and form leads"],
    ],
    cta: "Start building",
    help: "Anything at all, just reply to this email — or hit “Contact the founder” in the dashboard sidebar. Good luck out there 🚀",
  },

  invitation: {
    subject: "You've been invited to Zap Bridge",
    heading: "You've been invited",
    cta: "Accept the invitation",
    validity: (duration: string) => `This link is valid for ${duration}.`,
    days: (n: number) => `${n} ${n === 1 ? "day" : "days"}`,
    hours: (n: number) => `${n} ${n === 1 ? "hour" : "hours"}`,
  },

  leadNotification: {
    subject: (pageName: string) => `🎯 New lead · ${pageName}`,
    heading: "You've got a new lead",
    fromPage: "From landing page:",
    noFields: "(no fields)",
    cta: "View it in the dashboard",
    unsubscribe: "You can turn these off under Settings → Lead notifications.",
  },

  weeklyDigest: {
    subject: (totalLeads: number) => `📈 Weekly report: ${totalLeads} new ${totalLeads === 1 ? "lead" : "leads"}`,
    heading: "Your week in leads",
    intro: "How your published pages did over the last 7 days (compared with the week before):",
    columns: { page: "Page", views: "Views", clicks: "CTA clicks", leads: "Leads" },
    cta: "Open analytics",
    unsubscribePrefix: "Don't want the weekly report? Turn it off under ",
    unsubscribeLink: "Settings → Lead notifications",
    unsubscribeSuffix: ".",
  },

  leadNudge: {
    subject: (count: number) => `⏰ ${count} ${count === 1 ? "lead is" : "leads are"} waiting for a reply`,
    heading: "Some leads are still waiting",
    intro: "These came in more than 48 hours ago and haven't been opened. The sooner you get in touch, the better they convert.",
    waited: (hours: number) => `waiting ${hours}h`,
    more: (n: number) => `${n} more not listed.`,
    cta: "Follow up",
    onceOnly: "Each lead is only flagged once. Don't want these? Turn them off under ",
    unsubscribeLink: "Settings → Lead notifications",
    unsubscribeSuffix: ".",
  },

  publishQuota: {
    subjectDone: (n: number) => `${n} landing ${n === 1 ? "page has" : "pages have"} been unpublished`,
    subjectCountdown: (days: number) => `${days} days left: pages over your allowance will be unpublished`,
    subjectOver: (planLabel: string) => `You're over the ${planLabel} published-page allowance`,
    heading: "Published pages over your allowance",
    bodyDone: (unpublished: number, published: number) =>
      `The grace period has ended, so we unpublished ${unpublished} ${unpublished === 1 ? "page" : "pages"} over your allowance, leaving ${published} live.`,
    bodyDoneSafe: "The page content has not been deleted",
    bodyDoneSafeSuffix: " — upgrade and you can republish any time.",
    bodyCountdown: (published: number, planLabel: string, limit: number, daysLeft: number) =>
      `You currently have ${published} published landing ${published === 1 ? "page" : "pages"}, and the ${planLabel} allowance is ${limit}. Pages already live are unaffected, but you can't publish new ones for now. If this isn't resolved within ${daysLeft} days we'll automatically unpublish the excess (taken offline only, never deleted), keeping domain root paths and your earliest-published pages first.`,
    ctaUpgrade: "Upgrade plan",
    ctaPages: "Manage landing pages",
  },

  trial: {
    subjectCountdown: (days: number, planLabel: string) => `${days} days left on your ${planLabel} benefits`,
    subjectExpired: (planLabel: string) => `Your ${planLabel} benefits have ended`,
    subjectWinBack: (planLabel: string) => `Keep using ${planLabel}? Your pages and leads are still here`,
    heading: "About your plan",
    bodyCountdown: (planLabel: string, days: number, fallbackLabel: string) =>
      `Your ${planLabel} benefits end in ${days} days, after which you'll be on ${fallbackLabel}. Pages already live won't be deleted, but your allowances tighten — if you're running campaigns, it's worth deciding now which pages you want to keep long term.`,
    bodyExpired: (planLabel: string, fallbackLabel: string) =>
      `Your ${planLabel} benefits have ended and your allowances are now calculated on ${fallbackLabel}. Your page content and the leads you've collected are all still here, and upgrading restores everything at any time.`,
    bodyWinBack: (planLabel: string, fallbackLabel: string) =>
      `Your ${planLabel} period is over and your account continues on ${fallbackLabel}. Pages, domains and leads are all kept — if the campaigns were working, upgrading picks up where you left off.`,
    ctaBilling: "See plans",
    ctaPages: "Manage landing pages",
  },
};

export type EmailDictionary = typeof emails;
