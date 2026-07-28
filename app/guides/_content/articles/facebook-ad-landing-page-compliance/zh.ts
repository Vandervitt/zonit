import type { GuideArticle } from "../../types";

export const facebookAdLandingPageCompliance: GuideArticle = {
  slug: "facebook-ad-landing-page-compliance",
  title: "Facebook 广告落地页怎么做才不被拒审：8 个合规要点",
  description:
    "Facebook / Meta 广告落地页被拒审、限流怎么办？拆解 8 个最常见的合规问题——落地页与广告一致性、隐私政策、夸大功效、页面结构雷同判重——附上线前自查清单。",
  keywords: ["Facebook 广告落地页", "落地页拒审", "Meta 广告合规", "落地页限流"],
  datePublished: "2026-07-26",
  intro:
    "投放海外广告时，落地页往往是被拒审、限流的重灾区——广告素材过审了，落地页却被判违规，导致整个广告组受限。这篇拆解 Meta 落地页最常见的 8 个合规问题，帮你在上线前排掉隐患。",
  sections: [
    {
      id: "why-rejected",
      heading: "落地页为什么会被拒审或限流",
      blocks: [
        {
          t: "p",
          text: "Meta 不只审广告素材，也会抓取并评估落地页本身。落地页与广告承诺不一致、缺少合规要件、夸大功效，或大量页面结构高度雷同，都可能触发人工或系统判违规，轻则拒审、重则限流甚至封户。",
        },
        {
          t: "list",
          items: [
            "落地页内容与广告文案 / 图片承诺不一致（最常见）",
            "缺少隐私政策、联系方式等合规要件",
            "夸大或绝对化功效（尤其保健、美妆、金融类）",
            "诱导性弹窗、强制跳转、与广告无关的下载",
            "大量页面用同一模板、结构指纹高度雷同，被判重复内容",
          ],
        },
      ],
    },
    {
      id: "eight-points",
      heading: "8 个合规要点",
      blocks: [
        {
          t: "table",
          head: ["要点", "怎么做"],
          rows: [
            ["落地页与广告一致", "落地页首屏的卖点、图片、优惠必须与广告承诺对得上"],
            ["隐私政策 + 服务条款", "页脚放可点击的隐私政策与条款链接，说明数据如何收集使用"],
            ["真实可达的联系方式", "提供邮箱 / 表单 / WhatsApp 等真实联系入口"],
            ["避免绝对化功效", "不用「根治」「100% 有效」「保证」等词，改用中性、可验证的表达"],
            ["高风险品类加免责声明", "保健 / 美妆 / 金融类补充「仅供参考、非医疗建议」等免责"],
            ["无诱导与强制跳转", "不做自动下载、强制订阅、与广告无关的重定向"],
            ["移动端体验达标", "首屏快、可读、CTA 清晰（Meta 流量以移动端为主）"],
            ["页面结构差异化", "规模化投放时，避免多页面结构指纹完全雷同"],
          ],
        },
      ],
    },
    {
      id: "consistency",
      heading: "重点：落地页与广告的一致性",
      blocks: [
        {
          t: "p",
          text: "一致性是拒审的头号原因。广告里说「免费领取肤质分析」，落地页首屏就要能立刻看到这个钩子；广告图是产品实拍，落地页就不该换成无关素材。审核员（和系统）会把两者对照，落差越大越危险。",
        },
        {
          t: "callout",
          tone: "warning",
          text: "页面结构雷同同样危险：批量复制同一模板、只换文案的页面，容易被判为重复 / 低质内容而限流。规模化投放时要让页面结构指纹有差异——这也是「反同质化」要解决的问题。",
        },
      ],
    },
    {
      id: "checklist",
      heading: "上线前自查清单",
      blocks: [
        {
          t: "steps",
          items: [
            { title: "对照广告", desc: "逐条核对落地页卖点、图片、优惠是否与广告承诺一致" },
            { title: "查合规要件", desc: "隐私政策、条款、联系方式、必要免责是否齐全且可点击" },
            { title: "扫违规词", desc: "搜一遍绝对化 / 夸大 / 承诺类词汇并替换" },
            { title: "测移动端", desc: "在手机上过一遍加载速度、可读性与 CTA" },
            { title: "看结构差异", desc: "批量投放时确认各页面结构不是完全复制" },
          ],
        },
      ],
    },
    {
      id: "faq",
      heading: "常见问题",
      blocks: [
        {
          t: "faq",
          items: [
            {
              q: "落地页过审了，为什么广告还是被拒？",
              a: "拒审可能来自广告素材、受众定位或账户历史等多个环节，落地页只是其一。建议先确认落地页合规，再逐项排查素材文案、目标受众与账户状态。",
            },
            {
              q: "同一个模板做很多页会被判重复内容吗？",
              a: "有可能。大量页面结构指纹高度雷同容易被判重复 / 低质内容。规模化投放时应让页面结构有差异，同时保持内容真实一致。",
            },
            {
              q: "保健、美妆类落地页更容易被拒吗？",
              a: "这类属于高风险品类，对夸大功效更敏感。避免绝对化表达、补充必要免责声明，并保持内容与广告一致，可显著降低被拒概率。",
            },
          ],
        },
      ],
    },
  ],
  references: [
    {
      label: "Meta 广告标准（Advertising Standards）— Meta 透明度中心",
      url: "https://transparency.meta.com/policies/ad-standards/",
    },
    {
      label: "不可接受的商业行为（Unacceptable Business Practices）— Meta 透明度中心",
      url: "https://transparency.meta.com/policies/ad-standards/fraud-scams/unacceptable-business-practices/",
    },
    {
      label: "健康与保健类广告政策（Health and Wellness）— Meta 透明度中心",
      url: "https://transparency.meta.com/policies/ad-standards/restricted-goods-services/health-wellness/",
    },
  ],
};
