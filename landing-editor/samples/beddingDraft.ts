// landing-editor/samples/beddingDraft.ts
//
// 家居 / 床品家纺「睡眠 & 选品咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费选品 / 睡眠与面料咨询，无任何下单 / 结账 / 订阅语义。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Dwell%2C%20I%27d%20like%20free%20bedding%20advice";

export const beddingDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1522771739844-6a9f6d5f14af", 1600),
      alt: "Cozy made bed with soft linens",
    },
    badge: { emoji: "🛏️", text: "Better sleep starts with better bedding" },
    title: "Bedding matched to how you sleep",
    subtitle:
      "Tell us your climate, sleep style, and any sensitivities. We send a free recommendation over WhatsApp — the right fabric, weight, and weave for cooler, comfier nights.",
    cta: { text: "Get my free bedding advice", link: WHATSAPP },
    secondaryCta: { text: "Feel the fabrics", link: "https://instagram.com/dwell.home" },
    endorsementText: "Trusted by 88,000+ better sleepers worldwide",
    showcase: {
      type: "image",
      src: img("photo-1505693416388-ac5ce068fe85"),
      alt: "Folded bed linens",
    },
  },

  sections: [
    {
      type: "features",
      data: {
        title: "Why Dwell picks work",
        subtitle: "Comfort matched to your sleep, not just thread counts.",
        items: [
          {
            icon: "🌡️",
            title: "Temperature-matched",
            description:
              "Hot sleeper or always cold — we match breathable or cozy fabrics to your climate.",
          },
          {
            icon: "🧵",
            title: "Fabric that fits you",
            description:
              "Cotton, linen, bamboo, or sateen — we explain the real differences for your skin and sleep.",
          },
          {
            icon: "🌱",
            title: "Sensitive-skin friendly",
            description:
              "OEKO-TEX and hypoallergenic options for sensitive skin and allergies.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp help",
            description:
              "Tell us how you slept and we'll fine-tune the recommendation — free.",
          },
        ],
      },
    },

    {
      type: "products",
      data: {
        title: "Picks our team sleeps on",
        subtitle: "A few favorites by sleep style.",
        items: [
          {
            name: "Cooling Linen Set",
            description: "Breathable, temperature-regulating linen for hot sleepers and summers.",
            backgroundImage: { src: img("photo-1584100936595-c0654b55a2e2", 800), alt: "Linen bedding" },
          },
          {
            name: "Crisp Percale Cotton",
            description: "Light, matte, and cool — that fresh hotel-bed feel.",
            backgroundImage: { src: img("photo-1616627561839-074385245ff6", 800), alt: "Cotton bedding" },
          },
          {
            name: "Cozy Brushed Set",
            description: "Soft, warm, and snug for cold rooms and winter nights.",
            backgroundImage: { src: img("photo-1631049552240-59c37f38802b", 800), alt: "Warm bedding" },
          },
        ],
      },
    },

    {
      type: "reviews",
      data: {
        title: "What our community says",
        description: "Real messages from people we've helped.",
        items: [
          {
            name: "Rebecca",
            location: "United States",
            channel: "WhatsApp",
            avatar: { src: img("photo-1544005313-94ddf0286df2", 200), alt: "Rebecca" },
            content: {
              text: "As a hot sleeper, the linen they matched changed my nights. No more waking up overheated.",
            },
          },
          {
            name: "Henrik",
            location: "Sweden",
            channel: "Trustpilot",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Henrik" },
            content: {
              text: "They explained fabrics instead of pushing the priciest set. Honest and genuinely helpful.",
            },
          },
          {
            name: "Mariam",
            location: "United Arab Emirates",
            channel: "Instagram",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Mariam" },
            content: {
              text: "Found a hypoallergenic set that calmed my sensitive skin. Zero pressure to buy.",
            },
          },
        ],
      },
    },

    {
      type: "stats",
      data: {
        title: "Why people keep coming back",
        subtitle: "A few numbers behind our recommendations.",
        items: [
          { icon: "🛏️", value: "88,000+", label: "Sleepers matched" },
          { icon: "🌍", value: "37+", label: "Countries served" },
          { icon: "⭐", value: "4.9/5", label: "Average advice rating" },
          { icon: "⏱️", value: "<10 min", label: "Avg. WhatsApp reply" },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Frequently asked questions" },
        items: [
          {
            question: "Is the bedding advice really free?",
            answer: "Yes. Your recommendation and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "Can you help hot sleepers?",
            answer: "Absolutely. We match breathable, temperature-regulating fabrics to keep you cool.",
          },
          {
            question: "Do you have hypoallergenic options?",
            answer: "Yes. We recommend OEKO-TEX certified and hypoallergenic fabrics for sensitive skin.",
          },
          {
            question: "Do I have to buy anything?",
            answer: "No. Our guidance is independent — purchasing is entirely up to you.",
          },
        ],
      },
    },
  ],

  footer: {
    brandName: "Dwell",
    copyrightYear: "2026",
    contactEmail: "hello@dwell-home.com",
    privacyPolicy:
      "We use the sleep and preference details you share only to provide your recommendation. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Dwell provides bedding and fabric guidance for informational purposes only. Comfort is subjective and varies by sleeper.",
  },

  floatingButton: {
    text: "🛏️ Free bedding advice",
    link: WHATSAPP,
  },
};
