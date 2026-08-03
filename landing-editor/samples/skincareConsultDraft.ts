// landing-editor/samples/skincareConsultDraft.ts
//
// 美妆 / 护肤品牌「肤质咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 咨询，无任何下单 / 结账 / 订阅语义。
//
// 合规要点：
// - 本模板刻意不含 beforeAfter 区块：样例无法提供真实且已授权的客户照片，
//   拿库存肖像编造前后对比等于伪造效果证据，disclaimer 也兜不住。
//   商家若有合规的真实案例，可在编辑器中自行添加该区块。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

/** Unsplash 图片地址助手：统一裁剪与画质参数。 */
const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;


export const skincareConsultDraft: LandingPageDraft = {
  contact: {
    primary: "whatsapp",
    whatsapp: "+15551234567",
    email: "hello@aurae-skin.com",
  },
  hero: {
    backgroundImage: {
      src: img("photo-1612817288484-6f916006741a", 1600),
      alt: "Soft skincare flatlay on a neutral background",
    },
    badge: { emoji: "✨", text: "Dermatologist-guided skincare" },
    title: "Skincare that actually fits your skin",
    subtitle:
      "Get a free, personalized skin analysis from our advisors over WhatsApp — no guesswork, no generic routines.",
    cta: { text: "Get my free skin consult", target: { kind: "primary", prefill: "Hi Aurae, I'd like a free skin consultation" } },
    secondaryCta: { text: "See our routines on Instagram", target: { kind: "url", url: "https://instagram.com/aurae.skin" } },
    endorsementText: "Trusted by 30,000+ people in 30+ countries",
    showcase: {
      type: "image",
      src: img("photo-1748543669178-efd3de4e64e0"),
      alt: "Serum textures swatched on a neutral surface",
    },
  },

  sections: [
    // 1. 数据展示
    {
      type: "stats",
      data: {
        title: "Results people feel",
        subtitle: "A few numbers behind our skin advisors.",
        items: [
          { icon: "💧", value: "30,000+", label: "Skin consultations" },
          { icon: "🌍", value: "30+", label: "Countries served" },
          { icon: "⭐", value: "4.9/5", label: "Average advisor rating" },
          { icon: "⏱️", value: "<10 min", label: "Avg. WhatsApp reply" },
        ],
      },
    },

    // 2. 特性（core-value 组）
    {
      type: "features",
      data: {
        title: "Why people choose Aurae",
        subtitle: "Personalized, transparent, and guided by experts.",
        items: [
          {
            icon: "🧬",
            title: "Built around your skin",
            description:
              "We start with your skin type, concerns, and climate — never a one-size-fits-all routine.",
          },
          {
            icon: "🔬",
            title: "Full ingredient transparency",
            description:
              "Every recommendation comes with the actives, concentrations, and why they fit you.",
          },
          {
            icon: "👩‍⚕️",
            title: "Dermatologist-reviewed",
            description:
              "Routines are checked by licensed skincare advisors before they reach you.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp support",
            description:
              "Adjust your routine anytime as your skin changes — just send us a message.",
          },
        ],
      },
    },

    // 3. 服务流程
    {
      type: "process",
      data: {
        title: "How your free consult works",
        subtitle: "Four simple steps, all over WhatsApp.",
        steps: [
          {
            title: "Say hi on WhatsApp",
            description: "Tap the button and tell us your main skin goal.",
            image: { src: img("photo-1570172619644-dfd03ed5d881", 800), alt: "Skincare cream texture" },
          },
          {
            title: "Quick skin questionnaire",
            description: "Answer a few questions about your skin type, concerns, and current routine.",
          },
          {
            title: "Get your custom plan",
            description: "An advisor sends a tailored routine with clear ingredient explanations.",
          },
          {
            title: "Refine as you go",
            description: "Check in anytime and we'll fine-tune your routine for free.",
          },
        ],
      },
    },

    // 4. 评价
    {
      type: "reviews",
      data: {
        title: "What our community says",
        description: "Real messages from people we've helped.",
        items: [
          {
            name: "Sofia",
            location: "Spain",
            channel: "WhatsApp",
            avatar: { src: img("photo-1494790108377-be9c29b29330", 200), alt: "Sofia" },
            content: {
              text: "I finally understand my own skin. The advisor explained every step instead of just selling me things.",
            },
          },
          {
            name: "James",
            location: "United Kingdom",
            channel: "Trustpilot",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "James" },
            content: {
              text: "Replies were fast and genuinely helpful. My routine is simpler now and my skin is calmer.",
            },
          },
          {
            name: "Aisha",
            location: "United Arab Emirates",
            channel: "Instagram",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Aisha" },
            content: {
              text: "Loved that it was tailored to my climate and sensitive skin. No pressure, just honest advice.",
            },
          },
        ],
      },
    },

    // 5. 品牌故事
    {
      type: "story",
      data: {
        title: "Our story",
        subtitle: "Why we started Aurae.",
        body: "After years of confusing routines and wasted products, we built Aurae to give people honest, personalized skincare guidance. Our advisors take the time to understand your skin and explain the why behind every recommendation — so you can make confident choices, not impulse ones.",
        backgroundImage: {
          src: img("photo-1522338242992-e1a54906a8da", 1400),
          alt: "Skincare workspace with natural light",
        },
        signatureName: "Elena Park",
        signatureRole: "Founder",
      },
    },

    // 6. 安全保障（非交易：隐私 / 成分 / 无推销 / 免费跟进）
    {
      type: "guarantee",
      data: {
        title: "Your skin, in safe hands",
        description: "Care you can trust, before and after the consult.",
        items: [
          { icon: "🔒", title: "Privacy first", subtitle: "Your skin information stays confidential and is never sold." },
          { icon: "🧴", title: "Gentle, vetted ingredients", subtitle: "We avoid harsh actives and undisclosed fragrances." },
          { icon: "🙅", title: "No pushy sales", subtitle: "Honest advice — we only suggest what your skin actually needs." },
          { icon: "🤝", title: "Free follow-ups", subtitle: "Ongoing guidance as your skin changes, at no extra cost." },
        ],
      },
    },

    // 7. 常见问题
    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Frequently asked questions" },
        items: [
          {
            question: "Is the skin consultation really free?",
            answer: "Yes. Your initial WhatsApp consultation and all follow-ups are completely free.",
          },
          {
            question: "Do I have to get anything?",
            answer: "No. Our advice is free and independent — what you do with your routine is entirely up to you.",
          },
          {
            question: "How fast will I hear back?",
            answer: "Our advisors usually reply within 10 minutes during business hours.",
          },
          {
            question: "Can you help sensitive or acne-prone skin?",
            answer: "Absolutely. We tailor gentle routines for sensitive, acne-prone, and reactive skin.",
          },
        ],
      },
    },
  ],
  // 第二通道：主转化仍是 WhatsApp，本表单承接不用 WhatsApp / 更愿意留邮箱的访客。
  // 收的是同一件事（skin consult），只是换个落点，故文案与 CTA 主题保持一致。
  leadForm: {
    enabled: true,
    title: "Prefer email? Get your skin consult here",
    description:
      "Not on WhatsApp, or would rather not message? Fill this in and a skincare specialist will send your skin consult by email instead. Same free advice, no obligation to buy anything.",
    submitText: "Send me my skin consult",
    successMessage:
      "Thanks — a skincare specialist will email you your skin consult shortly. Check your spam folder if it hasn't arrived.",
    fields: {
      name: { enabled: true, required: true, label: "Your name" },
      email: { enabled: true, required: true, label: "Email (where we send it)" },
      phone: { enabled: false, required: false },
      whatsapp: { enabled: true, required: false, label: "WhatsApp (optional, if you'd rather chat)" },
      telegram: { enabled: false, required: false },
      message: {
        enabled: true,
        required: true,
        label: "Your skin type and what you'd like to improve",
      },
    },
  },

  footer: {
    brandName: "Aurae Skincare",
    copyrightYear: "2026",
    privacyPolicy:
      "We collect only the skin information you share with us to provide your consultation. Your data is kept confidential, never sold, and you can request its deletion at any time.",
    termsOfService:
      "Aurae provides cosmetic skincare guidance for informational purposes only and does not offer medical diagnosis or treatment. Always consult a qualified professional for medical skin conditions.",
  },

  floatingButton: {
    text: "💬 Free skin consult",
    target: { kind: "channel", channel: "whatsapp", prefill: "Hi Aurae, I'd like a free skin consultation" },
  },
};
