// landing-editor/lib/channelGuidance.ts
// 渠道选择引导的**结构**。展示文案已移入 lib/i18n/admin 的 editor.channels
// （同名 key），随后台界面语言变化；本文件只留顺序等与语言无关的事实。
//
// 这是本次改造的产品价值所在：只把选择权交出去而不解释，等于把难题原样丢回给
// 诊所老板、律所合伙人、装修队长——他们不是专业投手，不该被要求自己判断
// 「WhatsApp 和表单哪个转化更高」。
//
// 每条文案回答三件事：这个渠道是什么、什么生意适合、代价是什么。
// 用具体行业举例（管道漏水、留学咨询、医美面诊），不用「高意向线索」这类黑话。
import type { LeadChannel } from "@/types/schema.draft";

/**
 * 一条渠道引导的形状。值在字典里（editor.channels），本接口只用于消费侧断言——
 * 字典按语言推导出的字面量类型里，没有 tradeoff / placeholder 的渠道会丢掉这两个键，
 * 直接读取会编译不过。
 */
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

/** 主渠道单选的展示顺序。表单排第一——它是平台唯一能完整承接的渠道。 */
export const CHANNEL_ORDER: LeadChannel[] = ["form", "whatsapp", "phone", "email", "telegram"];
