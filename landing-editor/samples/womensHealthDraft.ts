// landing-editor/samples/womensHealthDraft.ts
//
// 保健品 / 女性健康「周期 & 习惯咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费健康评估，无任何下单 / 结账 / 订阅语义。
// 高合规风险：避免治疗承诺，功效表述均配 disclaimer，明确非医疗。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Aria%2C%20I%27d%20like%20a%20free%20wellness%20check";

export const womensHealthDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1512290923902-8a9f81dc236c", 1600),
      alt: "Calm wellness setting",
    },
    badge: { emoji: "🌸", text: "Women's wellness, personalized" },
    title: "Feel supported through every cycle and stage",
    subtitle:
      "Get a free wellness check over WhatsApp. Our advisors offer honest, personalized guidance on nutrition and habits for energy, cycle comfort, and balance.",
    cta: { text: "Get my free wellness check", link: WHATSAPP },
    secondaryCta: { text: "Our approach", link: "https://instagram.com/aria.wellness" },
    endorsementText: "Trusted by 100,000+ women building healthier routines",
    showcase: {
      type: "image",
      src: img("photo-1571019613454-1cb2f99b2d8b"),
      alt: "Wellness and nutrition essentials",
    },
  },

  sections: [
    {
      type: "stats",
      data: {
        title: "Support women stay with",
        subtitle: "A few numbers behind our advisors.",
        items: [
          { icon: "🌸", value: "100,000+", label: "Wellness checks done" },
          { icon: "🌍", value: "40+", label: "Countries served" },
          { icon: "⭐", value: "4.9/5", label: "Average advisor rating" },
          { icon: "⏱️", value: "<10 min", label: "Avg. WhatsApp reply" },
        ],
      },
    },

    {
      type: "story",
      data: {
        title: "Why we started Aria",
        subtitle: "Women's wellness deserves honest guidance.",
        body: "Too often, women's health is met with dismissive advice or products promising the world. We built Aria to listen properly — understanding your cycle, energy, and life stage, then offering honest, personalized guidance on nutrition and habits. No miracle claims, no shame. Just supportive, transparent help, and a clear nudge to see a doctor when something needs one.",
        backgroundImage: {
          src: img("photo-1506744038136-46273834b3fb", 1400),
          alt: "Calm natural setting",
        },
        signatureName: "Dr. Naomi Adeyemi",
        signatureRole: "Founder & Women's Health Advisor",
      },
    },

    {
      type: "features",
      data: {
        title: "Why Aria works",
        subtitle: "Honest, personalized, and judgment-free.",
        items: [
          {
            icon: "🩷",
            title: "Built around your stage",
            description:
              "Cycle, postpartum, perimenopause, or beyond — guidance tailored to where you are.",
          },
          {
            icon: "🥗",
            title: "Nutrition & habit focused",
            description:
              "Practical food and lifestyle guidance, with supplements only ever supportive.",
          },
          {
            icon: "🧾",
            title: "No medical claims",
            description:
              "We never claim to treat hormonal or any medical conditions — that's a doctor's domain.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp support",
            description:
              "Check in as your needs change and we'll adjust your routine — free.",
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
            name: "Sophie",
            location: "United States",
            channel: "WhatsApp",
            avatar: { src: img("photo-1544005313-94ddf0286df2", 200), alt: "Sophie" },
            content: {
              text: "Finally felt heard instead of dismissed. The nutrition guidance for my cycle made a real difference.",
            },
          },
          {
            name: "Yara",
            location: "Lebanon",
            channel: "Trustpilot",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Yara" },
            content: {
              text: "Honest and warm. They told me to see my doctor about one symptom rather than selling me a fix.",
            },
          },
          {
            name: "Mei",
            location: "Singapore",
            channel: "Instagram",
            avatar: { src: img("photo-1502823403499-6ccfcf4fb453", 200), alt: "Mei" },
            content: {
              text: "Tailored to my postpartum stage with zero pressure. I feel more energized and supported.",
            },
          },
        ],
      },
    },

    {
      type: "guarantee",
      data: {
        title: "Guidance you can trust",
        description: "Honest, women-first support.",
        items: [
          { icon: "🔒", title: "Privacy first", subtitle: "Your health details stay confidential and are never sold." },
          { icon: "🧾", title: "No disease claims", subtitle: "We don't claim to diagnose, treat, or cure any condition." },
          { icon: "🩺", title: "We defer to your doctor", subtitle: "For symptoms or diagnosed conditions, we'll point you to a professional." },
          { icon: "🤝", title: "Free follow-ups", subtitle: "Ongoing guidance through every stage, at no cost." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Frequently asked questions" },
        items: [
          {
            question: "Is the wellness check really free?",
            answer: "Yes. Your check and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "Can you treat hormonal or cycle conditions?",
            answer: "No. We offer general wellness and nutrition guidance only. For symptoms or diagnosed conditions, please consult your doctor.",
          },
          {
            question: "Is this safe during pregnancy or breastfeeding?",
            answer: "Always consult your doctor before changing nutrition or supplements during pregnancy or breastfeeding — we'll point you there.",
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
    brandName: "Aria",
    copyrightYear: "2026",
    contactEmail: "hello@aria-wellness.com",
    privacyPolicy:
      "We use the health and lifestyle details you share only to provide your wellness check. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Aria provides general women's wellness and nutrition information only. It is not medical advice and is not intended to diagnose, treat, cure, or prevent any condition. Always consult a qualified healthcare professional, especially during pregnancy or breastfeeding.",
  },

  floatingButton: {
    text: "🌸 Free wellness check",
    link: WHATSAPP,
  },
};
