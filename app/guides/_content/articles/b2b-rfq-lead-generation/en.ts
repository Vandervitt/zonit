import type { GuideArticle } from "../../types";

export const b2bRfqLeadGeneration: GuideArticle = {
  slug: "b2b-rfq-lead-generation",
  title: "B2B lead generation: designing an RFQ your sales team can quote from",
  description:
    "A generic contact form produces enquiries you cannot price. This covers the five fields that make an RFQ actionable, why MOQ belongs on the page and price does not, and what makes a supplier look credible.",
  keywords: [
    "B2B lead generation",
    "RFQ form design",
    "wholesale enquiries",
    "supplier landing page",
  ],
  industry: "b2b",
  datePublished: "2026-08-02",
  intro:
    "A B2B enquiry is worth many times a consumer lead, and the buyer knows it — they are deciding whether you are a credible supplier before they will spend a reply. That makes this the one category where asking for more, not less, is usually correct. This covers what to ask, what to publish, and what to leave for the quote.",
  sections: [
    {
      id: "rfq-fields",
      heading: "The five fields that make an RFQ actionable",
      blocks: [
        {
          t: "p",
          text: "The standard advice — fewer fields, higher conversion — is written for consumer forms. In B2B, a smaller number of quotable enquiries beats a larger pile of one-line messages, because each round-trip loses buyers to the supplier who could answer immediately.",
        },
        {
          t: "table",
          head: ["Field", "What it determines", "Cost of omitting"],
          rows: [
            ["Specification or category", "Whether you can make or supply it at all", "A reply that is a question"],
            ["Volume", "Pricing band and feasibility", "A quote you have to revise"],
            ["Destination", "Certification, documentation, duties, lead time", "A quote that is simply wrong"],
            ["Timeline", "Whether this is a live project or research", "A pipeline full of maybes"],
            ["Target price band", "Whether you are in the running at all", "Weeks spent on a deal you were never winning"],
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "Destination is the one most often missed. In cross-border sourcing it drives certification, paperwork, duties, and transit time — a quote without it is a guess dressed as a number.",
        },
      ],
    },
    {
      id: "moq-not-price",
      heading: "Publish the MOQ, not the price",
      blocks: [
        {
          t: "p",
          text: "These two feel like the same decision and are opposites. A minimum order quantity filters out enquiries you would decline anyway and costs you nothing to state. A price commits you before you know the specification, volume, and destination.",
        },
        {
          t: "list",
          items: [
            "MOQ on the page: saves both sides a conversation neither wanted",
            "Price in the quote: where it can reflect what the buyer actually asked for",
            "Freight and logistics: publish lane coverage and typical transit times, not rates — rates move within a day",
            "Packaging and custom work: publish what you can produce, and convert artwork into a mock-up rather than a price",
          ],
        },
      ],
    },
    {
      id: "credibility",
      heading: "What makes a supplier look credible",
      blocks: [
        {
          t: "p",
          text: "Buyers who have been burned by sourcing platforms check the verifiable thing first. Adjectives about quality and service look identical across every supplier they are comparing you against.",
        },
        {
          t: "steps",
          items: [
            {
              title: "Certifications with their actual numbers",
              desc: "A number can be verified and a photo cannot. Lead with the number, then show the factory.",
            },
            {
              title: "Capacity, years in operation, and markets served",
              desc: "Specifics that are hard to fake and easy to sanity-check.",
            },
            {
              title: "Named clients or reference projects, where permitted",
              desc: "Where NDAs prevent it, say so — that sentence is itself a credibility signal.",
            },
            {
              title: "An NDA-first stance if you handle buyer designs",
              desc: "In OEM and packaging, fear of drawings leaking is the single biggest hesitation. Address it before it is raised.",
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
              q: "Should demos be gated behind a form or bookable directly?",
              a: "Direct booking converts better and qualifies worse. If a live session is expensive to staff, a few qualifying fields buy back more sales time than they cost in submissions — and across time zones a form also captures the scheduling information an open calendar cannot.",
            },
            {
              q: "How much specification should the page publish?",
              a: "Enough for an engineer to rule you in or out: capacity, tolerances, footprint, power. Withholding those wastes both parties' time, and an engineer who cannot check fit moves to a supplier whose numbers are visible.",
            },
            {
              q: "Form or WhatsApp for B2B?",
              a: "Form for anything requiring a specification, because a serious buyer would rather write it once than repeat it. WhatsApp is common in sourcing and freight, where terms get negotiated in chat and conditions change within a day. Route leads into a CRM either way — Pro and Agency plans POST each enquiry straight through.",
            },
            {
              q: "Is a long sales cycle worth a landing page at all?",
              a: "Yes, because the page's job is entering the evaluation, not closing it. In a months-long cycle, being in the shortlist conversation early is worth more than any on-page persuasion could be.",
            },
          ],
        },
      ],
    },
  ],
  references: [
    {
      label: "Google Ads — Advertising policies help",
      url: "https://support.google.com/adspolicy/answer/6008942",
    },
  ],
};
