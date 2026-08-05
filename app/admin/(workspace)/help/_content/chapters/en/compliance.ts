import type { HelpChapterData } from "../../types";

export const compliance: HelpChapterData = {
  slug: "compliance",
  title: "Compliance & content rules",
  summary: "Why these pages carry no transactions, disclaimers for higher-risk categories, and footer requirements.",
  sections: [
    {
      id: "non-transactional",
      heading: "Why there's no checkout or payment",
      blocks: [
        {
          t: "p",
          text: "Pages built on Zap Bridge are lead-capture pages, not storefronts: there's no cart, checkout, order, subscription or refund anywhere on them, and conversion runs through enquiries, bookings and form fills. That's a deliberate design choice:",
        },
        {
          t: "list",
          items: [
            "Enquiry-led conversion performs better for high-ticket overseas business that needs a conversation — open the dialogue first, close it on WhatsApp or the phone.",
            "No transaction step means lower ad-review risk and a much lighter compliance load (no payment compliance, no consumer transaction protections to handle).",
            "Prices in the plans section are display copy (“from $99”) meant to prompt an enquiry — they don't constitute an online sale.",
          ],
        },
        {
          t: "callout",
          tone: "warning",
          text: "Don't add “Buy now”, “Place your order” or “Cash on delivery” to your own copy — the page has no such capability, so this only confuses visitors and invites complaints.",
        },
      ],
    },
    {
      id: "high-risk",
      heading: "Content rules for higher-risk categories",
      blocks: [
        {
          t: "p",
          text: "Health, medical, beauty, weight loss and finance sit under both ad platform policy and the law of your target market, so the copy needs extra care:",
        },
        {
          t: "list",
          items: [
            "No guaranteed outcomes. “Lose 10 lbs in 30 days” or “approval guaranteed” breaks platform policy and may break local advertising law. Use “most customers report…” or “results vary” instead.",
            "Before/after imagery and result claims must carry a disclaimer (templates ship with one — keep it and complete it for your jurisdiction).",
            "Avoid cure claims in medical copy, and return guarantees in financial copy.",
            "Reviews and case studies must be real. Fabricated testimonials are a common reason ad accounts get banned.",
          ],
        },
      ],
    },
    {
      id: "footer-policy",
      heading: "Footer policy links",
      blocks: [
        {
          t: "p",
          text: "Every page's footer needs at least one compliance link or policy entry (privacy policy, disclaimer, terms of service, and so on). It's both a publishing requirement here and a near-universal ad review item — a missing privacy policy is one of the most common reasons landing pages get rejected.",
        },
        {
          t: "list",
          items: [
            "If you collect visitor details (a form), you need a privacy policy stating what you collect and what you use it for.",
            "Cookie consent for EU traffic is handled for you (see the “Tracking & attribution” chapter), but the privacy policy text still has to come from you and reflect what your business actually does.",
          ],
        },
      ],
    },
  ],
};
