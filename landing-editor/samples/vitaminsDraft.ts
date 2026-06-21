// landing-editor/samples/vitaminsDraft.ts
//
// 保健品 / 膳食补充剂「营养咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费营养评估，无任何下单 / 结账 / 订阅语义。
// 高合规风险：功效相关表述均配 disclaimer，避免疾病预防/治疗承诺。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Vitae%2C%20I%27d%20like%20a%20free%20nutrition%20check";

export const vitaminsDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1577563908411-5077b6dc7624", 1600),
      alt: "Supplements and fresh ingredients",
    },
    badge: { emoji: "🌱", text: "Nutrition guidance, personalized" },
    title: "Supplements that fit your body — not the hype",
    subtitle:
      "Get a free, personalized nutrition check over WhatsApp. Our advisors help you cut through the noise and focus on what your routine actually needs.",
    cta: { text: "Get my free nutrition check", link: WHATSAPP },
    secondaryCta: { text: "How it works", link: "https://instagram.com/vitae.health" },
    endorsementText: "Trusted by 95,000+ people building healthier habits",
    showcase: {
      type: "image",
      src: img("photo-1550572017-edd951b55104"),
      alt: "Daily supplement routine",
    },
  },

  sections: [
    {
      type: "stats",
      data: {
        title: "A routine people stick with",
        subtitle: "A few numbers behind our advisors.",
        items: [
          { icon: "🌱", value: "95,000+", label: "Nutrition checks" },
          { icon: "🌍", value: "38+", label: "Countries served" },
          { icon: "⭐", value: "4.8/5", label: "Average advisor rating" },
          { icon: "⏱️", value: "<10 min", label: "Avg. WhatsApp reply" },
        ],
      },
    },

    {
      type: "features",
      data: {
        title: "Why Vitae is different",
        subtitle: "Honest, transparent, and built around you.",
        items: [
          {
            icon: "🧬",
            title: "Built around your routine",
            description:
              "We look at your diet, lifestyle, and goals — never a generic stack everyone gets.",
          },
          {
            icon: "🔬",
            title: "Full ingredient transparency",
            description:
              "Clear forms, dosages, and what the evidence does and doesn't support.",
          },
          {
            icon: "🧾",
            title: "No miracle claims",
            description:
              "We never promise supplements prevent, treat, or cure any condition.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp support",
            description:
              "Adjust as your goals change — just send us a message anytime, free.",
          },
        ],
      },
    },

    {
      type: "process",
      data: {
        title: "How your free check works",
        subtitle: "Four simple steps, all over WhatsApp.",
        steps: [
          {
            title: "Say hi on WhatsApp",
            description: "Tap the button and tell us your main wellness goal.",
            image: { src: img("photo-1505751172876-fa1923c5c528", 800), alt: "Supplement capsules" },
          },
          {
            title: "Quick lifestyle questionnaire",
            description: "Answer a few questions about your diet, routine, and any sensitivities.",
          },
          {
            title: "Get your guidance",
            description: "An advisor shares transparent, evidence-aware suggestions for your routine.",
          },
          {
            title: "Refine as you go",
            description: "Check in anytime and we'll fine-tune your routine for free.",
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
            name: "Hannah",
            location: "United States",
            channel: "WhatsApp",
            avatar: { src: img("photo-1544005313-94ddf0286df2", 200), alt: "Hannah" },
            content: {
              text: "They simplified my overloaded cabinet to a few things that make sense for me. No hype, just honest advice.",
            },
          },
          {
            name: "Tobias",
            location: "Germany",
            channel: "Trustpilot",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Tobias" },
            content: {
              text: "Transparent about what the evidence actually supports. Even told me to ask my doctor about one thing.",
            },
          },
          {
            name: "Priya",
            location: "India",
            channel: "Instagram",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Priya" },
            content: {
              text: "Tailored to my vegetarian diet and zero pressure to buy. Finally feel like I understand my routine.",
            },
          },
        ],
      },
    },

    {
      type: "guarantee",
      data: {
        title: "Guidance you can trust",
        description: "Honest support, with no false promises.",
        items: [
          { icon: "🔒", title: "Privacy first", subtitle: "Your health details stay confidential and are never sold." },
          { icon: "🧾", title: "No disease claims", subtitle: "We never claim to prevent, diagnose, treat, or cure any condition." },
          { icon: "🩺", title: "We defer to your doctor", subtitle: "For medical concerns or medications, we'll point you to a professional." },
          { icon: "🤝", title: "Free follow-ups", subtitle: "Ongoing guidance as your goals change, at no cost." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Frequently asked questions" },
        items: [
          {
            question: "Is the nutrition check really free?",
            answer: "Yes. Your check and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "Are these claims medically proven?",
            answer: "Supplements are not intended to diagnose, treat, cure, or prevent any disease. We share evidence-aware, general wellness guidance only.",
          },
          {
            question: "Can you advise if I take medication?",
            answer: "We'll always recommend checking with your doctor or pharmacist before combining supplements with medication.",
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
    brandName: "Vitae",
    copyrightYear: "2026",
    contactEmail: "hello@vitae-health.com",
    privacyPolicy:
      "We use the health and lifestyle details you share only to provide your nutrition check. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Vitae provides general wellness and nutrition information only. These statements have not been evaluated by any medical authority, and our guidance is not intended to diagnose, treat, cure, or prevent any disease. Always consult a qualified healthcare professional.",
  },

  floatingButton: {
    text: "🌱 Free nutrition check",
    link: WHATSAPP,
  },
};
