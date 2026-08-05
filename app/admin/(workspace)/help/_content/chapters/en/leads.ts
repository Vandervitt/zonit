import type { HelpChapterData } from "../../types";

export const leads: HelpChapterData = {
  slug: "leads",
  title: "Leads",
  summary: "The lead inbox, email notifications, pushing to your CRM by webhook, and what to check when nothing arrives.",
  sections: [
    {
      id: "inbox",
      heading: "The lead inbox",
      blocks: [
        {
          t: "p",
          text: "Everything a visitor submits through a lead form lands in the Leads inbox: their contact fields, any qualifying details, and the attribution behind it (which page, which form or CTA).",
        },
        {
          t: "list",
          items: [
            "Leads are listed newest first and can be filtered by page.",
            "Overseas leads go cold fast: follow up within the hour and your conversion rate will be markedly better than replying the next day.",
            "Direct-contact conversions (WhatsApp, phone) never touch a form, so they don't appear here — those visitors went straight to your WhatsApp or dialled you. The inbox only holds form submissions.",
          ],
        },
      ],
    },
    {
      id: "email-notify",
      heading: "New lead emails",
      blocks: [
        {
          t: "p",
          text: "Turn on email notifications under Settings → Lead notifications and every new lead is emailed to your account address as it arrives — no need to sit refreshing the dashboard.",
        },
      ],
    },
    {
      id: "webhook",
      heading: "Webhook to your CRM (Pro and above)",
      blocks: [
        {
          t: "p",
          text: "POST new leads straight into your own systems: a CRM, Zapier, Make, or anything that accepts an HTTP request — so a lead arriving drops into your workflow automatically.",
        },
        {
          t: "steps",
          items: [
            { title: "Set the endpoint", desc: "Settings → Lead notifications → enter your webhook URL (a Zapier Catch Hook address, for example) and switch it on." },
            { title: "Save the signing secret", desc: "Turning it on the first time generates a signing secret, shown only once — save it right away. Use it on your end to verify the request really came from Zap Bridge." },
            { title: "Receive and verify", desc: "Each new lead is POSTed to your endpoint as JSON with a signature header. Failed deliveries are retried automatically." },
          ],
        },
        {
          t: "list",
          items: [
            "With Zapier: create a Zap → pick Webhooks by Zapier (Catch Hook) as the trigger → paste the generated URL into your lead notification settings → wire the following steps to your CRM, spreadsheet or Slack.",
            "Make (formerly Integromat) works the same way — grab the URL from a Custom Webhook module.",
            "Any 2xx response counts as success; failures retry on a backoff schedule, so there's nothing to resend by hand.",
          ],
        },
      ],
    },
    {
      id: "no-leads",
      heading: "No leads coming in? Work through this",
      blocks: [
        {
          t: "steps",
          items: [
            { title: "Confirm the page is published and reachable", desc: "Open your domain on mobile data (not the office Wi-Fi) and check the page loads." },
            { title: "Submit a test lead yourself", desc: "Fill in the form and submit. If it shows up in the inbox, the plumbing is fine and you have a traffic or conversion-rate problem." },
            { title: "Check the contact details", desc: "Make sure the WhatsApp number is a real, reachable number in international format — template placeholder numbers receive nothing." },
            { title: "Check the notification channels", desc: "For email, look in spam. For webhooks, check your endpoint's logs and response codes." },
            { title: "Use the funnel to locate it", desc: "The Analytics funnel tells you where it stalls: views but no clicks is a page-appeal problem; clicks but no leads is a form or contact-path problem." },
          ],
        },
      ],
    },
  ],
};
