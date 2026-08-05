// 中文侧沿用改造前的原文案，不趁国际化顺手改词——改文案是产品决策，
// 混在国际化 PR 里会让"哪些界面变了"无法从 diff 看出来。
export const shell = {
  nav: {
    overview: "概览",
    pages: "落地页",
    leads: "线索",
    domains: "域名",
    media: "素材库",
    analytics: "投放分析",
    billing: "账户与计费",
    settings: "设置",
    help: "帮助",
  },
  trialTag: (planLabel: string) => `${planLabel} 体验`,
  trialUntil: (date: string) => ` · 至 ${date}`,
  signOut: "退出登录",
};
