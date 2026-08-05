// 域名页 + 添加域名弹窗 + 升级引导弹窗 + 发布配额横幅。
export const domains = {
  title: "Domains",
  enabledCount: (used: number, limit: string) => `${used}${limit} domains enabled`,
  add: "Add domain",
  loadErrorLabel: "the domain list",
  empty: "No domains connected yet",

  columns: { domain: "Domain", verification: "Verification", enabled: "Enabled", actions: "Actions" },
  noPublishedPages: "No pages published",
  rootMissing: (domain: string) => `Nothing is published at the root path — visiting ${domain} directly returns 404`,
  verified: "Verified",
  pending: "Pending",
  refreshVerification: "Refresh verification status",
  dns: {
    misconfigured: "DNS not configured",
    misconfiguredTooltip:
      "Ownership is verified, but the DNS records aren't right, so visitors won't see your landing page. Check the A/CNAME records with your DNS provider.",
    ok: "DNS configured",
    okTooltip: "Ownership is verified and DNS points here, so visitors can reach your landing page.",
    recheck: "Re-check DNS configuration",
  },
  deleteConfirm: { title: "Delete this domain?", ok: "Delete", cancel: "Cancel" },
  delete: "Delete",

  addDialog: {
    title: "Add a custom domain",
    intro: "Connect your own domain so visitors see your brand in the address bar.",
    vercelTip: {
      message: "No domain yet? We strongly recommend buying one on Vercel",
      linkText: "Vercel",
      body: [
        "Domains bought on ",
        " have their DNS hosted there by default, so they work as soon as you connect them — no A/CNAME records to configure by hand, and no exposure to mainland-China provider policy. Domains from other registrars (GoDaddy, Namecheap, Alibaba Cloud and so on) work too, but you'll need to add the DNS records yourself in their control panel.",
      ],
    },
    label: "Domain",
    required: "Enter a domain",
    placeholder: "example.com or www.example.com",
    submit: "Add domain",
    submitting: "Adding…",
    errors: {
      invalid_domain: "That domain isn't formatted correctly",
      domain_tld_blocked:
        "Domains under mainland-China jurisdiction (.cn and similar) aren't supported — their resolution depends on ICP filing and registry policy. Use an international domain such as .com or .net.",
      domain_taken: "Another account already has this domain",
      vercel_api_error: "The Vercel API call failed. Please try again shortly.",
      limit_exceeded:
        "You've hit your plan's domain limit. Upgrade, or disable one of your existing domains first.",
      fallback: "Could not add the domain. Please try again.",
    },
    recordsIntro:
      "Domain added. Add the records below with your DNS provider (Cloudflare, AWS Route 53, Namecheap, …). Vercel issues the SSL certificate automatically once DNS propagates.",
    mainlandNs: {
      message: "This domain uses a mainland-China DNS provider",
      description: (provider: string) =>
        `Its nameservers belong to ${provider}. The domain still works, but mainland regulation (real-name and ICP filing rules, for instance) means the provider could suspend resolution. For overseas campaigns we recommend moving DNS to Cloudflare or a similar provider — or at least knowing the risk.`,
    },
    record: { type: "Type", name: "Name", value: "Value" },
    recordHint:
      "⚠️ Use an A record for an apex domain (example.com) and a CNAME for a subdomain (www.example.com). On Cloudflare, set the proxy status to “DNS only” (grey cloud) or certificate issuance is blocked.",
    done: "Done",
  },

  upgradeDialog: {
    title: "You've hit your landing page limit",
    later: "Maybe later",
    cta: (plan: string, price: string) => `See ${plan} · ${price}`,
    body: (current: string, currentLimit: string, target: string, targetLimit: string) =>
      `${current} allows up to ${currentLimit}. Upgrading to ${target} lets you manage up to ${targetLimit}.`,
    alsoGet: "Upgrading also gets you:",
    removeWatermark: "✓ Platform watermark removed",
    moreDomains: (n: string) => `✓ Connect up to ${n}`,
  },

  quotaBanner: {
    expiredTitle: "You're over your plan's published-page limit; the excess is about to be unpublished",
    countdownTitle: (days: number) => `You're over your plan's published-page limit — ${days} days left`,
    body: (published: number, limit: number, excess: number, deadline: string) =>
      `${published} pages are published, your plan allows ${limit}, so you're ${excess} over. Pages already live are unaffected for now, but you can't publish new ones. ${deadline} we'll automatically unpublish the excess, keeping domain root paths and the earliest-published pages first.`,
    deadlineWithin: (days: number) => `If this isn't resolved within ${days} days,`,
    deadlinePassed: "The grace period has ended, so",
    contentSafe: "Pages are only taken offline; their content is never deleted",
    contentSafeSuffix: " — republish any time after upgrading.",
    upgrade: "Upgrade plan",
    managePages: "Manage landing pages",
  },
};
