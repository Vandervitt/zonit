import type { GuideArticle } from "../../types";

export const rfqFirstReply: GuideArticle = {
  slug: "rfq-first-reply",
  title: "Replying to an RFQ: the first response that gets you shortlisted",
  description:
    "What to send when a request for quote arrives, how fast, and what to ask. The structure of a first reply, how to triage RFQs by quality, and how to keep enquiries from going cold across time zones.",
  keywords: ["RFQ response", "reply to request for quote", "B2B enquiry follow-up", "supplier quote reply"],
  ctaTarget: "rfq",
  datePublished: "2026-10-20",
  intro:
    "A buyer who sends a request for quote has usually sent it to several suppliers at once. They don't wait for the cheapest one; they keep talking to the first few that respond credibly. So the job of your first reply isn't to quote — it's to convince the buyer you understood what they need and can deliver it. This covers how to write that reply, and how to handle enquiries of very different quality.",
  sections: [
    {
      id: "acknowledge-first",
      heading: "Acknowledge first, quote second: don't wait for the full picture",
      blocks: [
        {
          t: "p",
          text: "Many factories wait until engineering and purchasing have costed everything, then send one complete quote. Meanwhile the buyer has no idea whether you received the request or are working on it. A same-day reply that confirms and asks the right follow-up questions keeps you on the shortlist better than a perfect quote three days later.",
        },
        {
          t: "callout",
          tone: "info",
          text: "An acknowledgement is not a pleasantry. It proves you read the request: restate the specification, quantity and destination in your own words, then ask only about the gaps that actually block a quote.",
        },
      ],
    },
    {
      id: "first-reply-structure",
      heading: "The four parts of a first reply",
      blocks: [
        {
          t: "steps",
          items: [
            {
              title: "Restate the requirement",
              desc: "Product, material or specification, quantity, destination market — in a sentence or two. If you got it wrong, the buyer corrects you now, which is far cheaper than a wrong quote.",
            },
            {
              title: "Ask only what blocks the quote",
              desc: "Missing quantity? Ask for quantity. Missing drawings? Ask for drawings. A twenty-question form hands your work to the buyer.",
            },
            {
              title: "Give the next step and a date",
              desc: "\"Quote and sampling lead time within two working days of receiving the drawings\" — a specific date is far more credible than \"as soon as possible\".",
            },
            {
              title: "Attach what can be verified",
              desc: "Certificate numbers, capacity, markets served. Buyers check these before replying; offering them saves the buyer a step.",
            },
          ],
        },
      ],
    },
    {
      id: "triage",
      heading: "Triage RFQs by quality",
      blocks: [
        {
          t: "p",
          text: "Not every enquiry deserves the same effort. Decide which kind it is first, then decide how deep the reply goes.",
        },
        {
          t: "table",
          head: ["Enquiry type", "What it looks like", "How to reply"],
          rows: [
            ["Complete", "Specification, quantity, destination and timeline stated", "Acknowledge same day; send a quote direction by the date you promised"],
            ["One-liner", "\"Send your price list\", \"Do you make this?\"", "Short acknowledgement plus three questions: specification, quantity, destination"],
            ["Sample request", "Wants to see a sample first", "Explain the sampling process, lead time and charges, and confirm which specification the sample covers"],
            ["Anonymous price check", "No company details, no specific need", "Polite reply stating your minimum order; no engineering time"],
          ],
        },
        {
          t: "callout",
          tone: "warning",
          text: "One-liners are the easiest to ignore, yet they often come from buyers who have only just started looking. A reply that asks the right three questions frequently turns them into a quotable enquiry.",
        },
      ],
    },
    {
      id: "time-zones",
      heading: "Across time zones: don't let enquiries go cold overnight",
      blocks: [
        {
          t: "p",
          text: "When the buyer's working day is your night, an RFQ that arrives at 2 a.m. and is read the next afternoon reaches the buyer after they've left — one exchange becomes two days.",
        },
        {
          t: "list",
          items: [
            "Get notified the moment an enquiry arrives: an email alert is far more reliable than remembering to check a dashboard",
            "Send an honest auto-acknowledgement saying it was received and who will reply, and when — don't pretend a human answered instantly",
            "Pull out the questions that need engineering input and send them before the buyer starts work, so they can answer first thing",
            "If you already run a CRM, push enquiries straight into it so follow-up history doesn't scatter across inboxes",
          ],
        },
      ],
    },
    {
      id: "faq",
      heading: "FAQ",
      blocks: [
        {
          t: "faq",
          items: [
            {
              q: "Should the first reply include a price?",
              a: "For complete enquiries in categories you know well, a range is fine. When information is missing, any price is a guess: too low and you're locked in, too high and you're filtered out. Confirming the requirement and committing to a quote date is usually safer.",
            },
            {
              q: "Can I use a template?",
              a: "The structure can be fixed; the content can't. The restatement must be written for this enquiry — buyers spot mass templates instantly, and a templated reply shows you didn't read their request.",
            },
            {
              q: "What if the buyer goes quiet?",
              a: "Follow up every few days, each time with something new: sampling lead time, a relevant certification, process notes on a similar part. A follow-up that only asks \"any update?\" rarely gets an answer.",
            },
            {
              q: "Does this apply to enquiries that start on WhatsApp?",
              a: "Same structure, shorter. WhatsApp conversations happen on your own phone, so no platform can count whether the buyer actually wrote — track follow-up yourself, and steer anything involving specifications or drawings to a form or email so it's stated once, completely.",
            },
          ],
        },
      ],
    },
  ],
};
