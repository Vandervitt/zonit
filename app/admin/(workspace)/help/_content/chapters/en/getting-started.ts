import type { HelpChapterData } from "../../types";

export const gettingStarted: HelpChapterData = {
  slug: "getting-started",
  title: "Getting started",
  summary: "Publish your first landing page in five minutes — from creating it to connecting a domain.",
  intro:
    "Zap Bridge gets you a landing page that can run ads and capture leads in minutes, published on your own brand domain. This chapter walks the whole first-publish flow.",
  sections: [
    {
      id: "first-publish",
      heading: "Publish your first landing page in five minutes",
      blocks: [
        {
          t: "steps",
          items: [
            { title: "Create a page", desc: "Go to Landing pages → New, pick one of {templates} industry templates, or let AI write the whole page from one sentence." },
            { title: "Edit the content", desc: "Change copy, images and buttons in the visual editor. Everything autosaves, with a live preview on the right." },
            { title: "Swap in your contact details", desc: "Replace the template's placeholder WhatsApp number with your real one — placeholder numbers are blocked at publish time." },
            { title: "Publish", desc: "Hit Publish. No domain yet? Choose “Publish on a platform address” — no DNS to configure, the page goes live immediately and starts capturing leads." },
            { title: "Move to your own brand domain (optional)", desc: "When you start running ads or settle in for the long haul, add your domain under Domains, follow the DNS instructions, and once it's verified pick it in the publish dialog. Your leads are unaffected (see the “Domains & publishing” chapter)." },
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "New accounts get 7 days of full Pro (publishing, CAPI, no watermark included), enough to run the whole publish-and-capture loop. When the trial ends and you drop to Free, publishing on your own domain needs a plan with a domain slot (Starter or above) — the platform address stays available. The “4 steps to launch” checklist on the Overview page ticks off as you go.",
        },
      ],
    },
    {
      id: "workspace-tour",
      heading: "A tour of the dashboard",
      blocks: [
        {
          t: "table",
          head: ["Sidebar entry", "What it's for"],
          rows: [
            ["Overview", "Dashboard home: account and page status at a glance"],
            ["Landing pages", "All your pages (draft / published) — create, edit, unpublish and delete here"],
            ["Leads", "Your lead inbox: the contact details visitors leave through forms and other channels"],
            ["Domains", "Connect, verify and manage your own domains"],
            ["Media", "One place for uploaded images and imported Unsplash assets"],
            ["Analytics", "The views → CTA clicks → leads funnel, plus the numbers behind it"],
            ["Plan & billing", "Your current plan, upgrades and subscription management"],
            ["Settings", "Account settings such as lead notifications (email / webhook)"],
            ["Help", "The help centre you're reading now"],
          ],
        },
      ],
    },
    {
      id: "plan-glance",
      heading: "Plans at a glance",
      blocks: [
        {
          t: "p",
          text: "All four plans (Free / Starter / Pro / Agency) include every template and the full visual editor. What differs is page count, domain count, AI allowance and the advanced lead-gen features.",
        },
        {
          t: "table",
          head: ["Key difference", "Free", "Starter", "Pro", "Agency"],
          rows: [
            ["Landing pages", "1", "5", "20", "Unlimited"],
            ["Custom domains", "0 (platform address only)", "1", "5", "Unlimited"],
            ["AI full-page generations / month", "3", "15", "80", "300"],
            ["Remove platform watermark", "—", "—", "✓", "✓"],
            ["Multi-platform tracking + server-side conversions", "—", "—", "✓", "✓"],
            ["Lead webhook", "—", "—", "✓", "✓"],
            ["Anti-duplication", "—", "—", "—", "✓"],
          ],
        },
        { t: "p", text: "Full comparison and billing details are in the “Plans & billing” chapter." },
      ],
    },
  ],
};
