import type { GuideArticle } from "../../types";

export const clinicPatientLeadGeneration: GuideArticle = {
  slug: "clinic-patient-lead-generation",
  title: "Clinic lead generation: why the consultation is the only thing worth selling",
  description:
    "A patient choosing a clinic is deciding who to trust with their body. This covers why consultation-first outperforms price-first, what makes a clinic credible on a page, and where medical advertising gets rejected.",
  keywords: [
    "clinic lead generation",
    "patient acquisition",
    "medical landing page",
    "dental clinic marketing",
  ],
  industry: "medical",
  datePublished: "2026-08-02",
  intro:
    "Almost nothing a clinic offers can be quoted responsibly before an assessment, which makes the consultation the only honest thing to put on the page — and, as it turns out, the thing that converts best. This covers why that is, what actually makes a clinic credible to a stranger, and the specific places medical pages get rejected.",
  sections: [
    {
      id: "consult-first",
      heading: "Consultation-first is both the safer and the better-converting structure",
      blocks: [
        {
          t: "p",
          text: "The pressure to publish a price is real: patients ask, competitors do it, and it feels like transparency. But a fixed number on the page commits you before you have examined anything, and it changes who books.",
        },
        {
          t: "table",
          head: ["", "Price-first page", "Consultation-first page"],
          rows: [
            ["Who books", "Patients comparing on cost", "Patients comparing on suitability"],
            ["Front desk receives", "A price negotiation", "A clinical conversation"],
            ["Risk", "Committed to a number you may not honour", "Quote follows the assessment"],
            ["Show-up rate", "Lower — no relationship yet", "Higher — they asked for the appointment"],
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "If your market expects a number, publish a starting range with what it includes. That is defensible. A single headline price for a procedure that varies per patient is not.",
        },
      ],
    },
    {
      id: "credibility",
      heading: "What makes a clinic credible to a stranger",
      blocks: [
        {
          t: "p",
          text: "Design does not substitute for the four things a patient is actually looking for, and they look for them in a predictable order.",
        },
        {
          t: "steps",
          items: [
            {
              title: "Named practitioners with verifiable credentials",
              desc: "A photo, a name, a registration number. An anonymous 'our expert team' is the single weakest thing on most clinic pages.",
            },
            {
              title: "The procedure explained in plain language",
              desc: "What happens, how long it takes, what anaesthetic is involved. Patients are trying to picture it, and clinical terminology stops them doing that.",
            },
            {
              title: "What recovery actually looks like",
              desc: "Downtime, restrictions, and the realistic timeline. Clinics avoid this because it sounds negative; patients read its absence as concealment.",
            },
            {
              title: "Honest outcomes, with their limits stated",
              desc: "Including who the procedure is not suitable for. Saying you would advise against it in some cases does more for credibility than any testimonial.",
            },
          ],
        },
      ],
    },
    {
      id: "one-page-per-procedure",
      heading: "One page per procedure, not one page per clinic",
      blocks: [
        {
          t: "p",
          text: "A visitor searching for implants who lands on a general clinic page has to work out whether you even do implants. That friction costs more than the extra pages cost to run, and it is invisible in your analytics because the visitor simply leaves.",
        },
        {
          t: "list",
          items: [
            "Match the page to the search: the procedure they typed should be the headline they see",
            "Each procedure has different objections — a page covering five answers none of them well",
            "Separate pages let you compare cost per booking between procedures and stop funding the ones that do not pay",
            "Several pages can live at different paths under one clinic domain, so this does not mean buying more domains",
          ],
        },
      ],
    },
    {
      id: "compliance",
      heading: "Where medical pages get rejected",
      blocks: [
        {
          t: "p",
          text: "Health and medical advertising is among the most heavily policed categories, and reviewers read the landing page rather than only the creative. The recurring causes are consistent across platforms.",
        },
        {
          t: "list",
          items: [
            "Guaranteed outcomes, or success rates presented without context",
            "Dramatic before-and-after comparisons, particularly where the change is the whole message",
            "Language implying diagnosis, or that the page itself can assess a condition",
            "Procedures that are restricted or prohibited outright in the market you are targeting",
            "Missing regulatory disclosures that your local medical body requires",
          ],
        },
        {
          t: "callout",
          tone: "warning",
          text: "A compliant ad pointing at a non-compliant page still fails, and the account takes the damage rather than the page. Fix the page first.",
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
              q: "Should the page use phone or a form?",
              a: "Both, and let the patient choose. Some want an immediate call, some need to describe a sensitive situation privately and would not phone at all. Forcing either group into the other channel loses them at the moment they were most ready to act.",
            },
            {
              q: "How do we handle international patients?",
              a: "Answer the trip, not just the treatment: how many days, how many visits, and what happens if a revision is needed after they fly home. Clinics serving patients from abroad also tend to need a chat channel — a call across time zones is the one thing an anxious patient will not initiate.",
            },
            {
              q: "Can we show patient results at all?",
              a: "Depends on your market and your regulator, and the rules are stricter than most clinics assume. Where results imagery is permitted, keep it consistent in lighting and framing, state the case context, and never present an outstanding result as typical.",
            },
            {
              q: "Is a longer form worth it for medical leads?",
              a: "Usually yes. A booking that arrives with the case detail your front desk needs is worth several that require a call to qualify — and in this category, a patient who has written down their situation has already invested in the appointment.",
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
      label: "Meta — Advertising Standards",
      url: "https://transparency.meta.com/policies/ad-standards/",
    },
  ],
};
