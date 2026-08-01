// landing-editor/lib/channelGuidance.ts
// 渠道选择的引导文案。
//
// 这是本次改造的产品价值所在：只把选择权交出去而不解释，等于把难题原样丢回给
// 诊所老板、律所合伙人、装修队长——他们不是专业投手，不该被要求自己判断
// 「WhatsApp 和表单哪个转化更高」。
//
// 每条文案回答三件事：这个渠道是什么、什么生意适合、代价是什么。
// 用具体行业举例（管道漏水、留学咨询、医美面诊），不用「高意向线索」这类黑话。
import type { LeadChannel } from "@/types/schema.draft";

export interface ChannelGuidance {
  label: string;
  /** 访客视角：点了会发生什么。 */
  what: string;
  /** 什么生意适合用它，带具体行业例子。 */
  fitFor: string;
  /** 代价 / 注意事项。没有就不显示——不为凑格式硬编。 */
  tradeoff?: string;
  /** 值输入框的占位符；表单没有值可填。 */
  placeholder?: string;
}

export const CHANNEL_GUIDANCE: Record<LeadChannel, ChannelGuidance> = {
  form: {
    label: "留资表单",
    what: "访客填写姓名和联系方式，你在后台收到完整线索。",
    fitFor: "需要先了解情况才能报价的生意——装修、B2B 采购、留学咨询、医美面诊。",
    tradeoff: "访客要多花半分钟，但你拿到的信息更完整，而且能导出、能推送到 CRM。",
  },
  whatsapp: {
    label: "WhatsApp",
    what: "访客点一下直接和你聊天。",
    fitFor: "东南亚、中东、拉美等 WhatsApp 普及的市场，或者一两句话就能问清楚的生意。",
    // 这条代价必须写出来：它就是平台的测量不对称，如实告诉用户比藏着好，
    // 也是引导用户考虑「主推表单 + 悬浮 WhatsApp」这个组合的诚实理由。
    tradeoff: "聊天发生在你自己手机里，平台只能统计有多少人点了，帮不了你记录和提醒。",
    placeholder: "+8613800138000",
  },
  phone: {
    label: "电话",
    what: "访客点一下直接拨号。",
    fitFor: "急单生意——管道漏水、开锁、搬家、空调抢修。客户当下就要人来。",
    placeholder: "+8602112345678",
  },
  email: {
    label: "邮箱",
    what: "访客点一下打开邮件客户端。",
    fitFor: "正式的 B2B 询盘往来，对方习惯留存书面记录。",
    placeholder: "sales@yourbrand.com",
  },
  telegram: {
    label: "Telegram",
    what: "访客点一下跳到你的 Telegram。",
    fitFor: "部分东欧、中亚市场与跨境行业。",
    placeholder: "yourbrand（不用填 @ 和 t.me/）",
  },
};

/** 面板顶部的总引导：把「选哪个渠道」翻译成一个业务问题。 */
export const CHANNEL_INTRO = {
  question: "不确定选哪个？先问自己：客户第一次联系你时，你需要先知道些什么才能报价？",
  needInfo: "需要 → 选留资表单。",
  noInfo: "不需要，聊两句就能谈 → 选 WhatsApp 或电话。",
  both: "两个都想要也可以：主按钮用表单，悬浮按钮挂 WhatsApp。",
};

/** 主渠道单选的展示顺序。表单排第一——它是平台唯一能完整承接的渠道。 */
export const CHANNEL_ORDER: LeadChannel[] = ["form", "whatsapp", "phone", "email", "telegram"];
