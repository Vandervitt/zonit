import type { GuideArticle } from "../../types";

export const facebookAdLandingPageCompliance: GuideArticle = {
  slug: "facebook-ad-landing-page-compliance",
  title: "Keeping a Facebook ad landing page out of rejection: 8 compliance points",
  description:
    "Facebook / Meta ad landing page rejected or throttled? This breaks down the eight most common compliance problems — ad-to-page consistency, privacy policy, exaggerated claims, duplicate page structure — with a pre-launch self-check list.",
  keywords: ["Facebook ad landing page", "landing page rejection", "Meta ad compliance", "ad throttling"],
  datePublished: "2026-07-26",
  intro:
    "When you run ads overseas, the landing page is where rejections and throttling tend to originate — the creative passes review, the page is flagged, and the whole ad set gets restricted. This breaks down the eight most common compliance problems with Meta landing pages so you can clear them before going live.",
  sections: [
    {
      id: "why-rejected",
      heading: "Why landing pages get rejected or throttled",
      blocks: [
        {
          t: "p",
          text: "Meta doesn't only review ad creative — it crawls and evaluates the landing page itself. A page that doesn't match what the ad promised, is missing compliance essentials, exaggerates results, or shares a near-identical structure with many other pages can trigger a manual or automated violation: a rejection at best, throttling or an account ban at worst.",
        },
        {
          t: "list",
          items: [
            "Page content doesn't match what the ad copy or imagery promised (the most common one)",
            "Missing compliance essentials such as a privacy policy or contact details",
            "Exaggerated or absolute efficacy claims (especially supplements, beauty, and finance)",
            "Deceptive pop-ups, forced redirects, or downloads unrelated to the ad",
            "Many pages built from one template with near-identical structural fingerprints, flagged as duplicate content",
          ],
        },
      ],
    },
    {
      id: "eight-points",
      heading: "The eight compliance points",
      blocks: [
        {
          t: "table",
          head: ["Point", "What to do"],
          rows: [
            [
              "Page matches the ad",
              "The benefits, imagery, and offer in the hero must line up with what the ad promised",
            ],
            [
              "Privacy policy + terms",
              "Put clickable privacy policy and terms links in the footer, explaining how data is collected and used",
            ],
            ["Reachable contact details", "Offer a genuine contact route — email, form, or WhatsApp"],
            [
              "No absolute claims",
              "Drop words like “cure”, “100% effective”, and “guaranteed” in favour of neutral, verifiable wording",
            ],
            [
              "Disclaimers for high-risk categories",
              "Supplements, beauty, and finance need added disclaimers such as “for reference only, not medical advice”",
            ],
            [
              "No deception or forced redirects",
              "No automatic downloads, forced subscriptions, or redirects unrelated to the ad",
            ],
            [
              "Mobile experience holds up",
              "Fast hero, readable text, clear CTA — Meta traffic is predominantly mobile",
            ],
            [
              "Differentiated page structure",
              "When running at scale, avoid pages whose structural fingerprints are completely identical",
            ],
          ],
        },
      ],
    },
    {
      id: "consistency",
      heading: "The big one: consistency between page and ad",
      blocks: [
        {
          t: "p",
          text: "Inconsistency is the number one cause of rejection. If the ad says “claim your free skin analysis”, that hook has to be visible in the hero immediately; if the ad image is a real product shot, the page shouldn't swap in unrelated stock. Reviewers — and the system — compare the two, and the wider the gap the greater the risk.",
        },
        {
          t: "callout",
          tone: "warning",
          text: "Near-identical page structure is just as risky: pages mass-copied from one template with only the copy changed are easily judged duplicate or low-quality content and throttled. Running at scale means giving pages differing structural fingerprints — which is exactly what anti-duplication exists to solve.",
        },
      ],
    },
    {
      id: "checklist",
      heading: "Pre-launch self-check",
      blocks: [
        {
          t: "steps",
          items: [
            {
              title: "Compare against the ad",
              desc: "Check the page's benefits, imagery, and offer line by line against what the ad promised",
            },
            {
              title: "Check compliance essentials",
              desc: "Confirm the privacy policy, terms, contact details, and any required disclaimers are present and clickable",
            },
            {
              title: "Scan for prohibited wording",
              desc: "Search the page for absolute, exaggerated, or guarantee-style claims and replace them",
            },
            {
              title: "Test on mobile",
              desc: "Run through load speed, readability, and the CTA on an actual phone",
            },
            {
              title: "Check structural variation",
              desc: "When running at volume, confirm the pages aren't exact structural copies of one another",
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
              q: "The landing page passed review — why was the ad still rejected?",
              a: "A rejection can originate from the creative, the audience targeting, or account history, and the landing page is only one of those. Confirm the page is compliant first, then work through creative copy, target audience, and account status one at a time.",
            },
            {
              q: "Will many pages from one template be judged duplicate content?",
              a: "It's possible. A large set of pages with near-identical structural fingerprints is easily judged duplicate or low-quality content. Running at scale means varying page structure while keeping the content genuine and consistent.",
            },
            {
              q: "Are supplement and beauty landing pages more likely to be rejected?",
              a: "They're high-risk categories and are treated more sensitively on efficacy claims. Avoiding absolute wording, adding the necessary disclaimers, and keeping the page consistent with the ad measurably lowers the odds of rejection.",
            },
          ],
        },
      ],
    },
  ],
  references: [
    {
      label: "Advertising Standards — Meta Transparency Centre",
      url: "https://transparency.meta.com/policies/ad-standards/",
    },
    {
      label: "Unacceptable Business Practices — Meta Transparency Centre",
      url: "https://transparency.meta.com/policies/ad-standards/fraud-scams/unacceptable-business-practices/",
    },
    {
      label: "Health and Wellness advertising policy — Meta Transparency Centre",
      url: "https://transparency.meta.com/policies/ad-standards/restricted-goods-services/health-wellness/",
    },
  ],
};
