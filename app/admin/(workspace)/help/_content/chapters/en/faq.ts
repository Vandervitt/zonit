import type { HelpChapterData } from "../../types";

export const faq: HelpChapterData = {
  slug: "faq",
  title: "FAQ & troubleshooting",
  summary: "Common questions, a troubleshooting table, and how to reach support.",
  sections: [
    {
      id: "faq",
      heading: "Common questions",
      blocks: [
        {
          t: "faq",
          items: [
            {
              q: "How do I publish a landing page?",
              a: "Hit Publish in the editor's top bar. No domain yet? Choose “Publish on a platform address” — no DNS needed, the page goes live immediately and can capture leads. To use your own brand domain, connect and verify it under Domains first (DNS setup is in “Domains & publishing”), then pick it in the publish dialog.",
            },
            {
              q: "I don't have a domain yet — can I publish and see how it goes?",
              a: "Yes. Choose “Publish on a platform address” and you get a dedicated address derived from the page name: no domain to buy, no DNS records to touch, and forms, WhatsApp and phone enquiries all work normally. You can move it to your own domain later without affecting the content or the leads you've already collected.",
            },
            {
              q: "Does editing a published page change what's live straight away?",
              a: "No. What's live is the snapshot from your last publish, and edits after that only touch the draft — the top bar and list will flag “unpublished changes”. It switches over when you hit Update. So you can edit safely while ads are running.",
            },
            {
              q: "How is the AI allowance counted?",
              a: "Per calendar month, resetting each month (full-page generation and copy rewriting count separately). Credits bought separately never expire and are used automatically once the monthly allowance is gone.",
            },
            {
              q: "What conversion methods do these pages support?",
              a: "Visitors reach you by WhatsApp, phone, email or Telegram, or submit a lead form. The pages carry no cart, payment or other transaction features.",
            },
            {
              q: "Why can't I add a .cn or other mainland-China domain?",
              a: "Domains under mainland-China jurisdiction (.cn / .com.cn / .中国 and similar) depend on ICP filing and registry policy, and resolution can be suspended — not a good fit for landing pages aimed overseas, so they're blocked at the point of adding. Use an international domain such as .com or .net.",
            },
            {
              q: "Can I publish one page to several domains?",
              a: "One page publishes to one address. If you need to run several domains, duplicate the page and publish each copy (pair this with Agency's anti-duplication to avoid being flagged as duplicates).",
            },
            {
              q: "Can one domain host several pages?",
              a: "Yes. Put a page on each path under the same domain — brand.com for the overview, brand.com/invisalign and brand.com/whitening for individual services. Enter the path after the domain when publishing. Republishing to the same domain and path replaces what's there, taking the previous page offline. How many you can publish depends on your plan's publishing allowance, not on how many domains you've connected.",
            },
            {
              q: "If I unpublish, do I lose the domain?",
              a: "No. Unpublishing only takes the page offline; the domain binding and its verified status stay, and you can republish any time.",
            },
            {
              q: "Why does my page have a platform watermark?",
              a: "Free and Starter pages show a watermark in the footer. Upgrading to Pro or above removes it automatically.",
            },
            {
              q: "What happens when my free Pro trial ends?",
              a: "You drop back to Free automatically: all pages and data are kept, while Pro-only capabilities (watermark removal, multi-platform tracking and CAPI, lead webhooks) stop working and the watermark returns. Free allows 1 published page — anything over that gets a 7-day grace period and an email first, and is only unpublished automatically if it's still unresolved (taken offline, never deleted), keeping the domain root and your earliest-published page first. Pages on a platform address follow the same rule and don't vanish when the trial ends. Upgrading restores everything at any time.",
            },
            {
              q: "Do I lose pages when I change plan?",
              a: "No. After a downgrade your pages and data remain, but capabilities beyond the new plan's allowance (advanced tracking, webhooks) stop working.",
            },
          ],
        },
      ],
    },
    {
      id: "troubleshoot",
      heading: "Troubleshooting table",
      blocks: [
        {
          t: "table",
          head: ["Symptom", "Most likely cause", "What to do"],
          rows: [
            [
              "Publish is blocked",
              "Validation failed: an empty primary CTA, or a template placeholder number left on the page",
              "Fix each blocking item listed in the top bar: fill in the hero's primary button, and replace any number starting 1555 with a real one",
            ],
            [
              "Domain stuck on “Pending”",
              "DNS hasn't propagated, or the records are wrong",
              "Check record type and value (apex: A @ 76.76.21.21; subdomain: CNAME cname.vercel-dns.com), delete conflicting old records, then hit “Refresh verification status” once it propagates",
            ],
            [
              "Pixel doesn't fire / no events in the ad platform",
              "Wrong Pixel ID, or an EU visitor who hasn't consented to cookies",
              "Test with Meta Pixel Helper; check the ID format in the tracking panel. Lower event counts on EU traffic are normal CMP behaviour",
            ],
            [
              "No leads arriving",
              "Contact details unreachable, or the path was never tested",
              "Work through the checklist in the “Leads” chapter: page reachable → submit a test → check the number → check notification channels → read the funnel",
            ],
            [
              "Webhook isn't receiving anything",
              "Wrong URL, or your endpoint isn't returning 2xx",
              "Check the URL in settings; check your endpoint's logs and response codes. Failures retry automatically and catch up once you're back",
            ],
            [
              "Image upload fails",
              "File too large, or an unsupported format",
              "Retry with a JPG / PNG / WebP under 1 MB, or import from Unsplash instead",
            ],
            [
              "Editor shows “Save failed — click to retry”",
              "Network blip, or an expired session",
              "Check your connection and hit retry; if it still fails, refresh and sign in again. Your content is whatever the last “Saved” state held",
            ],
          ],
        },
      ],
    },
    {
      id: "support",
      heading: "Contacting support",
      blocks: [
        {
          t: "p",
          text: "Still stuck? Email support@zapbridge.tech with the page link and a screenshot and we'll come back to you as soon as we can. You can also hit “Contact the founder” in the dashboard sidebar.",
        },
      ],
    },
  ],
};
