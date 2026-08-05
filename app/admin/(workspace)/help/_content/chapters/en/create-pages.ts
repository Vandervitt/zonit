import type { HelpChapterData } from "../../types";

export const createPages: HelpChapterData = {
  slug: "create-pages",
  title: "Creating landing pages",
  summary: "Start from an industry template, or let AI write the whole page; naming, duplicating and deleting.",
  intro:
    "There are two ways in: start from an industry template (recommended if you're new), or describe your business and let AI generate a full first draft.",
  sections: [
    {
      id: "from-template",
      heading: "Start from a template",
      blocks: [
        {
          t: "p",
          text: "Under Landing pages, hit New to open the template library. There are {templates} templates across {industries} industries (medical and dental, legal and immigration, education, home improvement and local services, B2B wholesale, beauty and skincare, and more). Each one is a complete, publishable page — copy structure, image slots and conversion buttons are all in place. Pick one and you land straight in the editor with the page created.",
        },
        {
          t: "list",
          items: [
            "Pick the closest industry. The section structure and copy angle are built around how that industry converts, so it's far less work than adapting a neighbouring one.",
            "Every plan gets every template — there's no paywall on the library.",
            "Templates in higher-risk categories (health, beauty, finance) ship with a disclaimer section. Keep it and complete it for your jurisdiction; don't delete it.",
          ],
        },
      ],
    },
    {
      id: "ai-generate",
      heading: "Let AI write it",
      blocks: [
        {
          t: "p",
          text: "If you'd rather not adapt a template, describe your business and AI will generate the whole page: copy for every section plus matched Unsplash imagery (including before/after pairs and reviewer avatars). You land in the editor afterwards to fine-tune.",
        },
        {
          t: "list",
          items: [
            "The more specific the brief, the better the result. Spell out what you sell, who you sell to, which market, your core selling point, and how you want people to contact you. For example: “Natural dog food brand for US pet owners, grain-free formula, drive WhatsApp enquiries.”",
            "Treat the output as a first draft: check every factual claim (ingredients, numbers, promises) and swap in your real contact details.",
            "Unhappy with one paragraph? Use AI rewrite on that field instead of regenerating the whole page.",
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "AI allowance depends on your plan: full-page generation is 3/month on Free, 15 on Starter, 80 on Pro and 300 on Agency, resetting each calendar month. Credits bought separately never expire and are used automatically once the monthly allowance runs out.",
        },
      ],
    },
    {
      id: "manage-pages",
      heading: "Managing pages: naming, duplicating, deleting",
      blocks: [
        {
          t: "list",
          items: [
            "Rename: edit the page name in the landing page list. The name is for your own organisation and never appears publicly.",
            "Duplicate: clone an existing page and tweak it — handy for running several creative angles on one product. Duplicates count towards your plan's page allowance.",
            "Delete: the page and its draft can't be recovered, and if it was published, deleting also takes it offline. Handle with care.",
            "Once you hit your plan's page limit you can't create more — delete an old page or upgrade.",
          ],
        },
      ],
    },
  ],
};
