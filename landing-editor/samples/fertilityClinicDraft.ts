// landing-editor/samples/fertilityClinicDraft.ts
//
// 生殖医学中心「初诊预约 + 表单留资」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 主转化为页内留资表单，电话作次级通道（这个品类患者常想直接找人说话）。
// 全程无下单 / 结账 / 疗程套餐售卖语义。
//
// 合规要点（risk: high）：
// - 生殖医疗不得承诺成功率结果，引用统计必须标注来源年份与人群口径。
// - 文案避免制造年龄焦虑式的胁迫感——该品类患者本就承受压力，且平台审查严格。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - 电话号码 +1 555 010 0142 为占位号码，上线前替换为真实中心号码。
import type { LandingPageDraft } from "@/types/schema.draft";

/** Unsplash 图片地址助手：统一裁剪与画质参数。 */
const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** 页内留资表单锚点：本模板以表单为主转化路径。 */


export const fertilityClinicDraft: LandingPageDraft = {
  contact: {
    primary: "form",
    phone: "+15550100142",
    email: "care@willowbrook-fertility.example",
  },
  hero: {
    backgroundImage: {
      src: img("photo-1606811841689-23dfddce3e95", 1600),
      alt: "Quiet, warm clinic interior",
    },
    badge: { emoji: "🌱", text: "Consultant-led fertility care" },
    title: "Before anything else, you deserve to know where you stand",
    subtitle:
      "A first consultation is about understanding your situation — what the tests show, what your realistic options are, and what each one would ask of you. Treatment is a decision that comes later, if at all.",
    cta: { text: "Request a first consultation", target: { kind: "primary" } },
    secondaryCta: { text: "Speak to our care team", target: { kind: "channel", channel: "phone" } },
    endorsementText: "Regulated fertility centre · Consultant-led since 2009",
    showcase: {
      type: "image",
      src: img("photo-1631217868264-e5b90bb7e133"),
      alt: "Consultant meeting with patients",
    },
  },

  sections: [
    // 1. 数据展示（口径明确，不夸大）
    {
      type: "stats",
      data: {
        title: "About our centre",
        subtitle: "Figures from our most recent published reporting year.",
        items: [
          { icon: "🩺", value: "16 yrs", label: "Consultant-led practice" },
          { icon: "🔬", value: "4", label: "On-site embryology labs" },
          { icon: "🗣️", value: "9", label: "Languages spoken by our care team" },
          { icon: "📄", value: "100%", label: "Patients given written treatment plans" },
        ],
      },
    },

    // 2. 特性（core-value 组）
    {
      type: "features",
      data: {
        title: "How our care works",
        subtitle: "What patients tell us made the difference.",
        items: [
          {
            icon: "👩‍⚕️",
            title: "The same consultant throughout",
            description:
              "You are not passed between clinicians. One consultant knows your history and sees it through.",
          },
          {
            icon: "🧭",
            title: "Investigation before treatment",
            description:
              "We establish what is actually happening before recommending any pathway. Sometimes the answer is simpler than expected.",
          },
          {
            icon: "💬",
            title: "A counsellor from day one",
            description:
              "Emotional support is part of the care, not an add-on you have to ask for.",
          },
          {
            icon: "📊",
            title: "Your own numbers, not headline rates",
            description:
              "Success statistics are meaningless until they're for someone with your history. Yours are explained in writing.",
          },
        ],
      },
    },

    // 3. 提供的方向（纯展示，无价格）
    {
      type: "products",
      data: {
        title: "Pathways we support",
        subtitle: "Your consultation establishes which of these is relevant to you.",
        items: [
          {
            name: "Fertility investigation",
            description:
              "Hormone profiling, imaging, and semen analysis to establish a clear picture before decisions.",
            backgroundImage: { src: img("photo-1579154204601-01588f351e67", 800), alt: "Laboratory analysis" },
          },
          {
            name: "Ovulation support & IUI",
            description:
              "Lower-intervention pathways that are appropriate more often than people expect.",
            backgroundImage: { src: img("photo-1576091160399-112ba8d25d1d", 800), alt: "Clinical consultation" },
          },
          {
            name: "IVF & ICSI",
            description:
              "Full-cycle care with your own consultant and embryology team, explained step by step.",
            backgroundImage: { src: img("photo-1579684385127-1ef15d508118", 800), alt: "Clinical team at work" },
          },
          {
            name: "Fertility preservation",
            description:
              "Egg and sperm freezing, including for patients facing medical treatment that affects fertility.",
            backgroundImage: { src: img("photo-1516574187841-cb9cc2ca948b", 800), alt: "Clinical equipment" },
          },
        ],
      },
    },

    // 4. 服务流程
    {
      type: "process",
      data: {
        title: "What happens after you get in touch",
        subtitle: "No commitment at any stage.",
        steps: [
          {
            title: "Tell us your situation",
            description:
              "Share as much or as little as you're comfortable with. A care coordinator reads every enquiry personally.",
            image: { src: img("photo-1576091160550-2173dba999ef", 800), alt: "Clinical notes being prepared" },
          },
          {
            title: "First consultation",
            description:
              "60 minutes with a consultant, in person or by video, going through your history and any previous treatment.",
          },
          {
            title: "Investigation, if needed",
            description:
              "Tests are arranged only where they would change the recommendation. We explain why each one is being done.",
          },
          {
            title: "A written plan",
            description:
              "Your options, what each involves, realistic expectations for your case, and time to consider it all.",
          },
        ],
      },
    },

    // 5. 评价
    {
      type: "reviews",
      data: {
        title: "In patients' own words",
        description: "Shared with permission.",
        items: [
          {
            name: "Marta & Jonas",
            location: "Germany",
            channel: "Email",
            avatar: { src: img("photo-1494790108377-be9c29b29330", 200), alt: "Marta" },
            content: {
              text: "The first clinic that didn't rush us toward treatment. They investigated properly and found something two other centres had missed.",
            },
          },
          {
            name: "Aisha",
            location: "United Kingdom",
            channel: "Google",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Aisha" },
            content: {
              text: "Having the same consultant every single appointment changed everything about how the process felt.",
            },
          },
          {
            name: "Pedro",
            location: "Brazil",
            channel: "WhatsApp",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Pedro" },
            content: {
              text: "They were honest with us about the odds for our situation. Hard to hear, but we could finally make a real decision.",
            },
          },
        ],
      },
    },

    // 6. 品牌故事
    {
      type: "story",
      data: {
        title: "Why we start with understanding",
        subtitle: "The thinking behind our centre.",
        body: "Fertility care has a habit of moving people straight to treatment, because treatment is what a clinic sells. But a significant number of patients who arrive expecting IVF turn out to need something less invasive — and some need investigation into a cause nobody has looked for yet. We built Willowbrook around getting that first part right: a proper investigation, one consultant who stays with you, and honest numbers for your situation rather than the ones that look best on a website.",
        backgroundImage: {
          src: img("photo-1629909613654-28e377c37b09", 1400),
          alt: "Clinic interior in natural light",
        },
        signatureName: "Dr. Helena Vasquez",
        signatureRole: "Medical Director",
      },
    },

    // 7. 安全保障（非交易：监管 / 隐私 / 支持 / 透明）
    {
      type: "guarantee",
      data: {
        title: "What you can rely on",
        description: "Commitments that hold at every stage of your care.",
        items: [
          { icon: "🏛️", title: "Regulated & inspected", subtitle: "Licensed by the national fertility regulator and subject to routine inspection." },
          { icon: "🔒", title: "Absolute confidentiality", subtitle: "Your records are medical data, held securely and never shared without your consent." },
          { icon: "💬", title: "Counselling included", subtitle: "Access to a fertility counsellor at every stage, at no additional cost." },
          { icon: "📄", title: "Everything in writing", subtitle: "Plans, risks, and realistic expectations documented so you can consider them at home." },
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
            question: "Do we have to commit to treatment to consult?",
            answer:
              "No. Many patients come for a first consultation and investigation, then take months to decide — or decide against treatment. That is entirely normal.",
          },
          {
            question: "What are the chances of success?",
            answer:
              "It depends heavily on age, diagnosis, and history, and any single headline figure would be misleading. Your consultant gives you figures relevant to your specific situation, with the population and year they come from.",
          },
          {
            question: "Can we be seen if we've had treatment elsewhere?",
            answer:
              "Yes. Bring your previous records — reviewing what has already been tried is one of the most useful things a first consultation can do.",
          },
          {
            question: "Do you treat single patients and same-sex couples?",
            answer:
              "Yes. Our care pathways and counselling support all family structures.",
          },
          {
            question: "Is there support for the emotional side?",
            answer:
              "Yes, from the first appointment. A fertility counsellor is part of your care team rather than a referral you have to chase.",
          },
        ],
      },
    },
  ],

  leadForm: {
    enabled: true,
    title: "Request a first consultation",
    description:
      "Share as much as you feel comfortable sharing. A care coordinator reads every enquiry personally and will offer you consultation times. Submitting this form commits you to nothing.",
    submitText: "Request a consultation",
    successMessage:
      "Thank you — a care coordinator will contact you within one working day. Everything you've shared is confidential.",
    fields: {
      name: { enabled: true, required: true, label: "Your name" },
      email: { enabled: true, required: true, label: "Email" },
      phone: { enabled: true, required: false, label: "Phone (if you'd prefer we call)" },
      whatsapp: { enabled: false, required: false },
      telegram: { enabled: false, required: false },
      message: {
        enabled: true,
        required: false,
        label: "Anything you'd like us to know before we speak (optional)",
      },
    },
  },

  footer: {
    brandName: "Willowbrook Fertility Centre",
    copyrightYear: "2026",
    privacyPolicy:
      "We collect only the information you choose to share in order to arrange your consultation and provide care. Fertility records are held as sensitive medical data under strict confidentiality, are never sold or shared without your written consent, and can be deleted on request.",
    termsOfService:
      "Information on this page is general and does not constitute medical advice or a diagnosis. Submitting this form does not create a treating relationship. Suitability for any pathway, along with its risks and realistic prospects, is determined only in consultation with a consultant following clinical assessment. Outcomes vary between individuals and no result is guaranteed.",
  },

  floatingButton: {
    text: "🌱 Request a consultation",
    target: { kind: "primary" },
  },
};
