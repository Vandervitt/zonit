// landing-editor/samples/homeServicesDraft.ts
//
// 本地生活服务（保洁 / 深度清洁）「免费上门报价」营销落地页样例（海外 leadgen，非交易）。
// 主转化走 WhatsApp 即时咨询，悬浮按钮指向页内留资表单——本地服务访客多在移动端，
// 两个落点覆盖"现在就想聊"与"先留需求等回电"两种意图。
// "quote / estimate" 仅为留资话术：页面不出现价目表、在线支付、预付定金等交易语义。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15553219876 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

/** Unsplash 图片地址助手：统一裁剪与画质参数。 */
const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;


/** 页内留资表单锚点：第二落点。 */

export const homeServicesDraft: LandingPageDraft = {
  contact: {
    primary: "whatsapp",
    whatsapp: "+15553219876",
    email: "hello@brightline-home.example",
  },
  hero: {
    backgroundImage: {
      src: img("photo-1581578731548-c64695cc6952", 1600),
      alt: "Bright, freshly cleaned living room",
    },
    badge: { emoji: "✨", text: "Vetted, insured cleaning teams" },
    title: "Come home to a place that's actually clean",
    subtitle:
      "Message us on WhatsApp with a couple of photos and your postcode. You'll get a clear quote and an available slot — usually within the hour.",
    cta: { text: "Get my free quote", target: { kind: "primary", prefill: "Hi Brightline, I'd like a free cleaning quote" } },
    secondaryCta: { text: "Request a callback instead", target: { kind: "channel", channel: "form" } },
    endorsementText: "18,000+ homes cleaned · Fully insured teams",
    showcase: {
      type: "image",
      src: img("photo-1527515637462-cff94eecc1ac"),
      alt: "Cleaner wiping down a kitchen surface",
    },
  },

  sections: [
    // 1. 数据展示
    {
      type: "stats",
      data: {
        title: "Why neighbours keep calling us back",
        subtitle: "A few numbers from the last twelve months.",
        items: [
          { icon: "🏠", value: "18,000+", label: "Homes cleaned" },
          { icon: "⭐", value: "4.9/5", label: "Average rating" },
          { icon: "🔁", value: "72%", label: "Customers who rebook" },
          { icon: "⏱️", value: "<1 h", label: "Avg. quote response" },
        ],
      },
    },

    // 2. 特性（core-value 组）
    {
      type: "features",
      data: {
        title: "What you get every visit",
        subtitle: "Same standards whether it's a one-off or a weekly slot.",
        items: [
          {
            icon: "🛡️",
            title: "Vetted and insured",
            description:
              "Every cleaner is background-checked, trained, and covered by our insurance before they enter your home.",
          },
          {
            icon: "📋",
            title: "A checklist you approve",
            description:
              "We agree what's included before the first visit, so nothing important gets skipped.",
          },
          {
            icon: "🌿",
            title: "Family-safe products",
            description:
              "Low-fragrance, pet- and child-friendly products as standard — tell us if you'd prefer something specific.",
          },
          {
            icon: "🔑",
            title: "Same team each time",
            description:
              "Regular bookings keep the same cleaner where possible, so you don't re-explain your home every week.",
          },
        ],
      },
    },

    // 3. 服务流程
    {
      type: "process",
      data: {
        title: "Booking takes about five minutes",
        subtitle: "No account to create, no deposit to leave.",
        steps: [
          {
            title: "Send photos and your postcode",
            description: "A couple of phone photos is enough for us to size the job accurately.",
            image: { src: img("photo-1600585154340-be6161a56a0c", 800), alt: "Living room ready for cleaning" },
          },
          {
            title: "Get your quote and a slot",
            description: "We reply with a clear quote and the next available times in your area.",
          },
          {
            title: "We clean, you check",
            description: "Walk through with the team at the end. Anything you're not happy with, we put right.",
          },
        ],
      },
    },

    // 4. 信任徽章
    {
      type: "trust",
      data: {
        backgroundImage: {
          src: img("photo-1585421514738-01798e348b17", 1400),
          alt: "Neatly organised cleaning supplies",
        },
        badges: [
          { icon: "🪪", title: "Background-checked staff", subtitle: "Identity and reference checks on every cleaner" },
          { icon: "🛡️", title: "Fully insured", subtitle: "Public liability cover on every visit" },
          { icon: "🕒", title: "Punctual or we tell you", subtitle: "Running late? You get a message, not silence" },
          { icon: "🌿", title: "Eco-conscious products", subtitle: "Effective without harsh chemical residue" },
        ],
      },
    },

    // 5. 客户评价
    {
      type: "reviews",
      data: {
        title: "What neighbours say",
        description: "Reviews from customers across the area.",
        items: [
          {
            name: "Ellie",
            location: "Manchester",
            channel: "Google",
            avatar: { src: img("photo-1494790108377-be9c29b29330", 200), alt: "Ellie" },
            content: {
              text: "Quoted in twenty minutes from two photos. The team arrived on time and the kitchen has never looked better.",
            },
          },
          {
            name: "Ahmed",
            location: "Birmingham",
            channel: "WhatsApp",
            avatar: { src: img("photo-1633332755192-727a05c4013d", 200), alt: "Ahmed" },
            content: {
              text: "Same cleaner every fortnight now. She knows the flat better than I do at this point.",
            },
          },
          {
            name: "Sofia",
            location: "Leeds",
            channel: "Google",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Sofia" },
            content: {
              text: "I flagged one room at the end and they redid it on the spot, no argument. That's why I stayed.",
            },
          },
        ],
      },
    },

    // 6. 保障（非交易：无预付 / 重做 / 透明报价）
    {
      type: "guarantee",
      data: {
        title: "Booking with confidence",
        description: "What we commit to on every job.",
        items: [
          { icon: "🙅", title: "No deposit to book", subtitle: "Confirm your slot without paying anything up front." },
          { icon: "🔁", title: "We'll put it right", subtitle: "Not happy with an area? Tell us and we'll redo it." },
          { icon: "🧾", title: "The quote is the quote", subtitle: "No surprise additions once the team arrives." },
          { icon: "📅", title: "Reschedule freely", subtitle: "Plans change — move your slot with a message." },
        ],
      },
    },

    // 7. 常见问题
    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Common questions" },
        items: [
          {
            question: "How do you quote from photos?",
            answer:
              "Photos tell us the size and condition of each room, which is what drives the time needed. If anything looks unclear, we'll ask before quoting.",
          },
          {
            question: "Do I need to be home during the clean?",
            answer:
              "Not at all. Many customers arrange key access or a smart lock code. Whatever you prefer is fine.",
          },
          {
            question: "What if I'm not happy with something?",
            answer:
              "Tell the team before they leave, or message us the same day. We'll come back and put it right.",
          },
          {
            question: "Which areas do you cover?",
            answer:
              "Send us your postcode on WhatsApp and we'll confirm availability and the next open slots straight away.",
          },
        ],
      },
    },
  ],

  // 第二落点：不便即时聊的访客留资
  leadForm: {
    enabled: true,
    title: "Prefer a callback?",
    description: "Leave your details and we'll get back to you with a quote and available slots.",
    submitText: "Request a callback",
    successMessage: "Thanks — we'll be in touch shortly with your quote.",
    fields: {
      name: { enabled: true, required: true, label: "Your name" },
      email: { enabled: false, required: false },
      phone: { enabled: true, required: true, label: "Phone number" },
      whatsapp: { enabled: true, required: false, label: "WhatsApp (optional)" },
      telegram: { enabled: false, required: false },
      message: {
        enabled: true,
        required: false,
        label: "Postcode, property size, and what you'd like cleaned",
      },
    },
  },

  footer: {
    brandName: "Brightline Home Services",
    copyrightYear: "2026",
    privacyPolicy:
      "We collect only the contact and property details you share in order to prepare your quote and arrange your visit. Photos of your home are used solely for quoting, are never published, and can be deleted on request.",
    termsOfService:
      "Quotes are based on the information and photos you provide and are confirmed once the team assesses the property. Availability varies by area and season. Nothing on this page constitutes a binding booking until confirmed with you directly.",
  },

  floatingButton: {
    text: "💬 Get a free quote",
    target: { kind: "channel", channel: "whatsapp", prefill: "Hi Brightline, I'd like a free cleaning quote" },
  },
};
