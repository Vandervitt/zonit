import type { GuideArticle } from "../../types";

export const googleAdsLandingPagePolicy: GuideArticle = {
  slug: "google-ads-landing-page-policy",
  title: "Google Ads destination requirements: why pages get disapproved",
  description:
    "Google reviews the destination, not just the ad. This covers the destination requirements most advertisers trip over, how disapproval differs from low Ad Rank, and what to fix first.",
  keywords: [
    "Google Ads landing page",
    "destination requirements",
    "ad disapproved",
    "landing page experience",
  ],
  ctaTarget: "anti-ban",
  datePublished: "2026-08-02",
  intro:
    "Google evaluates the destination in two separate ways, and confusing them leads to fixing the wrong thing. One is policy: the page either meets the destination requirements or the ad is disapproved. The other is quality: landing page experience feeds Ad Rank, so a fully compliant page can still deliver almost nothing while costing more per click. This covers both, and how to tell which one you are dealing with.",
  sections: [
    {
      id: "two-systems",
      heading: "Disapproval and low Ad Rank are different problems",
      blocks: [
        {
          t: "p",
          text: "The symptom is similar — the ad is not delivering — but the cause, the notification, and the fix have nothing in common.",
        },
        {
          t: "table",
          head: ["", "Policy disapproval", "Landing page experience"],
          rows: [
            ["Notification", "Explicit, names a policy", "None — you infer it from metrics"],
            ["Effect", "Ad does not run at all", "Runs, but ranks lower and costs more"],
            ["Cause", "Requirement breach on the destination", "Relevance, usability, speed, transparency"],
            ["Fix", "Correct the breach, then appeal", "Improve the page, wait for re-evaluation"],
            ["Appeal", "Available and appropriate", "Nothing to appeal"],
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "If you received no disapproval notice, stop reading policy pages. You are dealing with quality signals, and the answer is on the page rather than in the rulebook.",
        },
      ],
    },
    {
      id: "destination-requirements",
      heading: "The destination requirements advertisers trip over",
      blocks: [
        {
          t: "p",
          text: "Most disapprovals in this category are mundane rather than exotic — the requirements are about the destination working, being honest, and being reachable.",
        },
        {
          t: "list",
          items: [
            "The URL must work for everyone, from every targeted location and device — a page that geo-blocks the reviewer fails",
            "No mismatch between the display URL, the final URL, and where the visitor actually lands",
            "No redirect through a domain unrelated to the destination, and no chains that break in some markets",
            "The page must not be under construction, parked, or return an error for any targeted market",
            "Content must be crawlable — blocking Google's crawler in robots.txt prevents evaluation entirely",
            "Contact information, privacy policy, and terms must exist as real, reachable pages",
            "No automatic downloads, no unexpected interstitials, and no back-button hijacking",
          ],
        },
      ],
    },
    {
      id: "landing-page-experience",
      heading: "What landing page experience actually measures",
      blocks: [
        {
          t: "p",
          text: "This is the quality half, and it is where compliant advertisers quietly lose money. Four things carry it, and only one of them is speed.",
        },
        {
          t: "steps",
          items: [
            {
              title: "Relevance to the search, not just the keyword",
              desc: "Someone searching for a specific service should land on that service. A general homepage that technically contains the keyword scores badly and converts worse.",
            },
            {
              title: "Usefulness and originality",
              desc: "A page that only restates the ad gives the visitor nothing. Substance — how it works, what it costs, what happens next — is measured indirectly through behaviour.",
            },
            {
              title: "Transparency about who you are",
              desc: "Real business information, clear contact routes, and honest handling of personal data. This is the most commonly missing one on lead-gen pages.",
            },
            {
              title: "Navigation and speed on mobile",
              desc: "Fast on a mid-range phone on mobile data. Interstitials, layout shift, and forced app prompts all count against it.",
            },
          ],
        },
      ],
    },
    {
      id: "restricted-categories",
      heading: "Categories with additional destination rules",
      blocks: [
        {
          t: "p",
          text: "Some verticals carry extra requirements on the page itself, and several require certification before the ad can run at all.",
        },
        {
          t: "list",
          items: [
            "Healthcare and medicines: restricted by market, with certification required for several sub-categories",
            "Financial services: disclosure requirements on the page, plus verification in many markets",
            "Legal services: regulated by jurisdiction, with claims restrictions that vary by market",
            "Anything collecting sensitive personal data: heightened requirements on how the page explains and handles it",
          ],
        },
        {
          t: "callout",
          tone: "warning",
          text: "Certification and market availability change. Check the current policy for the markets you are targeting rather than relying on a previous approval — a page that was fine last year in one country tells you nothing about this year in another.",
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
              q: "My ad was approved before and is disapproved now. Nothing changed.",
              a: "Destinations are re-reviewed continuously, and something on the page may have changed without you touching it — a third-party script, an embedded widget, a broken policy link, or a redirect that now fails from one market. Check the page as it currently resolves rather than as you remember writing it.",
            },
            {
              q: "Does a slow page get disapproved?",
              a: "Not usually — speed feeds landing page experience rather than policy. The effect is lower Ad Rank and higher cost per click rather than a disapproval notice, which is why it is easy to miss for months.",
            },
            {
              q: "Can I send traffic to a homepage?",
              a: "You can, and it usually scores poorly. Relevance is assessed against the search, so a page that answers the specific query outperforms a homepage that mentions everything — this is a case where the compliance-friendly choice and the conversion-friendly choice are the same one.",
            },
            {
              q: "Is a privacy policy actually required?",
              a: "If the page collects any personal information, treat it as required — and beyond Google's own requirements, data protection law in your target markets will have its own view. It is a trivial page to publish and a recurring reason for otherwise fine pages to be disapproved.",
            },
          ],
        },
      ],
    },
  ],
  references: [
    {
      label: "Google Ads — Destination requirements",
      url: "https://support.google.com/adspolicy/answer/6368661",
    },
    {
      label: "Google Ads — About landing page experience",
      url: "https://support.google.com/google-ads/answer/2404197",
    },
    {
      label: "Google Ads — Advertising policies help centre",
      url: "https://support.google.com/adspolicy/answer/6008942",
    },
  ],
};
