import type { GuideArticle } from "../../types";

export const landingPageDuplicateDetection: GuideArticle = {
  slug: "landing-page-duplicate-detection",
  title: "Structural duplicate detection: why your pages get flagged even when the copy is different",
  description:
    "Rewriting the text does not make two pages different. This covers what actually gets compared when platforms look for duplicates, which signals you control, and what changes if you run many pages.",
  keywords: [
    "landing page duplicate detection",
    "page fingerprint",
    "ad account duplicate content",
    "anti-duplication landing page",
  ],
  ctaTarget: "anti-ban",
  datePublished: "2026-08-02",
  intro:
    "The common assumption is that duplicate detection compares words. It is the reason so many advertisers spin the copy, change the headline, swap the stock photos — and still get the same outcome across a set of pages. Text is one signal among several, and for a page built from a template it is rarely the one that gives you away. This covers what is actually being compared, and which parts of it you can do something about.",
  sections: [
    {
      id: "what-is-compared",
      heading: "What actually gets compared",
      blocks: [
        {
          t: "p",
          text: "Treat it as a fingerprint assembled from several independent layers. Two pages can share a layer without being a problem; sharing most of them across a set of pages is what makes a set look mass-produced.",
        },
        {
          t: "table",
          head: ["Layer", "What it captures", "How much control you have"],
          rows: [
            ["Text", "Wording, headings, claims", "Total — and it is the layer most people over-invest in"],
            ["DOM structure", "Section order, nesting depth, element counts", "High, if your builder lets you reorder and drop sections"],
            ["Assets", "Image files, hashes, CDN paths, favicon", "High — and commonly overlooked"],
            ["Technical fingerprint", "Class-name patterns, script bundle, meta shape", "Depends entirely on your page builder"],
            ["Infrastructure", "Domain, IP, DNS provider, certificate issuer", "Moderate, and expensive to vary"],
            ["Behavioural", "Traffic pattern, bounce, time-on-page across the set", "Indirect — it follows from targeting"],
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "The practical implication: rewriting text moves one row of six. If the other five are identical across twenty pages, the rewrite buys you very little.",
        },
      ],
    },
    {
      id: "why-templates-are-risky",
      heading: "Why template-built pages are structurally similar by default",
      blocks: [
        {
          t: "p",
          text: "This is not an argument against templates — it is an argument for understanding what a template does. A template fixes section order, nesting, and class-name patterns so that everyone who uses it produces pages with the same skeleton. That is the entire value proposition, and it is also the exposure.",
        },
        {
          t: "list",
          items: [
            "Every page from the same template has the same section sequence unless you change it",
            "The same builder emits the same class-name and script patterns for every customer",
            "Stock photography is shared across everyone who searched the same term",
            "Default favicons, default meta shapes, and boilerplate footers repeat verbatim",
          ],
        },
        {
          t: "p",
          text: "The uncomfortable version: if you and a competitor both used the same popular template and the same stock library, your pages may be structurally closer to each other than either is to your own previous campaign.",
        },
      ],
    },
    {
      id: "what-to-vary",
      heading: "What to vary, in order of cost-effectiveness",
      blocks: [
        {
          t: "p",
          text: "Ranked by how much difference it makes per unit of effort. The first three cost almost nothing and are the ones most advertisers skip.",
        },
        {
          t: "steps",
          items: [
            {
              title: "Section order and section set",
              desc: "Drop the sections you cannot substantiate and reorder the rest to match the audience. This changes the DOM signature more than any amount of rewriting, and it usually improves the page.",
            },
            {
              title: "Imagery — original where possible, varied where not",
              desc: "Your own photographs are the single strongest differentiator available. Where you must use stock, at least do not reuse the same files across a set of pages.",
            },
            {
              title: "Favicon, meta, and footer boilerplate",
              desc: "Cheap to vary, almost never varied. Default favicons in particular are a giveaway across a whole account.",
            },
            {
              title: "Copy, written from the actual offer",
              desc: "Rewriting matters, but write from the product rather than paraphrasing the template. Paraphrase preserves the sentence skeleton that made it detectable.",
            },
            {
              title: "Domain and hosting spread",
              desc: "Effective and expensive. Worth it at scale, wasteful for two pages, and no substitute for the four above.",
            },
          ],
        },
      ],
    },
    {
      id: "what-not-to-do",
      heading: "What does not work, and what backfires",
      blocks: [
        {
          t: "p",
          text: "Several widely shared tactics either do nothing or make the pattern more obvious rather than less.",
        },
        {
          t: "list",
          items: [
            "Spinning text with a tool: produces awkward copy, leaves structure untouched, and lowers conversion at the same time",
            "Invisible text, hidden divs, or randomised whitespace: does not change what is compared, and is itself a policy problem if detected",
            "Cloaking — showing reviewers something different from users: prohibited outright on the major platforms, and treated far more seriously than a duplicate page",
            "One page per keyword with only the keyword swapped: the clearest possible signal that a set is machine-generated",
          ],
        },
        {
          t: "callout",
          tone: "warning",
          text: "The distinction that matters: reducing accidental structural similarity between your own legitimate pages is housekeeping. Disguising a page from the reviewer is evasion, and it is the category that gets accounts terminated rather than ads rejected.",
        },
      ],
    },
    {
      id: "at-scale",
      heading: "If you run many pages",
      blocks: [
        {
          t: "p",
          text: "Everything above compounds when you operate dozens of pages across several accounts. At that point similarity stops being a per-page property and becomes a property of the set.",
        },
        {
          t: "list",
          items: [
            "Audit across the set, not per page — two pages looking fine says nothing about twenty",
            "Vary systematically rather than randomly: a random generator produces its own recognisable distribution",
            "Keep a record of which structure went to which campaign, so a rejection tells you something",
            "Treat each account's pages as a set too — the pattern is visible at account level, not only at page level",
          ],
        },
        {
          t: "p",
          text: "This is the case for tooling: doing it by hand is possible for five pages and unmanageable for fifty, which is where structural variation belongs in the builder rather than in a checklist.",
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
              q: "Is duplicate detection the same as the duplicate content penalty in SEO?",
              a: "No, and conflating them causes bad decisions. SEO duplicate handling is about which URL ranks — it picks a canonical and moves on. Ad platform duplicate signals feed into policy and quality review, where the outcome is a rejected page or a restricted account rather than a lower position.",
            },
            {
              q: "Does using a template mean my pages will be flagged?",
              a: "No. Templates are normal and the platforms know it. The risk is in running many pages that share the template's structure, its stock imagery, and its boilerplate simultaneously — the template is the starting point, not the finished page.",
            },
            {
              q: "How different is different enough?",
              a: "There is no published threshold and anyone quoting you one is guessing. The workable standard is whether a human reviewer looking at your set would conclude these were built for different offers or churned out from one. Optimise for that judgement rather than for a number.",
            },
            {
              q: "Will changing the domain solve it?",
              a: "It changes one layer. If the DOM, assets, and boilerplate remain identical, a new domain relocates the pattern rather than removing it — and it costs considerably more than reordering sections and swapping imagery.",
            },
          ],
        },
      ],
    },
  ],
  references: [
    {
      label: "Meta — Advertising Standards: Circumventing systems",
      url: "https://transparency.meta.com/policies/ad-standards/deceptive-content/circumventing-systems",
    },
    {
      label: "Google Ads — Misrepresentation policy",
      url: "https://support.google.com/adspolicy/answer/6020955",
    },
    {
      label: "Google Search Central — Duplicate content and canonicalization",
      url: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls",
    },
  ],
};
