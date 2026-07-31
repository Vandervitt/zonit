export const plans = {
  free: "Free",
  unlimited: "Unlimited",
  perMonthSuffix: "/mo",
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
    description: "What it does",
    mostPopular: "Most popular",
    ctaFree: "Start free",
    ctaUpgrade: "Upgrade",
  },
  rows: {
    landingPages: {
      label: "Landing pages",
      desc: "Total pages you can create and save",
    },
    customDomain: {
      label: "Custom domains",
      desc: "Publish pages on your own brand domain",
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
  highlights: {
    free: [
      "1 landing page",
      "The full lead-gen template library",
      "Visual content editor",
      "Online preview (publishing needs a paid plan and domain)",
    ],
    starter: ["3 landing pages + 1 custom domain", "1× Meta Pixel tracking"],
    pro: [
      "20 landing pages + 5 domains",
      "Platform watermark removed",
      "Meta / TikTok / Google tracking + Meta / TikTok CAPI",
    ],
    agency: [
      "Unlimited pages + unlimited domains",
      "Anti-duplication",
      "AI generation raised to 300 / mo",
    ],
  },
};
