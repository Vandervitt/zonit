// WhatsApp 落地页产品页文案（英文面）。
//
// 定位：**产品页**，承接商业意图查询（"whatsapp landing page" 及其变体）。
// 与 /guides/whatsapp-lead-landing-page 分工——那篇是信息型长文，答「这类页面
// 怎么做」；本页答「用 Zap Bridge 怎么做」，落点是注册与模板库。两页互链但不
// 复述对方的主体内容，避免关键词自噬。
//
// ⚠️ 口径铁律（全站一致，改前先读 lib/i18n/dictionaries/en/home.ts 顶部注释）：
//   · **线索（lead）只指表单线索**。WhatsApp / 电话只统计「点击」，平台拿不到
//     对话内容，也无从知道对方是否真的开口。本页大量谈 WhatsApp，是最容易把
//     「点击」写成「线索」的地方——每一处涉及计数的措辞都必须落在 click /
//     conversation started 上，不得用 lead / inquiry captured。
//   · overseas / cross-border 可以写在**场景描述位**（WhatsApp 本就是跨时区
//     生意的默认渠道），但不得进**受众定义位**——本地商户同样在用 WhatsApp。
//   · 生成页保持非交易：不出现 checkout / cart / order / payment 等概念。
// 数量一律用占位符，由 lib/templates/stats.ts 按注册表实际内容替换。
export const whatsapp = {
  meta: {
    title: "WhatsApp landing pages that turn ad clicks into chats | Zap Bridge",
    description:
      "Send paid traffic to a real page instead of a bare wa.me link: {whatsappTemplates} templates across {whatsappIndustries} industries open WhatsApp with your message pre-filled, every tap is tracked back to its source, and the policy footer ad reviewers look for is there from the first publish.",
    ogTitle: "WhatsApp landing pages — from ad click to chat",
    ogDescription:
      "A landing page that carries the persuasion, then hands the visitor to WhatsApp with the opening line already written. Published to your own domain in an afternoon.",
  },
  hero: {
    badge: "WhatsApp as your conversion path",
    titleLine1: "Your ad sends them to WhatsApp.",
    titleLine2: "Give them a page first.",
    subtitle:
      "Dropping a bare wa.me link into an ad asks a stranger to message you before you have told them anything. A WhatsApp landing page does the convincing first, then opens the chat with the opening line already written — and unlike a raw link, every tap is tracked back to the campaign that paid for it.",
    ctaPrimary: "Start free",
    ctaSecondary: "Browse WhatsApp templates",
  },
  problem: {
    kicker: "// what a bare link costs you",
    title: "The link works. The funnel doesn't.",
    desc: "wa.me links are trivial to make, which is exactly why they get used where a page belongs. Three things break when the ad points straight at the chat.",
    items: {
      cold: {
        title: "You're asking for a chat before you've earned it",
        desc: "The visitor has seen one ad creative. No offer detail, no evidence, no sense of who you are. Most people close the app rather than open a conversation with a stranger — and the ones who do message often open with 'what is this?', which you then pay for in reply time.",
      },
      blind: {
        title: "You can't tell which ad paid for which chat",
        desc: "A raw wa.me link carries no campaign, no source, no UTM. Conversations arrive with no idea which creative or audience produced them, so you end up optimising spend on guesswork.",
      },
      review: {
        title: "Ad reviewers have nothing to review",
        desc: "A destination that is just a chat handoff gives reviewers no policy links, no business identity, and no substance to check against your ad's claims — a common trigger for rejection on exactly the categories that rely on WhatsApp most.",
      },
    },
  },
  build: {
    kicker: "// what you get instead",
    title: "A page that does the persuading, then gets out of the way",
    desc: "Pick a template, swap in your offer, publish to your own domain. The WhatsApp path is wired up before you touch anything.",
    items: {
      prefill: {
        title: "The chat opens with the message already written",
        desc: "Every WhatsApp button carries a pre-filled opening line, so the visitor lands in the chat with something to send instead of a blank box. You control the wording per page — and per button, if a page has more than one offer.",
      },
      swap: {
        title: "Switch the whole page to another channel in one click",
        desc: "Contact details live on the page, not baked into each button. Change WhatsApp to a form, phone, email, or Telegram and every call-to-action on the page follows — no hunting through sections to update links one at a time.",
      },
      track: {
        title: "Every tap tracked back to its source",
        desc: "WhatsApp taps are recorded with the campaign, source, and UTM that brought the visitor in, and forwarded to your pixels. You see which creative produces conversations — not just which one produces cheap clicks.",
      },
      compliance: {
        title: "The policy pages reviewers look for, from day one",
        desc: "Privacy policy and terms publish as real subpages rather than footer text, your business identity sits in the footer, and the consent bar only appears where it's required. This is the baseline ad reviewers check before they read your offer.",
      },
    },
  },
  // 计数口径澄清段。这一段的存在本身就是防线：整页都在讲 WhatsApp，读者很容易
  // 默认「WhatsApp 也会像表单一样进线索列表」。与其等客户上线后发现对不上，
  // 不如在营销页就写清楚。
  measurement: {
    kicker: "// what gets counted, honestly",
    title: "Clicks and leads are not the same number",
    desc: "It matters that you know this before you build your reporting on it.",
    points: [
      "Form submissions become leads: they land in your inbox with the contact details, the page, and the source attached, and you can work them from there.",
      "WhatsApp and phone taps are counted as clicks, not leads. The conversation happens on WhatsApp's side — no platform can see whether the visitor actually said anything, so we don't pretend to.",
      "Both are attributed to the same campaigns and sources, so you can compare pages fairly. Just don't add the two numbers together and call the total 'leads'.",
    ],
  },
  templates: {
    kicker: "// starting points",
    title: "{whatsappTemplates} templates ship with WhatsApp as a conversion path",
    desc: "Across {whatsappIndustries} industries — clinics and dental practices, solar and home improvement, legal and immigration, tutoring, B2B sourcing, beauty and apparel. Each one is written for how inquiries actually arrive in that industry, and every one of them can be switched to a form instead if you'd rather capture details up front.",
    cta: "Browse the template library",
  },
  // 指向信息型长文的出口。刻意放在页面靠后：先让有购买意图的读者看完产品段，
  // 想深入了解方法论的再跳走。
  guide: {
    title: "Want the how-to rather than the product?",
    desc: "We keep a separate long-form guide on structuring WhatsApp lead pages — what to put above the fold, how to word the pre-filled message, and where these pages usually leak. It's written to be useful whether or not you build the page here.",
    cta: "Read the WhatsApp lead page guide",
  },
  finalCta: {
    title: "Put a page between the ad and the chat",
    desc: "Start from a template that already has the WhatsApp path wired up, publish it to your own domain, and see which campaigns actually produce conversations. Every sign-up gets 7 days of full Pro — no credit card.",
    ctaPrimary: "Start free",
    ctaSecondary: "See pricing",
  },
};
