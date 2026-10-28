// RFQ landing page product page copy (English face).
//
// Positioning: a **product page** for commercial-intent queries ("RFQ landing page",
// "request for quote page", "B2B quote form"). It pairs with /guides/b2b-rfq-lead-generation —
// that article answers "how to design an RFQ"; this page answers "how to do it on Urgizat".
//
// ⚠️ Wording rules (site-wide, see en/home.ts header and en/whatsapp.ts):
//   · A **lead** is a form submission only. WhatsApp / phone are counted as clicks.
//   · Quotes and enquiries are fine; orders, carts, checkout are not — generated pages stay
//     non-transactional.
//   · overseas / cross-border may describe the *scenario* (buyers in other markets), never the
//     *audience definition* — the English face serves suppliers anywhere.
//   · Only claim what ships today: the form guides buyers through a prompt, not structured
//     RFQ fields; Webhook delivery is a Pro feature; own-domain publishing is a paid feature.
// Counts use placeholders filled from the template registry (lib/templates/stats.ts).
export const rfq = {
  meta: {
    title: "RFQ landing pages for manufacturers and suppliers | Urgizat",
    description:
      "Give buyers a page built to send a request for quote: describe your factory in any language, get a full English RFQ page drafted by AI, and start from {rfqTemplates} B2B templates with a quote form already wired to your inbox.",
    ogTitle: "RFQ landing pages — from ad click to quotable enquiry",
    ogDescription:
      "A page that shows buyers what you can make, at what minimum and how fast, then takes the request for quote. Brief it in your own language; the page comes out in fluent English.",
  },
  hero: {
    badge: "B2B enquiries · OEM and factory-direct",
    titleLine1: "Buyers don't want your homepage.",
    titleLine2: "They want somewhere to send an RFQ.",
    subtitle:
      "A procurement lead clicking your Google, LinkedIn or Meta ad wants three answers: can you make it, what's the minimum, and how do they request a quote. Brief your factory in your own language, let AI draft the English page, publish it free on a platform address, and every request for quote lands in your inbox.",
    ctaPrimary: "Start free with the OEM template",
    ctaSecondary: "Browse B2B templates",
  },
  problem: {
    kicker: "// where enquiries leak",
    title: "The ad brought the buyer. The RFQ never came.",
    desc: "Buyers screening suppliers have little patience. If the landing spot doesn't catch them, the click is wasted spend.",
    items: {
      homepage: {
        title: "The ad lands on your homepage, and the quote path is buried",
        desc: "Homepages lead with brand story and company history. Capacity, minimums, lead times and certifications are scattered across menus — two pages in, the buyer moves on to the next supplier.",
      },
      unquotable: {
        title: "Enquiries arrive that you can't quote from",
        desc: "A generic contact form returns \"please send your price list\". Specification, volume and destination all need another round-trip, and each one is a chance to lose to a supplier who answered faster.",
      },
      review: {
        title: "Awkward English, and the ad review stalls",
        desc: "Machine-translated copy makes buyers doubt your professionalism, and a page without a privacy policy or business details is exactly what Google and Meta reviewers flag.",
      },
    },
  },
  build: {
    kicker: "// what you get",
    title: "A page whose only job is taking quote requests",
    desc: "Pick a B2B template, brief it in your own words, review the AI draft, publish.",
    items: {
      brief: {
        title: "Brief in your language, publish in English",
        desc: "Write your factory, products, minimums, lead times and certifications in whatever language you think in. AI drafts the whole page in English from the template — no invented case studies or numbers; where real material is needed, it leaves you a placeholder to fill.",
      },
      form: {
        title: "A quote form that asks for what you need to price",
        desc: "The form prompts buyers for product, quantity and destination market, so your first reply can carry a quote direction. Each request arrives with its source page and ad source; get it by email or export it, and on Pro push it to your CRM by Webhook.",
      },
      capability: {
        title: "Capability before company history",
        desc: "The templates open with production capacity, inspection stages, export documentation and an NDA-first stance — what procurement checks first when shortlisting suppliers.",
      },
      compliance: {
        title: "The policy pages reviewers look for, from day one",
        desc: "Privacy policy and terms publish as real subpages, business details sit in the footer, and the consent bar only appears where it's required.",
      },
    },
  },
  measurement: {
    kicker: "// how it's counted",
    title: "Quote requests and clicks are different numbers",
    desc: "Worth knowing before you build a report on them.",
    points: [
      "A form submission is a lead: it arrives with contact details, the enquiry, the page and the traffic source, ready to follow up.",
      "WhatsApp and phone taps are counted as clicks, not leads — the conversation happens on your own phone, and no platform can see whether the buyer actually wrote.",
      "Both are attributed to the same campaigns and sources, so pages compare fairly. Just don't add the clicks to your quote-request count.",
    ],
  },
  templates: {
    kicker: "// where to start",
    title: "{rfqTemplates} B2B templates with the quote form built in",
    desc: "OEM manufacturing, industrial equipment, custom packaging and freight forwarding. Each is written around how buyers in that trade actually ask for a quote, with the RFQ path above the fold and WhatsApp available as a secondary channel.",
    cta: "Browse B2B templates",
  },
  guide: {
    title: "Designing the RFQ itself?",
    desc: "Our long-form guide covers the fields that decide whether you can quote straight away, why your minimum order belongs on the page and your price doesn't, and what makes a supplier look credible.",
    cta: "Read the B2B RFQ guide",
  },
  finalCta: {
    title: "One page that catches every request for quote",
    desc: "Start from a B2B template, brief it in your own words, and have an English RFQ page in minutes. Every signup gets 14 days of full Pro, no card required — and the free plan publishes your first page on a platform address.",
    ctaPrimary: "Start free",
    ctaSecondary: "See pricing",
  },
};
