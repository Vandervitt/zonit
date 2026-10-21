import type { GuideArticle } from "../../types";

export const b2bAdsHomepageVsLandingPage: GuideArticle = {
  slug: "b2b-ads-homepage-vs-landing-page",
  title: "Homepage or landing page for B2B ads: what a buyer needs after the click",
  description:
    "When B2B ad clicks land on your homepage, buyers often can't find where to send a quote request. How the homepage and an RFQ landing page split the work, when the homepage is fine, and what belongs above the fold.",
  keywords: ["B2B ad landing page", "homepage vs landing page", "manufacturer landing page", "RFQ landing page"],
  ctaTarget: "rfq",
  datePublished: "2026-10-20",
  intro:
    "A company homepage serves everyone at once: existing customers, job seekers, partners, buyers checking you out. A visitor from an ad has one question — can you make what I need, and how do I ask for a quote. Send that single-purpose visitor to a page built for everyone and the request leaks away between the navigation bar and the company history. This covers what each page is for, and how to lay out the top of an ad landing page.",
  sections: [
    {
      id: "message-match",
      heading: "Whatever the ad promised, the landing spot has to deliver",
      blocks: [
        {
          t: "p",
          text: "The buyer searched for \"stainless sheet-metal enclosure OEM\" and landed on your company history and a full-catalogue menu, left to find the product themselves. An ad and a landing page that aren't saying the same thing is one of the most common ways B2B ad budgets are wasted.",
        },
        {
          t: "callout",
          tone: "info",
          text: "A quick test: put the ad headline next to the landing page headline. If a reader can't tell they're about the same thing, that ad group needs its own page.",
        },
      ],
    },
    {
      id: "jobs",
      heading: "Homepage and RFQ landing page do different jobs",
      blocks: [
        {
          t: "table",
          head: ["", "Homepage", "RFQ landing page"],
          rows: [
            ["Who it's for", "Every visitor", "One kind of buyer from one ad group"],
            ["Job to do", "Introduce the company, handle every kind of visit", "Get a request for quote you can price"],
            ["Navigation", "Full menu, encourages browsing", "As few exits as possible, quote path always visible"],
            ["Above the fold", "Brand and positioning", "What you make for this buyer, why to trust you, how to ask"],
            ["Success measure", "Time on site, pages per visit", "Quote form submissions"],
          ],
        },
        {
          t: "p",
          text: "They don't replace each other. The landing page catches ad traffic; the homepage lets serious buyers verify you. Linking from the landing page to the homepage beats using the homepage as the landing page.",
        },
      ],
    },
    {
      id: "when-homepage-is-fine",
      heading: "When the homepage is fine",
      blocks: [
        {
          t: "list",
          items: [
            "Brand-name ads: people searching your company name want your website",
            "Remarketing to existing customers: they know you and want what's new",
            "Follow-up ads after a trade show: they've met you and want an official place to verify you",
          ],
        },
        {
          t: "p",
          text: "Cold traffic is the opposite — category, product and competitor terms bring visitors who don't know you and arrive with one specific need. Those ads belong on a dedicated RFQ page.",
        },
      ],
    },
    {
      id: "above-the-fold",
      heading: "What belongs above the fold",
      blocks: [
        {
          t: "steps",
          items: [
            { title: "What you make", desc: "The category and process capability this ad group is about, in the buyer's terms rather than your slogan." },
            { title: "Why to trust you", desc: "Certificate numbers, capacity, years in business, markets served — specifics that can be checked." },
            { title: "Minimum order and lead time", desc: "Stating them filters out mismatched enquiries and saves a round-trip." },
            { title: "The quote request", desc: "Right at the top, prompting for product, quantity and destination; WhatsApp can sit alongside as a secondary channel." },
          ],
        },
        {
          t: "callout",
          tone: "warning",
          text: "The page still needs a privacy policy, terms and your business details. Ad platforms check for them when reviewing landing pages, and missing them can get the ad disapproved.",
        },
      ],
    },
    {
      id: "measurement",
      heading: "Measure separately to see which ads bring quote requests",
      blocks: [
        {
          t: "list",
          items: [
            "One page per ad group, so pages can be compared on quote requests directly",
            "Tag ad links with UTM parameters so each request arrives with its campaign",
            "Count only form submissions as quote requests; WhatsApp and phone taps are clicks — don't add them together",
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
              q: "We already have a company website. Do we still need a landing page?",
              a: "A website is for being verified and browsed; cold ad traffic needs a page that does one thing. Run both: send ads to the landing page, and link from it to the website.",
            },
            {
              q: "Do we need a page for every product?",
              a: "No. Split by ad group: a page for each group of ads whose buyers want clearly different things is enough. Start with the group that spends the most.",
            },
            {
              q: "Can we write the page in our own language?",
              a: "The page has to be in the buyer's language. You can prepare your factory and product details in your own language, generate the English page, then check terminology and numbers yourself — key specifications and certifications must be confirmed by a person.",
            },
            {
              q: "Won't a landing page look less established?",
              a: "Vague pages look unestablished, not short ones. With certificate numbers, capacity and business details stated plainly, a focused page reads more like a dependable factory than a homepage with no clear point.",
            },
          ],
        },
      ],
    },
  ],
};
