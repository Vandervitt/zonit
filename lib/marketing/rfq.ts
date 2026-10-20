// 外贸询盘落地页（/rfq-landing-page）的配置事实源：主推模板、配对指南、哪些模板算「询价型」。
// 纯数据与纯函数，不 import registry——客户端组件也能安全引用。

/** 首屏主 CTA 直接用这套模板建页（经登录回跳落到已套用该模板的编辑器）。 */
export const RFQ_PRIMARY_TEMPLATE = "b2b-sourcing";

/** 配对的信息型长文：本页答「在这里怎么做」，那篇答「询价表单怎么设计」。 */
export const RFQ_GUIDE_SLUG = "b2b-rfq-lead-generation";

/**
 * 「外贸询价型」模板：B2B 大类里以咨询报价为主转化的（OEM 制造、工业设备、定制包装、国际物流），
 * 不含以产品演示为主的 SaaS——后者的访客要的是试用，不是报价。
 */
export function isRfqTemplate(t: { tags: { category: string; archetype: string } }): boolean {
  return t.tags.category === "b2b" && t.tags.archetype === "consult";
}
