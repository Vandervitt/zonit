// 英文面受众是全球中小企业，不是「中国卖家出海」——故全篇不出现 overseas / going global 这类
// 只在出海语境成立的表述（中文面保留「海外获客」叙事）。
// 数量一律用 {templates} / {industries} 占位符，由 lib/templates/stats.ts 按注册表实际内容替换。
export const home = {
  meta: {
    title: "Zap Bridge — Landing pages that turn visitors into reachable leads",
    description:
      "Lead-gen landing pages for businesses that run on inquiries: start from {templates} templates across {industries} industries, draft a full page with AI, and ship your first version in minutes. Form leads land in one inbox you can actually work, and you still see the clicks and sources behind every WhatsApp and phone inquiry.",
    ogDescription:
      "{templates} inquiry and lead-capture templates across {industries} industries, plus AI full-page drafting — first version in minutes. Publish to your own brand domain and keep every lead in one inbox.",
  },
  hero: {
    badge: "Built for businesses that run on inquiries",
    titleLine1: "Turn visitors into",
    // 保持两行：更长的措辞在 1440 宽下会折成三行，末行只剩一个词。
    titleLine2: "leads you can reach",
    // 首屏讲结果不讲机制：像素 / UTM / CAPI 等术语一律留到下方追踪区再展开。
    // 也不锁死流量来源（广告 / SEO / 社媒同样成立）与转化渠道（表单 / WhatsApp / 电话）。
    subtitle:
      "Pick a lead-gen template, let AI write the whole page around your business, and publish to your own domain — first version live in an afternoon. Form leads land straight in your inbox; WhatsApp and phone inquiries reach you on their own channels, with every click and source tracked.",
    ctaPrimary: "Start free",
    ctaSecondary: "See pricing",
    note: "7 days of full Pro on sign-up · No credit card · No code",
  },
  editorMock: {
    pixelBadge: "Meta Pixel · fired",
    leadBadge: "Lead +1",
  },
  marquee: {
    heading: "Works with your ad and analytics stack",
  },
  industries: {
    kicker: "Who it's for",
    title: "Whatever you sell, there's a starting point",
    desc: "{templates} lead-gen templates across {industries} industries — clinics and law firms, contractors and tutors, wholesalers and DTC brands. Pick your industry and start from a page that already knows how your inquiries come in.",
    /** `{count}` 会被替换为该行业下的模板数；英文需区分单复数。 */
    countLabel: { one: "{count} template", other: "{count} templates" },
    cta: "Browse the full template library",
  },
  steps: {
    kicker: "Three steps to live",
    title: "From template to live page in three steps",
    desc: "The whole build is visual — no code, no dev queue. Create, edit, and preview for free; publishing on your own domain comes with the paid plans.",
    items: [
      {
        title: "Pick a lead-gen template",
        desc: "Choose from {templates} templates matched to your industry and the way your customers get in touch, and start with the page structure and copy baseline already in place.",
      },
      {
        title: "Edit content visually",
        desc: "Select a section to rewrite copy and swap images. Drag to reorder, autosave as you go, and preview desktop and mobile live.",
      },
      {
        title: "Publish to your own domain",
        desc: "Connect your brand domain — we work out the exact DNS record for you to paste — then publish and set your SEO details. Custom domains come with the paid plans.",
      },
    ],
  },
  features: {
    kicker: "Built for conversion",
    title: "Everything a converting page needs, ready to go",
    desc: "Pages, AI copy, leads, domains, tracking — get your inquiry pages right first, then switch on the rest as you grow.",
    items: {
      templates: {
        title: "Lead-gen template library",
        desc: "{templates} inquiry and lead-capture templates across {industries} industries — dental and clinics, legal and immigration, education, home improvement and local services, B2B sourcing, plus beauty, apparel, home, and supplements. Skip the blank page.",
      },
      editor: {
        title: "Visual content editing",
        desc: "Rewrite copy and swap images through section forms, reorder by drag, autosave as you work, and preview desktop and mobile live — what you see is what you ship, with no dev queue.",
      },
      leads: {
        title: "Not one form lead goes missing",
        desc: "Form submissions land in one inbox, with an email the moment one arrives and a daily nudge for anything still unread. WhatsApp and phone inquiries go straight to your own chats and calls — we track their clicks and sources so you can still see what each channel brings in. Reply in one tap, check whether each alert was sent successfully, and export to CSV any time — Pro and above POST each lead straight to your CRM or Zapier.",
      },
      domain: {
        title: "Publish on your own brand domain",
        desc: "Paid plans connect your own brand domain and publish once DNS verification passes. Independent SEO title, description, and share image — visitors only ever see your brand.",
      },
      tracking: {
        title: "Know which traffic actually converts",
        desc: "See visits, CTA clicks, and where each lead came from in one dashboard. Connect Meta, TikTok, GA4, and Google Ads by plan, so your ad platforms learn which clicks turned into real inquiries instead of guessing.",
      },
      ai: {
        title: "AI full-page generation & rewriting",
        desc: "Feed in your business details and AI drafts the full page — marketing copy plus stock imagery — on your current template, or rewrite section by section. First draft in minutes; always fact-check claims, cases, and assets before publishing.",
      },
      antiBan: {
        title: "Anti-duplication",
        desc: "Agency plans reseed page variants in one click: content stays put while hero layout, wrapper structure, and meta fingerprint shift with the seed — lowering the odds that same-template pages get flagged as duplicates.",
        linkLabel: "How anti-duplication works",
      },
    },
  },
  tracking: {
    kicker: "Attribution",
    title: "Know which clicks actually turned into inquiries",
    desc: "Your dashboard rolls up visits, CTA clicks, and the source behind every lead — so you can stop paying for traffic that never inquires. Ad platforms get told which clicks converted, which is how they learn to find you more of the same people.",
    bullets: [
      "One dashboard: visits, CTA clicks, form completion, and lead source per page",
      "Connect Meta, TikTok, GA4, and Google Ads — Pro and above",
      "Conversions reported back to Meta and TikTok server-side, so fewer get lost to ad blockers",
      "Cookie consent bar included — third-party tracking loads only after visitors agree",
    ],
    funnel: {
      consent: { label: "Visitor consent", note: "Tracking starts only after they agree" },
      pixels: { label: "Connected platforms", note: "Meta / TikTok / GA4 / Google Ads" },
      capture: { label: "Inquiry captured", note: "Form submits, CTA and WhatsApp taps" },
      forwarding: {
        label: "Reported back + dashboard",
        note: "Conversions to Meta / TikTok, sources in your dashboard",
      },
    },
  },
  pricing: {
    kicker: "Simple, transparent pricing",
    title: "Ship your first version free, upgrade when you go live",
    desc: "Free lets you create, save, and preview online. Upgrade to connect your own domain and unlock more pages, tracking, and AI credits by plan.",
    ctaFree: "Start free",
    ctaPaid: "Sign up to upgrade",
  },
  finalCta: {
    titleLine1: "Your next campaign",
    titleLine2: "deserves a page that converts",
    desc: "Create, edit, and preview right now — no credit card. Upgrade when you are ready to publish to your own brand domain.",
    ctaPrimary: "Start free",
    ctaSecondary: "Already have an account? Log in",
  },
};
