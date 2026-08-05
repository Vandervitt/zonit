import type { EmailDictionary } from "./en";

// 中文侧沿用改造前的原文案，不趁国际化顺手改词。
export const emails = {
  otp: {
    subject: (code: string) => `Zap Bridge 登录验证码：${code}`,
    heading: "登录验证码",
    intro: "使用以下验证码登录 Zap Bridge。验证码 10 分钟内有效，请勿泄露给他人。",
    ignore: "如果你没有尝试登录，请忽略这封邮件，你的账号是安全的。",
  },

  welcome: {
    subject: "欢迎加入 Zap Bridge，3 步上线你的第一张获客落地页",
    heading: (greeting: string) => `欢迎，${greeting} 👋`,
    fallbackGreeting: "你好",
    intro: "Zap Bridge 帮你不写代码、几分钟做出一张能跑广告、能收线索的出海落地页。三步就能跑通：",
    steps: [
      ["1. 建页", "选行业模板，或 AI 一句话生成整页"],
      ["2. 发布", "先用平台提供的地址，或绑定自己的品牌域名让投放更可信"],
      ["3. 开投收客", "配好像素，收 WhatsApp / 表单线索"],
    ],
    cta: "开始建页",
    help: "遇到任何问题，直接回复这封邮件，或在后台侧边栏点「联系创始人」找我。祝出单顺利 🚀",
  },

  invitation: {
    subject: "你被邀请加入 Zap Bridge",
    heading: "你被邀请加入",
    cta: "接受邀请",
    validity: (duration: string) => `该链接 ${duration}内有效。`,
    days: (n: number) => `${n} 天`,
    hours: (n: number) => `${n} 小时`,
  },

  leadNotification: {
    subject: (pageName: string) => `🎯 新线索 · ${pageName}`,
    heading: "收到一条新线索",
    fromPage: "来自落地页：",
    noFields: "（无字段）",
    cta: "在后台查看",
    unsubscribe: "你可在「设置 → 线索通知」关闭此邮件。",
  },

  weeklyDigest: {
    subject: (totalLeads: number) => `📈 本周获客周报：${totalLeads} 条新线索`,
    heading: "本周获客周报",
    intro: "过去 7 天你的已发布落地页表现（对比再上一周）：",
    columns: { page: "落地页", views: "曝光", clicks: "CTA 点击", leads: "线索" },
    cta: "查看投放分析",
    unsubscribePrefix: "不想收周报？可在",
    unsubscribeLink: "「设置 → 线索通知」",
    unsubscribeSuffix: "关闭。",
  },

  leadNudge: {
    subject: (count: number) => `⏰ ${count} 条线索还没跟进`,
    heading: "有线索还在等回复",
    intro: "这些线索留资已超过 48 小时，还没有被打开过。越早联系，成交率越高。",
    waited: (hours: number) => `已等 ${hours} 小时`,
    more: (n: number) => `还有 ${n} 条未列出。`,
    cta: "去跟进",
    onceOnly: "每条线索只提醒一次。不想收提醒？可在",
    unsubscribeLink: "「设置 → 线索通知」",
    unsubscribeSuffix: "关闭。",
  },

  publishQuota: {
    subjectDone: (n: number) => `已有 ${n} 张落地页被取消发布`,
    subjectCountdown: (days: number) => `还有 ${days} 天：超出的落地页将被取消发布`,
    subjectOver: (planLabel: string) => `已发布页数超出 ${planLabel} 套餐额度`,
    heading: "已发布页数超出套餐额度",
    bodyDone: (unpublished: number, published: number) =>
      `宽限期已结束，我们取消发布了 ${unpublished} 张超出额度的落地页，目前保留 ${published} 张在线。`,
    bodyDoneSafe: "页面内容没有删除",
    bodyDoneSafeSuffix: "，升级套餐后可以随时重新发布。",
    bodyCountdown: (published: number, planLabel: string, limit: number, daysLeft: number) =>
      `你当前有 ${published} 张已发布落地页，${planLabel} 套餐的额度是 ${limit} 张。已上线的页面不受影响，但暂时无法再发布新页面。如果 ${daysLeft} 天内仍未处理，我们会自动取消发布超出的部分（只是下线，内容不会删除），优先保留域名根路径与最早发布的页面。`,
    ctaUpgrade: "升级套餐",
    ctaPages: "管理落地页",
  },

  trial: {
    subjectCountdown: (days: number, planLabel: string) => `还有 ${days} 天：你的 ${planLabel} 权益即将到期`,
    subjectExpired: (planLabel: string) => `你的 ${planLabel} 权益已到期`,
    subjectWinBack: (planLabel: string) => `继续用 ${planLabel}？页面和线索都还在`,
    heading: "关于你的套餐",
    bodyCountdown: (planLabel: string, days: number, fallbackLabel: string) =>
      `你的 ${planLabel} 权益将在 ${days} 天后到期，之后回落到 ${fallbackLabel}。已上线的页面不会被删除，但额度会收紧；如果你正在投放，建议先确认要长期保留哪几张页。`,
    bodyExpired: (planLabel: string, fallbackLabel: string) =>
      `你的 ${planLabel} 权益已到期，当前按 ${fallbackLabel} 计算额度。页面内容和已收到的线索都还在，随时升级即可恢复。`,
    bodyWinBack: (planLabel: string, fallbackLabel: string) =>
      `你的 ${planLabel} 权益已经结束，账号仍在 ${fallbackLabel} 上正常使用。页面、域名和线索都保留着——如果之前的投放有效果，升级后就能继续放开手脚。`,
    ctaBilling: "查看套餐",
    ctaPages: "管理落地页",
  },
} satisfies EmailDictionary;
