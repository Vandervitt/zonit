// landing-editor/samples/onlineSkillsDraft.ts
//
// 职业技能在线课（数据分析 / UX / 云计算认证）「课程顾问咨询」营销落地页样例（海外 leadgen，非交易）。
// 主转化走页内留资表单（hero CTA 指向 #lead-form）——转行学员要先对齐背景、目标岗位与可投入
// 时间，表单一次收齐后由顾问回访；WhatsApp 作次通道。
// 页面不出现学费、分期、优惠码、在线报名付款：一律留到顾问对话中。
//
// 合规口径：职业培训属高审查品类，页面不写收入承诺、不写包就业、不写"保offer"，
// 就业相关表述一律限定为历史数据且明示因人而异。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15557712048 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** 页内留资表单锚点：主转化落点。 */
const FORM = "#lead-form";

const WHATSAPP =
  "https://wa.me/15557712048?text=Hi%20Northlane%2C%20I%27d%20like%20to%20speak%20to%20a%20course%20advisor";

export const onlineSkillsDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1516321318423-f06f85e504b3", 1600),
      alt: "Person studying an online course on a laptop",
    },
    badge: { emoji: "💼", text: "Part-time, mentor-led career courses" },
    title: "Change careers without quitting your job first",
    subtitle:
      "Talk to an advisor about where you're starting from. You'll get an honest view of which track fits your background, how many hours a week it really takes, and what the job market looks like for it.",
    cta: { text: "Talk to a course advisor", link: FORM },
    secondaryCta: { text: "See the curriculum", link: "https://example.com/northlane-curriculum" },
    endorsementText: "9,400+ learners · Mentors working in the field today",
    showcase: {
      type: "image",
      src: img("photo-1517245386807-bb43f82c33c4"),
      alt: "Learner reviewing a project on screen",
    },
  },

  sections: [
    {
      type: "stats",
      data: {
        title: "How the programme runs",
        subtitle: "Figures from cohorts completed in the last twelve months.",
        items: [
          { icon: "👩‍🎓", value: "9,400+", label: "Learners enrolled" },
          { icon: "🧑‍🏫", value: "1:1", label: "Weekly mentor session" },
          { icon: "⏳", value: "8–10 h", label: "Typical weekly commitment" },
          { icon: "🧩", value: "5", label: "Portfolio projects per track" },
        ],
      },
    },

    {
      type: "features",
      data: {
        title: "What makes it work part-time",
        subtitle: "Built for people studying around a job and a family.",
        items: [
          {
            icon: "🧑‍🏫",
            title: "A mentor who does the job",
            description:
              "Weekly one-to-one sessions with someone currently working in the field, not a full-time course tutor.",
          },
          {
            icon: "🧩",
            title: "Portfolio over certificates",
            description:
              "You finish with projects an employer can inspect, because a certificate alone rarely gets an interview.",
          },
          {
            icon: "🗓️",
            title: "Deadlines you can move",
            description:
              "Fall behind during a busy month and your mentor reschedules the plan instead of dropping you.",
          },
          {
            icon: "🎤",
            title: "Interview practice included",
            description:
              "Mock technical and behavioural interviews with written feedback before you start applying.",
          },
        ],
      },
    },

    {
      type: "products",
      data: {
        title: "Career tracks",
        subtitle: "Your advisor will tell you which one your background actually fits.",
        items: [
          {
            name: "Data analytics",
            description: "SQL, spreadsheets, visualisation, and the reporting work analysts do daily.",
            backgroundImage: { src: img("photo-1551288049-bebda4e38f71", 800), alt: "Analytics dashboard on a screen" },
          },
          {
            name: "UX & product design",
            description: "Research, wireframing, prototyping, and presenting design decisions.",
            backgroundImage: { src: img("photo-1499750310107-5fef28a66643", 800), alt: "Designer sketching interface ideas" },
          },
          {
            name: "Cloud & DevOps",
            description: "Containers, CI/CD, and the certification path employers screen for.",
            backgroundImage: { src: img("photo-1581094794329-c8112a89af12", 800), alt: "Engineer working on infrastructure code" },
          },
        ],
      },
    },

    {
      type: "process",
      data: {
        title: "From first call to first project",
        subtitle: "Nothing starts until the fit is clear.",
        steps: [
          {
            title: "Advisor call",
            description: "Your background, target role, and how many hours a week you can genuinely give.",
            image: { src: img("photo-1522071820081-009f0129c71c", 800), alt: "Advisor call in progress" },
          },
          {
            title: "Track recommendation",
            description: "A written recommendation, including the honest option of not enrolling yet.",
          },
          {
            title: "Mentor matching",
            description: "You're matched to a mentor by industry and timezone before the cohort begins.",
          },
        ],
      },
    },

    {
      type: "trust",
      data: {
        backgroundImage: {
          src: img("photo-1497366216548-37526070297c", 1400),
          alt: "Open-plan workspace",
        },
        badges: [
          { icon: "🧑‍💻", title: "Practising mentors", subtitle: "Working professionals, not career trainers" },
          { icon: "📁", title: "Portfolio-first", subtitle: "Five reviewed projects per track" },
          { icon: "🔁", title: "Cohort deferral", subtitle: "Move to a later cohort if life intervenes" },
          { icon: "🌍", title: "Timezone matching", subtitle: "Mentor sessions scheduled around your day job" },
        ],
      },
    },

    {
      type: "reviews",
      data: {
        title: "What learners say",
        description: "Feedback from people who studied while working.",
        items: [
          {
            name: "Grace O.",
            location: "Kenya",
            channel: "Email",
            avatar: { src: img("photo-1573497019940-1c28c88b4f3e", 200), alt: "Grace O." },
            content: {
              text: "The advisor told me to start with analytics instead of the track I asked about. She was right — I'd have struggled in the other one.",
            },
          },
          {
            name: "Marco P.",
            location: "Italy",
            channel: "WhatsApp",
            avatar: { src: img("photo-1500648767791-00dcc994a43e", 200), alt: "Marco P." },
            content: {
              text: "My mentor reviewed every project like a code review at work. That feedback was the whole value.",
            },
          },
          {
            name: "Hana K.",
            location: "Japan",
            channel: "Email",
            avatar: { src: img("photo-1487412720507-e7ab37603c6f", 200), alt: "Hana K." },
            content: {
              text: "I deferred a cohort when my job got busy and nobody made me feel bad about it. Came back and finished.",
            },
          },
        ],
      },
    },

    {
      type: "guarantee",
      data: {
        title: "How we handle your enrolment",
        description: "Commitments made on the advisor call.",
        items: [
          { icon: "🗣️", title: "We'll tell you not to enrol", subtitle: "If the timing or the fit is wrong, you'll hear it." },
          { icon: "⏳", title: "Realistic hours up front", subtitle: "The weekly commitment is stated before you decide." },
          { icon: "🔁", title: "Defer without penalty", subtitle: "Move to a later cohort if your circumstances change." },
          { icon: "🧑‍🏫", title: "Mentor swap on request", subtitle: "If the match isn't working, we reassign it." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Common questions" },
        items: [
          {
            question: "Will this get me a job?",
            answer:
              "We can't promise that, and any course that does is worth avoiding. Hiring depends on your portfolio, your market, and timing. What we provide is mentor-reviewed project work, interview practice, and an honest read on your prospects before you enrol.",
          },
          {
            question: "How much time does it take each week?",
            answer:
              "Most learners spend eight to ten hours a week. Your advisor will be blunt about whether that's compatible with your current schedule.",
          },
          {
            question: "Do I need a technical background?",
            answer:
              "For some tracks, no. For others it genuinely helps. That's the main thing the advisor call is for — matching the track to where you're actually starting from.",
          },
          {
            question: "What if I fall behind?",
            answer:
              "Tell your mentor. Plans get rescheduled and, if a month is impossible, you can defer to a later cohort rather than dropping out.",
          },
        ],
      },
    },
  ],

  leadForm: {
    enabled: true,
    title: "Talk to a course advisor",
    description:
      "Tell us your background and the role you're aiming for. An advisor will come back with a track recommendation — including whether now is the right time.",
    submitText: "Request an advisor call",
    successMessage: "Thanks — an advisor will be in touch to arrange your call.",
    fields: {
      name: { enabled: true, required: true, label: "Your name" },
      email: { enabled: true, required: true, label: "Email" },
      phone: { enabled: false, required: false },
      whatsapp: { enabled: true, required: false, label: "WhatsApp (optional)" },
      telegram: { enabled: false, required: false },
      message: {
        enabled: true,
        required: true,
        label: "Your current role, target role, and hours available per week",
      },
    },
  },

  footer: {
    brandName: "Northlane Skills Academy",
    copyrightYear: "2026",
    contactEmail: "advisors@northlane-skills.example",
    privacyPolicy:
      "We collect only the background and contact details you provide in order to recommend a track and arrange your advisor call. Your information is not sold, is not shared with employers without your consent, and can be deleted on request.",
    termsOfService:
      "This page describes education and mentoring services only. No employment outcome, salary level, or hiring result is promised or implied, and any figures shown are historical cohort data that will not apply to every learner. Course schedules, track availability, and mentor allocation are confirmed with you directly.",
  },

  floatingButton: {
    text: "💬 Ask an advisor",
    link: WHATSAPP,
  },
};
