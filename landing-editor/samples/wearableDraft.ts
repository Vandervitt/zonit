// landing-editor/samples/wearableDraft.ts
//
// 3C 配件 / 智能穿戴「选购 & 适配咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费选款 / 适配与健康数据功能咨询，无任何下单 / 结账 / 订阅语义。
// 健康/数据相关表述均配 disclaimer，避免医疗承诺。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Pulse%2C%20I%27d%20like%20a%20free%20smartwatch%20match";

export const wearableDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1523275335684-37898b6baf30", 1600),
      alt: "Smartwatch on a wrist",
    },
    badge: { emoji: "⌚", text: "Wearables matched to your goals" },
    title: "The right smartwatch for how you live",
    subtitle:
      "Tell us your phone, your goals, and your budget. Our advisors send a free match over WhatsApp — battery, fitness tracking, and compatibility sorted.",
    cta: { text: "Get my free watch match", link: WHATSAPP },
    secondaryCta: { text: "Compare models", link: "https://youtube.com/@pulse.wear" },
    endorsementText: "Trusted by 140,000+ active users worldwide",
    showcase: {
      type: "image",
      src: img("photo-1434493789847-2f02dc6ca35d"),
      alt: "Fitness tracker product shot",
    },
  },

  sections: [
    {
      type: "features",
      data: {
        title: "Why Pulse matches better",
        subtitle: "Honest, goal-first wearable guidance.",
        items: [
          {
            icon: "📲",
            title: "Phone compatibility checked",
            description:
              "iOS or Android — we confirm full feature support before recommending anything.",
          },
          {
            icon: "🏃",
            title: "Matched to your goals",
            description:
              "Running, sleep, recovery, or everyday — we match the tracking that matters to you.",
          },
          {
            icon: "🔋",
            title: "Battery for your routine",
            description:
              "Daily-charge or multi-day — we match battery life to how you'll actually use it.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp help",
            description:
              "Setting it up or syncing apps? Message us anytime and we'll guide you — free.",
          },
        ],
      },
    },

    {
      type: "stats",
      data: {
        title: "Why people trust us",
        subtitle: "A few numbers behind our matches.",
        items: [
          { icon: "⌚", value: "140,000+", label: "Wearables matched" },
          { icon: "🌍", value: "44+", label: "Countries served" },
          { icon: "⭐", value: "4.8/5", label: "Average match rating" },
          { icon: "⏱️", value: "<10 min", label: "Avg. WhatsApp reply" },
        ],
      },
    },

    {
      type: "products",
      data: {
        title: "Popular picks by goal",
        subtitle: "A few favorites across lifestyles.",
        items: [
          {
            name: "Runner's GPS Watch",
            description: "Accurate GPS, training metrics, and long battery for endurance.",
            backgroundImage: { src: img("photo-1508685096489-7aacd43bd3b1", 800), alt: "GPS sport watch" },
          },
          {
            name: "Everyday Smartwatch",
            description: "Notifications, payments, and solid all-round health tracking.",
            backgroundImage: { src: img("photo-1546868871-7041f2a55e12", 800), alt: "Smartwatch" },
          },
          {
            name: "Sleep & Recovery Band",
            description: "Lightweight wear with detailed sleep and recovery insights.",
            backgroundImage: { src: img("photo-1575311373937-040b8e1fd5b6", 800), alt: "Fitness band" },
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
            name: "Carlos",
            location: "Spain",
            channel: "WhatsApp",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Carlos" },
            content: {
              text: "They checked it works fully with my Android phone first. GPS is spot on for my runs.",
            },
          },
          {
            name: "Hana",
            location: "South Korea",
            channel: "Trustpilot",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Hana" },
            content: {
              text: "Matched a multi-day battery so I can track sleep without charging nightly. No upsell, just useful.",
            },
          },
          {
            name: "Tom",
            location: "United Kingdom",
            channel: "Instagram",
            avatar: { src: img("photo-1500648767791-00dcc994a43e", 200), alt: "Tom" },
            content: {
              text: "Honest guidance on which features I'd actually use. Helped me skip paying for ones I wouldn't.",
            },
          },
        ],
      },
    },

    {
      type: "guarantee",
      data: {
        title: "Guidance you can trust",
        description: "Honest help, before and after.",
        items: [
          { icon: "🔒", title: "Privacy first", subtitle: "Your details stay confidential and are never sold." },
          { icon: "📲", title: "Compatibility verified", subtitle: "We confirm full feature support with your phone first." },
          { icon: "🩺", title: "Not a medical device", subtitle: "Wearable health metrics are for wellness only, not medical diagnosis." },
          { icon: "🤝", title: "Free follow-ups", subtitle: "Setup and syncing help anytime, at no cost." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Frequently asked questions" },
        items: [
          {
            question: "Is the watch match really free?",
            answer: "Yes. Your match and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "Will it work with my phone?",
            answer: "We confirm full compatibility with your iOS or Android phone before recommending.",
          },
          {
            question: "Are the health features medically accurate?",
            answer: "Wearable metrics are for general wellness and fitness only — they are not medical devices or a substitute for professional advice.",
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
    brandName: "Pulse",
    copyrightYear: "2026",
    contactEmail: "help@pulse-wear.com",
    privacyPolicy:
      "We use the details you share only to provide your wearable match. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Pulse provides wearable-product matching guidance for informational purposes only. Health and fitness metrics from wearables are not medical advice.",
  },

  floatingButton: {
    text: "⌚ Free watch match",
    link: WHATSAPP,
  },
};
