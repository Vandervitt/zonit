// 投放分析页（含 CapiHealthCard / PageComparison 两个子卡片）。
export const analytics = {
  title: "Analytics",
  allPages: "All landing pages",
  range: { d7: "Last 7 days", d30: "Last 30 days", d90: "Last 90 days", from: "Start date", to: "End date" },
  loadError: { data: "the analytics data", pages: "the landing page filter list" },

  totals: {
    views: "Views (PV)",
    clicks: "CTA clicks",
    leads: "Leads",
    ctr: "Click-through rate",
  },
  change: {
    new: "vs previous: new",
    flat: "vs previous: unchanged",
    suffix: " vs previous",
  },
  comparisonNote: (views: number, clicks: number, leads: number) =>
    `The comparison uses the adjacent period of equal length (views ${views} · clicks ${clicks} · leads ${leads}). Equal-length adjacent periods rather than “same month last year”, because campaigns run on flight cycles, not calendar months.`,

  funnel: {
    title: "Conversion funnel",
    empty: "No data in this period",
    steps: { views: "Views", clicks: "CTA clicks", leads: "Leads" },
    fromPrevious: (pct: string) => `${pct} of previous step`,
    cvr: (pct: string) => `Lead conversion rate (leads / views): ${pct}`,
  },

  formFunnel: {
    title: "Form funnel",
    note: "On-page lead forms only",
    empty: "Nobody started filling in a form in this period",
    starts: "Started",
    submits: "Submitted",
    completion: "Completion rate",
    rejected: (n: number) =>
      `${n} submissions rejected — a high share of one error code usually means a field is tripping visitors up:`,
  },

  trend: { title: "Trend", empty: "No data in this period", views: "Views", clicks: "CTA clicks" },

  attribution: {
    title: "Attribution breakdown",
    dimensions: { source: "Source", medium: "Medium", campaign: "Campaign", content: "Ad / creative", term: "Keyword" },
    empty: (param: string) => `No traffic carrying ${param} in this period`,
    columns: { views: "Views", clicks: "CTA clicks", leads: "Leads", cvr: "Lead conv. rate" },
    /** 广告链接没带该维度时的归组名。数据里的哨兵值是 lib/analytics/dimensions.ts 的 UNLABELED。 */
    unlabeled: "(not tagged)",
    note: (param: string, unlabeled: string) =>
      `Sorted by leads. Leads count on-page form submissions only; WhatsApp and phone count as CTA clicks. Traffic is grouped here only when the ad link carries ${param}; anything without it lands in “${unlabeled}”.`,
  },

  channels: {
    title: "CTA channel split",
    empty: "No clicks yet",
    columns: { channel: "Channel", clicks: "Clicks" },
  },

  capiHealth: {
    title: "Server-side conversions (CAPI)",
    verdict: { idle: "No events", healthy: "Healthy", degraded: "Some failures", failing: "Many failures" },
    idleHint: ["No server-side conversions in this period. Configure account-level credentials in ", ", and form conversions get sent to the platform straight from our servers, recovering what blocker extensions swallow."],
    settingsLink: "Settings",
    sent: "Delivered",
    pending: "Retrying",
    failed: "Failed",
    deliveryRate: "Delivery rate",
    lastFailure: (provider: string) => `${provider}: most recent failure`,
    reasons: {
      missingCredential: "No credentials found: neither page-level nor account-level is configured, or they were deleted",
      invalidToken: "The Access Token is invalid or expired — regenerate it on the platform",
      insufficientScope: "The token lacks permission to write to that Dataset / Pixel",
      wrongDataset: "The Dataset ID / Pixel Code is wrong or has been deleted",
      rateLimited: "Rate-limited by the platform; this usually clears itself on retry",
    },
    platformReturned: "Platform returned: ",
    columns: { provider: "Platform", sent: "Delivered", pending: "Retrying", failed: "Failed", lastErrorAt: "Last failure" },
    note: "Delivery rate = delivered / (delivered + failed). Events still retrying aren't settled yet and are excluded from the denominator; an event counts as failed only after hitting the retry limit (5).",
  },

  pageComparison: {
    title: "Page comparison",
    hint: "Click any row to filter every chart below to that page",
    empty: "No landing pages yet",
    columns: { page: "Landing page", views: "Views", clicks: "CTA clicks", leads: "Leads", cvr: "Lead conv. rate" },
    noLeads: "No leads",
    noTraffic: "No traffic",
  },
};
