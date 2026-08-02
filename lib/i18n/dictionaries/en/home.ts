// 英文面受众是全球中小企业，不是「中国卖家出海」。
//
// ⚠️ 这条约定管的是**词出现在句子的哪个位置**，不是一张禁词表——本文件是该约定的
// 事实源，lib/seo/site.ts 与 en/templateIndustry.ts 均指向此处，改口径先改这里。
//
//   ❌ 受众定义位：`landing pages for brands going global` / `for supplements
//      going global`——overseas 在这里修饰的是「你得是谁」，等于给本土诊所、
//      本地服务商、只做国内市场的品牌加了一道资格门槛，把人挡在门外。
//   ✅ 场景描述位：`built for the case where buyers are in another time zone and
//      WhatsApp is the default channel`——描述的是产品服务的一种场景，跨境卖家
//      读到觉得被理解，本土卖家读到也不会觉得与己无关。
//
// 跨境获客是真实且重要的客群（见 docs/constraints/product-positioning.md），
// 不能因为怕窄化受众就把它整个抹掉——那会让 overseas / cross-border 这类真实查询
// 词在英文面无处承接。分层原则：
//   · 首页 / siteDescription / 定价 / 导航——全客群必经，跨境表述不进受众定义位；
//   · 行业页、模板 seoIntro、/guides——分众入口，可以并且应该写清跨境场景。
// 中文面「海外获客」叙事完全不受本约定约束，那是准确且有搜索量的表述。
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
  // 首屏示意图上的两枚浮动徽标。与 hero.subtitle 同一条约束：首屏只讲结果，
  // 不出现 Pixel / CAPI / UTM 这类机制术语——非投放用户看到会直接判定
  // 「这是给广告专家用的」。归因能力留到下方追踪区展开。
  editorMock: {
    sourceBadge: "Source · Instagram",
    leadBadge: "New lead · +1",
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
    // Free 能真发布（平台分配地址，不碰 DNS），只是拿不到自有域名槽位——
    // 见 lib/i18n/dictionaries/*/plans.ts 的 customDomain.freeValue。
    // 这里不能写成「免费只能预览」：那会把刚打通的激活路径重新藏起来。
    desc: "The whole build is visual — no code, no dev queue. Publish free on a platform-provided address; your own brand domain comes with the paid plans.",
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
        desc: "Connect your brand domain — we work out the exact DNS record for you to paste — then publish and set your SEO details. One domain holds several pages, each service at its own address. Custom domains come with the paid plans.",
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
        title: "One brand domain, a page per service",
        desc: "Paid plans connect your own brand domain and publish once DNS verification passes. Put several pages under the same domain, each at its own address — a clinic keeps the overview on the main domain and gives Invisalign and whitening an address each; same for law firms and training providers. Visitors stay inside your brand throughout, and every page carries its own SEO title, description, and share image.",
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
    title: "Go live free, upgrade when you want your own domain",
    desc: "Free publishes a real, working page on a platform-provided address — no domain to buy, no DNS to touch. Upgrade to connect your own brand domain and unlock more pages, tracking, and AI credits by plan.",
    ctaFree: "Start free",
    ctaPaid: "Sign up to upgrade",
  },
  finalCta: {
    titleLine1: "Your next campaign",
    titleLine2: "deserves a page that converts",
    desc: "Build and publish your first page right now — no domain, no credit card. Upgrade when you want it on your own brand domain.",
    ctaPrimary: "Start free",
    ctaSecondary: "Already have an account? Log in",
  },
};
