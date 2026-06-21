// landing-editor/samples/jointDraft.ts
//
// 保健品 / 关节骨骼「活动度 & 习惯咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费活动度评估，无任何下单 / 结账 / 订阅语义。
// 高合规风险：避免治疗关节炎等疾病承诺，功效表述均配 disclaimer。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Mobil%2C%20I%27d%20like%20a%20free%20mobility%20check";

export const jointDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1538805060514-97d9cc17730c", 1600),
      alt: "Active senior stretching outdoors",
    },
    badge: { emoji: "🦵", text: "Stay mobile, move with ease" },
    title: "Support for joints that keep you moving",
    subtitle:
      "Get a free mobility check over WhatsApp. Our advisors help you build gentle movement habits and routines — with honest guidance on supportive nutrition.",
    cta: { text: "Get my free mobility check", link: WHATSAPP },
    secondaryCta: { text: "Our approach", link: "https://instagram.com/mobil.health" },
    endorsementText: "Trusted by 70,000+ people staying active",
    showcase: {
      type: "image",
      src: img("photo-1518611012118-696072aa579a"),
      alt: "Gentle stretching routine",
    },
  },

  sections: [
    {
      type: "stats",
      data: {
        title: "Movement people keep up",
        subtitle: "A few numbers behind our advisors.",
        items: [
          { icon: "🦵", value: "70,000+", label: "Mobility checks done" },
          { icon: "📅", value: "83%", label: "More active by week 4" },
          { icon: "⭐", value: "4.8/5", label: "Average advisor rating" },
          { icon: "⏱️", value: "<10 min", label: "Avg. WhatsApp reply" },
        ],
      },
    },

    {
      type: "features",
      data: {
        title: "Why Mobil works",
        subtitle: "Gentle, honest, and built around your movement.",
        items: [
          {
            icon: "🚶",
            title: "Movement-first approach",
            description:
              "We start with gentle, joint-friendly movement habits — supplements are only ever supportive.",
          },
          {
            icon: "🌿",
            title: "Transparent nutrition guidance",
            description:
              "Honest information on supportive nutrients, with clear, realistic expectations.",
          },
          {
            icon: "🧾",
            title: "No medical claims",
            description:
              "We never claim to treat, cure, or reverse arthritis or any joint condition.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp support",
            description:
              "Tell us how you're moving and we'll adjust your routine — free, anytime.",
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
            description: "Tap the button and tell us where you feel stiffness or discomfort.",
            image: { src: img("photo-1599058917212-d750089bc07e", 800), alt: "Gentle exercise" },
          },
          {
            title: "Quick movement questionnaire",
            description: "Share your activity level, routine, and any sensitivities.",
          },
          {
            title: "Get your gentle plan",
            description: "An advisor sends joint-friendly movement and supportive nutrition guidance.",
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
            name: "Robert",
            location: "United States",
            channel: "WhatsApp",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Robert" },
            content: {
              text: "The gentle routine got me walking comfortably again. Honest about what supplements can and can't do.",
            },
          },
          {
            name: "Margit",
            location: "Austria",
            channel: "Trustpilot",
            avatar: { src: img("photo-1544005313-94ddf0286df2", 200), alt: "Margit" },
            content: {
              text: "They focused on movement first and told me to see my doctor about one issue. Real, caring advice.",
            },
          },
          {
            name: "Kenji",
            location: "Japan",
            channel: "Instagram",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Kenji" },
            content: {
              text: "Tailored to my desk job and zero pressure to buy. I feel less stiff in the mornings.",
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
          { icon: "🔒", title: "Privacy first", subtitle: "Your health details stay confidential and are never sold." },
          { icon: "🧾", title: "No disease claims", subtitle: "We don't claim to treat, cure, or reverse any joint condition." },
          { icon: "🩺", title: "We defer to your doctor", subtitle: "For pain or diagnosed conditions, we'll point you to a professional." },
          { icon: "🤝", title: "Free follow-ups", subtitle: "Ongoing guidance as you build movement habits, at no cost." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Frequently asked questions" },
        items: [
          {
            question: "Is the mobility check really free?",
            answer: "Yes. Your check and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "Will this treat my arthritis or joint pain?",
            answer: "No. We offer general wellness and movement guidance only and don't treat medical conditions. Please consult a doctor for joint pain or arthritis.",
          },
          {
            question: "Are joint supplements proven to work?",
            answer: "Evidence varies. We share honest, general information and never promise specific results — always check with your doctor.",
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
    brandName: "Mobil",
    copyrightYear: "2026",
    contactEmail: "hello@mobil-health.com",
    privacyPolicy:
      "We use the health and activity details you share only to provide your mobility check. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Mobil provides general wellness and movement information only. It is not medical advice and is not intended to diagnose, treat, cure, or prevent any condition. Always consult a qualified healthcare professional before changing your routine.",
  },

  floatingButton: {
    text: "🦵 Free mobility check",
    link: WHATSAPP,
  },
};
