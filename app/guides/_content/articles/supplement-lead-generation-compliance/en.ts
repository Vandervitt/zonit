import type { GuideArticle } from "../../types";

export const supplementLeadGenerationCompliance: GuideArticle = {
  slug: "supplement-lead-generation-compliance",
  title: "Supplement lead generation: converting without the claims that get you restricted",
  description:
    "In supplements the fastest-converting copy is also the copy that gets accounts restricted. This covers what to say instead, where disclaimers actually belong, and why an assessment offer is the structural answer.",
  keywords: [
    "supplement lead generation",
    "supplement advertising compliance",
    "nutrition landing page",
    "health claims",
  ],
  industry: "supplement",
  datePublished: "2026-08-02",
  intro:
    "Everything that would make a supplement page convert fastest — a specific health outcome, a timeline, a transformation — is also what gets creative rejected and accounts restricted. That is not a copywriting problem you can write your way around; it is a structural one. This covers the structure that converts without leaning on outcome claims.",
  sections: [
    {
      id: "what-to-say-instead",
      heading: "What replaces the outcome claim",
      blocks: [
        {
          t: "p",
          text: "The page still has to be persuasive. It just has to persuade through mechanism and credibility rather than through results, which is a harder brief and a more durable one.",
        },
        {
          t: "table",
          head: ["Instead of", "Say", "Why it works"],
          rows: [
            ["'Fixes your sleep'", "What the formulation does and why those ingredients", "Mechanism is factual and checkable"],
            ["'Lose 5kg in a month'", "The habit change the product supports", "Sells a method, not a promise"],
            ["'Clinically proven'", "The study, with what it actually measured", "Specificity survives scrutiny"],
            ["'Treats joint pain'", "Everyday mobility and activity", "Describes the benefit without a medical claim"],
            ["Before-and-after bodies", "Habit tracking, routine, usage context", "Converts the audience that stays"],
          ],
        },
      ],
    },
    {
      id: "disclaimers",
      heading: "Disclaimers belong beside the claim, not in the footer",
      blocks: [
        {
          t: "p",
          text: "Most supplement pages pool their qualifiers in a footer nobody reads, including the reviewer. A qualifier does its job when it sits in the same eyeline as the statement it qualifies.",
        },
        {
          t: "list",
          items: [
            "Inline, next to any statement about what the formulation is for",
            "A standing notice in the footer as well — but treat that as the backstop, not the mechanism",
            "State that it is not intended to diagnose, treat, cure, or prevent, in the wording your market requires",
            "If a claim needs three qualifiers to be defensible, the claim is the problem, not the qualifiers",
          ],
        },
        {
          t: "callout",
          tone: "warning",
          text: "Reviewers read the landing page, not just the creative. A compliant ad pointing at a page that overclaims still fails, and the account takes the damage rather than the page.",
        },
      ],
    },
    {
      id: "assessment",
      heading: "Why an assessment is the structural answer",
      blocks: [
        {
          t: "p",
          text: "A consultation offer is not a loophole — it is a genuinely better fit for this category, for three reasons that happen to align commercially and legally.",
        },
        {
          t: "steps",
          items: [
            {
              title: "It moves the specific conversation off the public page",
              desc: "Individual guidance lives in a reply you control, rather than on a page a regulator in another market may read.",
            },
            {
              title: "It lets you qualify who the product actually suits",
              desc: "A mismatched customer in this category is a refund and a bad review, not a sale.",
            },
            {
              title: "It gives the honest pitch room to breathe",
              desc: "The truthful version of a supplement pitch needs more explanation than an ad can carry. The assessment is where that explanation fits.",
            },
          ],
        },
        {
          t: "p",
          text: "Keep the assessment itself on the right side of the line: ask about diet, routine, and goals. Asking about conditions, medications, or symptoms turns the exchange into something closer to health advice, which is a different regulatory position and a different professional standard.",
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
              q: "Which supplement categories are riskiest?",
              a: "Weight management and anything adjacent to a diagnosed condition — sleep, joint, and women's health all sit close to regulated territory. Ingredient status varies too: melatonin, for instance, is prescription-only in some countries, so the same product supports different copy in different markets.",
            },
            {
              q: "Can we use customer testimonials?",
              a: "Usually yes, framed as individual experience rather than as a typical result, and never making a claim the brand could not make itself. A testimonial does not launder a claim — if you cannot say it, neither can a quoted customer.",
            },
            {
              q: "Does a disclaimer make an outcome claim safe?",
              a: "No. A disclaimer qualifies a claim you are entitled to make; it does not authorise one you are not. Rules differ by market and none of them are satisfied by a footer line alone.",
            },
            {
              q: "What does this do to conversion rate?",
              a: "It lowers immediate conversion and raises everything downstream — reply rate, fit, retention, and the odds your account survives the quarter. Judge it on qualified conversations, not on opt-ins.",
            },
          ],
        },
      ],
    },
  ],
  references: [
    {
      label: "Google Ads — Healthcare and medicines policy",
      url: "https://support.google.com/adspolicy/answer/176031",
    },
    {
      label: "Meta — Advertising Standards: Personal health",
      url: "https://transparency.meta.com/policies/ad-standards/",
    },
  ],
};
