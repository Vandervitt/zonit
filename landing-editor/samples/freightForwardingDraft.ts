// landing-editor/samples/freightForwardingDraft.ts
//
// 国际物流 / 货代「运价咨询」营销落地页样例（海外 leadgen，非交易）。
// 主转化走 WhatsApp（货主常在手机上问船期、舱位，即时性强），页内留资表单
// 作为第二落点收结构化货量信息。
// 页面不出现在线下单、付运费、支付链接：运价与舱位一律经业务确认，
// "quote / rate" 仅为留资话术。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15557654321 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15557654321?text=Hi%20Portway%2C%20I%27d%20like%20a%20freight%20quote";

/** 页内留资表单锚点：第二落点。 */
const FORM = "#lead-form";

export const freightForwardingDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1494412574643-ff11b0a5c1c3", 1600),
      alt: "Container ship being loaded at a port terminal",
    },
    badge: { emoji: "🚢", text: "Licensed freight forwarder" },
    title: "Know your landed cost before you book",
    subtitle:
      "Message us with your route, volume, and cargo type. You get current rates, realistic transit times, and the customs documents you'll need — in one reply.",
    cta: { text: "Get a freight quote", link: WHATSAPP },
    secondaryCta: { text: "Send cargo details instead", link: FORM },
    endorsementText: "38,000+ shipments handled · Licensed and bonded",
    showcase: {
      type: "image",
      src: img("photo-1578575437130-527eed3abbec"),
      alt: "Warehouse staff preparing pallets for export",
    },
  },

  sections: [
    {
      type: "stats",
      data: {
        title: "What shippers rely on us for",
        subtitle: "Performance over the last twelve months.",
        items: [
          { icon: "📦", value: "38,000+", label: "Shipments handled" },
          { icon: "🌍", value: "60+", label: "Origin & destination ports" },
          { icon: "⏱️", value: "<2 h", label: "Avg. quote response" },
          { icon: "📄", value: "99.1%", label: "Customs clearance first-pass rate" },
        ],
      },
    },

    {
      type: "features",
      data: {
        title: "Why shippers stay with us",
        subtitle: "Fewer surprises between booking and delivery.",
        items: [
          {
            icon: "🧾",
            title: "All-in landed cost",
            description:
              "Freight, local charges, duties, and handling quoted together — not revealed one invoice at a time.",
          },
          {
            icon: "📍",
            title: "Tracking that means something",
            description:
              "Milestone updates from pickup to delivery, with a named coordinator when something slips.",
          },
          {
            icon: "📑",
            title: "Customs paperwork prepared",
            description:
              "HS classification, commercial invoice, and certificates checked before the container moves.",
          },
          {
            icon: "🛡️",
            title: "Cargo insurance arranged",
            description:
              "Optional all-risk cover organised alongside the booking, with the terms explained in plain language.",
          },
        ],
      },
    },

    {
      type: "process",
      data: {
        title: "How quoting works",
        subtitle: "Three steps, usually inside two hours.",
        steps: [
          {
            title: "Send your cargo details",
            description: "Route, volume or container type, cargo description, and your target ready date.",
            image: { src: img("photo-1586528116311-ad8dd3c8310d", 800), alt: "Coordinator checking shipment documents" },
          },
          {
            title: "Rates and transit times",
            description: "Current options across carriers with realistic transit times, not best-case figures.",
          },
          {
            title: "Book and track",
            description: "We handle booking, documentation, and customs, and keep you posted at each milestone.",
          },
        ],
      },
    },

    {
      type: "trust",
      data: {
        backgroundImage: {
          src: img("photo-1517841905240-472988babdf9", 1400),
          alt: "Aerial view of a container terminal",
        },
        badges: [
          { icon: "🪪", title: "Licensed & bonded", subtitle: "Registered forwarder with customs authority" },
          { icon: "🤝", title: "Direct carrier contracts", subtitle: "Allocation secured, not resold at the last minute" },
          { icon: "🛡️", title: "Insurance arranged", subtitle: "All-risk cover available on every booking" },
          { icon: "👤", title: "Named coordinator", subtitle: "One person owns your shipment end to end" },
        ],
      },
    },

    {
      type: "reviews",
      data: {
        title: "What shippers say",
        description: "Feedback from exporters and importers we move cargo for.",
        items: [
          {
            name: "Wei L.",
            location: "China",
            channel: "WhatsApp",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Wei L." },
            content: {
              text: "They flagged a classification error in our invoice before the container sailed. That would have been a two-week hold.",
            },
          },
          {
            name: "Fatima Z.",
            location: "Morocco",
            channel: "Email",
            avatar: { src: img("photo-1580489944761-15a19d654956", 200), alt: "Fatima Z." },
            content: {
              text: "The quote included every local charge. Final invoice matched it to the cent — that never used to happen.",
            },
          },
          {
            name: "Peter K.",
            location: "Germany",
            channel: "Phone",
            avatar: { src: img("photo-1519085360753-af0119f7cbe7", 200), alt: "Peter K." },
            content: {
              text: "When a vessel got delayed they called us before we noticed. Rebooked on the next sailing the same day.",
            },
          },
        ],
      },
    },

    {
      type: "guarantee",
      data: {
        title: "What you can hold us to",
        description: "Commitments on every booking.",
        items: [
          { icon: "🧾", title: "No hidden local charges", subtitle: "Everything quoted up front or it isn't billed." },
          { icon: "📞", title: "We call you first", subtitle: "Delays and rollovers are reported, not discovered." },
          { icon: "📑", title: "Documents checked twice", subtitle: "Paperwork reviewed before cargo moves, not at the border." },
          { icon: "🔍", title: "Quote breakdown on request", subtitle: "Every line item explained, no black-box pricing." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Common questions" },
        items: [
          {
            question: "What do you need to quote?",
            answer:
              "Origin and destination, cargo description, weight and volume or container type, and your target ready date. Rough figures are fine to start.",
          },
          {
            question: "Do you handle customs clearance?",
            answer:
              "Yes, at both ends where we hold the relevant licences. We prepare and check documentation before the cargo moves.",
          },
          {
            question: "How long are quoted rates valid?",
            answer:
              "Ocean rates move with the market, so validity is stated on each quote. We'll tell you plainly if a rate is likely to change.",
          },
          {
            question: "Can you arrange cargo insurance?",
            answer:
              "Yes. All-risk cover can be arranged with the booking, and we'll explain what is and isn't covered before you decide.",
          },
        ],
      },
    },
  ],

  leadForm: {
    enabled: true,
    title: "Send your cargo details",
    description: "Prefer not to chat? Leave your shipment details and a coordinator will come back with rates.",
    submitText: "Request rates",
    successMessage: "Thanks — a coordinator will send you rates and transit times shortly.",
    fields: {
      name: { enabled: true, required: true, label: "Your name" },
      email: { enabled: true, required: true, label: "Work email" },
      phone: { enabled: false, required: false },
      whatsapp: { enabled: true, required: false, label: "WhatsApp (optional)" },
      telegram: { enabled: false, required: false },
      message: {
        enabled: true,
        required: true,
        label: "Origin, destination, cargo type, and volume or container size",
      },
    },
  },

  footer: {
    brandName: "Portway Freight",
    copyrightYear: "2026",
    contactEmail: "rates@portway-freight.example",
    privacyPolicy:
      "We collect only the shipment and contact details you provide in order to quote and arrange your freight. Commercial details are treated as confidential, are shared only with the carriers and authorities required to move your cargo, and can be deleted on request.",
    termsOfService:
      "Rates, transit times, and space availability are indicative, move with the market, and are confirmed in writing at booking. Customs outcomes and vessel schedules are determined by authorities and carriers and cannot be guaranteed.",
  },

  floatingButton: {
    text: "💬 Get a freight quote",
    link: WHATSAPP,
  },
};
