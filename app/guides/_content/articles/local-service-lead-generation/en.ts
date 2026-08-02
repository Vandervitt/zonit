import type { GuideArticle } from "../../types";

export const localServiceLeadGeneration: GuideArticle = {
  slug: "local-service-lead-generation",
  title: "Local service lead generation: the two things a local buyer checks first",
  description:
    "Local service buyers are the least patient audience there is. This covers why service area and a visible phone number decide the job, when a form beats a call, and how to run a page per service and town.",
  keywords: [
    "local service lead generation",
    "contractor leads",
    "home services marketing",
    "local landing page",
  ],
  industry: "local-service",
  datePublished: "2026-08-02",
  intro:
    "Something is broken, leaking, or has to move on a date that is already fixed. Before a local buyer reads anything about your company they check two things: do you cover my area, and can I reach a human now. A page that buries either loses the job to the competitor who did not — and you will never see it in your analytics, because the visitor simply leaves.",
  sections: [
    {
      id: "the-two-checks",
      heading: "Service area and a reachable human, in the first screen",
      blocks: [
        {
          t: "p",
          text: "These are not nice-to-haves further down the page. They are the filter, and everything else is read only after they pass.",
        },
        {
          t: "list",
          items: [
            "State the area in the words locals use — neighbourhoods, suburbs, or counties, not a radius in kilometres",
            "Keep the phone number visible as the page scrolls, not parked in the footer",
            "Say your hours and what 'emergency' actually means for you, so a same-day promise is one you can keep",
            "Naming the area is also the fastest way to stop paying for clicks from outside it",
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "Service area in the first screen is the single cheapest change in this category. It costs one line and it removes the most common reason a qualified visitor bounces.",
        },
      ],
    },
    {
      id: "phone-vs-form",
      heading: "When a form beats a call",
      blocks: [
        {
          t: "p",
          text: "Phone comes first in this trade and it is not close — but the form earns its place on the jobs where the customer would rather describe the work than explain it out loud.",
        },
        {
          t: "table",
          head: ["Job type", "Channel", "Why"],
          rows: [
            ["Emergency repair", "Phone, tap-to-call", "They are calling whoever answers first"],
            ["Quote for scheduled work", "Form with photos", "You can price accurately the first time"],
            ["Moving", "Form plus a video walk-through", "Buys the customer a fixed quote, which is what they actually want"],
            ["Inspection or survey", "Form, with a report as the offer", "'Free inspection' sounds like a sales visit; 'photo report' sounds like information"],
          ],
        },
        {
          t: "p",
          text: "Photos and video are the underused tool here. Condition drives price more than size does, and customers estimate area badly — an image lets you quote accurately the first time, which is what stops the awkward revision on the doorstep.",
        },
      ],
    },
    {
      id: "page-per-service-town",
      heading: "One page per service and town",
      blocks: [
        {
          t: "p",
          text: "This is the standard structure in local services, and the reason is simple: it matches what people actually search for. Someone typing 'emergency boiler repair' plus their town should land on exactly that, not on a general home services page.",
        },
        {
          t: "steps",
          items: [
            {
              title: "Combine service and area in the page and the headline",
              desc: "The words they typed should be the words they see, or they will keep looking.",
            },
            {
              title: "Compare cost per lead between combinations",
              desc: "Separate pages are the only way to see which service-and-town pairs actually pay.",
            },
            {
              title: "Keep the proof local to that page",
              desc: "Jobs completed nearby and reviews naming the neighbourhood do more than a national count.",
            },
            {
              title: "Run them under one domain at different paths",
              desc: "A page per town does not mean a domain per town — the paid plans hold several under one.",
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
              q: "Should we publish prices?",
              a: "A starting range, in most trades — local buyers expect one and its absence reads as evasive. A fixed price commits you before you have seen the condition, which is exactly what the photos exist to reveal.",
            },
            {
              q: "What kills conversion on a local service page?",
              a: "A phone number only in the footer, no service area, and no evidence the business is real. Photos of actual completed jobs outperform stock imagery by a wide margin here, and licence or insurance details resolve the objection most local buyers never voice.",
            },
            {
              q: "How do we handle storm or seasonal demand spikes?",
              a: "Reference the situation, not a specific event you are chasing. Insurance-claim language in particular needs care: describing how you support a claim is fine, implying an outcome with an insurer is not.",
            },
            {
              q: "Is WhatsApp useful for local trades?",
              a: "Very, for quoting from photos — cleaning, moving, and landscaping all resolve faster when the customer can show you the job. It is a poor substitute for a phone number on genuinely urgent work, so run both rather than choosing.",
            },
          ],
        },
      ],
    },
  ],
  references: [
    {
      label: "Google Business Profile — Guidelines for representing your business",
      url: "https://support.google.com/business/answer/3038177",
    },
    {
      label: "Google Ads — Misrepresentation policy",
      url: "https://support.google.com/adspolicy/answer/6020955",
    },
  ],
};
