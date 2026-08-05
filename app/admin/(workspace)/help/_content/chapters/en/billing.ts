import type { HelpChapterData } from "../../types";

export const billing: HelpChapterData = {
  slug: "billing",
  title: "Plans & billing",
  summary: "Full comparison of the four plans, managing your subscription, and what happens when you hit a limit.",
  sections: [
    {
      id: "plans",
      heading: "Full plan comparison",
      blocks: [
        {
          t: "table",
          head: ["Feature", "Free ($0)", "Starter ($5.99/mo)", "Pro ($19.99/mo)", "Agency ($49.99/mo)"],
          rows: [
            ["Landing pages", "1", "5", "20", "Unlimited"],
            ["Custom domains", "0", "1", "5", "Unlimited"],
            ["AI full-page generations / month", "3", "15", "80", "300"],
            ["AI copy rewrites / month", "10", "100", "Unlimited", "Unlimited"],
            ["Every industry template", "✓", "✓", "✓", "✓"],
            ["Visual editor + autosave", "✓", "✓", "✓", "✓"],
            ["Basic tracking (1× Meta Pixel)", "✓", "✓", "✓", "✓"],
            ["Publish on a platform address (no DNS)", "✓", "✓", "✓", "✓"],
            ["Publish on your own domain", "—", "✓", "✓", "✓"],
            ["Remove platform watermark", "—", "—", "✓", "✓"],
            ["Multi-platform tracking (Meta/TikTok/Google) + CAPI", "—", "—", "✓", "✓"],
            ["Lead webhook", "—", "—", "✓", "✓"],
            ["Anti-duplication", "—", "—", "—", "✓"],
          ],
        },
        {
          t: "list",
          items: [
            "New accounts get 7 days of full Pro, then drop back to Free automatically (no card needed, pages and data are kept).",
            "Free and Starter pages carry a platform watermark in the footer; Pro and above remove it.",
            "Free can publish too — on a platform-assigned address. What it can't do is carry your own brand domain.",
            "Which to pick: Starter to test a single page; Pro for real campaigns (CAPI attribution and lead automation); Agency for multi-client or multi-page portfolios, or when you need anti-duplication.",
          ],
        },
      ],
    },
    {
      id: "subscribe",
      heading: "Subscribing, changing and invoices",
      blocks: [
        {
          t: "list",
          items: [
            "Upgrading: Plan & billing → pick the plan → Upgrade, and complete checkout on the secure payment page. Major credit cards are supported.",
            "Subscriptions bill monthly and renew automatically. Invoices and payment history live in the payment provider's customer portal, reachable via “Manage subscription”.",
            "Cancelling: also through “Manage subscription” in that portal. Your benefits stay active until the end of the current period.",
          ],
        },
      ],
    },
    {
      id: "quota-limits",
      heading: "What happens at a limit, or after a downgrade",
      blocks: [
        {
          t: "table",
          head: ["Situation", "What happens"],
          rows: [
            ["Landing page or domain limit reached", "You can't create or connect more — delete something or upgrade. Existing content is untouched"],
            ["AI full-page allowance used up", "The monthly allowance resets each calendar month. If you've bought a credit pack it's used automatically (credits never expire); otherwise wait for the reset or upgrade"],
            ["AI rewrite allowance used up", "Rewrites don't draw on credit packs: once the monthly allowance is gone you wait for the reset or upgrade (Pro and above are unlimited)"],
            ["Downgrade leaves you over the new limits", "Published pages aren't deleted, but capabilities beyond the new plan (advanced tracking, webhooks) stop working until you move back up"],
          ],
        },
      ],
    },
  ],
};
