export const plans = {
  free: "Free",
  unlimited: "Unlimited",
  perMonthSuffix: "/mo",
  perYearSuffix: "/yr",
  // 年付价下方的说明：{monthly} 为折合月价（向下截断到分），{saved} 为相对月付全年的节省额。
  yearlyNote: "{monthly}/mo billed yearly · save {saved}",
  // 英文面直接以美元结算，不做换算——保留此键仅为两语字典结构对齐。
  approxCny: "≈ CN¥{amount}",
  // 量词区分单复数：英文 "1 page" / "3 pages"。中文无此变化，两个形态取同值。
  units: {
    pages: { one: "page", other: "pages" },
    domains: { one: "domain", other: "domains" },
    perMonth: { one: "/ mo", other: "/ mo" },
  },
  table: {
    feature: "Feature",
    includedInAll: "Included in every plan",
    included: "Included",
    notIncluded: "Not included",
    // 窄屏卡片里「权益名: 额度」的分隔符。
    valueSeparator: ": ",
    // {days} is filled from SIGNUP_TRIAL_DAYS — never hard-code the number.
    trialBadge: "{days}-day free trial",
    currentBadge: "Your plan",
    ctaFree: "Start free",
    ctaTrial: "Start free trial",
    ctaChoose: "Choose {plan}",
    // 月付 / 年付切换；{months} = 12 - YEARLY_PRICE_MONTHS。
    billingPeriod: "Billing period",
    intervalMonth: "Monthly",
    intervalYear: "Yearly",
    yearSave: "{months} months free",
  },
  groups: { publish: "Publishing", tracking: "Tracking & leads", ai: "AI generation", scale: "Running at scale" },
  // Who each plan is for: visitors pick by who they are, not by diffing rows.
  fit: {
    free: "Publish one page free and see whether inquiries come in",
    pro: "Several offers at once, with CAPI sending conversions back to ad platforms",
    agency: "Agencies running campaigns for many clients",
  },
  rows: {
    landingPages: {
      label: "Landing pages",
      desc: "Total pages you can create and save",
    },
    // freeValue: Free has no custom-domain slot but can still publish on a
    // platform-assigned subdomain — showing 0 as an em dash reads as "cannot publish".
    customDomain: {
      label: "Publishing address",
      desc: "Publish on your own brand domain; no domain yet? use a platform-provided address",
      freeValue: "Platform-provided address",
    },
    templates: {
      label: "Lead-gen templates",
      // 不写死数量：模板库还在增长，而本表在客户端渲染，拿不到注册表口径。
      desc: "Every inquiry and lead-capture template in the library, as your editing starting point",
    },
    editor: {
      label: "Visual content editor",
      desc: "Edit copy and images through forms, reorder sections, preview live",
    },
    basicPixel: {
      label: "Basic tracking (1× Meta Pixel)",
      desc: "Connect one Meta Pixel to track landing page conversions",
    },
    watermark: {
      label: "Remove platform watermark",
      desc: "Drop the footer watermark — the page is purely your brand",
    },
    advancedTracking: {
      label: "Multi-platform tracking & CAPI",
      desc: "Meta / TikTok / Google tracking plus Meta / TikTok server-side forwarding",
    },
    antiBan: {
      label: "Anti-duplication",
      desc: "Reseed page variants to scatter the structural fingerprint, lowering duplicate-detection odds",
    },
    leadWebhook: {
      label: "Lead webhook",
      desc: "POST new leads to your CRM / Zapier in real time, signed",
    },
    aiPage: {
      label: "AI full-page generation",
      desc: "Feed in business details and AI drafts full page copy on your template",
    },
    aiRewrite: {
      label: "AI rewriting",
      desc: "Polish and rewrite section by section to produce variants fast",
    },
  },
};
