import type { GuideArticle } from "../../types";

export const consumerTechLeadGeneration: GuideArticle = {
  slug: "consumer-tech-lead-generation",
  title: "Consumer tech lead generation: winning the comparison, not the spec sheet",
  description:
    "Tech buyers arrive with two other tabs open. This covers how to build a comparison that survives scrutiny, when a pre-launch waitlist beats a product page, and what a distributor page needs instead.",
  keywords: [
    "consumer tech lead generation",
    "hardware landing page",
    "pre-launch waitlist",
    "distributor enquiries",
  ],
  industry: "gadget",
  datePublished: "2026-08-02",
  intro:
    "A consumer tech visitor has two or three options open, is reading specifications they half understand, and is looking for the one difference that decides it. A page that lists features answers a question nobody asked. This covers how to build the comparison instead, and the two adjacent uses — pre-launch and channel — that the same structure serves.",
  sections: [
    {
      id: "comparison",
      heading: "Building a comparison that survives scrutiny",
      blocks: [
        {
          t: "p",
          text: "The instinct is to win every row. That is exactly what destroys the table: a comparison in which you are better at everything is transparent to a buyer who has already read two competitor pages this afternoon, and it discredits the rows that were true.",
        },
        {
          t: "steps",
          items: [
            {
              title: "Pick the two or three dimensions where you genuinely win",
              desc: "Battery hours, latency, compatibility, warranty reach — whichever actually decides the purchase in your category.",
            },
            {
              title: "Say nothing about the rest",
              desc: "Silence on a dimension reads as honest. A fabricated win on it reads as a reason to distrust everything else.",
            },
            {
              title: "Translate each spec into what it means in use",
              desc: "'8 hours' is a number; 'a full working day plus the commute home' is a decision.",
            },
            {
              title: "Put the full spec sheet lower down",
              desc: "For the minority who scroll to it. Leading with it filters out most of the people who would have bought.",
            },
          ],
        },
      ],
    },
    {
      id: "compatibility",
      heading: "Compatibility is a yes-or-no question — ask it first",
      blocks: [
        {
          t: "p",
          text: "A device that will not work with what the visitor already owns is not a purchase at any price, so everything after that question is wasted if the answer is no. Asking first also hands you the most useful qualification in this category for free.",
        },
        {
          t: "list",
          items: [
            "Phone model, ecosystem, or platform — whichever gates your product",
            "The model itself tells you the price tier the visitor is comfortable with",
            "Selling into other markets adds two more: network bands, and whether your companion app is published in that country's store",
            "Plug standards, voltage, and local certifications belong on the page, not in the reply",
          ],
        },
        {
          t: "callout",
          tone: "warning",
          text: "Naming a feature that is unavailable in the visitor's market is worse than omitting it. An unusable feature on the page is a negative asset.",
        },
      ],
    },
    {
      id: "pre-launch-and-channel",
      heading: "Two adjacent uses: pre-launch and distribution",
      blocks: [
        {
          t: "p",
          text: "The same page structure serves two jobs that have nothing to do with a storefront, and both are stronger uses of lead capture than a product page would be.",
        },
        {
          t: "table",
          head: ["", "Pre-launch waitlist", "Distributor enquiry"],
          rows: [
            ["Audience", "Consumers", "Retail and channel buyers"],
            ["What convinces", "The problem it solves, and being early", "Margin, packaging, certifications, MOQ"],
            ["Channel", "Form — you want an email to announce to", "Form, routed to CRM"],
            ["What you learn", "Whether the positioning works before you commit stock", "Whether you can supply and support that market"],
          ],
        },
        {
          t: "p",
          text: "Pre-launch is the underused one: it builds a list and validates positioning before you commit to inventory, which is the most expensive mistake in hardware.",
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
              q: "Do drop tests and durability claims need proof on the page?",
              a: "If you state a height or a standard, yes. A number without a test behind it gets challenged in reviews and by ad platforms alike, and a short video of the actual test outperforms a certification badge nobody recognises.",
            },
            {
              q: "Should the page name the market leader we compete with?",
              a: "Only if you can be specific and fair about it. Naming a competitor invites the reader to verify, which works in your favour when the claim holds and against you badly when it does not.",
            },
            {
              q: "Is chat or a form better for consumer tech?",
              a: "Chat for the pre-purchase question — compatibility, availability, which model fits — because that visitor would otherwise leave. Form for waitlists and distributor enquiries, where you need something structured to act on later.",
            },
            {
              q: "What about health features on wearables?",
              a: "Frame readings as fitness metrics and reference only. Implying detection, diagnosis, or monitoring of a condition moves the page into a restricted health category, which brings both rejection risk and liability.",
            },
          ],
        },
      ],
    },
  ],
  references: [
    {
      label: "Google Ads — Misrepresentation policy",
      url: "https://support.google.com/adspolicy/answer/6020955",
    },
  ],
};
