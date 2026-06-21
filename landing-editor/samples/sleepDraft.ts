// landing-editor/samples/sleepDraft.ts
//
// 保健品 / 助眠「睡眠习惯咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费睡眠评估，无任何下单 / 结账 / 订阅语义。
// 高合规风险：避免治疗失眠等疾病承诺，功效表述均配 disclaimer。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Lull%2C%20I%27d%20like%20a%20free%20sleep%20check";

export const sleepDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1455642305367-68834a1da7ab", 1600),
      alt: "Calm bedroom at night",
    },
    badge: { emoji: "🌙", text: "Better nights, gently guided" },
    title: "Wind down to deeper, calmer nights",
    subtitle:
      "Get a free sleep check over WhatsApp. Our advisors help you build a calming wind-down routine and habits — alongside any natural support that fits you.",
    cta: { text: "Get my free sleep check", link: WHATSAPP },
    secondaryCta: { text: "Our approach", link: "https://instagram.com/lull.rest" },
    endorsementText: "Trusted by 90,000+ people sleeping better",
    showcase: {
      type: "image",
      src: img("photo-1541781774459-bb2af2f05b55"),
      alt: "Evening tea and calm setting",
    },
  },

  sections: [
    {
      type: "stats",
      data: {
        title: "Calmer nights, built on routine",
        subtitle: "A few numbers behind our advisors.",
        items: [
          { icon: "🌙", value: "90,000+", label: "Sleep checks done" },
          { icon: "📅", value: "84%", label: "Better routine by week 3" },
          { icon: "⭐", value: "4.8/5", label: "Average advisor rating" },
          { icon: "⏱️", value: "<10 min", label: "Avg. WhatsApp reply" },
        ],
      },
    },

    {
      type: "features",
      data: {
        title: "Why Lull works",
        subtitle: "Gentle, honest, and built around your nights.",
        items: [
          {
            icon: "🛏️",
            title: "Routine-first approach",
            description:
              "We start with your wind-down habits and sleep environment, not just a supplement.",
          },
          {
            icon: "🌿",
            title: "Gentle, transparent support",
            description:
              "Clear guidance on natural options like magnesium or herbal teas, with honest expectations.",
          },
          {
            icon: "🧾",
            title: "No medical claims",
            description:
              "We never claim to treat insomnia or any sleep disorder — that's a doctor's domain.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp support",
            description:
              "Tell us how you slept and we'll adjust your routine — free, anytime.",
          },
        ],
      },
    },

    {
      type: "process",
      data: {
        title: "How your free check works",
        subtitle: "Four steps, all over WhatsApp.",
        steps: [
          {
            title: "Say hi on WhatsApp",
            description: "Tap the button and tell us what's keeping you up.",
            image: { src: img("photo-1531353826977-0941b4779a1c", 800), alt: "Calm bedside setting" },
          },
          {
            title: "Quick sleep questionnaire",
            description: "Share your evening routine, screen habits, and sleep environment.",
          },
          {
            title: "Get your wind-down plan",
            description: "An advisor sends a calming routine and any gentle support that fits you.",
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
            name: "Emma",
            location: "United Kingdom",
            channel: "WhatsApp",
            avatar: { src: img("photo-1544005313-94ddf0286df2", 200), alt: "Emma" },
            content: {
              text: "The wind-down routine made the biggest difference. Honest about what a supplement can and can't do.",
            },
          },
          {
            name: "Hiro",
            location: "Japan",
            channel: "Trustpilot",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Hiro" },
            content: {
              text: "They focused on my screen habits first, not just selling pills. My evenings feel calmer now.",
            },
          },
          {
            name: "Lucia",
            location: "Italy",
            channel: "Instagram",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Lucia" },
            content: {
              text: "Gentle, realistic advice — and they told me to see a doctor about one issue. Genuinely caring.",
            },
          },
        ],
      },
    },

    {
      type: "guarantee",
      data: {
        title: "Guidance you can trust",
        description: "Gentle support, with no false promises.",
        items: [
          { icon: "🔒", title: "Privacy first", subtitle: "Your sleep details stay confidential and are never sold." },
          { icon: "🧾", title: "No disease claims", subtitle: "We don't claim to treat insomnia or any sleep disorder." },
          { icon: "🩺", title: "We defer to your doctor", subtitle: "For persistent sleep problems, we'll point you to a professional." },
          { icon: "🤝", title: "Free follow-ups", subtitle: "Ongoing guidance as your routine improves, at no cost." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Frequently asked questions" },
        items: [
          {
            question: "Is the sleep check really free?",
            answer: "Yes. Your check and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "Will this cure my insomnia?",
            answer: "No. We offer general wellness and routine guidance only and don't treat sleep disorders. Please see a doctor for persistent insomnia.",
          },
          {
            question: "Are natural sleep aids safe?",
            answer: "We share general guidance, but always recommend checking with your doctor or pharmacist, especially if you take medication.",
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
    brandName: "Lull",
    copyrightYear: "2026",
    contactEmail: "hello@lull-rest.com",
    privacyPolicy:
      "We use the sleep and lifestyle details you share only to provide your sleep check. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Lull provides general wellness and sleep-routine information only. It is not medical advice and is not intended to diagnose, treat, cure, or prevent any condition, including insomnia. Always consult a qualified healthcare professional.",
  },

  floatingButton: {
    text: "🌙 Free sleep check",
    link: WHATSAPP,
  },
};
