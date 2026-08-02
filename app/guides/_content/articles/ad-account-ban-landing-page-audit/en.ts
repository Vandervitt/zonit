import type { GuideArticle } from "../../types";

export const adAccountBanLandingPageAudit: GuideArticle = {
  slug: "ad-account-ban-landing-page-audit",
  title: "Account restricted or throttled? Audit the landing page first",
  description:
    "When an account gets restricted, most people re-examine the creative. The page is the more common cause. This is the order to check things in, and what to do while the appeal sits.",
  keywords: [
    "ad account banned",
    "ad account restricted",
    "ad delivery throttled",
    "landing page policy audit",
  ],
  ctaTarget: "anti-ban",
  datePublished: "2026-08-02",
  intro:
    "The creative passed review. The ad ran. Then delivery collapsed, or the account was restricted, and the first instinct is to rewrite the ad. Reviewers read the destination, not only the creative — which is why a compliant ad pointing at a non-compliant page fails, and why the damage lands on the account rather than on the page. This is the audit order that finds the cause fastest.",
  sections: [
    {
      id: "triage",
      heading: "First: work out which thing actually happened",
      blocks: [
        {
          t: "p",
          text: "Three different events get described as 'banned', and they have different causes and different remedies. Misidentifying which one you are in wastes the appeal window.",
        },
        {
          t: "table",
          head: ["What happened", "What it usually means", "First place to look"],
          rows: [
            ["Single ad rejected", "A specific policy trigger in creative or destination", "The page section matching the stated policy"],
            ["Delivery collapsed, nothing rejected", "Quality or relevance signals, not a policy breach", "Landing experience: speed, mismatch, bounce"],
            ["Account restricted", "Accumulated signals, or one severe category", "The whole set of pages, not this campaign"],
            ["Domain flagged", "The destination itself, across advertisers", "Shared hosting, prior owner, redirect chain"],
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "The distinction that saves the most time: a rejection names a policy, a throttle names nothing. If nothing was rejected, stop reading the policy pages and start looking at landing experience.",
        },
      ],
    },
    {
      id: "page-audit",
      heading: "The page audit, in order",
      blocks: [
        {
          t: "p",
          text: "Work top-down. Each step is cheap and rules out a whole class of cause.",
        },
        {
          t: "steps",
          items: [
            {
              title: "Does the page say what the ad promised?",
              desc: "Message mismatch is the most common cause of quiet throttling. If the ad offers a free assessment and the page opens with a discount, that is a mismatch even though both are yours.",
            },
            {
              title: "Read the page as the reviewer, not as the author",
              desc: "Find every sentence that states an outcome, a timeline, or a guarantee. In health, finance, and employment categories, that is where the trigger almost always is.",
            },
            {
              title: "Check what is above the fold on a phone",
              desc: "Reviewers see mobile. A disclaimer that sits beside the claim on desktop and three screens below it on mobile is not doing its job.",
            },
            {
              title: "Confirm the footer is complete and reachable",
              desc: "Privacy policy and terms must exist as real pages, not as dead links. A broken privacy link is a trivial fix and a recurring rejection cause.",
            },
            {
              title: "Follow every redirect the ad actually traverses",
              desc: "Trackers, shorteners, and geo-redirects all count. A clean final page reached through a flagged intermediary still fails.",
            },
            {
              title: "Load it from the target market",
              desc: "Geo-gating, currency switches, or an interstitial that only appears for some regions can make the reviewer's experience different from yours.",
            },
          ],
        },
      ],
    },
    {
      id: "the-set",
      heading: "If the account is restricted, audit the set",
      blocks: [
        {
          t: "p",
          text: "Account-level action is rarely about one page. It is about a pattern across everything the account has pointed at — which is why fixing the campaign you were running when it happened often changes nothing.",
        },
        {
          t: "list",
          items: [
            "List every destination the account has used in recent months, including paused campaigns",
            "Look for the shared element: same boilerplate, same stock imagery, same structure, same hosting",
            "Check whether any page in the set is in a restricted category you had forgotten about",
            "Check the domains' history — a previously flagged domain carries its record forward",
          ],
        },
        {
          t: "callout",
          tone: "warning",
          text: "Do not open a second account to keep spending while the first is under review. Platforms treat that as circumvention, and it converts a recoverable restriction into a permanent one.",
        },
      ],
    },
    {
      id: "while-you-wait",
      heading: "What to do while the appeal sits",
      blocks: [
        {
          t: "p",
          text: "Appeals take days and are often decided by systems rather than people. What you do in the meantime determines whether you have anything to restart with.",
        },
        {
          t: "list",
          items: [
            "Fix the page first, then appeal — appealing an unchanged page usually reproduces the same result",
            "Keep the fix documented: what changed, when, and why, so a second appeal can point at specifics",
            "Do not delete the page. A destination that 404s during review removes the reviewer's ability to clear it",
            "Move spend to a channel that is still working rather than to a new account on the same platform",
            "Treat leads already in your inbox as the asset they are — this is the week they matter most",
          ],
        },
      ],
    },
    {
      id: "prevention",
      heading: "The prevention that actually pays off",
      blocks: [
        {
          t: "p",
          text: "Most of what gets accounts into trouble is structural rather than accidental, which means it is preventable at build time rather than at review time.",
        },
        {
          t: "list",
          items: [
            "Write the page so the persuasive version and the compliant version are the same sentence — an assessment offer usually achieves this where an outcome claim cannot",
            "Keep qualifiers inline, beside the claim, rather than pooled in a footer",
            "Ship a real privacy policy and terms on every page from the start, not when the first rejection arrives",
            "Reduce accidental structural similarity across your own pages before scale makes it visible",
            "Keep one page per offer, so a rejection tells you which offer is the problem",
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
              q: "The ad was approved. How can the page be the problem?",
              a: "Approval of a creative is not approval of the destination, and pages are re-reviewed independently and repeatedly. A page can also change after approval — yours, or a shared component on it — which is why previously fine campaigns start failing without anyone touching the ad.",
            },
            {
              q: "Nothing was rejected but delivery died. Is that a policy issue?",
              a: "Usually not. Silent collapse points at quality and relevance signals: slow loading, mismatch between ad and page, or a landing experience that produces immediate bounces. Those are measured, not adjudicated, so there is no notice and nothing to appeal.",
            },
            {
              q: "Can I just move to a new domain?",
              a: "It sometimes restores delivery and it does not address why the first one was flagged. If the cause was the content or the structure, the new domain inherits the problem within days — and repeatedly rotating domains is itself a signal.",
            },
            {
              q: "How long should I wait before appealing again?",
              a: "Appeal once with the page genuinely fixed rather than repeatedly with it unchanged. Repeated identical appeals rarely change the outcome and can look like pressure rather than remediation.",
            },
          ],
        },
      ],
    },
  ],
  references: [
    {
      label: "Meta — Advertising Standards: Landing page requirements",
      url: "https://transparency.meta.com/policies/ad-standards/",
    },
    {
      label: "Google Ads — Destination requirements",
      url: "https://support.google.com/adspolicy/answer/6368661",
    },
    {
      label: "Google Ads — About account suspensions",
      url: "https://support.google.com/adspolicy/answer/7187501",
    },
  ],
};
