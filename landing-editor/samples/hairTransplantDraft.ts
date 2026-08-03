// landing-editor/samples/hairTransplantDraft.ts
//
// 植发诊所「免费发际线评估 + 表单预约」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 主转化为页内留资表单（发量情况需要文字描述与照片跟进，表单比即时通讯更能收全信息），
// WhatsApp 作为次级快捷通道。全程无下单 / 结账 / 报价付款语义。
//
// 合规要点（risk: high）：
// - 植发属医疗行为，效果因人而异，页面不得承诺成活率或具体发量结果。
// - 本模板刻意不含 beforeAfter 区块：样例无法提供真实且已授权的患者照片，
//   拿库存肖像充当疗效对比等于伪造医疗证据，disclaimer 也兜不住；
//   且与本模板「先出书面评估、不合适就劝退」的叙事相冲。
//   诊所若有合规的真实案例，可在编辑器中自行添加该区块。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15557654321 为占位号码，上线前替换为真实诊所号码。
import type { LandingPageDraft } from "@/types/schema.draft";

/** Unsplash 图片地址助手：统一裁剪与画质参数。 */
const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** 页内留资表单锚点：本模板以表单为主转化路径。 */


export const hairTransplantDraft: LandingPageDraft = {
  contact: {
    primary: "form",
    whatsapp: "+15557654321",
    email: "assessments@meridian-hair.example",
  },
  hero: {
    backgroundImage: {
      src: img("photo-1626383120723-2a941488860d", 1600),
      alt: "Quiet consultation corner at the clinic",
    },
    badge: { emoji: "🩺", text: "Surgeon-led hair restoration" },
    title: "Find out what's actually possible for your hairline",
    subtitle:
      "Send a few photos and our surgeons will send back a written assessment — your graft range, the technique that suits you, and an honest answer if surgery isn't the right call yet.",
    cta: { text: "Get my free assessment", target: { kind: "primary" } },
    secondaryCta: { text: "Ask a question on WhatsApp", target: { kind: "channel", channel: "whatsapp", prefill: "Hi Meridian, I'd like to ask about a hair assessment" } },
    endorsementText: "9,400+ assessments reviewed by our surgical team",
    showcase: {
      type: "image",
      src: img("photo-1758691463198-dc663b8a64e4"),
      alt: "Doctor writing an assessment during a consultation",
    },
  },

  sections: [
    // 1. 数据展示
    {
      type: "stats",
      data: {
        title: "A team that does this every day",
        subtitle: "The numbers behind our surgical practice.",
        items: [
          { icon: "🔬", value: "9,400+", label: "Assessments reviewed" },
          { icon: "🌍", value: "30+", label: "Countries treated" },
          { icon: "⭐", value: "4.8/5", label: "Average patient rating" },
          { icon: "📄", value: "48 h", label: "Written assessment turnaround" },
        ],
      },
    },

    // 2. 特性（core-value 组）
    {
      type: "features",
      data: {
        title: "Why patients choose Meridian",
        subtitle: "Surgeon-led care, with the honest conversation first.",
        items: [
          {
            icon: "🧑‍⚕️",
            title: "Assessed by the operating surgeon",
            description:
              "The surgeon who would perform your procedure reviews your photos personally — not a sales advisor.",
          },
          {
            icon: "📋",
            title: "A written plan, not a phone pitch",
            description:
              "You receive your graft range, suggested technique, and recovery timeline in writing, to read in your own time.",
          },
          {
            icon: "🙅",
            title: "We say no when it's no",
            description:
              "Ongoing loss, unrealistic density goals, or an age where results would shift — we tell you before you travel.",
          },
          {
            icon: "🏥",
            title: "Accredited surgical facility",
            description:
              "Procedures take place in a licensed operating theatre with a full anaesthetic and nursing team on site.",
          },
        ],
      },
    },

    // 3. 提供的技术方案（纯展示，无价格）
    {
      type: "products",
      data: {
        title: "Techniques we work with",
        subtitle: "Your assessment recommends which one fits your pattern and donor area.",
        items: [
          {
            name: "FUE — follicular unit extraction",
            description:
              "Individual follicles moved one by one. No linear scar, suited to shorter hairstyles.",
            backgroundImage: { src: img("photo-1579684385127-1ef15d508118", 800), alt: "Surgical team in an operating room" },
          },
          {
            name: "DHI — direct hair implantation",
            description:
              "Implanter-pen placement for dense, controlled angling around the frontal hairline.",
            backgroundImage: { src: img("photo-1612349317150-e413f6a5b16d", 800), alt: "Surgeon who performs the procedure" },
          },
          {
            name: "Beard & eyebrow restoration",
            description:
              "The same follicle-by-follicle approach applied to facial hair and brow reconstruction.",
            backgroundImage: { src: img("photo-1625038032200-648fbcd800d0", 800), alt: "Grooming tools laid out" },
          },
          {
            name: "Medical maintenance plan",
            description:
              "Not everyone needs surgery. Some patterns are better held with a supervised medical plan first.",
            backgroundImage: { src: img("photo-1584308666744-24d5c474f2ae", 800), alt: "Prescription medication packs" },
          },
        ],
      },
    },

    // 4. 服务流程
    {
      type: "process",
      data: {
        title: "How the assessment works",
        subtitle: "Four steps, and you can stop at any of them.",
        steps: [
          {
            title: "Send photos through the form",
            description:
              "Front, top, crown, and both sides in natural light. The form tells you exactly what to capture.",
            image: { src: img("photo-1666886573531-48d2e3c2b684", 800), alt: "Medical consultation" },
          },
          {
            title: "A surgeon reviews your case",
            description:
              "Pattern, donor density, and progression are assessed against your stated goal.",
          },
          {
            title: "You receive a written assessment",
            description:
              "Graft range, technique, recovery timeline, and any reason we'd advise waiting — within 48 hours.",
          },
          {
            title: "Talk it through, if you want to",
            description:
              "A video call with the surgeon to go through the plan. No obligation to book anything.",
          },
        ],
      },
    },

    // 5. 评价
    {
      type: "reviews",
      data: {
        title: "What patients say",
        description: "Messages from people who went through the assessment.",
        items: [
          {
            name: "Tomás",
            location: "Spain",
            channel: "WhatsApp",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Tomás" },
            content: {
              text: "They told me to wait a year and stabilise first. No clinic had ever turned me away — that's why I came back to them.",
            },
          },
          {
            name: "Rana",
            location: "United Arab Emirates",
            channel: "Google",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Rana" },
            content: {
              text: "The written assessment answered questions I hadn't thought to ask. It made the decision much easier.",
            },
          },
          {
            name: "Michael",
            location: "United Kingdom",
            channel: "Email",
            avatar: { src: img("photo-1500648767791-00dcc994a43e", 200), alt: "Michael" },
            content: {
              text: "Straight answers about what the donor area could realistically cover. No overselling at any point.",
            },
          },
        ],
      },
    },

    // 6. 品牌故事
    {
      type: "story",
      data: {
        title: "Why we assess before we operate",
        subtitle: "The practice behind the clinic.",
        body: "Meridian was founded by surgeons who kept meeting patients who had been sold a procedure they weren't ready for — operated on mid-progression, or given a hairline that would look wrong in fifteen years. We built the practice around the assessment instead of the booking: photos first, an honest written read second, and surgery only when it's genuinely the right step. Some of the assessments we're proudest of ended with us telling someone not to have surgery.",
        backgroundImage: {
          src: img("photo-1758691461990-03b49d969495", 1400),
          alt: "Doctor completing a written assessment with a patient",
        },
        signatureName: "Dr. Elif Kaya",
        signatureRole: "Lead Surgeon & Founder",
      },
    },

    // 7. 安全保障（非交易：资质 / 隐私 / 无推销 / 术后跟进）
    {
      type: "guarantee",
      data: {
        title: "How we look after you",
        description: "Standards that apply before, during, and after your procedure.",
        items: [
          { icon: "🛡️", title: "Licensed surgical team", subtitle: "Every procedure is performed by registered surgeons in an accredited theatre." },
          { icon: "🔒", title: "Your photos stay private", subtitle: "Case photos are confidential, never sold, and published only with written consent." },
          { icon: "🙅", title: "No pressure to book", subtitle: "The assessment is informational. You are never called repeatedly to close a sale." },
          { icon: "🤝", title: "Aftercare for 12 months", subtitle: "Scheduled check-ins through the full growth cycle at no extra cost." },
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
            question: "Is the assessment really free?",
            answer:
              "Yes. Submitting photos, receiving the written assessment, and the follow-up video call all cost nothing.",
          },
          {
            question: "What if I'm not a good candidate?",
            answer:
              "We'll tell you plainly, explain why, and outline what would need to change. A significant share of our assessments recommend waiting or a medical plan instead of surgery.",
          },
          {
            question: "How many grafts will I need?",
            answer:
              "Your assessment gives a range based on your photos, but the final number is confirmed only in a clinical examination on the day.",
          },
          {
            question: "Will my hair keep thinning after the procedure?",
            answer:
              "Transplanted follicles are taken from an area that is typically resistant to loss, but existing native hair can continue to thin. Your assessment explains what that means for your specific pattern.",
          },
          {
            question: "Do you help with travel arrangements?",
            answer:
              "Our coordinators help with scheduling, accommodation guidance, and airport transfers once you decide to proceed.",
          },
        ],
      },
    },
  ],

  leadForm: {
    enabled: true,
    title: "Get your free written assessment",
    description:
      "Tell us your goal and attach the photo angles listed above. A surgeon reviews every submission personally and replies within 48 hours. No cost and no obligation — submitting this form does not book a procedure.",
    submitText: "Send my photos for assessment",
    successMessage:
      "Thanks — your case is with our surgical team. You'll have a written assessment within 48 hours.",
    fields: {
      name: { enabled: true, required: true, label: "Your name" },
      email: { enabled: true, required: true, label: "Email (where we send the assessment)" },
      phone: { enabled: false, required: false },
      whatsapp: { enabled: true, required: false, label: "WhatsApp (optional, for quick questions)" },
      telegram: { enabled: false, required: false },
      message: {
        enabled: true,
        required: true,
        label: "Your age, how long you've been losing hair, and what you'd like to change",
      },
    },
  },

  footer: {
    brandName: "Meridian Hair Restoration",
    copyrightYear: "2026",
    privacyPolicy:
      "We collect only the photos and health information you submit in order to prepare your assessment. Case photos are treated as medical data, are never sold or shared without your written consent, and can be deleted on request at any time.",
    termsOfService:
      "Information on this page is general and does not constitute a medical diagnosis. Submitting the assessment form does not create a treating relationship and does not book a procedure. Suitability, graft counts, and expected outcomes are confirmed only after an in-person clinical examination by a qualified surgeon. Individual results vary and no outcome is guaranteed.",
  },

  floatingButton: {
    text: "📄 Free written assessment",
    target: { kind: "primary" },
  },
};
