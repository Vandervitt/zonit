import type { GuideArticle } from "../../types";

export const landingPageConversionAttribution: GuideArticle = {
  slug: "landing-page-conversion-attribution",
  title: "Landing page conversion attribution: pixels, UTMs, and server-side (CAPI)",
  description:
    "Spending on ads without knowing which conversions came from where? This walks through the three layers of landing page attribution — browser pixels, UTM parameters, and server-side forwarding (CAPI) — and why iOS and browser restrictions make CAPI non-optional.",
  keywords: ["conversion attribution", "CAPI", "server-side events", "Meta Pixel", "UTM"],
  datePublished: "2026-07-26",
  intro:
    "The worst place to be in paid acquisition is “the money went out, and I don't know where the conversions came from.” Attribution is how you answer which ad or channel produced a given lead. This breaks down the three layers of landing page attribution, and why browser pixels alone no longer cut it.",
  sections: [
    {
      id: "why",
      heading: "Why attribution is not optional",
      blocks: [
        {
          t: "p",
          text: "Without attribution you can't tell which ad, which channel, or which page is actually producing leads — you're adjusting budget on instinct. With it in place, ad platforms receive real conversion signals to optimise against, and you can concentrate spend on the combinations that work.",
        },
      ],
    },
    {
      id: "three-layers",
      heading: "The three layers: pixel, UTM, CAPI",
      blocks: [
        {
          t: "table",
          head: ["Layer", "What it is", "What it solves"],
          rows: [
            [
              "Browser pixel",
              "JS tracking code embedded in the page (e.g. Meta Pixel)",
              "Records views, clicks, and conversion events on the browser side",
            ],
            [
              "UTM parameters",
              "Link suffixes (utm_source / medium / campaign)",
              "Marks which channel, ad, or creative the traffic came from",
            ],
            [
              "Server-side (CAPI)",
              "Conversion events sent to the ad platform straight from your server",
              "Bypasses browser restrictions and fills in conversions the pixel missed",
            ],
          ],
        },
      ],
    },
    {
      id: "why-capi",
      heading: "Why the pixel alone stopped being enough",
      blocks: [
        {
          t: "p",
          text: "iOS privacy rules, browser restrictions on third-party cookies, and ad blockers all cause browser pixels to miss a meaningful share of conversions. When the pixel under-reports, the ad platform never learns an accurate conversion signal, and optimisation suffers.",
        },
        {
          t: "callout",
          tone: "info",
          text: "Server-side forwarding (CAPI) sends conversion events to the platform directly from your server, independent of the browser environment, filling in what the pixel lost. Sending both — pixel plus CAPI, deduplicated — is the mainstream approach today.",
        },
      ],
    },
    {
      id: "setup",
      heading: "Setting it up on the landing page",
      blocks: [
        {
          t: "steps",
          items: [
            { title: "Install the pixel", desc: "Add your Meta / TikTok / Google pixel IDs to the landing page" },
            { title: "Tag with UTMs", desc: "Give every ad link consistent UTM parameters to mark its source" },
            {
              title: "Define the conversion event",
              desc: "Decide what counts as a conversion (form submit, WhatsApp click, and so on)",
            },
            {
              title: "Turn on server-side forwarding",
              desc: "Configure CAPI so conversions are also sent server-side and deduplicated against the pixel",
            },
            {
              title: "Verify",
              desc: "Use the platform's event debugging tools to confirm events arrive correctly and aren't duplicated",
            },
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
              q: "Will the pixel and CAPI double-count conversions?",
              a: "Not as long as you pass the same event ID for the same event — the platform deduplicates automatically. Sending both with a shared event ID is the recommended setup: you recover what was lost without counting anything twice.",
            },
            {
              q: "Do UTM parameters hurt SEO?",
              a: "UTM-tagged links are for ad campaigns and shouldn't serve as the page's canonical URL. Set the landing page's canonical to the clean address and the duplicate-content concern goes away.",
            },
            {
              q: "Can I set up CAPI without a technical team?",
              a: "Yes. Landing page tools with built-in server-side forwarding usually just need your pixel credentials to switch it on — there's no server for you to build.",
            },
          ],
        },
      ],
    },
  ],
  references: [
    {
      label: "Conversions API documentation — Meta for Developers",
      url: "https://developers.facebook.com/docs/marketing-api/conversions-api/",
    },
    {
      label: "Deduplicate pixel and server events — Meta for Developers",
      url: "https://developers.facebook.com/documentation/ads-commerce/conversions-api/deduplicate-pixel-and-server-events",
    },
    {
      label: "Collect campaign data with custom URLs (UTM) — Google Analytics Help",
      url: "https://support.google.com/analytics/answer/10917952",
    },
    {
      label: "App Tracking Transparency (ATT) — Apple Developer",
      url: "https://developer.apple.com/documentation/apptrackingtransparency",
    },
  ],
};
