// landing-editor/samples/k12TutoringDraft.ts
//
// K12 课外辅导（数学 / 科学 / 备考）「免费学情评估」营销落地页样例（海外 leadgen，非交易）。
// 主转化走 WhatsApp（家长多在手机上问排课与老师），页内留资表单作第二落点收年级、
// 科目与时间偏好。
// 页面不出现课时单价、课包、在线支付：一律以"免费评估 + 试听"作为留资话术。
//
// 合规口径：涉及未成年人，页面不写成绩承诺、不做提分保证，成绩相关表述限定为
// 历史平均且明示因人而异；明确由家长提交信息、可随时删除。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15556604392 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15556604392?text=Hi%20Sparkpath%2C%20I%27d%20like%20a%20free%20assessment%20for%20my%20child";

/** 页内留资表单锚点：第二落点。 */
const FORM = "#lead-form";

export const k12TutoringDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1580582932707-520aed937b7b", 1600),
      alt: "Students working together in a classroom",
    },
    badge: { emoji: "📚", text: "Maths · Science · Exam preparation" },
    title: "Find out where the gap actually started",
    subtitle:
      "Most struggles in Year 9 began two years earlier. Book a free assessment and we'll show you which topics are missing, then match a tutor who teaches the way your child learns.",
    cta: { text: "Book a free assessment", link: WHATSAPP },
    secondaryCta: { text: "Send details instead", link: FORM },
    endorsementText: "6,800+ families · Background-checked tutors",
    showcase: {
      type: "image",
      src: img("photo-1509062522246-3755977927d7"),
      alt: "Tutor helping a student with a maths problem",
    },
  },

  sections: [
    {
      type: "stats",
      data: {
        title: "What parents look at",
        subtitle: "From families who completed at least one term with us.",
        items: [
          { icon: "👨‍👩‍👧", value: "6,800+", label: "Families supported" },
          { icon: "🧑‍🏫", value: "1:1", label: "Tutor to student" },
          { icon: "📈", value: "1 grade", label: "Avg. improvement per term" },
          { icon: "🔁", value: "81%", label: "Families who continue a second term" },
        ],
      },
    },

    {
      type: "features",
      data: {
        title: "How we work with your child",
        subtitle: "Same approach whether it's catch-up or exam preparation.",
        items: [
          {
            icon: "🔍",
            title: "Assessment before lessons",
            description:
              "We map which prior topics are missing, because tutoring the current chapter rarely fixes the real gap.",
          },
          {
            icon: "🤝",
            title: "Matched, not allocated",
            description:
              "Tutors are matched on subject and teaching style, and you can request a different one after any session.",
          },
          {
            icon: "📩",
            title: "A short report every session",
            description:
              "What was covered, what your child found hard, and what to practise — in plain language, not jargon.",
          },
          {
            icon: "🛡️",
            title: "Safeguarding as standard",
            description:
              "Every tutor is background-checked, and online sessions are recorded and available to parents.",
          },
        ],
      },
    },

    {
      type: "process",
      data: {
        title: "Getting started takes a week",
        subtitle: "The assessment and the first session cost nothing.",
        steps: [
          {
            title: "Free assessment",
            description: "A short diagnostic session that identifies the missing topics, not just the current grade.",
            image: { src: img("photo-1571260899304-425eee4c7efc", 800), alt: "Child working through an exercise book" },
          },
          {
            title: "Tutor match & trial session",
            description: "We propose a tutor and you sit in on a trial session before committing to anything.",
          },
          {
            title: "Weekly sessions and reports",
            description: "Regular sessions with a written summary after each one, and a review with you each term.",
          },
        ],
      },
    },

    {
      type: "trust",
      data: {
        backgroundImage: {
          src: img("photo-1546410531-bb4caa6b424d", 1400),
          alt: "School books and stationery on a desk",
        },
        badges: [
          { icon: "🪪", title: "Background-checked tutors", subtitle: "Identity, references, and safeguarding checks" },
          { icon: "🎥", title: "Sessions recorded", subtitle: "Parents can review any online session" },
          { icon: "📄", title: "Report after every session", subtitle: "You always know what was covered" },
          { icon: "🔄", title: "Change tutor any time", subtitle: "No explanation needed, no penalty" },
        ],
      },
    },

    {
      type: "reviews",
      data: {
        title: "What parents say",
        description: "Feedback from families across the area.",
        items: [
          {
            name: "Rachel",
            location: "Bristol",
            channel: "Google",
            avatar: { src: img("photo-1494790108377-be9c29b29330", 200), alt: "Rachel" },
            content: {
              text: "The assessment found gaps from two years back. Once those were fixed, the current work stopped being a battle.",
            },
          },
          {
            name: "Yusuf",
            location: "Luton",
            channel: "WhatsApp",
            avatar: { src: img("photo-1633332755192-727a05c4013d", 200), alt: "Yusuf" },
            content: {
              text: "We asked to change tutor after two sessions. No awkwardness, new match that week, and it clicked.",
            },
          },
          {
            name: "Priya",
            location: "Leicester",
            channel: "Google",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Priya" },
            content: {
              text: "The session reports are what sold me. I finally know what she's struggling with instead of guessing.",
            },
          },
        ],
      },
    },

    {
      type: "guarantee",
      data: {
        title: "What you can count on",
        description: "Our commitments to families.",
        items: [
          { icon: "🆓", title: "Assessment and trial are free", subtitle: "Nothing to pay before you've seen a session." },
          { icon: "🔄", title: "Change tutor any time", subtitle: "Tell us it isn't working and we rematch." },
          { icon: "📅", title: "Reschedule without fuss", subtitle: "Move a session when school life gets busy." },
          { icon: "🙅", title: "No lesson packages required", subtitle: "Continue term by term, not by prepaid bundle." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Common questions" },
        items: [
          {
            question: "Can you guarantee my child's grade will improve?",
            answer:
              "No. Progress depends on your child's starting point, the time they put in, and their school context. The figures on this page are averages across past students, not a prediction for any individual child.",
          },
          {
            question: "Are sessions online or in person?",
            answer:
              "Both, depending on your area. Online sessions are recorded so you can review them; in-person tutors are background-checked in the same way.",
          },
          {
            question: "What if my child doesn't get on with the tutor?",
            answer:
              "Tell us and we'll rematch, usually within the same week. You don't need to justify it — fit matters more than credentials at this age.",
          },
          {
            question: "How often should sessions be?",
            answer:
              "Most families start with one session a week. After the assessment we'll tell you honestly whether that's enough for the gap we've found.",
          },
        ],
      },
    },
  ],

  leadForm: {
    enabled: true,
    title: "Send your child's details",
    description:
      "Prefer not to chat? Leave the details and a coordinator will arrange the free assessment at a time that suits you.",
    submitText: "Request an assessment",
    successMessage: "Thanks — a coordinator will contact you to arrange the assessment.",
    fields: {
      name: { enabled: true, required: true, label: "Parent or guardian name" },
      email: { enabled: true, required: false, label: "Email (optional)" },
      phone: { enabled: true, required: true, label: "Phone number" },
      whatsapp: { enabled: true, required: false, label: "WhatsApp (optional)" },
      telegram: { enabled: false, required: false },
      message: {
        enabled: true,
        required: true,
        label: "Year group, subject, and the times that suit you",
      },
    },
  },

  footer: {
    brandName: "Sparkpath Tutoring",
    copyrightYear: "2026",
    contactEmail: "families@sparkpath-tutoring.example",
    privacyPolicy:
      "Enquiries are submitted by a parent or guardian. We collect only the contact details and school information needed to arrange an assessment and match a tutor. Information about a child is shared only with the assigned tutor and coordinator, is never used for advertising, and is deleted on request.",
    termsOfService:
      "Improvement figures on this page are historical averages across past students and are not a prediction or guarantee of any individual result. Academic outcomes are determined by schools and examination boards. Tutor availability, session times, and formats are confirmed with you directly.",
  },

  floatingButton: {
    text: "💬 Book a free assessment",
    link: WHATSAPP,
  },
};
