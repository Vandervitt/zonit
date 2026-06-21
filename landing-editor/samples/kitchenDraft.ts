// landing-editor/samples/kitchenDraft.ts
//
// 家居 / 厨房小工具「厨房好物 & 用法咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费选品 / 用法与食谱咨询，无任何下单 / 结账 / 订阅语义。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Cucina%2C%20I%27d%20like%20free%20kitchen%20gear%20advice";

export const kitchenDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1556910103-1c02745aae4d", 1600),
      alt: "Bright modern kitchen with tools",
    },
    badge: { emoji: "🍳", text: "Cook smarter, not harder" },
    title: "The right kitchen tools for the way you cook",
    subtitle:
      "Tell us what you cook and the space you have. We send a free gear guide over WhatsApp — durable, genuinely useful tools, plus recipes to use them.",
    cta: { text: "Get my free gear guide", link: WHATSAPP },
    secondaryCta: { text: "See it in action", link: "https://youtube.com/@cucina.kitchen" },
    endorsementText: "Trusted by 105,000+ home cooks worldwide",
    showcase: {
      type: "image",
      src: img("photo-1590794056226-79ef3a8147e1"),
      alt: "Kitchen utensils set",
    },
  },

  sections: [
    {
      type: "features",
      data: {
        title: "Why Cucina picks work",
        subtitle: "Useful, durable, and matched to your cooking.",
        items: [
          {
            icon: "🎯",
            title: "Matched to how you cook",
            description:
              "Everyday meals, baking, or meal-prep — we recommend tools you'll actually reach for.",
          },
          {
            icon: "🪵",
            title: "Built to last",
            description:
              "Durable materials over gimmicks — gear that survives daily use, not a drawer of clutter.",
          },
          {
            icon: "📏",
            title: "Right-sized for your space",
            description:
              "Compact, multi-use picks for small kitchens so you store less and do more.",
          },
          {
            icon: "💬",
            title: "Recipes & WhatsApp help",
            description:
              "We share recipes and tips to get the most from each tool — free, anytime.",
          },
        ],
      },
    },

    {
      type: "products",
      data: {
        title: "Tools our cooks love",
        subtitle: "A few multi-use favorites.",
        items: [
          {
            name: "All-Rounder Chef's Knife",
            description: "One balanced blade that handles 90% of daily prep with ease.",
            backgroundImage: { src: img("photo-1593618998160-e34014e67546", 800), alt: "Chef's knife" },
          },
          {
            name: "Nesting Prep Set",
            description: "Bowls, measures, and a colander that stack into one small footprint.",
            backgroundImage: { src: img("photo-1556909211-36987daf7b4d", 800), alt: "Prep bowls" },
          },
          {
            name: "Cast-Iron Skillet",
            description: "Sear, bake, and roast in one durable, naturally non-stick pan.",
            backgroundImage: { src: img("photo-1620812097331-cd2b4c1a4a5e", 800), alt: "Cast iron skillet" },
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
            name: "Daniela",
            location: "Mexico",
            channel: "WhatsApp",
            avatar: { src: img("photo-1544005313-94ddf0286df2", 200), alt: "Daniela" },
            content: {
              text: "They steered me away from gadgets I'd never use and toward three tools I now cook with daily.",
            },
          },
          {
            name: "Paul",
            location: "France",
            channel: "Trustpilot",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Paul" },
            content: {
              text: "Perfect picks for my tiny apartment kitchen. The recipes they sent sealed the deal.",
            },
          },
          {
            name: "Aiko",
            location: "Japan",
            channel: "Instagram",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Aiko" },
            content: {
              text: "Honest, durable recommendations with zero pressure to buy. My knife is a joy to use.",
            },
          },
        ],
      },
    },

    {
      type: "stats",
      data: {
        title: "Why people keep coming back",
        subtitle: "A few numbers behind our gear guides.",
        items: [
          { icon: "🍳", value: "105,000+", label: "Gear guides created" },
          { icon: "🌍", value: "40+", label: "Countries served" },
          { icon: "⭐", value: "4.9/5", label: "Average guide rating" },
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
            question: "Is the gear guide really free?",
            answer: "Yes. Your guide, recipes, and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "Can you recommend for a small kitchen?",
            answer: "Absolutely. We specialize in compact, multi-use tools for limited space.",
          },
          {
            question: "Do I have to buy anything?",
            answer: "No. Our guidance is independent — purchasing is entirely up to you.",
          },
          {
            question: "Can you suggest budget-friendly options?",
            answer: "Yes. We match durable picks at every budget and flag the best value.",
          },
        ],
      },
    },
  ],

  footer: {
    brandName: "Cucina",
    copyrightYear: "2026",
    contactEmail: "hello@cucina-kitchen.com",
    privacyPolicy:
      "We use the cooking details you share only to provide your gear guide. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Cucina provides kitchen-gear guidance for informational purposes only. Always follow manufacturer care and safety instructions for each product.",
  },

  floatingButton: {
    text: "🍳 Free gear guide",
    link: WHATSAPP,
  },
};
