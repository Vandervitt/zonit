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
};
