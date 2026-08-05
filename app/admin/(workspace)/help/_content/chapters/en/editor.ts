import type { HelpChapterData } from "../../types";

export const editor: HelpChapterData = {
  slug: "editor",
  title: "Using the editor",
  summary: "The editor layout, all 12 content sections and 3 fixed parts, lead forms, primary conversion, SEO and theming.",
  intro:
    "The editor is where the page gets built: edit section content on the left, watch the live preview on the right, and manage saving and publishing from the top bar. This chapter walks through what each section is for and how to fill it in.",
  sections: [
    {
      id: "layout",
      heading: "The editor layout",
      blocks: [
        {
          t: "list",
          items: [
            "Left: the page structure and the edit form for each section. Click a section to expand its form; changes show in the preview immediately.",
            "Right: the live preview, switchable between mobile and desktop framing. What you see is what publishes.",
            "Top bar: save status, undo / redo, validation status, “Preview” for full screen, “Share preview” for a draft link, and “Publish” (published pages show “Update”).",
          ],
        },
        {
          t: "callout",
          tone: "success",
          text: "Everything autosaves — there's no save button to hit. “Saved” in the top bar means you're safe; “Save failed — click to retry” retries when clicked, and tells you why it failed (a duplicate page name, for instance). If you close or refresh with unsaved changes, the browser will warn you.",
        },
        {
          t: "p",
          text: "Made a mess? Undo it: the ↺ / ↻ buttons in the top bar, or Cmd/Ctrl+Z to undo and Shift+Cmd/Ctrl+Z to redo, up to 50 steps back. Even a full-page AI generation is a single undo, so it can't permanently overwrite what you had.",
        },
      ],
    },
    {
      id: "fixed-parts",
      heading: "The three page-level fixed parts",
      blocks: [
        {
          t: "table",
          head: ["Fixed part", "Position", "What it's for"],
          rows: [
            [
              "Hero",
              "Top of the page",
              "Where visitors decide to stay or leave, within three seconds. The headline says who you help and with what; the subheadline adds the core value; the primary button points straight at your conversion path (WhatsApp, say).",
            ],
            [
              "Footer",
              "Bottom of the page",
              "Brand details and compliance links. The footer must carry at least one compliance link or policy entry (a privacy policy, for example) — that's a publishing requirement, covered in “Compliance & content rules”.",
            ],
            [
              "Floating button",
              "Follows the scroll",
              "A contact button pinned to the corner (usually WhatsApp), so visitors can reach you from anywhere on the page. Keep the number consistent with the primary CTA.",
            ],
          ],
        },
      ],
    },
    {
      id: "blocks",
      heading: "The 12 content sections",
      blocks: [
        { t: "p", text: "Content sections can be added, removed and dragged into any order. More isn't better — pick the 5–8 that suit your industry and keep the page focused on converting." },
        {
          t: "table",
          head: ["Section", "What it's for", "How to fill it in"],
          rows: [
            ["Stats", "Establish first trust with a few key numbers", "Three or four is plenty: people served, years in business, satisfaction. Numbers must be real and checkable — don't inflate them."],
            ["Plans (Offer)", "Present service packages or value tiers side by side", "Prices here are display copy (“from $99”) and there's no buy button — the point is to prompt an enquiry for a quote, not to sell online."],
            ["Products", "List products or services", "Give each one a clear image and a one-line hook. Use your media library or Unsplash."],
            ["Before / after", "Show results visually", "Comparison shots need the same angle and lighting to be believable. Health and beauty categories must pair them with a disclaimer."],
            ["Process", "Reduce anxiety by showing what happens next", "Three to five steps, one line each, from “get in touch” through to “get the result”."],
            ["Trust", "Credentials, certifications, press, partner brands", "Only what you genuinely have. Fake endorsements put your ad account at risk."],
            ["Features", "Your core selling points, itemised", "Write benefits, not specs: “visible in 30 days” lands harder than “contains 5% niacinamide”."],
            ["Reviews", "Customer testimonials and ratings", "Reviews with an avatar and specific detail read as most credible. Don't invent them — with permission, you can quote real conversations."],
            ["Story", "Brand or founder narrative, for emotional connection", "Say why you do this. One honest paragraph beats a page of marketing lines."],
            ["Countdown", "Create urgency for a time-limited offer", "Only for genuinely time-limited offers. A permanent fake countdown damages trust and carries platform compliance risk."],
            ["FAQ", "Answer objections up front and cut pointless enquiries", "Write what people actually ask: price range, timelines, coverage area, aftercare. Five to eight is about right."],
            ["Guarantee", "Service assurances and commitments", "Keep it to service promises (free follow-up visit, redo if you're unhappy). Don't write refund guarantees or other transactional commitments."],
          ],
        },
      ],
    },
    {
      id: "lead-form",
      heading: "Lead form",
      blocks: [
        {
          t: "p",
          text: "If your conversion path is “visitor fills in a form, you follow up”, add the lead form section. One form per page maximum; if the primary CTA points at the form, the page must contain it.",
        },
        {
          t: "list",
          items: [
            "The form must collect at least one field you can actually reach someone on: phone, email, WhatsApp or Telegram. A name alone isn't a usable lead.",
            "Use extra fields as light qualification: service type, budget range, target country, preferred appointment time. Fewer fields means a higher submission rate — three to five is the sweet spot.",
            "Submissions land in the Leads inbox and can notify you by email or webhook (see the “Leads” chapter).",
          ],
        },
      ],
    },
    {
      id: "primary-conversion",
      heading: "Primary conversion path",
      blocks: [
        {
          t: "p",
          text: "Every page needs one clear primary conversion path — where the primary button takes people. There are four options: WhatsApp, phone, email or lead form.",
        },
        {
          t: "table",
          head: ["Path", "Suits", "Watch out for"],
          rows: [
            ["WhatsApp", "The default messaging channel in most overseas markets, and the lowest-friction option (recommended)", "Use international format (country code + number, no plus sign or spaces). The template's placeholder number (starting 1555) must be replaced or publishing is blocked."],
            ["Phone", "Local services and urgent jobs", "Confirm the number is dialable from your target country."],
            ["Email", "B2B and formal enquiries", "Response time drives conversion — aim to reply within 24 hours."],
            ["Form", "When you need to qualify leads, or visitors can't message immediately", "Requires the lead form section on the page."],
          ],
        },
        {
          t: "callout",
          tone: "warning",
          text: "Publishing validates the primary CTA: the hero's primary button can't be empty, and any template placeholder number left anywhere on the page (including the floating button) blocks publishing — placeholder numbers receive nothing.",
        },
      ],
    },
    {
      id: "media",
      heading: "Images and assets",
      blocks: [
        {
          t: "list",
          items: [
            "Every image slot opens the media picker: upload your own, or search and import from the free Unsplash library.",
            "Unsplash images are free for commercial use and attribution is handled automatically on import — nothing to add by hand.",
            "Fill in alt text for every image: it helps SEO and it's an accessibility requirement. Describe what's in it, e.g. “teeth whitening before and after”.",
            "Use your own real photography for products and results wherever you can, and keep stock imagery for atmosphere — authenticity moves conversion rate directly.",
          ],
        },
      ],
    },
    {
      id: "branding",
      heading: "Brand theme",
      blocks: [
        {
          t: "p",
          text: "Brand settings offer six theme palettes that recolour buttons, accents and backgrounds across the whole page in one go. Pick the one closest to your brand or logo — there's no need to colour sections individually.",
        },
      ],
    },
    {
      id: "seo",
      heading: "SEO settings",
      blocks: [
        {
          t: "p",
          text: "The SEO panel controls how the page appears in search results and social shares. Structured data (JSON-LD) is generated from the page content automatically — nothing to maintain by hand.",
        },
        {
          t: "table",
          head: ["Field", "How to write it"],
          rows: [
            ["Title", "50–60 characters, “core keyword + brand”, e.g. “Teeth Whitening in Dubai | SmileCare”."],
            ["Description", "120–155 characters: the value in one line plus a nudge to act. This is the snippet in search results."],
            ["Social sharing image (OG image)", "A 1200×630 image — the big preview when the link is shared on WhatsApp or Facebook, which directly affects click-through."],
          ],
        },
      ],
    },
    {
      id: "draft-share",
      heading: "Sharing a draft preview",
      blocks: [
        {
          t: "p",
          text: "“Share preview” in the top bar creates a draft preview link you can send to a colleague or client before going live. A preview link isn't publishing: to go public you still connect a domain (or use the platform address) and hit Publish.",
        },
      ],
    },
  ],
};
