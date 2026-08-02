// landing-editor/samples/immigrationLawDraft.ts
//
// 移民 / 法律咨询「免费案情评估」营销落地页样例（海外 leadgen，非交易）。
// 主转化走页内留资表单（hero CTA 指向 #lead-form），电话作为次通道——案情涉及
// 隐私，表单比即时聊天更符合访客心理，也便于先收集必要信息再回电。
//
// 合规要点（risk=high，本模板的红线最多）：
// - 不得出现任何"保证获批 / 包过 / 百分百成功"承诺；成功率类表述必须限定为历史数据；
// - 页面明示：提交表单不构成委托关系，页面内容不构成法律意见；
// - 案例展示模块强制免责声明，且不展示可识别当事人信息；
// - 不出现律师费、付款、分期等交易语义（费用一律留到咨询中说明）。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - 电话 +15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

/** Unsplash 图片地址助手：统一裁剪与画质参数。 */
const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** 页内留资表单锚点：主转化落点。 */


export const immigrationLawDraft: LandingPageDraft = {
  contact: {
    primary: "form",
    phone: "+15551234567",
    email: "assessments@vantage-immigration.example",
  },
  hero: {
    backgroundImage: {
      src: img("photo-1589829545856-d10d557cf95f", 1600),
      alt: "Law office meeting room with documents on the table",
    },
    badge: { emoji: "⚖️", text: "Registered immigration practitioners" },
    title: "Know where your case really stands",
    subtitle:
      "Request a free case assessment. A registered practitioner reviews your situation and explains your realistic options — including when there aren't any.",
    cta: { text: "Request a case assessment", target: { kind: "primary" } },
    secondaryCta: { text: "How the assessment works", target: { kind: "primary" } },
    endorsementText: "Advising applicants since 2009 · Regulated practitioners only",
    showcase: {
      type: "image",
      src: img("photo-1450101499163-c8848c66ca85"),
      alt: "Practitioner reviewing application documents",
    },
  },

  sections: [
    // 1. 数据展示（历史数据表述，不作为未来承诺）
    {
      type: "stats",
      data: {
        title: "Our track record, stated plainly",
        subtitle: "Historical figures — every case is decided on its own facts.",
        items: [
          { icon: "📁", value: "6,500+", label: "Cases assessed since 2009" },
          { icon: "⚖️", value: "100%", label: "Work handled by regulated practitioners" },
          { icon: "🗣️", value: "12", label: "Languages spoken in-house" },
          { icon: "⏱️", value: "<1 day", label: "Avg. assessment response" },
        ],
      },
    },

    // 2. 特性（core-value 组）
    {
      type: "features",
      data: {
        title: "What the assessment gives you",
        subtitle: "A clear picture before you commit to anything.",
        items: [
          {
            icon: "🔍",
            title: "An honest read on eligibility",
            description:
              "We tell you which routes you plausibly qualify for — and which you don't — before any engagement.",
          },
          {
            icon: "🗓️",
            title: "Realistic timelines",
            description:
              "Current processing expectations for your route, based on published authority data, not optimism.",
          },
          {
            icon: "📄",
            title: "Document checklist",
            description:
              "Exactly what evidence your route requires, so you can start gathering it while you decide.",
          },
          {
            icon: "🚩",
            title: "Risks flagged early",
            description:
              "Prior refusals, gaps, or inconsistencies are raised at the start, not discovered mid-application.",
          },
        ],
      },
    },

    // 3. 服务流程
    {
      type: "process",
      data: {
        title: "How the assessment works",
        subtitle: "Three steps, no obligation at any point.",
        steps: [
          {
            title: "Share your situation",
            description: "Complete the form with your nationality, current status, and what you're hoping to achieve.",
            image: { src: img("photo-1521791136064-7986c2920216", 800), alt: "Consultation between practitioner and client" },
          },
          {
            title: "Practitioner review",
            description: "A registered practitioner reviews your details and identifies the routes worth considering.",
          },
          {
            title: "Written assessment",
            description: "You receive a plain-language summary of options, risks, and next steps — yours to keep either way.",
          },
        ],
      },
    },

    // 4. 信任徽章（资质与监管）
    {
      type: "trust",
      data: {
        backgroundImage: {
          src: img("photo-1479142506502-19b3a3b7ff33", 1400),
          alt: "Classical courthouse columns",
        },
        badges: [
          { icon: "🎖️", title: "Regulated practitioners", subtitle: "Every case handled by a registered adviser" },
          { icon: "🔒", title: "Confidential by law", subtitle: "Your details are protected from first contact" },
          { icon: "🌐", title: "Multilingual team", subtitle: "Advice in your first language where possible" },
          { icon: "📚", title: "Published guidance only", subtitle: "Assessments cite official rules, not rumour" },
        ],
      },
    },

    // 5. 案例（强免责声明，不含可识别信息）
    {
      type: "beforeAfter",
      data: {
        title: "Situations we're asked about",
        subtitle: "Anonymised examples of how an assessment changed the plan.",
        disclaimer:
          "These are anonymised illustrations, not predictions. Every case turns on its own facts and on decisions made solely by immigration authorities. Past outcomes do not indicate future results, and no outcome is or can be guaranteed. Nothing on this page is legal advice, and submitting the form does not create a client relationship.",
        items: [
          {
            crmName: "Applicant A (anonymised)",
            duration: "Assessment took 2 days",
            caseDescription:
              "Was preparing to apply on a route they did not qualify for. The assessment identified a different route and the documents it required.",
            beforeImage: { src: img("photo-1554224155-6726b3ff858f", 800), alt: "Stack of application paperwork" },
            afterImage: { src: img("photo-1450101499163-c8848c66ca85", 800), alt: "Organised application file" },
          },
          {
            crmName: "Applicant B (anonymised)",
            duration: "Assessment took 1 day",
            caseDescription:
              "Had a prior refusal that would have undermined a new application. The assessment set out how the refusal needed to be addressed first.",
            beforeImage: { src: img("photo-1517842645767-c639042777db", 800), alt: "Refusal letter on a desk" },
            afterImage: { src: img("photo-1521791136064-7986c2920216", 800), alt: "Reviewing a revised case strategy" },
          },
        ],
      },
    },

    // 6. 客户评价
    {
      type: "reviews",
      data: {
        title: "What clients say",
        description: "Feedback from people who started with an assessment.",
        items: [
          {
            name: "N. Okafor",
            location: "Nigeria",
            channel: "Google",
            avatar: { src: img("photo-1506794778202-cad84cf45f1d", 200), alt: "N. Okafor" },
            content: {
              text: "They told me the route I'd planned wouldn't work and explained why. Painful to hear, but it saved me a refusal.",
            },
          },
          {
            name: "M. Haddad",
            location: "Lebanon",
            channel: "Email",
            avatar: { src: img("photo-1472099645785-5658abf4ff4e", 200), alt: "M. Haddad" },
            content: {
              text: "The written assessment listed every document with a deadline. I finally understood my own case.",
            },
          },
          {
            name: "S. Rahman",
            location: "Bangladesh",
            channel: "Phone",
            avatar: { src: img("photo-1519345182560-3f2917c472ef", 200), alt: "S. Rahman" },
            content: {
              text: "No promises, no pressure. Just a clear explanation of what was realistic and what wasn't.",
            },
          },
        ],
      },
    },

    // 7. 保障（非交易：无承诺 / 保密 / 明确不构成委托）
    {
      type: "guarantee",
      data: {
        title: "What we will and won't do",
        description: "Stated up front, because this field attracts a lot of bad promises.",
        items: [
          { icon: "🚫", title: "We never guarantee outcomes", subtitle: "Any adviser who promises approval is misleading you." },
          { icon: "🔐", title: "Strict confidentiality", subtitle: "Your details are never shared without your written consent." },
          { icon: "📝", title: "Assessment ≠ engagement", subtitle: "Submitting the form does not create a client relationship." },
          { icon: "💬", title: "Plain language, always", subtitle: "You'll get an explanation you can actually act on." },
        ],
      },
    },

    // 8. 常见问题
    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Common questions" },
        items: [
          {
            question: "Is the case assessment free?",
            answer:
              "Yes. The initial assessment carries no cost and no obligation. If we think you don't need us, we'll say so.",
          },
          {
            question: "Can you guarantee my application will be approved?",
            answer:
              "No. Nobody can. Decisions rest entirely with the relevant immigration authority. What a practitioner can do is make sure your case is presented accurately and completely.",
          },
          {
            question: "Does submitting the form make you my lawyer?",
            answer:
              "No. The assessment is informational. A client relationship only begins if you and a practitioner agree to it in writing.",
          },
          {
            question: "Is my information kept confidential?",
            answer:
              "Yes. Everything you share is treated as confidential from first contact and is never shared without your written consent.",
          },
        ],
      },
    },
  ],

  // 主转化：页内案情评估表单
  leadForm: {
    enabled: true,
    title: "Request your free case assessment",
    description:
      "Share your situation and a registered practitioner will respond with a written assessment. No cost, no obligation, and no client relationship is created by submitting this form.",
    submitText: "Request my assessment",
    successMessage: "Thanks — a practitioner will review your details and respond within one business day.",
    fields: {
      name: { enabled: true, required: true, label: "Your name" },
      email: { enabled: true, required: true, label: "Email" },
      phone: { enabled: true, required: false, label: "Phone (optional)" },
      whatsapp: { enabled: false, required: false },
      telegram: { enabled: false, required: false },
      message: {
        enabled: true,
        required: true,
        label: "Your nationality, current status, and what you're hoping to achieve",
      },
    },
  },

  footer: {
    brandName: "Vantage Immigration",
    copyrightYear: "2026",
    privacyPolicy:
      "We collect only the information you provide in order to assess your case. Case details are treated as confidential, are never shared with third parties without your written consent, and can be deleted on request at any time.",
    termsOfService:
      "Information on this page is general and does not constitute legal advice. Submitting the assessment form does not create a client relationship. Immigration decisions are made solely by the relevant authorities; no outcome is guaranteed and past results do not indicate future outcomes. Rules and processing times change and are confirmed only in a written assessment.",
  },

  floatingButton: {
    text: "📞 Speak to a practitioner",
    target: { kind: "channel", channel: "phone" },
  },
};
