export const templates = {
  meta: {
    title: "{templates} lead-gen landing page templates — pick by industry | Zap Bridge",
    description:
      "Lead-gen landing page templates across {industries} industries — clinics, legal and immigration, education, home improvement and local services, B2B sourcing, plus beauty, apparel, home, and supplements. Capture leads by form, WhatsApp, phone, email, or Telegram — switch channel in one click, compliant footer out of the box.",
    ogTitle: "{templates} lead-gen landing page templates | Zap Bridge",
    ogDescription:
      "Pick a lead-gen template by industry, swap the content, connect your domain, and publish — no blank page to start from.",
  },
  gallery: {
    kicker: "Templates",
    title: "Lead-gen template library",
    /** `{templates}` 与 `{industries}` 会被替换为实际数量。 */
    subtitle:
      "{templates} lead-capture templates across {industries} industries, each with a compliant footer built in. Every template works with any channel — the tags below are just what each one is set up for, and you can switch to a form, WhatsApp, phone, email, or Telegram in one click after you pick it.",
    cta: "Start free · 7 days of Pro on sign-up",
    /**
     * 卡片上的转化标签，如 "Set up for WhatsApp"。`{channel}` 为渠道名。
     * 措辞刻意强调「预设」而非「只能用」——渠道现在是页面级设置，选完模板
     * 一键就能改（见 docs/lead-capture-channels.md）。旧文案「WhatsApp capture」
     * 会让人以为选了这套模板就锁死了渠道。
     */
    captureTag: "Set up for {channel}",
    /** `{name}` 为模板名。 */
    thumbnailAlt: "{name} template preview",
  },
  detail: {
    backToGallery: "← All templates",
    useTemplate: "Start with this template",
    includedHeading: "What's inside",
    whoForHeading: "Who it's for",
    howToHeading: "How to use it",
    faqHeading: "Common questions",
    detailIntroNote: "↓ Live render of the template draft below (copy and images are all editable; lead capture in the preview does not submit anything)",
    includedHeading2: "What's in this template",
    howToHeading2: "How to use it for lead gen",
    relatedHeading: "More in this industry",
    otherTemplates: "Browse other templates",
    breadcrumbRoot: "Templates",
  },
  /** 页面范式（数据键为英文 slug，此处为展示名）。 */
  archetype: {
    seeding: "Discovery capture",
    consult: "Booking inquiry",
    compare: "Comparison lead",
    demo: "Demo booking",
  },
  /** 行业大类。 */
  category: {
    beauty: "Beauty & personal care",
    apparel: "Apparel & accessories",
    gadget: "Consumer tech",
    home: "Home & living",
    supplement: "Health & supplements",
    "toys-baby": "Toys & baby",
    medical: "Medical",
    "home-improvement": "Home improvement",
    b2b: "B2B & wholesale",
    education: "Education & training",
    legal: "Legal & immigration",
    "local-service": "Local services",
  },
  /** 转化渠道。 */
  conversion: {
    whatsapp: "WhatsApp",
    form: "Form",
    telegram: "Telegram",
    phone: "Phone",
    email: "Email",
  },
};
