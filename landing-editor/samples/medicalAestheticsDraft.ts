// landing-editor/samples/medicalAestheticsDraft.ts
//
// 医美诊所「面诊评估 + 表单预约」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 主转化为页内留资表单（诉求与既往治疗史需要成段描述），WhatsApp 作次级通道。
// 全程无下单 / 结账 / 疗程套餐售卖语义。
//
// 合规要点（risk: high）：
// - 注射与能量设备治疗属医疗行为，不得承诺效果、维持时长或「零风险」。
// - 不得出现疗程包价、限时优惠等促销语义，避免广告平台医疗品类拒审。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15557654321 为占位号码，上线前替换为真实诊所号码。
import type { LandingPageDraft } from "@/types/schema.draft";

/** Unsplash 图片地址助手：统一裁剪与画质参数。 */
const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** 页内留资表单锚点：本模板以表单为主转化路径。 */


export const medicalAestheticsDraft: LandingPageDraft = {
  contact: {
    primary: "form",
    whatsapp: "+15557654321",
    email: "consultations@aurelle-clinic.example",
  },
  hero: {
    backgroundImage: {
      src: img("photo-1519494026892-80bbd2d6fd0d", 1600),
      alt: "Calm clinic reception area",
    },
    badge: { emoji: "🩺", text: "Doctor-led aesthetic medicine" },
    title: "Start with a consultation, not a treatment menu",
    subtitle:
      "Tell us what bothers you when you look in the mirror. A doctor assesses your face as a whole and tells you what would actually help — including when the answer is nothing at all.",
    cta: { text: "Request my consultation", target: { kind: "primary" } },
    secondaryCta: { text: "Ask a question on WhatsApp", target: { kind: "channel", channel: "whatsapp", prefill: "Hi Aurelle, I'd like to ask about a consultation" } },
    endorsementText: "Doctor-led since 2014 · 12,000+ consultations",
    showcase: {
      type: "image",
      src: img("photo-1521791136064-7986c2920216"),
      alt: "Consultation between practitioner and client",
    },
  },

  sections: [
    // 1. 数据展示
    {
      type: "stats",
      data: {
        title: "A practice built on repeat patients",
        subtitle: "The numbers we're judged on.",
        items: [
          { icon: "🧑‍⚕️", value: "12,000+", label: "Consultations" },
          { icon: "🔁", value: "78%", label: "Patients who return" },
          { icon: "⭐", value: "4.9/5", label: "Average rating" },
          { icon: "🗓️", value: "3 days", label: "Typical wait for an appointment" },
        ],
      },
    },

    // 2. 特性（core-value 组）
    {
      type: "features",
      data: {
        title: "How we practise",
        subtitle: "The things that make a clinic worth returning to.",
        items: [
          {
            icon: "👩‍⚕️",
            title: "Doctors only, never delegated",
            description:
              "Every injectable and energy-device treatment is performed by a registered doctor, not a technician.",
          },
          {
            icon: "🪞",
            title: "We assess the whole face",
            description:
              "Volume, proportion, and how you age as a person — not the one line you came in worried about.",
          },
          {
            icon: "🚫",
            title: "Conservative by default",
            description:
              "We would rather do less and see you again than overtreat once. Refusing a request is part of the job.",
          },
          {
            icon: "🧾",
            title: "Every product traceable",
            description:
              "Batch numbers for all injectables are recorded in your file and available to you on request.",
          },
        ],
      },
    },

    // 3. 提供的治疗方向（纯展示，无价格）
    {
      type: "products",
      data: {
        title: "What we treat",
        subtitle: "Your consultation determines which of these — if any — suits you.",
        items: [
          {
            name: "Injectable relaxants",
            description:
              "Softening expression lines while keeping your face mobile and readable.",
            backgroundImage: { src: img("photo-1612349317150-e413f6a5b16d", 800), alt: "Doctor at the clinic" },
          },
          {
            name: "Volume restoration",
            description:
              "Restoring support where it has been lost, rather than adding volume where it never was.",
            backgroundImage: { src: img("photo-1576091160550-2173dba999ef", 800), alt: "Clinical notes and stethoscope" },
          },
          {
            name: "Skin quality treatments",
            description:
              "Resurfacing, microneedling, and medical-grade skincare for texture, tone, and scarring.",
            backgroundImage: { src: img("photo-1512290923902-8a9f81dc236c", 800), alt: "Skincare device close-up" },
          },
          {
            name: "Medical skincare plans",
            description:
              "Often the right first step. Prescription-strength routines supervised over several months.",
            backgroundImage: { src: img("photo-1556228720-195a672e8a03", 800), alt: "Skincare products on a clinical surface" },
          },
        ],
      },
    },

    // 4. 服务流程
    {
      type: "process",
      data: {
        title: "What a consultation involves",
        subtitle: "Around 45 minutes, and you leave with a plan in writing.",
        steps: [
          {
            title: "Tell us what's bothering you",
            description:
              "Submit the form with your concern, any previous treatments, and your medical history.",
            image: { src: img("photo-1576091160399-112ba8d25d1d", 800), alt: "Medical consultation" },
          },
          {
            title: "Facial assessment with a doctor",
            description:
              "In person or by video. We look at movement, proportion, and skin quality, not a checklist.",
          },
          {
            title: "An honest recommendation",
            description:
              "What would help, what wouldn't, what it involves, and what the recovery actually looks like.",
          },
          {
            title: "Decide in your own time",
            description:
              "Treatment is never performed on the day of a first consultation. You go home and think about it.",
          },
        ],
      },
    },

    // 5. 评价
    {
      type: "reviews",
      data: {
        title: "What patients say",
        description: "Feedback from people who have been through a consultation.",
        items: [
          {
            name: "Ines",
            location: "Portugal",
            channel: "Google",
            avatar: { src: img("photo-1494790108377-be9c29b29330", 200), alt: "Ines" },
            content: {
              text: "She talked me out of the treatment I came in asking for and suggested something smaller. I still look like me.",
            },
          },
          {
            name: "Farah",
            location: "United Arab Emirates",
            channel: "WhatsApp",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Farah" },
            content: {
              text: "The only clinic that asked about my medical history properly before touching anything.",
            },
          },
          {
            name: "Elena",
            location: "Italy",
            channel: "Instagram",
            avatar: { src: img("photo-1517841905240-472988babdf9", 200), alt: "Elena" },
            content: {
              text: "No pressure, no packages, no upselling. Just a doctor explaining what she'd do and why.",
            },
          },
        ],
      },
    },

    // 6. 品牌故事
    {
      type: "story",
      data: {
        title: "Why we consult before we treat",
        subtitle: "The practice behind the clinic.",
        body: "Aurelle started because too many patients were arriving having been treated from a menu — a syringe here, a device there, with no one looking at the face as a whole. Faces age in patterns, and treating a single line in isolation is how people end up looking done rather than well. So we consult first, always, and we treat conservatively. If you leave a consultation having decided not to have anything, we consider that a good outcome.",
        backgroundImage: {
          src: img("photo-1631217868264-e5b90bb7e133", 1400),
          alt: "Doctor speaking with a patient",
        },
        signatureName: "Dr. Camille Roux",
        signatureRole: "Medical Director",
      },
    },

    // 7. 安全保障（非交易：资质 / 隐私 / 无推销 / 术后跟进）
    {
      type: "guarantee",
      data: {
        title: "How we keep you safe",
        description: "The standards behind every treatment we perform.",
        items: [
          { icon: "🛡️", title: "Registered doctors only", subtitle: "All treatments performed by doctors on the medical register, never delegated." },
          { icon: "🧾", title: "Traceable products", subtitle: "Batch numbers recorded in your file and available to you on request." },
          { icon: "🔒", title: "Confidential records", subtitle: "Photos and medical history are held as medical data and never sold or shared." },
          { icon: "📞", title: "A doctor on call after treatment", subtitle: "Direct access to your treating doctor throughout your recovery." },
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
            question: "Will I be treated on the day I consult?",
            answer:
              "No. We deliberately separate consultation from treatment so you can decide without any pressure in the room.",
          },
          {
            question: "What if you don't think I need anything?",
            answer:
              "We'll say so. A consultation that ends in a skincare plan, or in nothing at all, is a normal outcome here.",
          },
          {
            question: "How long do results last?",
            answer:
              "It varies considerably between individuals depending on metabolism, the area treated, and the product used. Your doctor gives you a realistic range for your case rather than a headline figure.",
          },
          {
            question: "Are there risks?",
            answer:
              "Yes — every medical treatment carries risk. Your consultation covers the specific risks, side effects, and recovery for anything being considered, in writing.",
          },
          {
            question: "Can I consult by video first?",
            answer:
              "Yes, for an initial assessment. Any treatment requires an in-person examination beforehand.",
          },
        ],
      },
    },
  ],

  leadForm: {
    enabled: true,
    title: "Request a consultation",
    description:
      "Tell us what you'd like to address and a coordinator will offer you appointment times with a doctor. Submitting this form books nothing and commits you to nothing — it starts a conversation.",
    submitText: "Request my consultation",
    successMessage:
      "Thanks — a coordinator will be in touch within one working day with appointment options.",
    fields: {
      name: { enabled: true, required: true, label: "Your name" },
      email: { enabled: true, required: true, label: "Email" },
      phone: { enabled: false, required: false },
      whatsapp: { enabled: true, required: false, label: "WhatsApp (optional)" },
      telegram: { enabled: false, required: false },
      message: {
        enabled: true,
        required: true,
        label: "What you'd like to address, and any previous treatments or medical conditions",
      },
    },
  },

  footer: {
    brandName: "Aurelle Aesthetic Medicine",
    copyrightYear: "2026",
    privacyPolicy:
      "We collect only the information you provide in order to arrange and prepare your consultation. Medical history and photographs are held as confidential medical records, are never sold or shared without your written consent, and can be deleted on request.",
    termsOfService:
      "Information on this page is general and does not constitute medical advice or a diagnosis. Submitting this form does not create a treating relationship. Suitability for any treatment, along with its risks and expected outcome, is determined only in a consultation with a registered doctor following an in-person examination. Individual results vary and no outcome is guaranteed.",
  },

  floatingButton: {
    text: "🗓️ Request a consultation",
    target: { kind: "primary" },
  },
};
