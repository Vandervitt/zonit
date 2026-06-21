// landing-editor/samples/babyCareDraft.ts
//
// 玩具母婴 / 婴童喂养用品「选品 & 喂养咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费选品建议，无任何下单 / 结账 / 订阅语义。
// 育儿安全相关表述配 disclaimer，建议就医由儿科医生判断。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Nido%2C%20I%27d%20like%20free%20baby%20gear%20advice";

export const babyCareDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1515488042361-ee00e0ddd4e4", 1600),
      alt: "Soft baby nursery essentials",
    },
    badge: { emoji: "🍼", text: "Gentle gear, confident parenting" },
    title: "The right baby essentials, without the overwhelm",
    subtitle:
      "New parent or expecting? Tell us your stage and we'll send a free, no-fluff essentials guide over WhatsApp — safe, practical gear matched to your baby.",
    cta: { text: "Get my free essentials guide", link: WHATSAPP },
    secondaryCta: { text: "See our checklist", link: "https://instagram.com/nido.baby" },
    endorsementText: "Trusted by 120,000+ parents worldwide",
    showcase: {
      type: "image",
      src: img("photo-1555252333-9f8e92e65df9"),
      alt: "Baby feeding essentials",
    },
  },

  sections: [
    {
      type: "features",
      data: {
        title: "Why Nido guides work",
        subtitle: "Safe, practical, and matched to your stage.",
        items: [
          {
            icon: "🎯",
            title: "Matched to your stage",
            description:
              "Newborn, weaning, or toddler — we recommend only what you actually need now.",
          },
          {
            icon: "🛡️",
            title: "Safety-first picks",
            description:
              "Gear meeting recognized safety standards, with clear guidance on safe use.",
          },
          {
            icon: "🧼",
            title: "Practical & fuss-free",
            description:
              "Easy-to-clean, durable essentials that make daily routines simpler.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp help",
            description:
              "As your baby grows, message us for the next stage of essentials — free.",
          },
        ],
      },
    },

    {
      type: "trust",
      data: {
        badges: [
          { icon: "✅", title: "Safety-standard picks", subtitle: "We only recommend gear meeting recognized safety standards." },
          { icon: "🌱", title: "Non-toxic & BPA-free", subtitle: "Baby-safe materials we'd use for our own little ones." },
          { icon: "👩‍⚕️", title: "Defer to your pediatrician", subtitle: "For feeding or health concerns, we point you to a professional." },
          { icon: "🔒", title: "Privacy first", subtitle: "Your family's details stay confidential and are never sold." },
        ],
      },
    },

    {
      type: "stats",
      data: {
        title: "Why parents trust us",
        subtitle: "A few numbers behind our guides.",
        items: [
          { icon: "🍼", value: "120,000+", label: "Essentials guides" },
          { icon: "🌍", value: "44+", label: "Countries served" },
          { icon: "⭐", value: "4.9/5", label: "Average guide rating" },
          { icon: "⏱️", value: "<10 min", label: "Avg. WhatsApp reply" },
        ],
      },
    },

    {
      type: "reviews",
      data: {
        title: "What parents say",
        description: "Real messages from families we've helped.",
        items: [
          {
            name: "Jess",
            location: "United States",
            channel: "WhatsApp",
            avatar: { src: img("photo-1544005313-94ddf0286df2", 200), alt: "Jess" },
            content: {
              text: "As a first-time mum I was drowning in lists. They cut it down to exactly what we needed — safe and practical.",
            },
          },
          {
            name: "Mohammed",
            location: "United Arab Emirates",
            channel: "Trustpilot",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Mohammed" },
            content: {
              text: "Honest advice that saved us money. They even told us to ask our pediatrician about feeding — real care.",
            },
          },
          {
            name: "Lena",
            location: "Germany",
            channel: "Instagram",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Lena" },
            content: {
              text: "Safety-first picks and zero pressure to buy. The weaning gear they matched made mealtimes so much easier.",
            },
          },
        ],
      },
    },

    {
      type: "guarantee",
      data: {
        title: "Care you can trust",
        description: "Safe, honest guidance for your family.",
        items: [
          { icon: "✅", title: "Safety-checked", subtitle: "Gear meeting recognized safety standards." },
          { icon: "👩‍⚕️", title: "Not medical advice", subtitle: "For feeding or health concerns, always consult your pediatrician." },
          { icon: "🙅", title: "No pushy sales", subtitle: "Independent advice — buy from anywhere, or nowhere." },
          { icon: "🤝", title: "Free follow-ups", subtitle: "Next-stage essentials as your baby grows, at no cost." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Frequently asked questions" },
        items: [
          {
            question: "Is the essentials guide really free?",
            answer: "Yes. Your guide and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "Can you give feeding or health advice?",
            answer: "We share general product guidance only. For feeding, allergies, or health concerns, please consult your pediatrician.",
          },
          {
            question: "Is the gear safe?",
            answer: "We only recommend gear meeting recognized safety standards, but always follow instructions and supervise your baby.",
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
    brandName: "Nido",
    copyrightYear: "2026",
    contactEmail: "hello@nido-baby.com",
    privacyPolicy:
      "We use the details you share about your family only to provide your essentials guide. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Nido provides baby-product guidance for informational purposes only and is not a substitute for medical or pediatric advice. Always follow product safety instructions and consult your pediatrician for health concerns.",
  },

  floatingButton: {
    text: "🍼 Free essentials guide",
    link: WHATSAPP,
  },
};
