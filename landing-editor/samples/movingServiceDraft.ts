// landing-editor/samples/movingServiceDraft.ts
//
// 本地生活服务（搬家 / 搬迁）「免费上门估价」营销落地页样例（海外 leadgen，非交易）。
// 主转化走 WhatsApp（搬家决策快、常在手机上问档期），页内留资表单作第二落点收
// 起止地址、房型与搬迁日期。
// "quote / estimate" 仅为留资话术：页面不出现价目表、在线支付、预付定金。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15554417720 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;


/** 页内留资表单锚点：第二落点。 */

export const movingServiceDraft: LandingPageDraft = {
  contact: {
    primary: "whatsapp",
    whatsapp: "+15554417720",
    email: "moves@cartwell-movers.example",
  },
  hero: {
    backgroundImage: {
      src: img("photo-1600518464441-9154a4dea21b", 1600),
      alt: "Packed moving boxes in an empty room",
    },
    badge: { emoji: "📦", text: "Insured local & long-distance moves" },
    title: "A moving quote that doesn't change on the day",
    subtitle:
      "Send a short video walk-through of your place. You'll get a fixed written quote, a crew size, and an arrival window — not an hourly rate that drifts.",
    cta: { text: "Get my moving quote", target: { kind: "primary", prefill: "Hi Cartwell, I'd like a moving quote" } },
    secondaryCta: { text: "Send move details instead", target: { kind: "channel", channel: "form" } },
    endorsementText: "22,000+ moves completed · Goods-in-transit insured",
    showcase: {
      type: "image",
      src: img("photo-1530103862676-de8c9debad1d"),
      alt: "Movers carrying boxes to a van",
    },
  },

  sections: [
    {
      type: "stats",
      data: {
        title: "Why people book us twice",
        subtitle: "From moves completed in the last twelve months.",
        items: [
          { icon: "🚚", value: "22,000+", label: "Moves completed" },
          { icon: "⏱️", value: "94%", label: "Crews arriving in the agreed window" },
          { icon: "📦", value: "0.3%", label: "Moves with a damage claim" },
          { icon: "⭐", value: "4.8/5", label: "Average rating" },
        ],
      },
    },

    {
      type: "features",
      data: {
        title: "What's included as standard",
        subtitle: "The things that usually appear as extras elsewhere.",
        items: [
          {
            icon: "🧾",
            title: "Fixed written quote",
            description:
              "Quoted from your video walk-through and held on the day, so a slow lift doesn't inflate the bill.",
          },
          {
            icon: "🛡️",
            title: "Goods-in-transit cover",
            description:
              "Your belongings are insured while they're in our vans, with the cover level stated in the quote.",
          },
          {
            icon: "🪑",
            title: "Furniture dismantled and rebuilt",
            description:
              "Beds, wardrobes, and desks taken apart and reassembled in the right rooms — not left in the hall.",
          },
          {
            icon: "📦",
            title: "Packing materials supplied",
            description:
              "Boxes, wrap, and protective covers delivered before the move if you're packing yourself.",
          },
        ],
      },
    },

    {
      type: "process",
      data: {
        title: "How the quote works",
        subtitle: "No one needs to visit unless you'd rather they did.",
        steps: [
          {
            title: "Send a video walk-through",
            description: "Walk through each room on your phone. That's enough for us to size the van and crew.",
            image: { src: img("photo-1554224155-6726b3ff858f", 800), alt: "Person filming a room on a phone" },
          },
          {
            title: "Fixed quote and date",
            description: "A written quote with crew size, van size, and an arrival window for your chosen date.",
          },
          {
            title: "Move day",
            description: "The crew loads, transports, and reassembles. You check each room before they leave.",
          },
        ],
      },
    },

    {
      type: "trust",
      data: {
        backgroundImage: {
          src: img("photo-1558618666-fcd25c85cd64", 1400),
          alt: "Moving van loaded with furniture",
        },
        badges: [
          { icon: "🛡️", title: "Fully insured", subtitle: "Goods-in-transit and public liability cover" },
          { icon: "🪪", title: "Employed crews", subtitle: "Trained staff, not day-hire labour" },
          { icon: "🧾", title: "Quote held on the day", subtitle: "No hourly creep once loading starts" },
          { icon: "📞", title: "One contact throughout", subtitle: "The same coordinator from quote to delivery" },
        ],
      },
    },

    {
      type: "reviews",
      data: {
        title: "What customers say",
        description: "Reviews from recent moves.",
        items: [
          {
            name: "Hannah",
            location: "Leeds",
            channel: "Google",
            avatar: { src: img("photo-1494790108377-be9c29b29330", 200), alt: "Hannah" },
            content: {
              text: "The lift was out of order on the day and the price didn't move. Previous company would have charged me for every flight.",
            },
          },
          {
            name: "Omar",
            location: "Sheffield",
            channel: "WhatsApp",
            avatar: { src: img("photo-1633332755192-727a05c4013d", 200), alt: "Omar" },
            content: {
              text: "Quoted from a two-minute video I filmed at lunch. Van turned up the right size, crew was the right size.",
            },
          },
          {
            name: "Beata",
            location: "Nottingham",
            channel: "Google",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Beata" },
            content: {
              text: "They rebuilt both wardrobes in the right rooms. I'd braced myself for a hallway full of flat-pack.",
            },
          },
        ],
      },
    },

    {
      type: "guarantee",
      data: {
        title: "Booking with confidence",
        description: "What we commit to on every move.",
        items: [
          { icon: "🙅", title: "No deposit to hold a date", subtitle: "Your slot is confirmed without paying up front." },
          { icon: "🧾", title: "The quote is the quote", subtitle: "Fixed on the day unless you add items yourself." },
          { icon: "📅", title: "Free date changes", subtitle: "Completion delayed? Move the date with a message." },
          { icon: "🔧", title: "We put damage right", subtitle: "Anything damaged in transit is repaired or claimed for." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Common questions" },
        items: [
          {
            question: "Can you quote without visiting?",
            answer:
              "Yes — a phone video of each room is usually enough. If the move is unusually large or access is complicated, we'll ask to visit rather than guess.",
          },
          {
            question: "What if my completion date slips?",
            answer:
              "It happens constantly with property chains. Message us and we'll move the date to the next available slot at no charge.",
          },
          {
            question: "Do you pack for me?",
            answer:
              "We can pack everything, just the fragile items, or nothing at all if you'd rather do it yourself. Tell us which and it's reflected in the quote.",
          },
          {
            question: "Are my belongings insured?",
            answer:
              "Yes, goods-in-transit cover applies while items are with us, and the cover level is stated in your written quote.",
          },
        ],
      },
    },
  ],

  leadForm: {
    enabled: true,
    title: "Send your move details",
    description: "Prefer not to chat? Leave your details and a coordinator will come back with a quote and available dates.",
    submitText: "Request a quote",
    successMessage: "Thanks — a coordinator will be in touch with your quote and available dates.",
    fields: {
      name: { enabled: true, required: true, label: "Your name" },
      email: { enabled: false, required: false },
      phone: { enabled: true, required: true, label: "Phone number" },
      whatsapp: { enabled: true, required: false, label: "WhatsApp (optional)" },
      telegram: { enabled: false, required: false },
      message: {
        enabled: true,
        required: true,
        label: "Moving from, moving to, property size, and preferred date",
      },
    },
  },

  footer: {
    brandName: "Cartwell Movers",
    copyrightYear: "2026",
    privacyPolicy:
      "We collect only the addresses, contact details, and property information needed to quote and schedule your move. Videos and photos you send are used solely for quoting, are never published, and are deleted once the move is complete.",
    termsOfService:
      "Quotes are based on the information, video, or photos you provide and are held on the day unless the inventory or access changes. Availability varies by date and area. Nothing on this page constitutes a confirmed booking until agreed with you directly.",
  },

  floatingButton: {
    text: "💬 Get a moving quote",
    target: { kind: "channel", channel: "whatsapp", prefill: "Hi Cartwell, I'd like a moving quote" },
  },
};
