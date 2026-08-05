import type { HelpChapterData } from "../../types";

export const account: HelpChapterData = {
  slug: "account",
  title: "Account & settings",
  summary: "How you sign in, your account details, and notification settings.",
  sections: [
    {
      id: "login",
      heading: "Signing in",
      blocks: [
        {
          t: "list",
          items: [
            "Passwordless: enter your email, get a 6-digit code, and you're in — no password to set, any email domain works.",
            "You can also sign in with Google in one click.",
            "Both routes with the same email land in the same account, sharing all data.",
            "New accounts get 7 days of full Pro, then drop back to Free automatically (pages and data are kept).",
          ],
        },
      ],
    },
    {
      id: "settings",
      heading: "Settings at a glance",
      blocks: [
        {
          t: "table",
          head: ["Setting", "Where", "What it does"],
          rows: [
            ["Lead email notifications", "Settings → Lead notifications", "New leads emailed to your account address; the toggle takes effect immediately"],
            ["Weekly lead digest", "Settings → Lead notifications", "Monday summary of views / CTA clicks / leads per page (on by default, can be turned off)"],
            ["Lead webhook", "Settings → Lead notifications", "Pro and above; setup is in the “Leads” chapter"],
            ["Interface language", "Settings → Language", "Switches this dashboard and the emails we send you between English and Chinese"],
            ["Plan & subscription", "Plan & billing", "Upgrades, invoices, cancellation"],
          ],
        },
        {
          t: "p",
          text: "Your pages, leads and media are isolated per account — only you can see and manage them.",
        },
      ],
    },
  ],
};
