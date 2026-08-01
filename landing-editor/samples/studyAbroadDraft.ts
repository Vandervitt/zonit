// landing-editor/samples/studyAbroadDraft.ts
//
// 留学 / 语言培训「免费选校规划咨询」营销落地页样例（海外 leadgen，非交易）。
// 主转化走 WhatsApp 咨询，页内留资表单作为第二落点（不方便即时聊的访客留资）。
// 合规要点（risk=medium）：录取结果因人而异，页面不得出现任何"保证录取 / 包过"
// 类承诺；成果展示模块带免责声明，学费与付款一律不出现在页面上。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15557654321 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

/** Unsplash 图片地址助手：统一裁剪与画质参数。 */
const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;


export const studyAbroadDraft: LandingPageDraft = {
  contact: {
    primary: "whatsapp",
    whatsapp: "+15557654321",
    email: "advisors@northbridge-education.example",
  },
  hero: {
    backgroundImage: {
      src: img("photo-1562774053-701939374585", 1600),
      alt: "University campus courtyard on a bright day",
    },
    badge: { emoji: "🎓", text: "Independent study advisors" },
    title: "Find the course that actually fits you",
    subtitle:
      "Talk to an advisor on WhatsApp and get a free, personalised study plan — course shortlist, entry requirements, and a realistic timeline.",
    cta: { text: "Get my free study plan", target: { kind: "primary", prefill: "Hi Northbridge, I'd like a free study plan" } },
    secondaryCta: { text: "Read student stories", target: { kind: "channel", channel: "form" } },
    endorsementText: "9,000+ students advised across 20+ destinations",
    showcase: {
      type: "image",
      src: img("photo-1522202176988-66273c2fd55f"),
      alt: "Students working together in a university library",
    },
  },

  sections: [
    // 1. 数据展示
    {
      type: "stats",
      data: {
        title: "Guidance grounded in real numbers",
        subtitle: "What our advising team has handled so far.",
        items: [
          { icon: "🎓", value: "9,000+", label: "Students advised" },
          { icon: "🌍", value: "20+", label: "Study destinations" },
          { icon: "🗂️", value: "600+", label: "Partner institutions" },
          { icon: "⏱️", value: "<2 h", label: "Avg. WhatsApp reply" },
        ],
      },
    },

    // 2. 特性（core-value 组）
    {
      type: "features",
      data: {
        title: "How our advising is different",
        subtitle: "Independent guidance, in plain language.",
        items: [
          {
            icon: "🧭",
            title: "Shortlist built around you",
            description:
              "Courses matched to your grades, budget range, and career direction — not to whoever pays us most.",
          },
          {
            icon: "📋",
            title: "Requirements spelled out",
            description:
              "Entry criteria, language scores, and document deadlines listed clearly, so nothing catches you late.",
          },
          {
            icon: "✍️",
            title: "Application review",
            description:
              "An advisor reviews your personal statement and documents before you submit anything.",
          },
          {
            icon: "💬",
            title: "One advisor, start to finish",
            description:
              "The same person follows your case — you never re-explain your situation to someone new.",
          },
        ],
      },
    },

    // 3. 方案（展示文案，无价格 / 无付款）
    {
      type: "plans",
      data: {
        title: "Choose where you want support",
        subtitle: "Every path starts with the same free consultation.",
        items: [
          {
            name: "Course shortlist",
            description: "For students who know the destination but not the course.",
            label: "Most common starting point",
            valueProps: [
              "Personalised shortlist of suitable courses",
              "Entry requirements and language scores explained",
              "Realistic timeline back from your intake date",
            ],
            cta: { text: "Ask about this", target: { kind: "primary", prefill: "Hi Northbridge, I'd like a free study plan" } },
          },
          {
            name: "Full application support",
            description: "For students who want a second pair of eyes on every document.",
            badge: "Most chosen",
            valueProps: [
              "Everything in the course shortlist",
              "Personal statement and document review",
              "Deadline tracking through to decision",
            ],
            cta: { text: "Ask about this", target: { kind: "primary", prefill: "Hi Northbridge, I'd like a free study plan" } },
          },
          {
            name: "Language preparation",
            description: "For students who need to lift a test score before applying.",
            valueProps: [
              "Diagnostic assessment of your current level",
              "Study plan targeting the score you need",
              "Progress check-ins with your advisor",
            ],
            cta: { text: "Ask about this", target: { kind: "primary", prefill: "Hi Northbridge, I'd like a free study plan" } },
          },
        ],
      },
    },

    // 4. 服务流程
    {
      type: "process",
      data: {
        title: "How it works",
        subtitle: "Three steps, starting with a free conversation.",
        steps: [
          {
            title: "Free consultation",
            description: "Message us on WhatsApp with your grades, budget range, and where you'd like to study.",
            image: { src: img("photo-1543269865-cbf427effbad", 800), alt: "Advisor talking with a student" },
          },
          {
            title: "Your study plan",
            description: "An advisor sends a shortlist, entry requirements, and a timeline built back from your intake.",
          },
          {
            title: "Apply with support",
            description: "We review your documents and track deadlines with you through to the decision.",
          },
        ],
      },
    },

    // 5. 学生成果（结果因人而异，带免责声明）
    {
      type: "beforeAfter",
      data: {
        title: "Where students started, and where they landed",
        subtitle: "Shared with permission.",
        disclaimer:
          "Admission outcomes depend on your academic record, language ability, funding, visa decisions, and each institution's own criteria. These are individual examples, not typical or guaranteed results. We do not influence admission or visa decisions.",
        items: [
          {
            crmName: "Rafael",
            duration: "Applied over 7 months",
            caseDescription:
              "Unsure between three countries; narrowed to one programme after a diagnostic call and lifted his language score in time for the autumn intake.",
            beforeImage: { src: img("photo-1434030216411-0b793f4b4173", 800), alt: "Student studying alone at a desk" },
            afterImage: { src: img("photo-1541339907198-e08756dedf3f", 800), alt: "University lecture hall" },
          },
          {
            crmName: "Amina",
            duration: "Applied over 5 months",
            caseDescription:
              "Rewrote her personal statement after two review rounds and applied to a shortlist matched to her funding range.",
            beforeImage: { src: img("photo-1456513080510-7bf3a84b82f8", 800), alt: "Writing a personal statement by hand" },
            afterImage: { src: img("photo-1498243691581-b145c3f54a5a", 800), alt: "Graduation day on campus" },
          },
        ],
      },
    },

    // 6. 学生评价
    {
      type: "reviews",
      data: {
        title: "What students say",
        description: "Messages from students we've advised.",
        items: [
          {
            name: "Chen",
            location: "Malaysia",
            channel: "WhatsApp",
            avatar: { src: img("photo-1531427186611-ecfd6d936c79", 200), alt: "Chen" },
            content: {
              text: "They talked me out of a course that looked good on paper but didn't match what I wanted to do. Grateful for that.",
            },
          },
          {
            name: "Yasmin",
            location: "Egypt",
            channel: "WhatsApp",
            avatar: { src: img("photo-1544005313-94ddf0286df2", 200), alt: "Yasmin" },
            content: {
              text: "Every requirement was laid out in one message. No guessing, no last-minute document panic.",
            },
          },
          {
            name: "Diego",
            location: "Colombia",
            channel: "Google",
            avatar: { src: img("photo-1492562080023-ab3db95bfbce", 200), alt: "Diego" },
            content: {
              text: "My advisor answered on weekends when a deadline was close. That mattered more than any brochure.",
            },
          },
        ],
      },
    },

    // 7. 保障（非交易：独立性 / 隐私 / 透明）
    {
      type: "guarantee",
      data: {
        title: "How we work with you",
        description: "Principles we hold to on every case.",
        items: [
          { icon: "⚖️", title: "Independent advice", subtitle: "We tell you when a course isn't right, even a partner one." },
          { icon: "🔒", title: "Documents kept private", subtitle: "Your transcripts and personal statement are never shared without consent." },
          { icon: "🗣️", title: "No guarantees, ever", subtitle: "Nobody can promise admission — we explain realistic odds instead." },
          { icon: "🤝", title: "Free first consultation", subtitle: "The initial plan costs nothing and carries no obligation." },
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
            question: "Is the first consultation really free?",
            answer:
              "Yes. The consultation and your initial study plan cost nothing, and there is no obligation to continue.",
          },
          {
            question: "Can you guarantee I'll be admitted?",
            answer:
              "No, and be careful with anyone who says they can. Admission and visa decisions rest entirely with institutions and authorities. What we do is help you present the strongest, most realistic application.",
          },
          {
            question: "What if my language score isn't ready yet?",
            answer:
              "That's common. An advisor assesses your current level and builds a timeline that includes the preparation you need.",
          },
          {
            question: "How quickly will someone reply?",
            answer:
              "Usually within two hours during business hours, on WhatsApp or by the form on this page.",
          },
        ],
      },
    },
  ],

  // 第二落点：不便即时聊的访客留资
  leadForm: {
    enabled: true,
    title: "Prefer we contact you?",
    description: "Leave your details and an advisor will follow up with a free study plan.",
    submitText: "Request my study plan",
    successMessage: "Thanks — an advisor will be in touch shortly.",
    fields: {
      name: { enabled: true, required: true, label: "Your name" },
      email: { enabled: true, required: true, label: "Email" },
      phone: { enabled: false, required: false },
      whatsapp: { enabled: true, required: false, label: "WhatsApp (optional)" },
      telegram: { enabled: false, required: false },
      message: {
        enabled: true,
        required: false,
        label: "What would you like to study, and where?",
      },
    },
  },

  footer: {
    brandName: "Northbridge Education",
    copyrightYear: "2026",
    privacyPolicy:
      "We collect only the academic and contact details you share in order to prepare your study plan. Transcripts and personal statements are treated as confidential, are never shared with an institution without your consent, and can be deleted on request.",
    termsOfService:
      "Northbridge provides independent educational guidance. We do not make admission or visa decisions and cannot guarantee any outcome. Entry requirements, deadlines, and course availability are set by institutions and may change without notice.",
  },

  floatingButton: {
    text: "💬 Chat with an advisor",
    target: { kind: "channel", channel: "whatsapp", prefill: "Hi Northbridge, I'd like a free study plan" },
  },
};
