import type { GuideArticle } from "../types";

export const landingPageConversionAttribution: GuideArticle = {
  slug: "landing-page-conversion-attribution",
  title: "海外落地页转化归因怎么做：像素、UTM 与服务端回传(CAPI)",
  description:
    "广告费花出去却不知道哪条转化？一篇讲清落地页转化归因的三层——浏览器像素、UTM 参数、服务端回传(CAPI)，以及 iOS 与浏览器限制下为什么必须上 CAPI。",
  keywords: ["转化归因", "CAPI", "服务端回传", "Facebook 像素", "UTM"],
  datePublished: "2026-07-26",
  intro:
    "投放最怕「钱花了，不知道哪来的转化」。归因就是把「这条线索来自哪个广告 / 渠道」讲清楚。这篇拆解落地页归因的三层机制，以及为什么如今光靠浏览器像素已经不够。",
  sections: [
    {
      id: "why",
      heading: "为什么必须做归因",
      blocks: [
        {
          t: "p",
          text: "没有归因，你无法知道哪个广告、哪个渠道、哪个页面真正带来了线索，只能凭感觉加减预算。做好归因后，投放平台能拿到真实转化信号去优化投放，你也能把预算集中到有效的组合上。",
        },
      ],
    },
    {
      id: "three-layers",
      heading: "归因的三层：像素 / UTM / CAPI",
      blocks: [
        {
          t: "table",
          head: ["层", "是什么", "解决什么"],
          rows: [
            ["浏览器像素", "页面内嵌的 JS 追踪代码（如 Meta Pixel）", "在浏览器端记录浏览、点击、转化事件"],
            ["UTM 参数", "链接后缀（utm_source / medium / campaign）", "标记流量来自哪个渠道 / 广告 / 素材"],
            ["服务端回传 CAPI", "从你的服务器直接把转化事件发给投放平台", "绕开浏览器限制，补齐像素丢失的转化"],
          ],
        },
      ],
    },
    {
      id: "why-capi",
      heading: "为什么光靠像素不够了",
      blocks: [
        {
          t: "p",
          text: "iOS 隐私新规、浏览器对第三方 Cookie 的限制、广告拦截插件，都会让浏览器像素漏掉相当一部分转化。像素少报，投放平台就学不到准确的转化信号，优化效果打折。",
        },
        {
          t: "callout",
          tone: "info",
          text: "服务端回传(CAPI)从你的服务器直接把转化事件发给平台，不依赖浏览器环境，能补齐像素丢失的部分——像素 + CAPI 双发、去重，是目前的主流做法。",
        },
      ],
    },
    {
      id: "setup",
      heading: "落地页上怎么配",
      blocks: [
        {
          t: "steps",
          items: [
            { title: "装像素", desc: "在落地页接入 Meta / TikTok / Google 等平台像素 ID" },
            { title: "带 UTM", desc: "给每条广告链接加规范的 UTM 参数，标记来源" },
            { title: "定义转化事件", desc: "明确什么算转化（如提交表单、点击 WhatsApp）" },
            { title: "开服务端回传", desc: "配置 CAPI，把转化事件从服务端补发给平台并与像素去重" },
            { title: "验证", desc: "用平台的事件调试工具确认事件被正确接收、无重复" },
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
              q: "像素和 CAPI 会不会重复计数？",
              a: "只要为同一事件传入相同的事件 ID，平台会自动去重。像素 + CAPI 双发、共享事件 ID 是推荐做法，既补全丢失又不重复。",
            },
            {
              q: "UTM 参数会不会影响 SEO？",
              a: "带 UTM 的链接主要用于广告投放，不应作为页面的规范 URL。落地页设置好 canonical 指向干净地址，即可避免重复内容问题。",
            },
            {
              q: "没有技术团队也能配 CAPI 吗？",
              a: "可以。选用内置服务端回传能力的落地页工具，通常只需填入像素凭据即可开启，无需自己搭服务。",
            },
          ],
        },
      ],
    },
  ],
  references: [
    {
      label: "Conversions API 文档 — Meta for Developers",
      url: "https://developers.facebook.com/docs/marketing-api/conversions-api/",
    },
    {
      label: "像素与 Conversions API 事件去重 — Meta for Developers",
      url: "https://developers.facebook.com/documentation/ads-commerce/conversions-api/deduplicate-pixel-and-server-events",
    },
    {
      label: "使用自定义 URL 收集广告系列数据（UTM）— Google Analytics 帮助",
      url: "https://support.google.com/analytics/answer/10917952",
    },
    {
      label: "App Tracking Transparency（ATT）— Apple Developer",
      url: "https://developer.apple.com/documentation/apptrackingtransparency",
    },
  ],
};
