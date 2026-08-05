import type { HelpChapterData } from "../../types";

export const tracking: HelpChapterData = {
  slug: "tracking",
  title: "Tracking & attribution",
  summary: "Pixels, server-side conversions (CAPI), UTM attribution, EU cookie consent and anti-duplication.",
  intro:
    "Your tracking setup decides whether the ad platforms can learn who actually converts, which feeds straight into your cost per lead. Tracking is configured per page, in the editor's tracking panel.",
  sections: [
    {
      id: "basic-pixel",
      heading: "Basic tracking: Meta Pixel (all plans)",
      blocks: [
        {
          t: "steps",
          items: [
            { title: "Get the Pixel ID", desc: "Create or find your Pixel in Meta Events Manager and copy the numeric ID (e.g. 1234567890)." },
            { title: "Paste it into the tracking panel", desc: "Editor → tracking panel → paste into “Meta Pixel ID” and save." },
            { title: "Verify", desc: "Visit the published page and confirm events fire, using the Meta Pixel Helper extension or the Test Events tool in Events Manager." },
          ],
        },
        {
          t: "p",
          text: "Pages report these lead-gen events automatically — there's nothing to instrument by hand:",
        },
        {
          t: "table",
          head: ["Event", "Fires when", "Use in campaigns"],
          rows: [
            ["Lead", "The page produces a valid lead", "Your conversion objective — the core optimisation signal"],
            ["Contact", "A visitor taps a contact CTA", "A shallower conversion signal"],
            ["FormSubmit", "A lead form is submitted", "The conversion event on the form path"],
            ["WhatsAppClick", "The WhatsApp button is tapped", "The conversion event on the WhatsApp path"],
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "Every event is lead-oriented — there's no Purchase or Checkout, because these pages carry no ecommerce. Set your campaign objective to a Lead-type goal.",
        },
      ],
    },
    {
      id: "advanced-pixels",
      heading: "Multi-platform tracking (Pro and above)",
      blocks: [
        {
          t: "p",
          text: "Pro and Agency can run several platforms at once; each takes its own ID in the tracking panel:",
        },
        {
          t: "table",
          head: ["Platform", "What to enter", "Format", "Where to find it"],
          rows: [
            ["Meta", "Pixel ID", "1234567890", "Meta Events Manager"],
            ["Google Analytics", "GA4 measurement ID", "G-XXXXXXX", "GA4 Admin → Data streams"],
            ["Google Ads", "Conversion ID", "AW-XXXXXXXXX", "Google Ads → Conversions"],
            ["TikTok", "Pixel ID", "CXXXXXXXXXXXXXXXXX", "TikTok Events Manager"],
          ],
        },
      ],
    },
    {
      id: "capi",
      heading: "Server-side conversions, CAPI (Pro and above)",
      blocks: [
        {
          t: "p",
          text: "iOS privacy limits and ad blockers swallow a meaningful share of client-side pixel events. The Conversions API sends conversions to Meta and TikTok straight from our servers, out of the browser's reach — which measurably improves attribution completeness and ROAS optimisation.",
        },
        {
          t: "steps",
          items: [
            { title: "Turn it on", desc: "Tracking panel → tick “Enable server-side conversions (CAPI)”, separately for Meta and TikTok." },
            { title: "Enter credentials", desc: "Meta takes a Dataset ID plus Access Token (generate it in Events Manager → Settings → Conversions API); TikTok takes a Pixel Code plus Access Token (from Events Manager)." },
            { title: "Save and verify", desc: "Once saved it shows “Configured ✓”. You should see server-sourced events arriving in the Meta / TikTok event tools." },
          ],
        },
        {
          t: "callout",
          tone: "warning",
          text: "Access tokens are never displayed again once saved (by design). To change one, just paste the new value over it; unticking the box deletes the stored credentials.",
        },
        {
          t: "p",
          text: "How delivery works: each lead is sent in real time, retried automatically on failure, with a daily sweep as a safety net — normally there's nothing for you to watch.",
        },
      ],
    },
    {
      id: "utm",
      heading: "UTM parameters and attribution",
      blocks: [
        {
          t: "p",
          text: "Put UTM parameters on your ad's landing page URL (utm_source / utm_medium / utm_campaign and so on) and they're captured automatically, then carried through with leads and conversion events — so you know which channel and which ad set each lead came from.",
        },
        {
          t: "list",
          items: [
            "For example: https://example.com/?utm_source=facebook&utm_medium=cpc&utm_campaign=summer_sale",
            "Meta, TikTok and Google all let you set URL parameters once at the ad level. Use dynamic macros (Meta's {{campaign.name}}, for instance) rather than typing them by hand.",
            "Combine the source data in the lead inbox and analytics dashboard to judge lead quality per channel.",
          ],
        },
      ],
    },
    {
      id: "cmp",
      heading: "Cookie consent for EU visitors",
      blocks: [
        {
          t: "p",
          text: "For visitors in the EU, EEA and UK, the page shows a cookie consent banner automatically: no tracking is collected before they consent, and normal reporting resumes after. Visitors elsewhere are unaffected.",
        },
        {
          t: "list",
          items: [
            "This is a GDPR requirement. The system decides from the visitor's location — there's nothing for you to configure.",
            "When you run EU traffic, event counts in reports sit slightly below actual visits (non-consenting visitors aren't counted). That's expected.",
          ],
        },
      ],
    },
    {
      id: "anti-ban",
      heading: "Anti-duplication (Agency only)",
      blocks: [
        {
          t: "p",
          text: "When many advertisers use the same template, the pages share a near-identical structural fingerprint, and platforms may treat them as duplicate or low-quality and throttle delivery. Anti-duplication scatters your page's DOM structure, attributes and meta fingerprint so it no longer matches others built on the same template.",
        },
        {
          t: "list",
          items: [
            "Visitors and platform crawlers see exactly the same content — only the structural fingerprint changes, not what's on the page. This is not cloaking and doesn't breach platform policy.",
            "How to use it: editor → anti-duplication panel. If a page gets flagged or throttled, hit “Re-scatter fingerprint” for a new seed and republish.",
            "Agency only; pages on other plans use the default structure.",
          ],
        },
      ],
    },
  ],
};
