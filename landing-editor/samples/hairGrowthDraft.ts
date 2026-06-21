// landing-editor/samples/hairGrowthDraft.ts
//
// 美妆 / 生发防脱「头皮护理咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费头皮评估，无任何下单 / 结账 / 订阅语义。
// 高合规风险：功效相关表述均配 disclaimer，避免承诺确定疗效。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Rooted%2C%20I%27d%20like%20a%20free%20scalp%20assessment";

export const hairGrowthDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1522337660859-02fbefca4702", 1600),
      alt: "Healthy hair and scalp care products",
    },
    badge: { emoji: "🌱", text: "Scalp-first hair care, guided by experts" },
    title: "Thinning hair? Start with your scalp",
    subtitle:
      "Get a free, personalized scalp assessment and care routine over WhatsApp — built around your hair type, shedding pattern, and goals.",
    cta: { text: "Get my free scalp check", link: WHATSAPP },
    secondaryCta: { text: "See real journeys", link: "https://instagram.com/rooted.care" },
    endorsementText: "Trusted by 60,000+ people on their hair journey",
    showcase: {
      type: "image",
      src: img("photo-1620331317314-9a6e6f0a2b48"),
      alt: "Scalp serum applicator",
    },
  },

  sections: [
    {
      type: "stats",
      data: {
        title: "A routine people stay with",
        subtitle: "A few numbers behind our scalp coaching.",
        items: [
          { icon: "🌱", value: "60,000+", label: "Scalp assessments" },
          { icon: "📅", value: "89%", label: "Stick to month 3" },
          { icon: "⭐", value: "4.8/5", label: "Average coach rating" },
          { icon: "⏱️", value: "<10 min", label: "Avg. WhatsApp reply" },
        ],
      },
    },

    {
      type: "story",
      data: {
        title: "Why we started Rooted",
        subtitle: "Hair confidence begins with honest guidance.",
        body: "We watched friends waste money on miracle promises that ignored the basics: scalp health, consistency, and realistic expectations. So we built Rooted to give people calm, honest coaching — understanding your shedding pattern and lifestyle, then guiding a gentle routine you can actually keep. No hype, just steady support.",
        backgroundImage: {
          src: img("photo-1556228453-efd6c1ff04f6", 1400),
          alt: "Hair care workspace with natural light",
        },
        signatureName: "Noah Bennett",
        signatureRole: "Founder",
      },
    },

    {
      type: "features",
      data: {
        title: "Why Rooted is different",
        subtitle: "Scalp-first, honest, and built around you.",
        items: [
          {
            icon: "🔬",
            title: "Scalp-first approach",
            description:
              "We start with scalp condition and shedding patterns, not one-size-fits-all products.",
          },
          {
            icon: "🧾",
            title: "Honest expectations",
            description:
              "Clear, realistic guidance — we never promise guaranteed regrowth or overnight results.",
          },
          {
            icon: "🧪",
            title: "Gentle, vetted routines",
            description:
              "Fragrance-conscious, scalp-friendly steps suited to sensitive and reactive skin.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp coaching",
            description:
              "Monthly check-ins to keep you consistent and adjust as your scalp responds.",
          },
        ],
      },
    },

    {
      type: "beforeAfter",
      data: {
        title: "Real journeys, real consistency",
        subtitle: "Shared with permission from our community.",
        disclaimer:
          "Individual results vary significantly and are not guaranteed. Hair care is a cosmetic routine, not a medical treatment. Persistent or sudden hair loss can have medical causes — please consult a qualified doctor or dermatologist.",
        items: [
          {
            crmName: "Anthony, 41",
            duration: "6 months",
            caseDescription:
              "Focused on scalp health and a consistent gentle routine for diffuse thinning.",
            beforeImage: { src: img("photo-1500648767791-00dcc994a43e", 800), alt: "Scalp before routine" },
            afterImage: { src: img("photo-1506794778202-cad84cf45f1d", 800), alt: "Scalp after routine" },
          },
          {
            crmName: "Renee, 36",
            duration: "5 months",
            caseDescription:
              "Built a calming post-partum shedding routine with realistic milestones.",
            beforeImage: { src: img("photo-1487412720507-e7ab37603c6f", 800), alt: "Hair before routine" },
            afterImage: { src: img("photo-1503104834685-7205e8607eb9", 800), alt: "Hair after routine" },
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
            name: "Tomas",
            location: "Portugal",
            channel: "WhatsApp",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Tomas" },
            content: {
              text: "First time someone explained my shedding honestly instead of selling a miracle. The routine is simple and I've stuck with it.",
            },
          },
          {
            name: "Grace",
            location: "Ireland",
            channel: "Trustpilot",
            avatar: { src: img("photo-1494790108377-be9c29b29330", 200), alt: "Grace" },
            content: {
              text: "Gentle, realistic, and supportive. The monthly check-ins are what keep me consistent.",
            },
          },
          {
            name: "Samuel",
            location: "South Africa",
            channel: "Instagram",
            avatar: { src: img("photo-1500648767791-00dcc994a43e", 200), alt: "Samuel" },
            content: {
              text: "No false promises. They even told me when to see a dermatologist — that honesty earned my trust.",
            },
          },
        ],
      },
    },

    {
      type: "guarantee",
      data: {
        title: "Honest care you can trust",
        description: "Support you can rely on, with no false promises.",
        items: [
          { icon: "🔒", title: "Privacy first", subtitle: "Your photos and details stay confidential and are never sold." },
          { icon: "🧾", title: "No false promises", subtitle: "Honest, realistic guidance — never guaranteed-regrowth claims." },
          { icon: "🩺", title: "We flag medical signs", subtitle: "If something needs a doctor, we'll tell you to see one." },
          { icon: "🤝", title: "Free follow-ups", subtitle: "Ongoing coaching as your scalp changes, at no cost." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Frequently asked questions" },
        items: [
          {
            question: "Is the scalp assessment really free?",
            answer: "Yes. Your assessment, routine, and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "Will this regrow my hair?",
            answer: "We can't promise that — no honest provider can. We focus on scalp health and realistic, consistent routines.",
          },
          {
            question: "Do I have to buy your products?",
            answer: "No. We give independent guidance and can work with products you already use.",
          },
          {
            question: "When should I see a doctor instead?",
            answer: "For sudden, patchy, or rapid hair loss, please consult a dermatologist — we'll always point you there if needed.",
          },
        ],
      },
    },
  ],

  footer: {
    brandName: "Rooted",
    copyrightYear: "2026",
    contactEmail: "hello@rooted-care.com",
    privacyPolicy:
      "We use the photos and details you share only to provide your scalp assessment. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Rooted provides cosmetic hair-care guidance for informational purposes only and does not diagnose or treat medical conditions. Always consult a qualified professional for medical hair loss.",
  },

  floatingButton: {
    text: "🌱 Free scalp check",
    link: WHATSAPP,
  },
};
