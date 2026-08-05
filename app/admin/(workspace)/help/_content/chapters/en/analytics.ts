import type { HelpChapterData } from "../../types";

export const analytics: HelpChapterData = {
  slug: "analytics",
  title: "Analytics",
  summary: "What each metric means, how to read the funnel, and the usual fixes.",
  sections: [
    {
      id: "metrics",
      heading: "What the metrics mean",
      blocks: [
        {
          t: "table",
          head: ["Metric", "Meaning", "Reference"],
          rows: [
            ["Views", "How many times the landing page was opened", "Tells you whether the ads are delivering"],
            ["CTA clicks", "How many times visitors tapped a conversion button (WhatsApp, form, …)", "Tells you whether the page persuades"],
            ["Leads", "Actual submissions (form fills and the like)", "The output that matters"],
            ["Conversion rate (CVR)", "Leads ÷ views", "Lead-gen pages typically land between 2% and 10%, varying a lot by industry and traffic quality"],
          ],
        },
      ],
    },
    {
      id: "funnel",
      heading: "How to read the funnel",
      blocks: [
        {
          t: "p",
          text: "The funnel shows drop-off across views → CTA clicks → leads. Diagnose by finding the steepest drop:",
        },
        {
          t: "table",
          head: ["Symptom", "Usually means", "What to do"],
          rows: [
            [
              "Barely any views",
              "An ad-side problem: budget, bidding, review status, or creative that won't spend",
              "Check delivery in your ad account — this isn't a landing page issue",
            ],
            [
              "Views, but a low CTA click rate",
              "The hero isn't catching the traffic: the headline doesn't match the ad's promise, the offer is unclear, or the page loads badly",
              "Make the hero headline restate the ad's promise (message match); trim the hero and sharpen the primary button copy",
            ],
            [
              "Clicks, but few leads",
              "Friction on the conversion path: too many form fields, an unreachable WhatsApp number, or something broken on the visitor's device",
              "Cut the form to 3–5 fields; test the WhatsApp link yourself; walk the whole thing on a real phone",
            ],
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "Comparing funnel shapes across pages or campaigns beats staring at any single number: on the same traffic, the page with the straighter funnel is the better page.",
        },
      ],
    },
  ],
};
