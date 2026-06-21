// landing-editor/samples/beautyDeviceDraft.ts
//
// 美妆 / 美容仪「家用美容仪咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费护理方案，无任何下单 / 结账 / 订阅语义。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Lumio%2C%20I%27d%20like%20a%20free%20skin-device%20plan";

export const beautyDeviceDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1570172619644-dfd03ed5d881", 1600),
      alt: "At-home beauty device on a clean vanity",
    },
    badge: { emoji: "💡", text: "At-home skincare tech, guided by pros" },
    title: "Smarter skin, from the comfort of home",
    subtitle:
      "Tell us your skin goals and get a free, personalized device-care plan over WhatsApp — the right routine, the right settings, the right pace.",
    cta: { text: "Get my free care plan", link: WHATSAPP },
    secondaryCta: { text: "See how it works", link: "https://youtube.com/@lumio.skin" },
    endorsementText: "Trusted by 80,000+ at-home skincare users",
    showcase: {
      type: "image",
      src: img("photo-1556228578-8c89e6adf883"),
      alt: "Person using a facial device",
    },
  },

  sections: [
    {
      type: "stats",
      data: {
        title: "Results people stick with",
        subtitle: "A few numbers behind our care plans.",
        items: [
          { icon: "💡", value: "80,000+", label: "Care plans created" },
          { icon: "📅", value: "92%", label: "Stick to week 4" },
          { icon: "⭐", value: "4.8/5", label: "Average plan rating" },
          { icon: "⏱️", value: "<10 min", label: "Avg. WhatsApp reply" },
        ],
      },
    },

    {
      type: "features",
      data: {
        title: "Why Lumio plans work",
        subtitle: "Clear guidance so your device actually delivers.",
        items: [
          {
            icon: "🎯",
            title: "Matched to your goals",
            description:
              "Firmness, texture, or glow — we set a routine and cadence around what you want.",
          },
          {
            icon: "🧭",
            title: "Settings made simple",
            description:
              "Exactly which mode, how long, and how often — no more guessing from a manual.",
          },
          {
            icon: "🛡️",
            title: "Safety-first guidance",
            description:
              "Clear do's and don'ts for sensitive skin, so you build a habit you can trust.",
          },
          {
            icon: "💬",
            title: "Check-ins that keep you going",
            description:
              "We nudge and adjust your plan over WhatsApp so you don't lose momentum.",
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
            description: "Tap the button and tell us your skin goal and current routine.",
            image: { src: img("photo-1512290923902-8a9f81dc236c", 800), alt: "Skincare device close-up" },
          },
          {
            title: "Quick skin check-in",
            description: "Answer a few questions about your skin type and any sensitivities.",
          },
          {
            title: "Get your weekly plan",
            description: "We send a simple schedule with modes, timing, and gentle ramp-up.",
          },
          {
            title: "Adjust as you progress",
            description: "Share how your skin responds and we fine-tune the plan — free.",
          },
        ],
      },
    },

    {
      type: "beforeAfter",
      data: {
        title: "Consistency, visualized",
        subtitle: "Shared with permission from our community.",
        disclaimer:
          "Individual results vary. At-home beauty devices are cosmetic, not medical, treatments — outcomes depend on skin type, settings, and consistency. This is not medical advice.",
        items: [
          {
            crmName: "Naomi, 38",
            duration: "10 weeks",
            caseDescription:
              "Followed a gentle firming cadence focused on the jawline and cheeks.",
            beforeImage: { src: img("photo-1508214751196-bcfd4ca60f91", 800), alt: "Portrait before plan" },
            afterImage: { src: img("photo-1531123897727-8f129e1688ce", 800), alt: "Portrait after plan" },
          },
          {
            crmName: "Yuki, 33",
            duration: "8 weeks",
            caseDescription:
              "Built a low-intensity texture routine suited to reactive skin.",
            beforeImage: { src: img("photo-1500648767791-00dcc994a43e", 800), alt: "Portrait before plan" },
            afterImage: { src: img("photo-1506794778202-cad84cf45f1d", 800), alt: "Portrait after plan" },
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
            name: "Marta",
            location: "Poland",
            channel: "WhatsApp",
            avatar: { src: img("photo-1502823403499-6ccfcf4fb453", 200), alt: "Marta" },
            content: {
              text: "I finally use my device correctly. The weekly schedule made it a habit instead of a gadget in a drawer.",
            },
          },
          {
            name: "Derek",
            location: "Canada",
            channel: "Trustpilot",
            avatar: { src: img("photo-1500648767791-00dcc994a43e", 200), alt: "Derek" },
            content: {
              text: "Clear, safe instructions for my sensitive skin. They checked in without ever pushing me to buy more.",
            },
          },
          {
            name: "Lucia",
            location: "Italy",
            channel: "Instagram",
            avatar: { src: img("photo-1544005313-94ddf0286df2", 200), alt: "Lucia" },
            content: {
              text: "The settings guidance alone was worth it. My skin looks calmer and I actually understand why.",
            },
          },
        ],
      },
    },

    {
      type: "guarantee",
      data: {
        title: "Guided care you can trust",
        description: "Support you can rely on, before and after.",
        items: [
          { icon: "🔒", title: "Privacy first", subtitle: "Your skin details stay confidential and are never sold." },
          { icon: "🛡️", title: "Safety-led advice", subtitle: "Gentle ramp-ups and clear cautions for sensitive skin." },
          { icon: "🙅", title: "No pushy sales", subtitle: "Independent guidance — works with the device you already have." },
          { icon: "🤝", title: "Free follow-ups", subtitle: "Keep messaging us as your routine evolves, at no cost." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Frequently asked questions" },
        items: [
          {
            question: "Is the care plan really free?",
            answer: "Yes. Your personalized plan and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "Do I need to buy your device?",
            answer: "No. We can build a plan around the device you already own — no purchase required.",
          },
          {
            question: "Is this safe for sensitive skin?",
            answer: "We design gentle, gradual routines, but always follow your device manual and a doctor's advice for medical concerns.",
          },
          {
            question: "How soon might I notice a difference?",
            answer: "It varies by skin and consistency. We focus on safe, steady habits rather than overnight promises.",
          },
        ],
      },
    },
  ],

  footer: {
    brandName: "Lumio",
    copyrightYear: "2026",
    contactEmail: "care@lumio-skin.com",
    privacyPolicy:
      "We use the skin information you share only to build your care plan. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Lumio provides cosmetic device-usage guidance for informational purposes only and does not provide medical diagnosis or treatment. Always follow your device manual and consult a professional for medical concerns.",
  },

  floatingButton: {
    text: "💡 Free care plan",
    link: WHATSAPP,
  },
};
