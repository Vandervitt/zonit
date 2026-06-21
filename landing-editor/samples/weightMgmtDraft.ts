// landing-editor/samples/weightMgmtDraft.ts
//
// 保健品 / 体重管理「健康习惯咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费习惯评估，无任何下单 / 结账 / 订阅语义。
// 高合规风险：避免快速减重 / 保证瘦身承诺，功效表述均配 disclaimer。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Balance%2C%20I%27d%20like%20a%20free%20habit%20check";

export const weightMgmtDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1490645935967-10de6ba17061", 1600),
      alt: "Balanced healthy meal",
    },
    badge: { emoji: "⚖️", text: "Sustainable habits, not quick fixes" },
    title: "A healthier weight, the sustainable way",
    subtitle:
      "Get a free habit check over WhatsApp. Our coaches help you build realistic nutrition and movement routines — no crash diets, no impossible promises.",
    cta: { text: "Get my free habit check", link: WHATSAPP },
    secondaryCta: { text: "Our approach", link: "https://instagram.com/balance.wellness" },
    endorsementText: "Trusted by 80,000+ people building lasting habits",
    showcase: {
      type: "image",
      src: img("photo-1498837167922-ddd27525d352"),
      alt: "Fresh wholesome ingredients",
    },
  },

  sections: [
    {
      type: "stats",
      data: {
        title: "Built on consistency, not crash diets",
        subtitle: "A few numbers behind our coaching.",
        items: [
          { icon: "⚖️", value: "80,000+", label: "Habit checks done" },
          { icon: "📅", value: "86%", label: "Stick to week 6" },
          { icon: "⭐", value: "4.8/5", label: "Average coach rating" },
          { icon: "⏱️", value: "<10 min", label: "Avg. WhatsApp reply" },
        ],
      },
    },

    {
      type: "story",
      data: {
        title: "Why we started Balance",
        subtitle: "Sustainable beats drastic, every time.",
        body: "We were tired of an industry that sells crash diets and guaranteed-result promises that leave people worse off. So we built Balance around honest coaching: small, realistic changes to nutrition and movement that fit your life and actually last. No shame, no extremes — just steady support and habits you can keep.",
        backgroundImage: {
          src: img("photo-1466637574441-749b8f19452f", 1400),
          alt: "Wholesome cooking at home",
        },
        signatureName: "Dr. Mara Lindqvist",
        signatureRole: "Founder & Health Coach",
      },
    },

    {
      type: "features",
      data: {
        title: "Why Balance works",
        subtitle: "Realistic, supportive, and built around you.",
        items: [
          {
            icon: "🥗",
            title: "Habits, not crash diets",
            description:
              "Small, sustainable nutrition and movement changes that fit your real routine.",
          },
          {
            icon: "🧾",
            title: "Honest expectations",
            description:
              "We never promise rapid weight loss or guaranteed numbers — just realistic, healthy progress.",
          },
          {
            icon: "🤝",
            title: "Judgment-free support",
            description:
              "Encouraging, shame-free coaching that meets you where you are.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp check-ins",
            description:
              "Weekly nudges and adjustments to keep you consistent — free.",
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
            name: "Carla",
            location: "United States",
            channel: "WhatsApp",
            avatar: { src: img("photo-1544005313-94ddf0286df2", 200), alt: "Carla" },
            content: {
              text: "First approach that didn't make me feel like a failure. Small changes, and they finally stuck.",
            },
          },
          {
            name: "Sven",
            location: "Sweden",
            channel: "Trustpilot",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Sven" },
            content: {
              text: "No crash-diet nonsense. Honest, realistic coaching and they checked in every week.",
            },
          },
          {
            name: "Amara",
            location: "Nigeria",
            channel: "Instagram",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Amara" },
            content: {
              text: "They tailored everything to my schedule and culture. Steady progress, zero pressure.",
            },
          },
        ],
      },
    },

    {
      type: "guarantee",
      data: {
        title: "Support you can trust",
        description: "Honest coaching, with no false promises.",
        items: [
          { icon: "🔒", title: "Privacy first", subtitle: "Your health details stay confidential and are never sold." },
          { icon: "🧾", title: "No guaranteed results", subtitle: "We never promise specific or rapid weight loss." },
          { icon: "🩺", title: "We defer to your doctor", subtitle: "For medical conditions or medication, we'll point you to a professional." },
          { icon: "🤝", title: "Free follow-ups", subtitle: "Ongoing check-ins as your habits build, at no cost." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Frequently asked questions" },
        items: [
          {
            question: "Is the habit check really free?",
            answer: "Yes. Your check and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "Will I lose a specific amount of weight?",
            answer: "We can't promise that — no honest coach can. We focus on sustainable habits and realistic, healthy progress.",
          },
          {
            question: "Is this medical or weight-loss treatment?",
            answer: "No. We offer general wellness coaching only. For medical conditions or medications, please consult your doctor.",
          },
          {
            question: "Do I have to buy anything?",
            answer: "No. Our coaching guidance is independent — purchasing is entirely up to you.",
          },
        ],
      },
    },
  ],

  footer: {
    brandName: "Balance",
    copyrightYear: "2026",
    contactEmail: "hello@balance-wellness.com",
    privacyPolicy:
      "We use the health and lifestyle details you share only to provide your habit check. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Balance provides general wellness and lifestyle coaching for informational purposes only. It is not medical advice or weight-loss treatment, and results vary. Always consult a qualified healthcare professional before changing your diet or exercise routine.",
  },

  floatingButton: {
    text: "⚖️ Free habit check",
    link: WHATSAPP,
  },
};
