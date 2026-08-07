import type { GuideArticle } from "../../types";

export const whatsappLeadLandingPage: GuideArticle = {
  slug: "whatsapp-lead-landing-page",
  title: "Building a WhatsApp lead-gen landing page: from zero to published",
  description:
    "Why does capturing leads over WhatsApp convert better in overseas markets? This covers the structure of a high-converting WhatsApp landing page, the full path from template to published, and the five mistakes people make most.",
  keywords: ["WhatsApp lead generation", "WhatsApp landing page", "overseas lead gen", "DTC landing page"],
  // 与 /whatsapp-landing-page 产品页配对：本文答「怎么做」，产品页答「在这里怎么做」。
  ctaTarget: "whatsapp",
  datePublished: "2026-07-26",
  intro:
    "In many overseas markets WhatsApp is a more natural way to talk than a form — one tap and the conversation starts, so the barrier is low and reply rates are high. This covers how a high-converting WhatsApp capture page should be built, and the full path from template to published.",
  sections: [
    {
      id: "why-whatsapp",
      heading: "Why capture leads over WhatsApp",
      blocks: [
        {
          t: "list",
          items: [
            "Low barrier to contact: no long form to fill in, a tap starts the conversation",
            "It's the mainstream channel in the Middle East, Southeast Asia, and Latin America, and carries real trust",
            "You can answer questions, quote, and follow up instantly — a shorter path from lead to sale",
            "Conversations carry context by nature, making them easier to convert than a cold form submission",
          ],
        },
      ],
    },
    {
      id: "structure",
      heading: "What a high-converting WhatsApp page looks like",
      blocks: [
        {
          t: "p",
          text: "A lead-gen landing page has exactly one goal: get the visitor to tap WhatsApp. So the structure should build trust and lower the barrier in sequence, with distractions cut to a minimum.",
        },
        {
          t: "table",
          head: ["Section", "What it does"],
          rows: [
            [
              "Hero hook",
              "One line on the value, a free incentive (“free consultation / assessment”), and the WhatsApp CTA",
            ],
            ["Pain points / benefits", "Name the visitor's problem and present your solution"],
            ["Trust signals", "Real cases, before-and-after, customer voices, credentials"],
            ["FAQ", "Clear the last-moment doubts — is it free, how do I reach you"],
            ["Compliant footer", "Privacy policy, terms, contact details — also required for ad compliance"],
          ],
        },
      ],
    },
    {
      id: "flow",
      heading: "From template to published",
      blocks: [
        {
          t: "steps",
          items: [
            {
              title: "Pick an industry template",
              desc: "Starting from a template matched to your category is far faster than a blank page",
            },
            {
              title: "Edit the content",
              desc: "Swap copy, images, and selling points, then set your WhatsApp number and prefilled message",
            },
            {
              title: "Connect your domain",
              desc: "Connect your own brand domain — DNS and the HTTPS certificate are configured automatically",
            },
            {
              title: "Set up attribution",
              desc: "Add pixels, UTMs, and server-side conversion forwarding so campaign data is attributable",
            },
            {
              title: "Publish and run ads",
              desc: "Go live, test with a small budget, and iterate the hero and CTA against the data",
            },
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "Tip: a WhatsApp tap can be forwarded to the ad platform as a conversion event and used for optimisation — provided your pixel and server-side forwarding are configured beforehand.",
        },
      ],
    },
    {
      id: "mistakes",
      heading: "The five most common mistakes",
      blocks: [
        {
          t: "list",
          items: [
            "No clear free incentive in the hero, so the visitor has no reason to tap",
            "Too many competing CTAs, diluting the single goal of tapping WhatsApp",
            "No trust signals, so the visitor doesn't feel safe starting a conversation",
            "No prefilled message, leaving the visitor unsure what to say once WhatsApp opens",
            "No attribution, so campaign data can't be optimised and the spend stays unaccountable",
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
              q: "WhatsApp page or a standard form page — which is better?",
              a: "It depends on the market and category. Where WhatsApp is widespread, tapping to chat is a lower barrier than filling a form and reply rates are higher; in North America and Europe forms remain common. You can offer both and let the visitor choose.",
            },
            {
              q: "Can a WhatsApp tap be forwarded as conversion data?",
              a: "Yes. Set the WhatsApp tap as a conversion event and forward it to the ad platform via the pixel and server-side (CAPI) for optimisation — tracking has to be configured in advance.",
            },
            {
              q: "Do I have to connect my own domain?",
              a: "Strongly recommended. Your own brand domain reads as more credible, helps campaigns get approved, and lets you build SEO and brand equity over time.",
            },
          ],
        },
      ],
    },
  ],
  references: [
    {
      label: "Create click-to-WhatsApp ads in Ads Manager — Meta Business Help Centre",
      url: "https://www.facebook.com/business/help/447934475640650",
    },
    {
      label: "WhatsApp Business Platform overview — Meta for Developers",
      url: "https://developers.facebook.com/docs/whatsapp/overview/",
    },
    {
      label: "Meta Conversions API (server-side events) — Meta for Developers",
      url: "https://developers.facebook.com/docs/marketing-api/conversions-api/",
    },
  ],
};
