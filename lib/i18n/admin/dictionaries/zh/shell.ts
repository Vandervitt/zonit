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

  founderContact: {
    tooltip: "联系创始人",
    intro: "遇到问题？直接联系创始人，24 小时内回复。",
    wechat: "微信",
    wechatQrAlt: "创始人微信二维码",
    noQr: "未配置二维码",
    wechatId: (id: string) => `微信号: ${id}`,
    email: "发邮件",
  },

  feedback: {
    send: "发送",
    later: "以后再说",
    placeholder: "想多说两句就写这里（选填）",
    thanks: "谢谢，已收到你的反馈 🙏",
    failed: "反馈提交失败，请稍后再试",
    networkFailed: "反馈提交失败，请检查网络后重试",
  },
};
