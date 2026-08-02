// landing-editor/samples/familyLawDraft.ts
//
// 家事法「首次咨询预约」营销落地页样例（法律 leadgen，非交易）。
// 主转化走页内留资表单（contact.primary = "form"），电话为次通道——当事人往往
// 不方便开口讲述家庭处境，书面陈述比即时通话更符合心理，也便于律师先看事实再回电。
//
// 合规要点（risk=high，与 immigrationLawDraft 同级）：
// - 不得出现「保证判给 / 一定拿到抚养权 / 包赢」等结果承诺；
// - 不展示可识别当事人信息；评价一律匿名化并注明已获授权；
// - 页面明示：内容不构成法律意见，提交表单不构成委托关系；
// - 不出现律师费、分期、按结果收费等交易语义（费用结构只描述形式，金额留到咨询）。
// - 刻意不使用 beforeAfter 区块：家事案件没有可展示的「前后对比」，硬套即失当。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），逐张下载核验主体正确后写入。
// - 电话 +15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

/** Unsplash 图片地址助手：统一裁剪与画质参数。 */
const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const familyLawDraft: LandingPageDraft = {
  contact: {
    primary: "form",
    phone: "+15551234567",
    email: "enquiries@harborline-family.example",
  },
  hero: {
    backgroundImage: {
      src: img("photo-1758518731462-d091b0b4ed0d", 1600),
      alt: "Solicitor and clients talking across a meeting table",
    },
    badge: { emoji: "⚖️", text: "Family law · Regulated solicitors" },
    title: "Work out where you stand, before you decide anything",
    subtitle:
      "Book a first consultation. A family solicitor listens to your situation, explains the options that realistically apply, and tells you plainly when the law will not give you what you want.",
    cta: { text: "Request a first consultation", target: { kind: "primary" } },
    secondaryCta: { text: "What the consultation covers", target: { kind: "primary" } },
    endorsementText: "Family matters only · Regulated solicitors · Confidential from the first message",
    showcase: {
      type: "image",
      src: img("photo-1573497620053-ea5300f94f21"),
      alt: "Two people in a quiet consultation across a small table",
    },
  },

  sections: [
    // 1. 数据展示：经营事实，不作为结果承诺
    {
      type: "stats",
      data: {
        title: "About the practice",
        subtitle: "Operational facts. Every family matter is decided on its own circumstances.",
        items: [
          { icon: "⚖️", value: "Family only", label: "The sole area this practice works in" },
          { icon: "🗓️", value: "18 yrs", label: "Advising on separation and children matters" },
          { icon: "🤝", value: "First", label: "We raise mediation before we raise court" },
          { icon: "⏱️", value: "1 day", label: "Typical response to a consultation request" },
        ],
      },
    },

    // 2. 特性：首次咨询到底给到什么，回答「值不值得约」
    {
      type: "features",
      data: {
        title: "What the first consultation gives you",
        subtitle: "Information you can act on, whether or not you instruct us afterwards.",
        items: [
          {
            icon: "🧭",
            title: "Which route actually applies",
            description:
              "Mediation, negotiated agreement, or court. Most people arrive assuming court; most matters do not need it, and knowing that early saves months.",
          },
          {
            icon: "📆",
            title: "A realistic timeline",
            description:
              "How long each route usually takes in practice, including the waiting that is outside anyone's control.",
          },
          {
            icon: "📄",
            title: "What to gather now",
            description:
              "The documents and dates that matter, so nothing later depends on paperwork you no longer have access to.",
          },
          {
            icon: "🚧",
            title: "Where your position is weak",
            description:
              "Said plainly. A solicitor who only tells you what you hoped to hear is expensive in a way that shows up much later.",
          },
        ],
      },
    },

    // 3. 流程：把「开口讲家事」拆成低压力的几步
    {
      type: "process",
      data: {
        title: "How it works",
        subtitle: "You control how much you share, and when.",
        steps: [
          {
            title: "Write down the situation",
            description:
              "In the form, in your own words. Most people find this easier than saying it out loud to a stranger, and it means the first conversation starts from facts.",
            image: { src: img("photo-1562564055-71e051d33c19"), alt: "Person writing at a desk with documents" },
          },
          {
            title: "A solicitor reviews it before speaking to you",
            description:
              "So the consultation is spent on your options rather than on background you have already written down once.",
            image: { src: img("photo-1642522029686-5485ea7e6042"), alt: "Solicitor reviewing case papers at a desk" },
          },
          {
            title: "The consultation itself",
            description:
              "By phone or in person, whichever you prefer. You leave knowing which route applies, roughly how long it takes, and what to do next week.",
            image: { src: img("photo-1551836022-d5d88e9218df"), alt: "Consultation taking place across a desk" },
          },
          {
            title: "Decide afterwards, not during",
            description:
              "There is no instruction to sign on the day. If you want to think about it, or speak to someone else, that is the normal outcome and not an awkward one.",
            image: { src: img("photo-1653463174231-3911539cfdd9"), alt: "Quiet office with a window and seating" },
          },
        ],
      },
    },

    // 4. 信任：资质与保密，当事人不会开口问但最在意
    {
      type: "trust",
      data: {
        backgroundImage: { src: img("photo-1496681859237-6039cd585c4e", 1600), alt: "Quiet meeting room with natural light" },
        badges: [
          { icon: "📜", title: "Regulated solicitors", subtitle: "Practising certificates and regulator details available on request." },
          { icon: "🔒", title: "Confidential from first contact", subtitle: "Your enquiry is privileged and is not shared with anyone else." },
          { icon: "🤝", title: "Mediation raised first", subtitle: "We say when court is not the proportionate route, including when it costs us the work." },
          { icon: "👶", title: "Children's arrangements prioritised", subtitle: "Where children are involved, their arrangements are addressed before finances." },
        ],
      },
    },

    // 5. 评价：匿名化处理，注明已获授权
    {
      type: "reviews",
      data: {
        title: "What former clients said",
        subtitle: "Anonymised and published with written permission. Names and details changed.",
        description:
          "Testimonials describe individual experiences and do not indicate what will happen in any other matter.",
        items: [
          {
            name: "Client · separation",
            location: "Consultation, then mediation",
            avatar: { src: img("photo-1494790108377-be9c29b29330", 200), alt: "Anonymised client portrait" },
            content: {
              text: "I came in expecting to be told to go to court. I was told the opposite, and that it would probably cost me less to mediate. That is not what I expected from a solicitor.",
            },
          },
          {
            name: "Client · children's arrangements",
            location: "Consultation only",
            avatar: { src: img("photo-1500648767791-00dcc994a43e", 200), alt: "Anonymised client portrait" },
            content: {
              text: "They were direct about which parts of what I wanted were unlikely. Hard to hear on the day and the reason I trusted the rest of it.",
            },
          },
          {
            name: "Client · finances on divorce",
            location: "Negotiated agreement",
            avatar: { src: img("photo-1624486217002-846e654ac969", 200), alt: "Anonymised client portrait" },
            content: {
              text: "The list of documents to gather, sent after the first call, was the single most useful thing anyone gave me in that year.",
            },
          },
        ],
      },
    },

    // 6. 保障：非法律意见声明与费用「形式」——不出现金额与按结果收费
    {
      type: "guarantee",
      data: {
        title: "What we can and cannot promise",
        subtitle: "Stated up front, because the opposite is common in this field.",
        items: [
          { icon: "🔐", title: "Confidentiality", subtitle: "From your first message, whether or not you instruct us." },
          { icon: "🧾", title: "Costs explained before work starts", subtitle: "Which stages are fixed-fee and which are hourly, in writing, before anything is chargeable." },
          {
            icon: "🚫",
            title: "No outcome is guaranteed",
            subtitle: "Family matters are decided on their own facts by the court or by agreement. Anyone promising you a result is not in a position to.",
          },
        ],
      },
    },

    // 7. FAQ：当事人真正会问、但不好意思问的四件事
    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Questions people hesitate to ask" },
        items: [
          {
            question: "Does contacting you commit me to anything?",
            answer:
              "No. Submitting the form does not create a client relationship and does not commit you to instructing this practice. Many people have one consultation, take the information away, and handle things themselves or through mediation.",
          },
          {
            question: "Will my partner find out I contacted a solicitor?",
            answer:
              "Not from us. Your enquiry is confidential from the first message. We will ask how you would prefer to be contacted, and we use only that channel.",
          },
          {
            question: "Can you tell me who will get the children or the house?",
            answer:
              "No one can, and you should be wary of anyone who says otherwise. What a consultation can do is explain the factors the court actually weighs and tell you, honestly, where your position looks strong and where it does not.",
          },
          {
            question: "Do I have to go to court?",
            answer:
              "Usually not. Most matters resolve through mediation or a negotiated agreement, and in many places attempting mediation is expected before a court will engage. We will say which route is proportionate for your situation, including when that means less work for us.",
          },
        ],
      },
    },
  ],

  leadForm: {
    enabled: true,
    title: "Request a first consultation",
    description:
      "Tell us what is happening in your own words. A family solicitor reads it before responding. Confidential, and no client relationship is created by submitting this form.",
    submitText: "Request my consultation",
    successMessage: "Thank you — a solicitor will review your message and respond within one business day, using only the contact method you chose.",
    fields: {
      name: { enabled: true, required: true, label: "Your name (or how you'd like to be addressed)" },
      email: { enabled: true, required: false, label: "Email" },
      phone: { enabled: true, required: false, label: "Phone" },
      whatsapp: { enabled: false, required: false },
      telegram: { enabled: false, required: false },
      message: {
        enabled: true,
        required: true,
        label: "What is happening, and what you are hoping to work out",
      },
    },
  },

  footer: {
    brandName: "Harborline Family Law",
    copyrightYear: "2026",
    privacyPolicy:
      "Your enquiry is treated as confidential and privileged from the first message. Details are read only by solicitors at this practice, are never shared with third parties without your written instruction, and can be deleted on request at any time. We contact you only through the channel you nominate.",
    termsOfService:
      "Information on this page is general and does not constitute legal advice. Submitting the consultation form does not create a solicitor-client relationship. Family matters are determined on their individual facts by agreement or by the court; no outcome is guaranteed and previous matters do not indicate future results. Testimonials are anonymised, published with written permission, and describe individual experiences only. Costs are explained in writing before any chargeable work begins.",
  },
};
