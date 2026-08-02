import type { GuideArticle } from "../../types";

export const tiktokLandingPageCompliance: GuideArticle = {
  slug: "tiktok-landing-page-compliance",
  title: "TikTok landing page rejections: what differs from Meta",
  description:
    "A page that clears Meta review can still fail on TikTok. This covers where the two diverge, the categories TikTok treats more strictly, and the ad-to-page consistency rule that catches most advertisers.",
  keywords: [
    "TikTok landing page rejection",
    "TikTok ads landing page",
    "TikTok ad policy",
    "TikTok creative compliance",
  ],
  ctaTarget: "anti-ban",
  datePublished: "2026-08-02",
  intro:
    "Most advertisers arrive at TikTok with a page that already works on Meta and assume the review will behave the same way. It does not. The policies overlap heavily, but the enforcement emphasis, the category restrictions, and the expectations about the ad-to-page relationship differ enough that a clean Meta page can fail here for reasons that never came up before.",
  sections: [
    {
      id: "where-they-diverge",
      heading: "Where TikTok and Meta diverge",
      blocks: [
        {
          t: "p",
          text: "The overlap is large — the differences are what cost you a launch week.",
        },
        {
          t: "table",
          head: ["Area", "What tends to differ", "Practical effect"],
          rows: [
            ["Ad-to-page consistency", "TikTok weighs the match between the video's claim and the page heavily", "A creative-led video with a generic page fails more often here"],
            ["Category entry", "Several verticals require documentation or are gated by market", "Approval can depend on who you are, not only what the page says"],
            ["Audience age composition", "A younger user base raises scrutiny on age-sensitive categories", "Supplements, finance, and appearance claims get read harder"],
            ["Landing experience", "Mobile-first to a greater degree; slow pages are penalised sooner", "Desktop-optimised pages underperform even when compliant"],
            ["Regional variation", "Policy application varies more visibly by market", "Approval in one market predicts little about another"],
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "The single most useful reframe: on TikTok, treat the video and the page as one submission that has to tell one story. Advertisers who treat the page as a separate asset get caught here first.",
        },
      ],
    },
    {
      id: "consistency",
      heading: "The consistency rule that catches most people",
      blocks: [
        {
          t: "p",
          text: "TikTok creative is native by design — the video looks like organic content. That is what makes it work, and it is also what creates the gap: an entertaining video that never states the offer, pointing at a page that opens with a hard offer, reads as a mismatch even though both are legitimately yours.",
        },
        {
          t: "steps",
          items: [
            {
              title: "State the same offer in both",
              desc: "If the video promises a free assessment, that phrase should be visible in the first screen of the page — not a paraphrase further down.",
            },
            {
              title: "Carry the visual identity across",
              desc: "Same product, same person, same setting where possible. A visitor arriving from a face they just watched should recognise the page.",
            },
            {
              title: "Do not escalate the claim on the page",
              desc: "A cautious video followed by an aggressive page is the pattern that gets flagged. Whatever the strongest claim is, it should appear in both or in neither.",
            },
            {
              title: "Match the language and the market",
              desc: "A localised video pointing at an English page is both a compliance signal and a conversion problem.",
            },
          ],
        },
      ],
    },
    {
      id: "stricter-categories",
      heading: "Categories that get read harder here",
      blocks: [
        {
          t: "p",
          text: "These are not necessarily prohibited — several are permitted with documentation or in specific markets. But they carry more review weight than the equivalent Meta submission.",
        },
        {
          t: "list",
          items: [
            "Weight management and body-image adjacent products — the strictest of the group in practice",
            "Supplements and anything implying a health effect, including 'wellness' framing",
            "Financial services, earning claims, and anything resembling an income opportunity",
            "Cosmetic procedures and appearance-outcome claims",
            "Products where the natural audience skews young, regardless of the product's own category",
          ],
        },
        {
          t: "callout",
          tone: "warning",
          text: "Category rules and market availability change, and they differ by country. Check the current policy for the markets you are entering rather than relying on what worked last quarter or in a different market.",
        },
      ],
    },
    {
      id: "page-checklist",
      heading: "Page checklist before you submit",
      blocks: [
        {
          t: "p",
          text: "Everything here is cheap to fix before submission and expensive to discover after a rejection.",
        },
        {
          t: "list",
          items: [
            "Loads fast on a mid-range phone on mobile data, not on your laptop",
            "The offer from the video is in the first screen, in the same words",
            "Qualifiers sit beside the claims they qualify, visible without scrolling past them",
            "Privacy policy and terms exist as real, reachable pages",
            "No auto-playing audio, no interstitial before the content, no forced app redirect",
            "Every redirect in the chain resolves cleanly from the target market",
            "Age-sensitive content is gated where the category requires it",
          ],
        },
      ],
    },
    {
      id: "faq",
      heading: "Common questions",
      blocks: [
        {
          t: "faq",
          items: [
            {
              q: "The same page is approved on Meta. Why is it rejected here?",
              a: "Each platform reviews independently against its own policy, and the emphasis differs — TikTok weighs ad-to-page consistency and category entry more heavily, and its younger audience composition raises scrutiny on age-sensitive verticals. Approval elsewhere carries no weight in this review.",
            },
            {
              q: "Do I need a separate landing page for TikTok?",
              a: "Often yes, and usually for conversion reasons before compliance ones. The traffic arrives from a native video with a specific expectation, and a page written for search intent answers a different question. Running a page per channel also means a rejection tells you which channel is the problem.",
            },
            {
              q: "Does the video have to mention the offer explicitly?",
              a: "It converts better and it reviews better. A video that is purely entertaining and a page that is purely transactional is the mismatch pattern — you do not have to make the video an infomercial, but the offer should not be a surprise on arrival.",
            },
            {
              q: "My account is fine but delivery is minimal. Is that a rejection?",
              a: "No. Silent low delivery usually reflects quality and relevance signals rather than a policy decision — commonly slow mobile loading or a landing experience that produces immediate exits. There is no notice for this and nothing to appeal; it is fixed on the page.",
            },
          ],
        },
      ],
    },
  ],
  references: [
    {
      label: "TikTok for Business — Advertising policies: Industry entry",
      url: "https://ads.tiktok.com/help/article/tiktok-advertising-policies-industry-entry",
    },
    {
      label: "TikTok for Business — Advertising policies: Ad creatives and landing page",
      url: "https://ads.tiktok.com/help/article/tiktok-advertising-policies-ad-creatives-landing-page",
    },
  ],
};
