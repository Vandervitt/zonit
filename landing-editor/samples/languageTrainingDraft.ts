// landing-editor/samples/languageTrainingDraft.ts
//
// 语言培训（雅思 / 托福备考）「免费水平测试 + 提分规划」营销落地页样例（海外 leadgen，非交易）。
// 主转化走页内留资表单（hero CTA 指向 #lead-form）——报名前要先测水平、报目标分与考试日期，
// 表单能一次收齐；WhatsApp 作次通道。
// 页面不出现学费、课时单价、在线报名付款：商务与排课一律留到顾问对话中。
//
// 合规口径：考试成绩由考生表现与考试机构评定，页面只写"目标分规划"与历史平均提分，
// 不承诺分数、不写保过。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15558802411 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** 页内留资表单锚点：主转化落点。 */
const FORM = "#lead-form";

const WHATSAPP =
  "https://wa.me/15558802411?text=Hi%20Lexicon%2C%20I%27d%20like%20a%20free%20level%20test";

export const languageTrainingDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1524178232363-1fb2b075b655", 1600),
      alt: "Students working through a language class",
    },
    badge: { emoji: "🎯", text: "IELTS · TOEFL · PTE preparation" },
    title: "Find out exactly which band is holding you back",
    subtitle:
      "Take a free 30-minute level test with a certified examiner. You leave with your current band, the skill costing you the most marks, and a study plan built around your test date.",
    cta: { text: "Book my free level test", link: FORM },
    secondaryCta: { text: "Ask about class times", link: WHATSAPP },
    endorsementText: "14,000+ students prepared · Ex-examiner teaching team",
    showcase: {
      type: "image",
      src: img("photo-1523240795612-9a054b0db644"),
      alt: "Teacher giving feedback on a speaking practice session",
    },
  },

  sections: [
    {
      type: "stats",
      data: {
        title: "What our students actually achieve",
        subtitle: "From students who completed a full preparation cycle in the last year.",
        items: [
          { icon: "🎓", value: "14,000+", label: "Students prepared" },
          { icon: "📈", value: "+1.2", label: "Avg. band improvement" },
          { icon: "👩‍🏫", value: "6", label: "Max students per class" },
          { icon: "🗓️", value: "8 weeks", label: "Typical preparation cycle" },
        ],
      },
    },

    {
      type: "features",
      data: {
        title: "Why the level test comes first",
        subtitle: "Most students lose marks in one skill and study all four anyway.",
        items: [
          {
            icon: "🔍",
            title: "Diagnosis before enrolment",
            description:
              "A certified examiner scores all four skills and tells you which one is actually costing you the band.",
          },
          {
            icon: "🗺️",
            title: "A plan tied to your test date",
            description:
              "Weekly targets counted back from the date you're sitting, not a generic course calendar.",
          },
          {
            icon: "✍️",
            title: "Marked writing every week",
            description:
              "Real examiner feedback on full essays — not a score, but the specific reason marks were lost.",
          },
          {
            icon: "🗣️",
            title: "Speaking practice with a human",
            description:
              "One-to-one mock speaking sessions recorded, so you hear the hesitation you don't notice live.",
          },
        ],
      },
    },

    {
      type: "process",
      data: {
        title: "How preparation starts",
        subtitle: "Three steps, and the first one costs nothing.",
        steps: [
          {
            title: "Free level test",
            description: "Thirty minutes online covering all four skills, scored by a certified examiner.",
            image: { src: img("photo-1503676260728-1c00da094a0b", 800), alt: "Student taking a written practice test" },
          },
          {
            title: "Your study plan",
            description: "A written plan with weekly targets, your weakest skill first, built around your test date.",
          },
          {
            title: "Class placement",
            description: "You're placed with students at your level — not in whichever class starts next.",
          },
        ],
      },
    },

    {
      type: "trust",
      data: {
        backgroundImage: {
          src: img("photo-1427504494785-3a9ca7044f45", 1400),
          alt: "Study materials and notes on a desk",
        },
        badges: [
          { icon: "🪪", title: "Certified examiners", subtitle: "Teachers with official examiner training" },
          { icon: "👥", title: "Six students maximum", subtitle: "Everyone speaks in every session" },
          { icon: "📊", title: "Progress you can see", subtitle: "Skill-by-skill scores tracked each week" },
          { icon: "🕒", title: "Timezone-friendly classes", subtitle: "Morning, evening, and weekend groups" },
        ],
      },
    },

    {
      type: "reviews",
      data: {
        title: "What students say",
        description: "Feedback from students who sat the test after preparing with us.",
        items: [
          {
            name: "Duy N.",
            location: "Vietnam",
            channel: "WhatsApp",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Duy N." },
            content: {
              text: "The level test showed my writing was the problem, not speaking like I assumed. Six weeks on writing and I finally got the band I needed.",
            },
          },
          {
            name: "Amina S.",
            location: "Egypt",
            channel: "Email",
            avatar: { src: img("photo-1580489944761-15a19d654956", 200), alt: "Amina S." },
            content: {
              text: "Recorded speaking sessions were uncomfortable to listen back to, and that's exactly why they worked.",
            },
          },
          {
            name: "Paulo R.",
            location: "Brazil",
            channel: "WhatsApp",
            avatar: { src: img("photo-1519085360753-af0119f7cbe7", 200), alt: "Paulo R." },
            content: {
              text: "They told me honestly that my test date was too soon and suggested moving it. Any other school would have just taken the money.",
            },
          },
        ],
      },
    },

    {
      type: "guarantee",
      data: {
        title: "What we commit to",
        description: "Applies from the level test onwards.",
        items: [
          { icon: "🆓", title: "The level test is free", subtitle: "No enrolment required to take it or to keep your plan." },
          { icon: "🗣️", title: "Honest readiness advice", subtitle: "If your test date is unrealistic, we say so." },
          { icon: "📝", title: "Weekly marked work", subtitle: "Written feedback on real essays, not just a score." },
          { icon: "🔄", title: "Switch class times freely", subtitle: "Move groups if your schedule changes." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Common questions" },
        items: [
          {
            question: "Can you guarantee I'll reach my target band?",
            answer:
              "No, and be wary of anyone who does. Your result depends on your starting level, the hours you put in, and your performance on the day. What we can do is tell you honestly whether your target and your test date fit together.",
          },
          {
            question: "How long before the test should I start?",
            answer:
              "Most students need six to ten weeks for a one-band improvement. The level test gives you a realistic answer for your situation rather than an average.",
          },
          {
            question: "Are classes online or in person?",
            answer:
              "Both are available. Online groups run across several timezones, and your consultant will suggest the format that fits your schedule.",
          },
          {
            question: "What happens after the free level test?",
            answer:
              "You receive your skill-by-skill scores and a written study plan. Whether you study with us afterwards is entirely your decision — the plan is yours either way.",
          },
        ],
      },
    },
  ],

  leadForm: {
    enabled: true,
    title: "Book your free level test",
    description:
      "Tell us your target score and test date. A consultant will confirm a test slot and, afterwards, send your study plan.",
    submitText: "Book my level test",
    successMessage: "Thanks — a consultant will confirm your level test slot shortly.",
    fields: {
      name: { enabled: true, required: true, label: "Your name" },
      email: { enabled: true, required: true, label: "Email" },
      phone: { enabled: false, required: false },
      whatsapp: { enabled: true, required: false, label: "WhatsApp (optional)" },
      telegram: { enabled: false, required: false },
      message: {
        enabled: true,
        required: true,
        label: "Which test, your target score, and your test date",
      },
    },
  },

  footer: {
    brandName: "Lexicon Language Lab",
    copyrightYear: "2026",
    contactEmail: "study@lexicon-lab.example",
    privacyPolicy:
      "We collect only the contact details and test information you provide in order to arrange your level test and prepare your study plan. Your test results are shared only with your assigned teacher and consultant, and can be deleted on request.",
    termsOfService:
      "Score improvements described on this page are historical averages across past students and are not a prediction or guarantee of any individual result. Examination scores are determined solely by the relevant examination board. Class schedules and availability are confirmed with you directly.",
  },

  floatingButton: {
    text: "💬 Ask about class times",
    link: WHATSAPP,
  },
};
