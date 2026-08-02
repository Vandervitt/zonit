import type { GuideArticle } from "../../types";

export const solarInstallerLeadGeneration: GuideArticle = {
  slug: "solar-installer-lead-generation",
  title: "Solar and home improvement leads: qualifying before the survey, not after",
  description:
    "A home improvement lead that cannot proceed costs you a wasted survey. This covers the four questions that qualify a homeowner, why savings figures backfire, and how to make a site visit feel low-risk.",
  keywords: [
    "solar lead generation",
    "home improvement leads",
    "installer marketing",
    "solar landing page",
  ],
  industry: "home-improvement",
  datePublished: "2026-08-02",
  intro:
    "Home improvement is a high-value decision made at home, usually by more than one person, over weeks — and nothing can be quoted honestly without seeing the property. So the page is not trying to close anything. It is trying to earn a survey booking from someone who can actually commission the work, and the difference between those two things is where most installer budgets leak.",
  sections: [
    {
      id: "qualify",
      heading: "Four questions that decide whether a survey is worth sending",
      blocks: [
        {
          t: "p",
          text: "Every unqualified survey costs a half-day and a fuel bill. Asking on the form costs a few submissions and saves all of them.",
        },
        {
          t: "table",
          head: ["Question", "Why it disqualifies", "Cost of not asking"],
          rows: [
            ["Do you own the property?", "A tenant cannot commission the work at any price", "The single most expensive wasted visit"],
            ["Property type and age", "Determines feasibility and pricing band", "A quote you have to retract"],
            ["Roof or site condition", "May need work before yours can start", "A survey that becomes a referral"],
            ["Timeline", "'Sometime next year' is not a lead yet", "A pipeline full of people who never book"],
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "Ownership is the one to ask first and never drop. It is a single tick box and it removes the most costly category of wasted visit in this trade.",
        },
      ],
    },
    {
      id: "savings",
      heading: "Why headline savings figures backfire",
      blocks: [
        {
          t: "p",
          text: "A big saving number in the hero is the most tempting thing to write and the most reliable way to damage the conversation that follows. It attracts clicks from people whose property will never produce that figure, and it starts the survey with a correction.",
        },
        {
          t: "list",
          items: [
            "State the assumptions with any figure you publish — system size, usage, tariff, location",
            "Prefer a range over a point estimate, because the honest answer is a range",
            "Payback period is more useful than annual saving, and harder to misread",
            "A grounded illustrative example beats a headline number with nothing behind it — and it survives ad review",
          ],
        },
        {
          t: "callout",
          tone: "warning",
          text: "Unsubstantiated savings and earnings claims are a recurring rejection cause in this category, and the landing page is where reviewers look for the substantiation.",
        },
      ],
    },
    {
      id: "low-risk-visit",
      heading: "Making the site visit feel low-risk",
      blocks: [
        {
          t: "p",
          text: "The homeowner's real hesitation is not the price — it is letting a salesperson into the house. Everything on the page should reduce that specific feeling.",
        },
        {
          t: "steps",
          items: [
            {
              title: "Show jobs completed nearby",
              desc: "Local specificity does more than volume. Three streets they recognise beat three hundred installations nationally.",
            },
            {
              title: "Name and show the people who will attend",
              desc: "A stranger in your home is a different proposition from a named installer with accreditations.",
            },
            {
              title: "Say what happens between the call and the finished work",
              desc: "Step by step, with rough durations. Uncertainty is what makes people postpone.",
            },
            {
              title: "State accreditations and warranty terms plainly",
              desc: "Including what the warranty does not cover — that sentence buys more trust than the rest of the section.",
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
              q: "Should the page offer a quote or a survey?",
              a: "A survey or assessment. A quote implies a number you can produce without seeing the property, which is not true for this trade — and a homeowner who was promised a quote and receives a booking request feels switched on, which is a bad way to start.",
            },
            {
              q: "Phone or form for installer leads?",
              a: "Both. A homeowner comparing installers wants to submit property details on their own time, while a late-stage or urgent enquiry converts on a call. The form is where qualification happens; the phone is where the ready-to-book ones arrive.",
            },
            {
              q: "How do we handle financing questions?",
              a: "Describe the options factually and stop there. Anything resembling a financial promotion or an implied approval carries regulatory weight in most markets, and the page is not the place to resolve it.",
            },
            {
              q: "Is one page enough for solar, batteries, and insulation?",
              a: "No — they attract different searches and different objections. Separate pages let each answer its own question, and the paid plans hold several at different paths under one domain.",
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
    {
      label: "Meta — Advertising Standards",
      url: "https://transparency.meta.com/policies/ad-standards/",
    },
  ],
};
