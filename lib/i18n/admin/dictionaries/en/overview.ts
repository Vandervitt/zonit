// 概览页（后台首页）。
export const overview = {
  title: "Overview",
  loadError: { pages: "the landing page data", domains: "the domain data", usage: "the AI usage data" },

  onboarding: {
    title: "Get your lead-gen page live in 4 steps",
    // key 必须与 lib/onboarding/checklist.ts 的 OnboardingStepId 对齐，
    // 那边只判断「做没做」，落点与文案在这里。
    steps: {
      page_created: { title: "Create a landing page", desc: "Pick an industry template, or generate one with AI" },
      publish_address: { title: "Get a publishing address", desc: "Claim a free platform subdomain, or connect your own" },
      page_published: { title: "Publish it", desc: "The page goes live at that address and you can start driving traffic" },
      first_lead: { title: "Receive your first lead", desc: "Submissions show up in your lead inbox" },
    },
  },

  stats: {
    pages: "Landing pages",
    pagesBreakdown: (published: number, drafts: number) => `${published} published · ${drafts} draft`,
    domains: "Connected domains",
    domainsVerified: (n: number) => `${n} verified`,
    aiPages: "AI pages this month",
    creditBalance: (balance: string | number) => `Credit balance ${balance}`,
    plan: "Current plan",
    pageQuota: (used: number, limit: string) => `Landing pages ${used}${limit}`,
    unlimitedSuffix: " (unlimited)",
  },

  recent: {
    title: "Recent landing pages",
    all: "View all",
    columns: { name: "Name", status: "Status", updatedAt: "Updated", actions: "Actions" },
    published: "Published",
    draft: "Draft",
    edit: "Edit",
    preview: "Preview",
  },

  quickActions: {
    title: "Quick actions",
    newPage: "New landing page",
    connectDomain: "Connect a domain",
    viewPlans: "See plans",
  },

  analyticsCard: {
    title: "Analytics",
    description: "Views, CTA clicks and source attribution — see how your pages perform, live.",
    cta: "Open analytics",
  },
};
