import type { GuideArticle } from "../../types";

export const educationEnrolmentLeadGeneration: GuideArticle = {
  slug: "education-enrolment-lead-generation",
  title: "Education lead generation: designing the low-commitment first step",
  description:
    "Education decisions are slow, expensive, and usually made by someone other than the student. This covers what the first step should be, how to write for two readers at once, and how to show results without over-promising.",
  keywords: [
    "education lead generation",
    "student enrolment marketing",
    "tutoring landing page",
    "study abroad leads",
  ],
  industry: "education",
  datePublished: "2026-08-02",
  intro:
    "Education decisions are slow, expensive, and usually made by someone other than the person who will attend — a parent, a sponsor, an employer. That means the page has two readers with different questions, and a first step small enough that neither has to commit. Getting that step right matters more than anything else on the page.",
  sections: [
    {
      id: "first-step",
      heading: "What the first step should be",
      blocks: [
        {
          t: "p",
          text: "Asking for enrolment on the first visit converts poorly in every education segment. The offer that works costs the visitor almost nothing while still telling you something you need.",
        },
        {
          t: "table",
          head: ["Segment", "First step", "What it tells you"],
          rows: [
            ["Language training", "Free level test", "The starting level every study plan depends on"],
            ["Study abroad", "Eligibility or profile assessment", "Whether the shortlist is realistic"],
            ["K-12 tutoring", "Free assessment, often from a photo of a test paper", "The actual gap, faster than any form"],
            ["Online courses", "First module, or an advisor call", "Whether they will finish — the real risk"],
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "The test is whether the offer is genuinely useful even if the person never enrols. A free level test passes; a 'free consultation' that is a sales call does not, and visitors can tell the difference from the wording.",
        },
      ],
    },
    {
      id: "two-readers",
      heading: "Writing for the payer and the attendee at once",
      blocks: [
        {
          t: "p",
          text: "Both readers are on the page, and the order matters. Lead with the outcome the decision-maker is paying for, then use the body for the experience the student will actually have.",
        },
        {
          t: "list",
          items: [
            "K-12 tutoring skews furthest toward the parent — results, safety, and tutor credentials carry the decision",
            "Study abroad splits: the family funds it, the student lives it, and both must recognise themselves on the page",
            "Adult upskilling is usually one person deciding and attending — write to the career change, not to the curriculum",
            "Corporate-funded training answers to a third reader entirely: the manager approving the budget",
          ],
        },
        {
          t: "p",
          text: "For career changers specifically, the fear is not that the course is bad — it is that they will not finish. Time commitment per week, what the first month looks like, and whether it works alongside a job matter more than the syllabus.",
        },
      ],
    },
    {
      id: "results",
      heading: "Showing results without over-promising",
      blocks: [
        {
          t: "p",
          text: "Guaranteed admission and guaranteed score claims are both a credibility problem and a frequent cause of ad rejection. Specifics with context do the same persuasive work and survive scrutiny.",
        },
        {
          t: "steps",
          items: [
            {
              title: "Attach the starting point to every improvement",
              desc: "'5.5 to 7.0 over twelve weeks' is supportable. 'Improve 1.5 bands' promises a result you do not control.",
            },
            {
              title: "Date the placements and name the cohort",
              desc: "A placement without context is unverifiable and reads as decoration.",
            },
            {
              title: "Include a realistic option in every shortlist",
              desc: "A list of reaches reads as a sales document. One achievable choice is what makes the ambitious ones believable.",
            },
            {
              title: "Say what you cannot promise",
              desc: "In a category where overpromising is the norm, an explicit no-guarantee line is a differentiator rather than a weakness.",
            },
          ],
        },
        {
          t: "callout",
          tone: "warning",
          text: "Income and employment claims move a course page into a heavily policed category in most markets. Convert the earnings conversation into an advisor call, where it can be qualified per person.",
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
              q: "Form or WhatsApp for education leads?",
              a: "Forms lead, because follow-up quality depends on context a form collects best — target country, current level, age, intake date. WhatsApp is a strong second in most markets and often becomes the entire counselling relationship, particularly where it spans time zones for months. Phone matters most for parent-facing tutoring.",
            },
            {
              q: "How do we handle students in other countries?",
              a: "Answer what turns into a conversion question across a border: intake dates, time zones for live classes, and whether the qualification is recognised where they live. These are administrative details domestically and deal-breakers internationally.",
            },
            {
              q: "Should we publish prices?",
              a: "A range with what it includes, usually yes — education buyers expect it and its absence reads as evasive. Keep the exact figure for the consultation where scholarships, payment terms, and level all affect it.",
            },
            {
              q: "One page per programme or one per institution?",
              a: "Per programme. A visitor searching for IELTS prep should land on IELTS prep, not on a school overview, and separate pages let you compare cost per enrolment between programmes.",
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
