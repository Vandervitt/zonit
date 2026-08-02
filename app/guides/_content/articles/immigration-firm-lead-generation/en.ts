import type { GuideArticle } from "../../types";

export const immigrationFirmLeadGeneration: GuideArticle = {
  slug: "immigration-firm-lead-generation",
  title: "Legal and immigration lead generation: collect the facts, never publish the verdict",
  description:
    "A page that answers whether someone qualifies is giving advice. This covers where the line sits, why written assessment outperforms a callback, and what legal advertising rules mean for the page.",
  keywords: [
    "immigration lead generation",
    "law firm marketing",
    "legal landing page",
    "case assessment form",
  ],
  industry: "legal",
  datePublished: "2026-08-02",
  intro:
    "Someone looking for legal help is dealing with a situation that has real consequences, and is trying to work out two things: whether their case is viable, and whether this firm handles cases like theirs. The page can answer the second directly. The first it must convert into an assessment rather than answer — and that constraint, handled well, is also what makes it convert.",
  sections: [
    {
      id: "the-line",
      heading: "Where the line sits",
      blocks: [
        {
          t: "p",
          text: "The tempting feature in this category is an eligibility checker: a few questions, an instant verdict, a captured lead. It is also the feature most likely to create a problem, because publishing a verdict is advice given to an unidentified person on unverified facts.",
        },
        {
          t: "table",
          head: ["Page does", "Status", "Why"],
          rows: [
            ["Describes practice areas and process", "Safe", "Factual information about your firm"],
            ["Lists document requirements", "Safe", "Procedural, publicly available"],
            ["Collects case facts via a form", "Safe", "Intake, not advice"],
            ["Returns an automated eligibility verdict", "Risky", "Advice on unverified facts, with liability if wrong"],
            ["States or implies a success rate", "Often restricted", "Regulated in many jurisdictions"],
          ],
        },
        {
          t: "callout",
          tone: "warning",
          text: "Legal advertising is regulated by jurisdiction and often by bar or professional body rules. Guaranteed outcomes, success-rate claims, and client testimonials are restricted or prohibited in some places, and required disclosures vary — verify what applies to your practice.",
        },
      ],
    },
    {
      id: "written-assessment",
      heading: "Why a written assessment beats a callback",
      blocks: [
        {
          t: "p",
          text: "Most professional service pages offer a call. In legal work a written assessment converts better and serves the practice better, for reasons specific to how these clients behave.",
        },
        {
          t: "list",
          items: [
            "Case facts need to be written down — a call produces piecemeal disclosure and an off-the-cuff answer",
            "A client discussing a sensitive situation would rather type it than say it to a stranger",
            "Immigration clients are frequently in another country and time zone, which makes phone intake unreliable",
            "The written assessment is itself the deliverable, which gives the visitor something concrete for their information",
          ],
        },
      ],
    },
    {
      id: "credibility",
      heading: "Answering 'do you handle cases like mine'",
      blocks: [
        {
          t: "p",
          text: "This is the question the page can and should answer outright, and most firm pages answer it badly by listing everything they do.",
        },
        {
          t: "steps",
          items: [
            {
              title: "Name the specific matters, not the practice area",
              desc: "'Spousal visa refusals and appeals' tells a visitor more than 'immigration law' ever will.",
            },
            {
              title: "Show admissions and credentials plainly",
              desc: "Where admitted, since when, and by which body. This is verifiable and it is what a cautious client checks.",
            },
            {
              title: "Explain the process step by step with realistic timelines",
              desc: "Anxiety in this category is mostly about not knowing what happens next. Removing that is a service in itself.",
            },
            {
              title: "Carry a clear non-advice notice",
              desc: "State that the content is general information and that submitting the form creates no client relationship.",
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
              q: "Can we use client testimonials?",
              a: "Depends entirely on your jurisdiction — testimonials are restricted or prohibited for legal practitioners in a number of them, and the rules often cover the wording as well as the fact. Check your professional body before adding them, not after.",
            },
            {
              q: "Should the page publish fees?",
              a: "A structure rather than a number usually works best: what is fixed-fee, what is hourly, what disbursements are extra. Clients fear an open-ended bill more than a high one, and describing the structure addresses that without committing you.",
            },
            {
              q: "How long should the intake form be?",
              a: "Long enough for a solicitor to give a real assessment without a follow-up round — usually the matter type, key dates, current status, and what has already been tried. In this category a longer form is not a barrier; a client who has written it down has invested in the relationship.",
            },
            {
              q: "Is one page enough for several practice areas?",
              a: "No. Someone searching for a visa refusal appeal has a different problem, different urgency, and different objections from someone planning a business visa. Separate pages match the search and let you see which matters actually pay.",
            },
          ],
        },
      ],
    },
  ],
  references: [
    {
      label: "Google Ads — Legal services policy",
      url: "https://support.google.com/adspolicy/answer/9101152",
    },
    {
      label: "Meta — Advertising Standards",
      url: "https://transparency.meta.com/policies/ad-standards/",
    },
  ],
};
