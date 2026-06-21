// landing-editor/samples/activewearDraft.ts
//
// 服饰 / 瑜伽运动服「训练 & 合身咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费选款 / 合身与训练搭配建议，无任何下单 / 结账 / 订阅语义。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Strlive%2C%20I%27d%20like%20a%20free%20activewear%20fit%20guide";

export const activewearDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1518611012118-696072aa579a", 1600),
      alt: "Athlete in performance activewear",
    },
    badge: { emoji: "🏃‍♀️", text: "Performance fit, matched to your training" },
    title: "Activewear that moves the way you do",
    subtitle:
      "Tell us how you train and we'll send a free fit-and-fabric guide over WhatsApp — the right support, squat-proof confidence, and pieces that last.",
    cta: { text: "Get my free fit guide", link: WHATSAPP },
    secondaryCta: { text: "See the collection", link: "https://instagram.com/strive.move" },
    endorsementText: "Trusted by 120,000+ athletes and movers",
    showcase: {
      type: "image",
      src: img("photo-1517836357463-d25dfeac3438"),
      alt: "Activewear set flat lay",
    },
  },

  sections: [
    {
      type: "features",
      data: {
        title: "Why Strive fits better",
        subtitle: "Engineered for movement, matched to you.",
        items: [
          {
            icon: "🏋️",
            title: "Matched to your training",
            description:
              "Yoga, lifting, running, or HIIT — we recommend support levels and cuts that suit your sport.",
          },
          {
            icon: "🩳",
            title: "Squat-proof confidence",
            description:
              "Honest guidance on opacity, compression, and coverage so you never second-guess a rep.",
          },
          {
            icon: "💨",
            title: "Fabric that performs",
            description:
              "Breathable, sweat-wicking picks suited to your climate and intensity.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp help",
            description:
              "Tell us how a piece felt mid-workout and we'll fine-tune the next pick — free.",
          },
        ],
      },
    },

    {
      type: "stats",
      data: {
        title: "Built on real feedback",
        subtitle: "A few numbers behind our fit guides.",
        items: [
          { icon: "🏃", value: "120,000+", label: "Fit guides created" },
          { icon: "🌍", value: "45+", label: "Countries served" },
          { icon: "⭐", value: "4.9/5", label: "Average fit rating" },
          { icon: "↩️", value: "-35%", label: "Fewer fit returns" },
        ],
      },
    },

    {
      type: "products",
      data: {
        title: "Pieces our team trains in",
        subtitle: "A few favorites across activities.",
        items: [
          {
            name: "FlexCore Leggings",
            description: "High-rise, squat-proof, and sculpting with a stay-put waistband.",
            backgroundImage: { src: img("photo-1506629905607-45e5a3f3c0a1", 800), alt: "Performance leggings" },
          },
          {
            name: "AirLight Tank",
            description: "Breathable, quick-drying, and built for high-intensity sessions.",
            backgroundImage: { src: img("photo-1571019613454-1cb2f99b2d8b", 800), alt: "Training tank" },
          },
          {
            name: "Studio Set",
            description: "Soft, supportive pieces designed for yoga and recovery days.",
            backgroundImage: { src: img("photo-1518310383802-640c2de311b2", 800), alt: "Yoga set" },
          },
        ],
      },
    },

    {
      type: "reviews",
      data: {
        title: "What athletes say",
        description: "Real messages from people we've fitted.",
        items: [
          {
            name: "Mia",
            location: "United States",
            channel: "WhatsApp",
            avatar: { src: img("photo-1544005313-94ddf0286df2", 200), alt: "Mia" },
            content: {
              text: "Finally leggings that don't go see-through on squats. The support advice was spot on for lifting.",
            },
          },
          {
            name: "Kenji",
            location: "Japan",
            channel: "Trustpilot",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Kenji" },
            content: {
              text: "They matched fabric to my humid climate. Stays dry through every run, zero chafing.",
            },
          },
          {
            name: "Amara",
            location: "Nigeria",
            channel: "Instagram",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Amara" },
            content: {
              text: "Honest fit help, no pushy selling. My set fits like it was made for me.",
            },
          },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Frequently asked questions" },
        items: [
          {
            question: "Is the fit guide really free?",
            answer: "Yes. Your fit-and-fabric guide and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "Can you help me pick support levels?",
            answer: "Absolutely. Tell us your activity and preferences and we'll recommend the right support and coverage.",
          },
          {
            question: "Do I have to buy anything?",
            answer: "No. Our guidance is independent — what you purchase is entirely up to you.",
          },
          {
            question: "Can you advise on sizing between brands?",
            answer: "Yes. Share your measurements and we'll give brand-agnostic sizing guidance.",
          },
        ],
      },
    },
  ],

  footer: {
    brandName: "Strive",
    copyrightYear: "2026",
    contactEmail: "fit@strive-move.com",
    privacyPolicy:
      "We use the training and size details you share only to provide your fit guide. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Strive provides activewear fit and fabric guidance for informational purposes only. Fit suggestions are estimates based on the details you provide.",
  },

  floatingButton: {
    text: "🏃‍♀️ Free fit guide",
    link: WHATSAPP,
  },
};
