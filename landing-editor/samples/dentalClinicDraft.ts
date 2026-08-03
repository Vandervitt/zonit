// landing-editor/samples/dentalClinicDraft.ts
//
// 牙科 / 医美「免费微笑评估 + 预约咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 预约咨询，无任何下单 / 结账 / 报价付款语义。
//
// 合规要点：
// - 本模板刻意不含 beforeAfter 区块：样例无法提供真实且已授权的患者照片，
//   拿库存肖像充当疗效对比等于伪造医疗证据，disclaimer 也兜不住。
//   诊所若有合规的真实案例，可在编辑器中自行添加该区块。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15557654321 为占位号码，上线前替换为真实诊所号码。
import type { LandingPageDraft } from "@/types/schema.draft";

/** Unsplash 图片地址助手：统一裁剪与画质参数。 */
const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;


export const dentalClinicDraft: LandingPageDraft = {
  contact: {
    primary: "whatsapp",
    whatsapp: "+15557654321",
    email: "hello@lumora-dental.com",
  },
  hero: {
    backgroundImage: {
      src: img("photo-1606811841689-23dfddce3e95", 1600),
      alt: "Bright modern dental studio interior",
    },
    badge: { emoji: "🦷", text: "Certified cosmetic dentists" },
    title: "A confident smile starts with a free assessment",
    subtitle:
      "Tell us what you'd like to improve and get a personalized smile plan from our dentists over WhatsApp — no pressure, no guesswork.",
    cta: { text: "Book my free smile assessment", target: { kind: "primary", prefill: "Hi Lumora, I'd like to book a free smile assessment" } },
    secondaryCta: { text: "See smile transformations", target: { kind: "url", url: "https://instagram.com/lumora.dental" } },
    endorsementText: "Trusted by 18,000+ patients across 20+ countries",
    showcase: {
      type: "image",
      src: img("photo-1588776814546-1ffcf47267a5"),
      alt: "Patient smiling after dental treatment",
    },
  },

  sections: [
    // 1. 数据展示
    {
      type: "stats",
      data: {
        title: "Care patients trust",
        subtitle: "A few numbers behind our dental team.",
        items: [
          { icon: "😁", value: "18,000+", label: "Smiles assessed" },
          { icon: "🌍", value: "20+", label: "Countries served" },
          { icon: "⭐", value: "4.9/5", label: "Average patient rating" },
          { icon: "⏱️", value: "<15 min", label: "Avg. WhatsApp reply" },
        ],
      },
    },

    // 2. 特性（core-value 组）
    {
      type: "features",
      data: {
        title: "Why patients choose Lumora",
        subtitle: "Gentle, transparent care led by certified dentists.",
        items: [
          {
            icon: "🧑‍⚕️",
            title: "Certified cosmetic dentists",
            description:
              "Every plan is created and reviewed by licensed dentists with years of cosmetic experience.",
          },
          {
            icon: "🪥",
            title: "Comfort-first treatment",
            description:
              "Modern, low-pain techniques and a calm studio designed to ease dental anxiety.",
          },
          {
            icon: "🔍",
            title: "Clear, honest plans",
            description:
              "We explain every option and only recommend the treatment your smile actually needs.",
          },
          {
            icon: "💬",
            title: "WhatsApp aftercare",
            description:
              "Message us anytime with questions before or after your visit — we're here to help.",
          },
        ],
      },
    },

    // 3. 产品（提供的治疗项目，纯展示）
    {
      type: "products",
      data: {
        title: "Treatments we offer",
        subtitle: "Explore the options — your assessment will recommend what fits you.",
        items: [
          {
            name: "Teeth whitening",
            description: "Brighten your smile safely with dentist-supervised whitening.",
            backgroundImage: { src: img("photo-1607008829749-c0f284a49841", 800), alt: "Teeth whitening" },
          },
          {
            name: "Porcelain veneers",
            description: "Reshape and perfect your smile with natural-looking veneers.",
            backgroundImage: { src: img("photo-1609840114035-3c981b782dfe", 800), alt: "Dental veneers" },
          },
          {
            name: "Clear aligners",
            description: "Straighten your teeth discreetly with custom clear aligners.",
            backgroundImage: { src: img("photo-1620331311520-246422fd82f9", 800), alt: "Clear aligners" },
          },
          {
            name: "Dental implants",
            description: "Restore missing teeth with durable, natural-feeling implants.",
            backgroundImage: { src: img("photo-1598256989800-fe5f95da9787", 800), alt: "Dental implant model" },
          },
        ],
      },
    },

    // 4. 服务流程
    {
      type: "process",
      data: {
        title: "How your free assessment works",
        subtitle: "Three simple steps, all over WhatsApp.",
        steps: [
          {
            title: "Message us on WhatsApp",
            description: "Tap the button and tell us what you'd like to improve about your smile.",
            image: { src: img("photo-1612531385446-f7e6d131e1d0", 800), alt: "Dentist reviewing smile" },
          },
          {
            title: "Share a few smile photos",
            description: "Send photos and answer a short questionnaire so our dentists can review.",
          },
          {
            title: "Get your personalized plan",
            description: "A dentist sends a tailored smile plan and helps you book a visit when ready.",
          },
        ],
      },
    },

    // 5. 评价
    {
      type: "reviews",
      data: {
        title: "What our patients say",
        description: "Real messages from people we've cared for.",
        items: [
          {
            name: "Camila",
            location: "Portugal",
            channel: "WhatsApp",
            avatar: { src: img("photo-1494790108377-be9c29b29330", 200), alt: "Camila" },
            content: {
              text: "They explained every option clearly and never pushed me. I finally love my smile.",
            },
          },
          {
            name: "Daniel",
            location: "Ireland",
            channel: "Google",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Daniel" },
            content: {
              text: "Fast replies and a genuinely gentle team. The whole visit was painless and calm.",
            },
          },
          {
            name: "Noor",
            location: "United Arab Emirates",
            channel: "Instagram",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Noor" },
            content: {
              text: "Loved how thorough the assessment was. No surprises, just honest advice.",
            },
          },
        ],
      },
    },

    // 6. 品牌故事
    {
      type: "story",
      data: {
        title: "Our story",
        subtitle: "Why we started Lumora.",
        body: "We opened Lumora to make cosmetic dentistry feel calm, honest, and approachable. Too many people avoid the dentist out of fear or confusion about cost and options. Our team takes the time to listen, explain, and build a plan around what you actually want — so every visit feels like a step toward a smile you're proud of.",
        backgroundImage: {
          src: img("photo-1629909613654-28e377c37b09", 1400),
          alt: "Modern dental studio with natural light",
        },
        signatureName: "Dr. Mara Oliveira",
        signatureRole: "Lead Dentist & Founder",
      },
    },

    // 7. 安全保障（非交易：资质 / 隐私 / 无推销 / 免费跟进）
    {
      type: "guarantee",
      data: {
        title: "Your care, in safe hands",
        description: "Standards you can count on, before and after your visit.",
        items: [
          { icon: "🛡️", title: "Licensed & certified", subtitle: "All treatments are performed by registered, qualified dentists." },
          { icon: "🔒", title: "Privacy first", subtitle: "Your photos and health details stay confidential and are never sold." },
          { icon: "🙅", title: "No pushy sales", subtitle: "Honest advice — we only suggest what your smile genuinely needs." },
          { icon: "🤝", title: "Free follow-ups", subtitle: "Aftercare guidance over WhatsApp at no extra cost." },
        ],
      },
    },

    // 8. 常见问题
    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Frequently asked questions" },
        items: [
          {
            question: "Is the smile assessment really free?",
            answer: "Yes. Your initial WhatsApp assessment and follow-up questions are completely free.",
          },
          {
            question: "Do I have to commit to treatment?",
            answer: "Not at all. The assessment is informational — you decide if and when to book a visit.",
          },
          {
            question: "How fast will a dentist reply?",
            answer: "Our team usually replies within 15 minutes during clinic hours.",
          },
          {
            question: "Can you help with dental anxiety?",
            answer: "Absolutely. Comfort-first care and gentle techniques are at the heart of what we do.",
          },
        ],
      },
    },
  ],
  // 第二通道：主转化仍是 WhatsApp，本表单承接不用 WhatsApp / 更愿意留邮箱的访客。
  // 收的是同一件事（smile assessment），只是换个落点，故文案与 CTA 主题保持一致。
  leadForm: {
    enabled: true,
    title: "Prefer email? Get your smile assessment here",
    description:
      "Not on WhatsApp, or would rather not message? Fill this in and one of our dentists will send your smile assessment by email instead. Same free advice, no obligation to buy anything.",
    submitText: "Send me my smile assessment",
    successMessage:
      "Thanks — one of our dentists will email you your smile assessment shortly. Check your spam folder if it hasn't arrived.",
    fields: {
      name: { enabled: true, required: true, label: "Your name" },
      email: { enabled: true, required: true, label: "Email (where we send it)" },
      phone: { enabled: false, required: false },
      whatsapp: { enabled: true, required: false, label: "WhatsApp (optional, if you'd rather chat)" },
      telegram: { enabled: false, required: false },
      message: {
        enabled: true,
        required: true,
        label: "What you'd like to improve about your smile",
      },
    },
  },

  footer: {
    brandName: "Lumora Dental Studio",
    copyrightYear: "2026",
    privacyPolicy:
      "We collect only the photos and information you share with us to provide your smile assessment. Your data is kept confidential, never sold, and you can request its deletion at any time.",
    termsOfService:
      "Lumora provides cosmetic dental information for guidance only. It is not a medical diagnosis. Treatment suitability is confirmed only after an in-person clinical examination by a qualified dentist.",
  },

  floatingButton: {
    text: "💬 Free smile assessment",
    target: { kind: "channel", channel: "whatsapp", prefill: "Hi Lumora, I'd like to book a free smile assessment" },
  },
};
