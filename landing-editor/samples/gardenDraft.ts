// landing-editor/samples/gardenDraft.ts
//
// 家居 / 园艺户外「庭院规划 & 植栽咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费庭院规划 / 植栽与工具咨询，无任何下单 / 结账 / 订阅语义。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Verda%2C%20I%27d%20like%20a%20free%20garden%20plan";

export const gardenDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1466692476868-aef1dfb1e735", 1600),
      alt: "Lush home garden",
    },
    badge: { emoji: "🌿", text: "A thriving garden, planned for you" },
    title: "Grow a garden that actually thrives",
    subtitle:
      "Tell us your space, climate, and how much time you have. We send a free garden plan over WhatsApp — the right plants, tools, and a season-by-season schedule.",
    cta: { text: "Get my free garden plan", link: WHATSAPP },
    secondaryCta: { text: "See garden makeovers", link: "https://instagram.com/verda.garden" },
    endorsementText: "Trusted by 75,000+ home gardeners worldwide",
    showcase: {
      type: "image",
      src: img("photo-1416879595882-3373a0480b5b"),
      alt: "Gardening tools and plants",
    },
  },

  sections: [
    {
      type: "features",
      data: {
        title: "Why Verda plans work",
        subtitle: "Matched to your climate, space, and time.",
        items: [
          {
            icon: "🌍",
            title: "Climate-matched plants",
            description:
              "We recommend plants suited to your zone and sunlight so they actually thrive.",
          },
          {
            icon: "⏱️",
            title: "Built for your time",
            description:
              "Low-maintenance or hands-on — a plan that fits the hours you really have.",
          },
          {
            icon: "🪴",
            title: "Space-smart layouts",
            description:
              "Balcony, raised bed, or backyard — layouts that make the most of your space.",
          },
          {
            icon: "💬",
            title: "Season-long WhatsApp help",
            description:
              "Send photos of struggling plants and we'll help you fix them — free.",
          },
        ],
      },
    },

    {
      type: "process",
      data: {
        title: "How your free plan works",
        subtitle: "Four steps, all over WhatsApp.",
        steps: [
          {
            title: "Say hi on WhatsApp",
            description: "Tap the button and tell us your location and the space you have.",
            image: { src: img("photo-1591857177580-dc82b9ac4e1e", 800), alt: "Garden planning" },
          },
          {
            title: "Quick garden check-in",
            description: "Share sunlight, soil, and how much time you want to spend.",
          },
          {
            title: "Get your garden plan",
            description: "We send a plant list, layout, tools, and a seasonal schedule.",
          },
          {
            title: "Grow with support",
            description: "Message us anytime your plants need help and we'll troubleshoot — free.",
          },
        ],
      },
    },

    {
      type: "reviews",
      data: {
        title: "What our gardeners say",
        description: "Real messages from people we've helped.",
        items: [
          {
            name: "Sandra",
            location: "United States",
            channel: "WhatsApp",
            avatar: { src: img("photo-1544005313-94ddf0286df2", 200), alt: "Sandra" },
            content: {
              text: "First year my tomatoes didn't die. They matched everything to my hot climate and tiny balcony.",
            },
          },
          {
            name: "Liam",
            location: "Ireland",
            channel: "Trustpilot",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Liam" },
            content: {
              text: "Honest, low-maintenance plan for a busy dad. They talked me out of plants I'd have killed.",
            },
          },
          {
            name: "Yuki",
            location: "Japan",
            channel: "Instagram",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Yuki" },
            content: {
              text: "The seasonal schedule keeps me on track. They even diagnosed a pest from my photo.",
            },
          },
        ],
      },
    },

    {
      type: "stats",
      data: {
        title: "Why people keep coming back",
        subtitle: "A few numbers behind our garden plans.",
        items: [
          { icon: "🌿", value: "75,000+", label: "Gardens planned" },
          { icon: "🌍", value: "34+", label: "Countries served" },
          { icon: "⭐", value: "4.9/5", label: "Average plan rating" },
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
            question: "Is the garden plan really free?",
            answer: "Yes. Your plan and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "Can you help complete beginners?",
            answer: "Absolutely. We tailor easy, hard-to-kill plans for first-time gardeners.",
          },
          {
            question: "Do I have to buy specific products?",
            answer: "No. We suggest options across budgets and what to reuse — purchasing is entirely up to you.",
          },
          {
            question: "Will it suit my balcony or small yard?",
            answer: "Yes. We plan for balconies, raised beds, and small yards as easily as large gardens.",
          },
        ],
      },
    },
  ],

  footer: {
    brandName: "Verda",
    copyrightYear: "2026",
    contactEmail: "hello@verda-garden.com",
    privacyPolicy:
      "We use the location and garden details you share only to provide your plan. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Verda provides gardening guidance for informational purposes only. Plant outcomes depend on climate, soil, and care.",
  },

  floatingButton: {
    text: "🌿 Free garden plan",
    link: WHATSAPP,
  },
};
