// 后台外壳：侧边导航、顶栏套餐标签、用户菜单。
//
// nav 的 key 必须与 app/admin/(workspace)/_shell/nav.ts 的 ADMIN_NAV 逐项对应——
// 那边只留结构（key/icon/href），文案全在这里，两边由 nav.test.ts 机械核对。
export const shell = {
  nav: {
    overview: "Overview",
    pages: "Landing pages",
    leads: "Leads",
    domains: "Domains",
    media: "Media",
    analytics: "Analytics",
    billing: "Plan & billing",
    settings: "Settings",
    help: "Help",
  },
  /** 赠送/试用档高于付费档时的顶栏标签，如「Pro trial · until Aug 5」。 */
  trialTag: (planLabel: string) => `${planLabel} trial`,
  trialUntil: (date: string) => ` · until ${date}`,
  signOut: "Sign out",

  founderContact: {
    tooltip: "Contact the founder",
    intro: "Stuck on something? Message the founder directly — reply within 24 hours.",
    wechat: "WeChat",
    wechatQrAlt: "Founder's WeChat QR code",
    noQr: "No QR code configured",
    wechatId: (id: string) => `WeChat ID: ${id}`,
    email: "Send an email",
  },

  feedback: {
    send: "Send",
    later: "Maybe later",
    placeholder: "Anything else you'd like to add (optional)",
    thanks: "Thank you — we got your feedback 🙏",
    failed: "Could not submit your feedback. Please try again shortly.",
    networkFailed: "Could not submit your feedback. Check your connection and try again.",
  },
};
