// landing-editor/samples/maternityDraft.ts
//
// 玩具母婴 / 孕产用品「孕期好物 & 舒适咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费孕期好物建议，无任何下单 / 结账 / 订阅语义。
// 孕期健康相关表述配 disclaimer，建议就医由医生 / 助产士判断。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Bloom%2C%20I%27d%20like%20free%20pregnancy%20comfort%20advice";

export const maternityDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1519689680058-324335c77eba", 1600),
      alt: "Calm expecting mother at home",
    },
    badge: { emoji: "🤰", text: "Comfort through every trimester" },
    title: "Feel more comfortable through your pregnancy",
    subtitle:
      "Tell us your trimester and what's bothering you. We send free, trimester-matched comfort and gear advice over WhatsApp — practical support, honestly given.",
    cta: { text: "Get my free comfort advice", link: WHATSAPP },
    secondaryCta: { text: "Our approach", link: "https://instagram.com/bloom.maternity" },
    endorsementText: "Trusted by 85,000+ expecting parents worldwide",
    showcase: {
      type: "image",
      src: img("photo-1555252333-9f8e92e65df9"),
      alt: "Maternity comfort essentials",
    },
  },

  sections: [
    {
      type: "features",
      data: {
        title: "Why Bloom advice works",
        subtitle: "Trimester-matched, practical, and honest.",
        items: [
          {
            icon: "🗓️",
            title: "Matched to your trimester",
            description:
              "Comfort and gear guidance tailored to where you are in your pregnancy.",
          },
          {
            icon: "🛋️",
            title: "Real comfort focus",
            description:
              "Support pillows, gentle wear, and practical tools for sleep, back, and daily ease.",
          },
          {
            icon: "🧾",
            title: "Honest, not medical",
            description:
              "Practical product and comfort tips only — we always defer health questions to your provider.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp support",
            description:
              "As your needs change each trimester, message us anytime — free.",
          },
        ],
      },
    },

    {
      type: "trust",
      data: {
        badges: [
          { icon: "👩‍⚕️", title: "Defer to your provider", subtitle: "For any health concern, we point you to your doctor or midwife." },
          { icon: "🌱", title: "Gentle, safe materials", subtitle: "Skin-friendly, non-toxic comfort products." },
          { icon: "🤝", title: "Judgment-free support", subtitle: "Warm, practical guidance with no pressure." },
          { icon: "🔒", title: "Privacy first", subtitle: "Your details stay confidential and are never sold." },
        ],
      },
    },

    {
      type: "stats",
      data: {
        title: "Why parents trust us",
        subtitle: "A few numbers behind our advice.",
        items: [
          { icon: "🤰", value: "85,000+", label: "Comfort plans shared" },
          { icon: "🌍", value: "37+", label: "Countries served" },
          { icon: "⭐", value: "4.9/5", label: "Average advice rating" },
          { icon: "⏱️", value: "<10 min", label: "Avg. WhatsApp reply" },
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
            name: "Amy",
            location: "United States",
            channel: "WhatsApp",
            avatar: { src: img("photo-1544005313-94ddf0286df2", 200), alt: "Amy" },
            content: {
              text: "The pregnancy pillow they matched finally let me sleep. Practical, trimester-specific advice I trusted.",
            },
          },
          {
            name: "Noor",
            location: "United Arab Emirates",
            channel: "Trustpilot",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Noor" },
            content: {
              text: "Honest and warm. They pointed me to my midwife for one symptom instead of selling a remedy.",
            },
          },
          {
            name: "Greta",
            location: "Italy",
            channel: "Instagram",
            avatar: { src: img("photo-1502823403499-6ccfcf4fb453", 200), alt: "Greta" },
            content: {
              text: "Comfort tips that actually helped my back, with zero pressure to buy. Felt genuinely supported.",
            },
          },
        ],
      },
    },

    {
      type: "guarantee",
      data: {
        title: "Support you can trust",
        description: "Honest, practical guidance for your pregnancy.",
        items: [
          { icon: "🔒", title: "Privacy first", subtitle: "Your details stay confidential and are never sold." },
          { icon: "👩‍⚕️", title: "Not medical advice", subtitle: "Always consult your doctor or midwife for health questions." },
          { icon: "🙅", title: "No pushy sales", subtitle: "Independent advice — buy from anywhere, or nowhere." },
          { icon: "🤝", title: "Free follow-ups", subtitle: "Support through every trimester, at no cost." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Frequently asked questions" },
        items: [
          {
            question: "Is the comfort advice really free?",
            answer: "Yes. Your advice and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "Can you give pregnancy health advice?",
            answer: "No. We offer comfort and product guidance only. For any health concern or symptom, please consult your doctor or midwife.",
          },
          {
            question: "Are the products safe during pregnancy?",
            answer: "We recommend gentle, body-safe comfort products, but always check with your provider if you're unsure.",
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
    brandName: "Bloom",
    copyrightYear: "2026",
    contactEmail: "hello@bloom-maternity.com",
    privacyPolicy:
      "We use the details you share only to provide your comfort advice. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Bloom provides pregnancy comfort and product guidance for informational purposes only and is not a substitute for medical advice. Always consult your doctor or midwife for any health concern.",
  },

  floatingButton: {
    text: "🤰 Free comfort advice",
    link: WHATSAPP,
  },
};
