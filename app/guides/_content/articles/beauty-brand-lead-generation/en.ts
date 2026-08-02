import type { GuideArticle } from "../../types";

export const beautyBrandLeadGeneration: GuideArticle = {
  slug: "beauty-brand-lead-generation",
  title: "Beauty lead generation: designing the hook that earns a reply",
  description:
    "Beauty visitors rarely buy on the first visit. This covers why an assessment outperforms a discount, how to build the evidence section without triggering ad rejections, and what the first reply has to contain.",
  keywords: [
    "beauty lead generation",
    "skincare landing page",
    "beauty brand marketing",
    "cosmetics lead capture",
  ],
  industry: "beauty",
  datePublished: "2026-08-02",
  intro:
    "A beauty visitor arrives with a concern, not with a purchase intent — breakouts, thinning hair, sensitivity, a shade they can never match. The page's job is not to close them; it is to prove you understand the concern well enough to be worth a reply. This guide covers the three decisions that determine whether that happens: which hook you offer, what evidence you show, and what your first reply contains.",
  sections: [
    {
      id: "hook",
      heading: "Why an assessment beats a discount",
      blocks: [
        {
          t: "p",
          text: "The instinct is to lead with a discount, because discounts lift opt-in rates. They also change who opts in and what you get. A discount attracts people comparing prices and leaves you a contact with no context; an assessment attracts people with a problem and leaves you something to open the conversation with.",
        },
        {
          t: "table",
          head: ["", "Discount hook", "Assessment hook"],
          rows: [
            ["Opt-in rate", "Higher", "Lower"],
            ["Reply rate after opt-in", "Low — nothing to say", "High — they asked a question"],
            ["What you learn", "Nothing", "Skin type, concern, budget, urgency"],
            ["Who it attracts", "Price comparers", "People with a problem to solve"],
            ["Second purchase", "Rare — they came for the price", "Likelier — you solved something"],
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "If you switch a page from assessment to discount, expect the opt-in number to go up and the number of conversations to go down. Judge the change on replies, not on submissions.",
        },
      ],
    },
    {
      id: "assessment-design",
      heading: "What the assessment should ask for",
      blocks: [
        {
          t: "p",
          text: "An assessment is only as good as the reply it enables. Ask for the two or three things that change your recommendation and nothing else — every extra field costs submissions without improving the answer.",
        },
        {
          t: "list",
          items: [
            "Skincare: the concern, how long it has been going on, and what they currently use",
            "Colour cosmetics: a photo in natural light, plus what shade they wear in a brand you know",
            "Hair and scalp: shedding pattern, duration, and current routine — duration tells you fastest whether you can help",
            "Devices: what they have tried already, which tells you their expectations and their budget",
          ],
        },
        {
          t: "p",
          text: "Notice that each of these is answerable in one message. If your assessment needs a form with eight fields, it is not an assessment — it is an application, and it will convert like one.",
        },
      ],
    },
    {
      id: "evidence",
      heading: "Building the evidence section without triggering rejections",
      blocks: [
        {
          t: "p",
          text: "Beauty creative is scrutinised closely, and the landing page is read alongside the ad. Most rejections in this category come from the same place: an outcome claim the page cannot substantiate, or imagery that implies one.",
        },
        {
          t: "steps",
          items: [
            {
              title: "Explain the mechanism before the result",
              desc: "Why the ingredient or device does what it does. This is the part competitors rarely bother with, and it carries more weight than another testimonial.",
            },
            {
              title: "Show three to four before-and-afters, same lighting and angle",
              desc: "Fewer reads as cherry-picked; a wall of dramatic transformations reads as a claim rather than as evidence.",
            },
            {
              title: "Let customers state the outcome, not the brand",
              desc: "An unedited customer voice describing their experience sits differently from the same sentence in your copy — both to a reader and to a reviewer.",
            },
            {
              title: "Keep the timeline out of the headline",
              desc: "'Results in 7 days' is the single most reliable way to attract a rejection in this category.",
            },
          ],
        },
        {
          t: "callout",
          tone: "warning",
          text: "Hair loss, anti-ageing, and at-home devices sit closest to the line. If the persuasive version of your sentence is the one you are unsure about, it is the one that will be flagged.",
        },
      ],
    },
    {
      id: "first-reply",
      heading: "The reply is the product",
      blocks: [
        {
          t: "p",
          text: "Most beauty pages are judged on opt-in rate and then quietly fail at the next step. The visitor asked a question, waited, and got a templated answer with a product link — at which point the assessment they were promised turns out not to have existed.",
        },
        {
          t: "list",
          items: [
            "Reply within the hour where you can — the intent decays faster in this category than almost any other",
            "Reference something they told you in the first sentence, or the personalisation was theatre",
            "Recommend one thing and explain why, rather than three and let them choose",
            "Say what to expect and when, which gives you a reason to follow up that is not a nudge",
          ],
        },
        {
          t: "p",
          text: "This is also why chat outperforms forms here: a routine recommendation is a conversation, and a visitor who can send a photo resolves in one exchange what a form would take three rounds to establish.",
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
              q: "Should a beauty page sell the product or capture the lead?",
              a: "Capture the lead, and let the store sell. A beauty purchase usually needs a question answered first, and a page that pushes straight to checkout loses the visitors who had one. The lead-gen page and your store are not competing — the page hands over a contact you can convert on your own channel.",
            },
            {
              q: "How long should a beauty landing page be?",
              a: "As long as your evidence justifies and no longer. A page with genuine ingredient science, real results, and a body of reviews earns a long page; the same structure with placeholder sections converts worse than a short one, because every empty block asks the visitor to keep scrolling for nothing.",
            },
            {
              q: "Does the same page work for a device and a serum?",
              a: "Usually not. A device is a considered purchase where the visitor compares against alternatives, which suits a comparison structure. A serum converts on the consult path — lead with the concern, offer the assessment. Running one structure for both means one of them is on the wrong page.",
            },
            {
              q: "What if I do not have before-and-after photos?",
              a: "Use in-use imagery and mechanism explainers instead, and ask early customers for permission as you go. Fabricated or borrowed results are worse than none: they are the first thing a reviewer checks, and the first thing a returning customer notices.",
            },
          ],
        },
      ],
    },
  ],
  references: [
    {
      label: "Meta — Advertising Standards: Personal health and appearance",
      url: "https://transparency.meta.com/policies/ad-standards/",
    },
    {
      label: "TikTok — Advertising policies: Industry entry",
      url: "https://ads.tiktok.com/help/article/tiktok-advertising-policies-industry-entry",
    },
  ],
};
