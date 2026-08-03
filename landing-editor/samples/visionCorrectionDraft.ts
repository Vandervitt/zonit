// landing-editor/samples/visionCorrectionDraft.ts
//
// 屈光手术中心「术式对比 + 适应性评估表单」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
//
// 本模板是模板库中第一套 archetype: "compare" 的样例：核心说服结构不是单向种草，
// 而是把三种术式并排摆开讲清适应人群与取舍，让访客自己判断——决策成本高、
// 访客会主动比价比方案的品类适用（屈光手术、正畸、医美设备、留学选校等）。
// 对比载体用 plans 区块（label 为展示标签而非价格），每个方案的 CTA 均指向同一
// 页内留资表单：无论访客倾向哪种术式，最终都要先做适应性评估。
//
// 合规要点（risk: high）：
// - 屈光手术属医疗行为，不得承诺术后视力结果或「终身摘镜」。
// - 三术式对比必须写明各自的禁忌与取舍，只讲优点会被平台判为误导。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15557654321 为占位号码，上线前替换为真实中心号码。
import type { LandingPageDraft } from "@/types/schema.draft";

/** Unsplash 图片地址助手：统一裁剪与画质参数。 */
const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** 页内留资表单锚点：三个方案的 CTA 与主 CTA 全部指向它。 */


export const visionCorrectionDraft: LandingPageDraft = {
  contact: {
    primary: "form",
    whatsapp: "+15557654321",
    email: "assessments@clearview-vision.example",
  },
  hero: {
    backgroundImage: {
      src: img("photo-1579684385127-1ef15d508118", 1600),
      alt: "Surgical team in an operating room",
    },
    badge: { emoji: "👁️", text: "Surgeon-led refractive centre" },
    title: "Three procedures. Only one of them is right for your eyes.",
    subtitle:
      "LASIK, SMILE, and lens implants each suit a different cornea, prescription, and lifestyle. Compare them honestly below — then let a surgeon confirm which one your eyes actually qualify for.",
    cta: { text: "Check which procedure suits me", target: { kind: "primary" } },
    secondaryCta: { text: "Ask a question on WhatsApp", target: { kind: "channel", channel: "whatsapp", prefill: "Hi Clearview, I'd like to ask which procedure suits me" } },
    endorsementText: "31,000+ suitability assessments · 1 in 5 advised against surgery",
    showcase: {
      type: "image",
      src: img("photo-1579154204601-01588f351e67"),
      alt: "Diagnostic equipment in the clinic",
    },
  },

  sections: [
    // 1. 数据展示
    {
      type: "stats",
      data: {
        title: "Our refractive practice",
        subtitle: "Figures from our published annual reporting.",
        items: [
          { icon: "👁️", value: "31,000+", label: "Suitability assessments" },
          { icon: "🚫", value: "1 in 5", label: "Advised against surgery" },
          { icon: "🔬", value: "22", label: "Diagnostic measurements per eye" },
          { icon: "⭐", value: "4.9/5", label: "Average patient rating" },
        ],
      },
    },

    // 2. 三术式并排对比（compare 范式核心区块；label 为展示标签，非价格）
    {
      type: "plans",
      data: {
        title: "Compare the three procedures",
        subtitle:
          "Every one of these has patients it suits and patients it doesn't. Here is the honest version.",
        items: [
          {
            name: "LASIK",
            label: "Flap-based · fastest recovery",
            badge: "Most performed",
            description:
              "A thin corneal flap is lifted, the tissue beneath reshaped, and the flap replaced. Functional vision usually returns within a day.",
            valueProps: [
              "Suits: low to moderate short-sightedness, astigmatism, adequate corneal thickness",
              "Recovery: most people back to desk work the next day",
              "Trade-off: the flap remains a permanent structural feature of the cornea",
              "Not for you if: your cornea is thin, or you box, wrestle, or do contact sports",
            ],
            cta: { text: "See if LASIK suits me", target: { kind: "primary" } },
          },
          {
            name: "SMILE",
            label: "Keyhole · no flap",
            description:
              "A lenticule of tissue is shaped inside the cornea and removed through a small incision. No flap is created at any point.",
            valueProps: [
              "Suits: short-sightedness with astigmatism, active lifestyles, contact-sport athletes",
              "Recovery: slightly slower visual sharpening than LASIK over the first week",
              "Trade-off: fewer surgeons are trained in it, and enhancement is more complex",
              "Not for you if: you are long-sighted, or your prescription falls outside its treatable range",
            ],
            cta: { text: "See if SMILE suits me", target: { kind: "primary" } },
          },
          {
            name: "Implantable lens",
            label: "Additive · cornea untouched",
            description:
              "A soft lens is placed inside the eye in front of the natural lens. No corneal tissue is removed, and the procedure is reversible.",
            valueProps: [
              "Suits: high prescriptions, thin corneas, patients ruled out of laser surgery",
              "Recovery: vision typically stabilises within a few days",
              "Trade-off: intraocular surgery carries a different risk profile from laser treatment",
              "Not for you if: your anterior chamber is too shallow or you have certain eye conditions",
            ],
            cta: { text: "See if a lens implant suits me", target: { kind: "primary" } },
          },
        ],
      },
    },

    // 3. 特性（core-value 组）
    {
      type: "features",
      data: {
        title: "How we decide what you qualify for",
        subtitle: "The assessment is the product here, not the surgery.",
        items: [
          {
            icon: "🔬",
            title: "22 measurements per eye",
            description:
              "Corneal topography, thickness mapping, pupil size, tear film, and retinal health — before anything is recommended.",
          },
          {
            icon: "🚫",
            title: "We turn people away",
            description:
              "About one in five people assessed are advised not to have surgery. That figure is published rather than buried.",
          },
          {
            icon: "🧑‍⚕️",
            title: "Assessed by the operating surgeon",
            description:
              "The surgeon who would perform your procedure reviews your scans and gives the recommendation personally.",
          },
          {
            icon: "🔁",
            title: "Aftercare for 12 months",
            description:
              "Scheduled reviews through the full stabilisation period, included as standard.",
          },
        ],
      },
    },

    // 4. 服务流程
    {
      type: "process",
      data: {
        title: "How the suitability assessment works",
        subtitle: "Two to three hours, and you leave knowing where you stand.",
        steps: [
          {
            title: "Submit your prescription",
            description:
              "Send your current prescription and answer a short questionnaire about your eyes and lifestyle.",
            image: { src: img("photo-1666886573531-48d2e3c2b684", 800), alt: "Clinical consultation" },
          },
          {
            title: "Full diagnostic scan",
            description:
              "A two-hour appointment covering corneal mapping, thickness, pupil, and retinal checks. Bring sunglasses — your pupils will be dilated.",
          },
          {
            title: "The surgeon's recommendation",
            description:
              "Which procedures you qualify for, which you don't and why, and the specific risks for your eyes.",
          },
          {
            title: "Decide without pressure",
            description:
              "You take the written assessment home. Nothing is scheduled on assessment day.",
          },
        ],
      },
    },

    // 5. 评价
    {
      type: "reviews",
      data: {
        title: "What patients say",
        description: "Including some who didn't end up having surgery.",
        items: [
          {
            name: "Yuki",
            location: "Japan",
            channel: "Google",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Yuki" },
            content: {
              text: "They ruled out LASIK because of my corneal thickness and explained exactly why. I had the lens implant instead.",
            },
          },
          {
            name: "Owen",
            location: "Australia",
            channel: "Email",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Owen" },
            content: {
              text: "I was told not to have surgery at all. No other clinic had mentioned my dry eye as a problem.",
            },
          },
          {
            name: "Sofia",
            location: "Mexico",
            channel: "WhatsApp",
            avatar: { src: img("photo-1494790108377-be9c29b29330", 200), alt: "Sofia" },
            content: {
              text: "The comparison made sense of three procedures I'd only ever seen advertised as if they were interchangeable.",
            },
          },
        ],
      },
    },

    // 6. 安全保障（非交易：资质 / 透明 / 隐私 / 跟进）
    {
      type: "guarantee",
      data: {
        title: "What we hold ourselves to",
        description: "Standards that apply whether or not you go ahead.",
        items: [
          { icon: "🛡️", title: "Registered ophthalmic surgeons", subtitle: "Every procedure performed by surgeons on the specialist register." },
          { icon: "📊", title: "Published outcomes", subtitle: "Our results and our decline rate are published annually, not selectively quoted." },
          { icon: "🔒", title: "Confidential records", subtitle: "Scans and medical history are held as medical data and never sold or shared." },
          { icon: "🤝", title: "Aftercare included", subtitle: "Twelve months of scheduled reviews at no additional cost." },
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
            question: "Which procedure is best?",
            answer:
              "None of them, in the abstract. The right procedure depends on your corneal thickness, prescription, pupil size, tear film, and what you do with your eyes daily. That is precisely what the assessment determines.",
          },
          {
            question: "Will I definitely not need glasses afterwards?",
            answer:
              "No procedure can guarantee a specific visual result, and none of them stop age-related changes such as reading vision decline in your forties. Your surgeon explains the realistic expectation for your eyes and prescription.",
          },
          {
            question: "What if I'm not suitable for any of them?",
            answer:
              "We tell you, explain why, and where relevant suggest what could change that in future. Around one in five people we assess are advised against surgery.",
          },
          {
            question: "Is the assessment free?",
            answer:
              "Yes, and it is a full diagnostic appointment rather than a sales consultation. You receive the written findings whether or not you proceed.",
          },
          {
            question: "How long until I can drive or work?",
            answer:
              "It varies by procedure and by individual. Most laser patients are back at a desk within one to two days, but you must not drive until an optometrist confirms you meet the legal standard.",
          },
        ],
      },
    },
  ],

  leadForm: {
    enabled: true,
    title: "Find out which procedure your eyes qualify for",
    description:
      "Send your current prescription and we'll book you a full diagnostic assessment. Submitting this form schedules nothing and commits you to nothing — and if you're not a candidate, we'll tell you.",
    submitText: "Book my suitability assessment",
    successMessage:
      "Thanks — our team will contact you within one working day to arrange your diagnostic appointment.",
    fields: {
      name: { enabled: true, required: true, label: "Your name" },
      email: { enabled: true, required: true, label: "Email" },
      phone: { enabled: false, required: false },
      whatsapp: { enabled: true, required: false, label: "WhatsApp (optional)" },
      telegram: { enabled: false, required: false },
      message: {
        enabled: true,
        required: true,
        label: "Your current prescription, your age, and whether you wear contact lenses",
      },
    },
  },

  footer: {
    brandName: "Clearview Vision Centre",
    copyrightYear: "2026",
    privacyPolicy:
      "We collect only the prescription and health information you provide in order to assess your suitability. Diagnostic scans are held as confidential medical records, are never sold or shared without your written consent, and can be deleted on request.",
    termsOfService:
      "Information on this page is general and does not constitute medical advice or a diagnosis. Submitting this form does not create a treating relationship. Suitability for any procedure, along with its specific risks, is determined only after a full diagnostic examination by a registered ophthalmic surgeon. Visual outcomes vary between individuals, no result is guaranteed, and refractive surgery does not prevent age-related changes to vision.",
  },

  floatingButton: {
    text: "👁️ Check my suitability",
    target: { kind: "primary" },
  },
};
