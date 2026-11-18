import type { GuideArticle } from "../../types";

export const independentSiteZeroInquiries: GuideArticle = {
  slug: "independent-site-zero-inquiries-6-layers",
  title: "Your Independent Site Gets Zero Inquiries? Check These 6 Layers First",
  description:
    "A factory site live a year with zero inquiries. Check six layers — indexing, impressions, ranking, clicks, landing page, form — before rebuilding anything.",
  keywords: ["independent site zero inquiries", "B2B website no inquiries", "Google Search Console impressions clicks", "landing page diagnosis", "factory website SEO"],
  datePublished: "2026-11-17",
  intro:
    "A factory builds an independent site, waits a year, and gets zero inquiries. The first reaction is usually that Google must have banned the site, or that the site needs rebuilding. Both guesses skip the real question: where, in the chain from 'Google knows the page exists' to 'a buyer leaves their contact details', does it break? An inquiry is the end of a chain with six links — indexing, impressions, ranking, clicks, landing page, form. If any one link is broken, the result is the same zero. This guide walks through the six layers in order, with one check for each, so you find the broken link before spending money on the wrong fix.",
  sections: [
    {
      id: "the-case",
      heading: "A real case: indexed 100%, zero inquiries",
      blocks: [
        {
          t: "p",
          text: "A foreign-trade independent site had been live for a year with zero inquiries. The owner's first reaction was that Google must have blocked it. Taken apart layer by layer, the numbers said something else: 100% of its pages were indexed, but in the last 28 days it had 0 clicks and only 12 impressions. The problem was neither indexing nor the contact form. The site was in Google's index — almost nobody ever saw it.",
        },
        {
          t: "p",
          text: "That case is the reason for the order below. Work through the layers in sequence. The moment you find a layer that looks wrong, stop: that is where the work is. Fixing a later layer while an earlier one is broken changes nothing.",
        },
        {
          t: "callout",
          tone: "info",
          text: "Zero inquiries is one symptom with at least six possible causes. Rebuilding the whole site treats all six at once — and usually fixes the wrong one.",
        },
      ],
    },
    {
      id: "layer-1-indexing",
      heading: "Layer 1 — Indexing: does Google know the page exists?",
      blocks: [
        {
          t: "p",
          text: "Indexing is the first link. If a page is not in Google's index, it cannot appear in any search, no matter how good it is. A new site is not indexed on day one, and a page can stay out of the index because it is blocked by robots rules, marked noindex, or simply never discovered.",
        },
        {
          t: "steps",
          items: [
            {
              title: "Open Google Search Console and check Pages",
              desc: "How many of your published pages are indexed, and how many are not?",
            },
            {
              title: "Spot-check with a site: search",
              desc: "Search site:yourdomain.com and see which pages show up.",
            },
            {
              title: "Read the reason before changing anything",
              desc: "Blocked, noindexed, or not yet discovered are three different problems — Search Console tells you which one it is.",
            },
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "In the case above, indexing was 100%. The owner's first guess — a Google penalty — was wrong, and checking took minutes. Check first, guess last.",
        },
      ],
    },
    {
      id: "layer-2-impressions",
      heading: "Layer 2 — Impressions: does anyone ever see the site?",
      blocks: [
        {
          t: "p",
          text: "An indexed page can still be invisible. Impressions count how many times your pages appeared in search results at all. Twelve impressions in 28 days means the site surfaced roughly once every two days. In practice, nobody saw it.",
        },
        {
          t: "p",
          text: "Low impressions usually mean one of two things: the pages target searches nobody makes, or the site has not yet earned the standing to appear for the searches it does target. Either way, the problem sits before the page itself. No change to the form or the design can fix it, because there is nobody on the page to convert.",
        },
        {
          t: "steps",
          items: [
            {
              title: "Look at total impressions for the last 28 days",
              desc: "In Search Console, open Performance and read the impressions number first.",
            },
            {
              title: "List the queries behind those impressions",
              desc: "If the list is empty or nearly empty, the site is not entering any search.",
            },
          ],
        },
        {
          t: "callout",
          tone: "warning",
          text: "This is the layer most often skipped. People rebuild the contact form while the real problem is that the site appears in almost no search.",
        },
      ],
    },
    {
      id: "layer-3-ranking",
      heading: "Layer 3 — Ranking: when it appears, where does it appear?",
      blocks: [
        {
          t: "p",
          text: "Impressions alone don't say whether the page is findable. A page can appear in results and still be effectively invisible if it only shows up far down the list, where almost nobody looks. Ranking is about position: which queries trigger the page, and how far down it sits for each.",
        },
        {
          t: "steps",
          items: [
            {
              title: "Look at average position per query",
              desc: "Not just the site average — query by query, in Search Console.",
            },
            {
              title: "Split the queries into two groups",
              desc: "Ones where the page is near the top, and ones where it sits deep. The deep group is where the work is.",
            },
          ],
        },
        {
          t: "p",
          text: "New sites take time to climb. As one seller put it, Google's cold-start period for a new site is long and hard to rush. A page that still ranks deep after a few weeks is not necessarily broken — but it is not bringing inquiries yet, and that is the fact to plan around, not to argue with.",
        },
      ],
    },
    {
      id: "layer-4-clicks",
      heading: "Layer 4 — Clicks: do people choose your result?",
      blocks: [
        {
          t: "p",
          text: "Clicks are impressions that turned into visits. In the case above, 12 impressions produced 0 clicks. With numbers that small, the click rate itself says little — but the direction is clear: the site was barely seen, and nobody who saw it clicked.",
        },
        {
          t: "p",
          text: "When impressions exist but clicks don't, look at what the searcher actually sees: the title and the description. Do they say what the page is for, in the words a buyer would use? A title that describes the company instead of the product, or a description that says nothing specific, gives a searcher no reason to choose this result over the ones around it.",
        },
        {
          t: "steps",
          items: [
            {
              title: "Read the title and description as a searcher sees them",
              desc: "Take the queries with the most impressions and look at the exact text shown for each.",
            },
            {
              title: "Ask whether each one answers the query",
              desc: "Or only describes the company. Rewrite the ones that don't — one page at a time.",
            },
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "Clicks are the first layer where the page itself matters. Everything before it is about being found at all.",
        },
      ],
    },
    {
      id: "layer-5-landing-page",
      heading: "Layer 5 — Landing page: can the page receive a visitor?",
      blocks: [
        {
          t: "p",
          text: "A visitor who arrives still has to be convinced. Many factory sites fail here: as one manufacturer put it, most sites have no ability to 'receive guests' at all — the problem is not that advertising is too small, but that the site itself cannot take a visitor in. The page may list products, but it does not answer the buyer's questions: what exactly is this, what are the specifications, what is the minimum order, how long is the lead time, and why should I trust this supplier?",
        },
        {
          t: "list",
          items: [
            "Can a stranger tell in seconds what the page sells and who it is for?",
            "Are specifications, minimum order and lead time stated, or only implied?",
            "Is there proof — real cases, certificates, a parameter table — or only claims?",
          ],
        },
        {
          t: "p",
          text: "The fix many factories already use is the same checklist: add cases, certificates and parameter tables, and add more ways to get in touch. That is page work, and it only pays off once the earlier layers are bringing visitors.",
        },
      ],
    },
    {
      id: "layer-6-form",
      heading: "Layer 6 — Form: can a visitor actually leave contact details?",
      blocks: [
        {
          t: "p",
          text: "The last link is the most often blamed and the least often checked. A form can be broken in ways nobody notices: submissions that never arrive, an inbox that is never read, a floating window that covers the contact button. Finding out takes a five-minute test, not a rebuild.",
        },
        {
          t: "steps",
          items: [
            {
              title: "Submit the form yourself",
              desc: "Use a real email address, and confirm the message arrives.",
            },
            {
              title: "Check which inbox it goes to",
              desc: "And whether anyone actually reads it.",
            },
            {
              title: "Open the page on a phone and on a desktop",
              desc: "Check that no floating element covers the contact button or the form.",
            },
            {
              title: "Offer more than one way in",
              desc: "A form plus WhatsApp or email, so one broken channel does not lose the inquiry.",
            },
          ],
        },
        {
          t: "callout",
          tone: "warning",
          text: "Check the form last, not first. A perfect form on a page nobody visits still produces zero inquiries — and rebuilding a working form fixes nothing.",
        },
      ],
    },
    {
      id: "what-to-do-next",
      heading: "Once you know the layer, what next?",
      blocks: [
        {
          t: "p",
          text: "The point of the six layers is to stop guessing. Each layer points to a different fix, and the fix for one layer does nothing for another.",
        },
        {
          t: "table",
          head: ["Stuck layer", "What it means", "What to do next"],
          rows: [
            ["Indexing", "Google doesn't have the page", "Find out why it isn't indexed — blocked, noindexed, or undiscovered — and fix that one reason"],
            ["Impressions", "Almost nobody is shown the site", "Work on being found: content that matches real searches, or a small amount of traffic to test with"],
            ["Ranking", "The page appears, but too far down", "Strengthen the page for the queries it already appears for; give it time — new sites climb slowly"],
            ["Clicks", "Seen but not chosen", "Rewrite the title and description in the buyer's words"],
            ["Landing page", "Visitors arrive but don't trust it enough to act", "Add specifications, minimum order, lead time, cases and certificates"],
            ["Form", "Visitors can't leave details, or details never arrive", "Test the form end to end and add a second contact channel"],
          ],
        },
        {
          t: "p",
          text: "If the stuck layer is impressions or ranking, one useful test is to stop rebuilding the whole site and test a single product on a single page first. If that page gets found and brings inquiries, the model works and you can add pages. If it doesn't get found either, you have confirmed the problem is upstream — being found — not the page. Either way, you learn it with one page instead of a whole site.",
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
              q: "My site is 100% indexed but still has zero inquiries. Has Google penalised it?",
              a: "Probably not. In the case above, the owner's first thought was a penalty, but 100% indexed with almost no impressions points the other way: the pages are in the index, they just rarely appear in any search. A penalty usually shows up as pages disappearing from the index, not as a site that stays indexed and unseen.",
            },
            {
              q: "How long should I wait before deciding a layer is stuck?",
              a: "Judge on a 28-day window in Search Console, not on a few days. New sites take time to be found at all — the cold-start period is long — so a week of nothing proves little. A full month of near-zero impressions, on the other hand, is a real signal.",
            },
            {
              q: "Should I just rebuild the whole site?",
              a: "Not before you know the layer. Rebuilding fixes the page and the form; it does nothing for indexing, impressions, ranking or clicks. Find the layer first. If the problem is upstream, a new site will produce the same zero.",
            },
            {
              q: "Visitors come but nobody leaves contact details — which layer is that?",
              a: "Layers 5 and 6. First check the page: does it state specifications, minimum order and lead time, and show proof? Then test the form end to end and check that nothing covers the contact button. Add a second channel, such as WhatsApp or email, so one broken path does not lose the inquiry.",
            },
          ],
        },
      ],
    },
  ],
  references: [
    {
      label: "Panel notes: an independent site live a year with zero inquiries",
      url: "https://www.tianwenseo.com/panel-notes-002/",
    },
  ],
};
