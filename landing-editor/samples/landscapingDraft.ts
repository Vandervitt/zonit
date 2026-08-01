// landing-editor/samples/landscapingDraft.ts
//
// 本地生活服务（园艺景观设计与养护）「免费上门看场 + 设计方案」营销落地页样例（海外 leadgen，非交易）。
// 主转化走页内留资表单（hero CTA 指向 #lead-form）——庭院改造需要面积、朝向、预算区间与
// 使用诉求，表单能一次收齐；WhatsApp 作次通道承接养护类快速咨询。
// 页面不出现价目表、设计费在线支付、预付定金："consultation / design" 仅为留资话术。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15558129046 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** 页内留资表单锚点：主转化落点。 */


export const landscapingDraft: LandingPageDraft = {
  contact: {
    primary: "form",
    whatsapp: "+15558129046",
    email: "studio@fernhill-landscapes.example",
  },
  hero: {
    backgroundImage: {
      src: img("photo-1558904541-efa843a96f01", 1600),
      alt: "Landscaped garden with planting and a stone path",
    },
    badge: { emoji: "🌿", text: "Garden design · Build · Maintenance" },
    title: "A garden you'll actually use, not just look at",
    subtitle:
      "Book a site visit and we'll walk the space with you — sun, drainage, soil, and how you want to use it. You'll get a concept plan and a realistic phasing plan before any planting starts.",
    cta: { text: "Book a free site visit", target: { kind: "primary" } },
    secondaryCta: { text: "Ask about maintenance", target: { kind: "channel", channel: "whatsapp", prefill: "Hi Fernhill, I'd like to talk about my garden" } },
    endorsementText: "2,300+ gardens designed & built · Qualified horticulturists",
    showcase: {
      type: "image",
      src: img("photo-1585320806297-9794b3e4eeae"),
      alt: "Gardener planting a newly designed border",
    },
  },

  sections: [
    {
      type: "stats",
      data: {
        title: "How we work",
        subtitle: "From projects completed in the last three years.",
        items: [
          { icon: "🌳", value: "2,300+", label: "Gardens designed & built" },
          { icon: "🧑‍🌾", value: "RHS", label: "Qualified horticulturists on every design" },
          { icon: "💧", value: "70%", label: "Designs using drought-tolerant planting" },
          { icon: "🗓️", value: "2 yr", label: "Establishment care included" },
        ],
      },
    },

    {
      type: "features",
      data: {
        title: "Why the site visit matters",
        subtitle: "Most disappointing gardens were designed from a photo.",
        items: [
          {
            icon: "☀️",
            title: "We survey the conditions",
            description:
              "Sun path, drainage, soil type, and exposure decide what will thrive. Guessing them is why planting fails in year two.",
          },
          {
            icon: "🪴",
            title: "Planting chosen to survive",
            description:
              "Species selected for your conditions and the time you'll realistically give the garden, not just for the render.",
          },
          {
            icon: "🧱",
            title: "Build and planting in one team",
            description:
              "Paving, levels, and planting handled by the same crew, so drainage and structure are solved before anything goes in the ground.",
          },
          {
            icon: "📅",
            title: "Phased if you'd rather",
            description:
              "A plan that can be built in stages across seasons instead of all at once — and still look finished at each stage.",
          },
        ],
      },
    },

    {
      type: "products",
      data: {
        title: "What we take on",
        subtitle: "Tell us which is closest and we'll refine it on site.",
        items: [
          {
            name: "Full garden design & build",
            description: "Concept plan, levels, hard landscaping, and planting delivered end to end.",
            backgroundImage: { src: img("photo-1523348837708-15d4a09cfac2", 800), alt: "Landscaped rear garden" },
          },
          {
            name: "Planting schemes",
            description: "Borders and beds designed for your soil, aspect, and how much time you have.",
            backgroundImage: { src: img("photo-1416879595882-3373a0480b5b", 800), alt: "Mixed planting border in flower" },
          },
          {
            name: "Seasonal maintenance",
            description: "Pruning, feeding, and lawn care on a schedule that suits the planting.",
            backgroundImage: { src: img("photo-1466692476868-aef1dfb1e735", 800), alt: "Gardener tending a lawn and beds" },
          },
        ],
      },
    },

    {
      type: "process",
      data: {
        title: "From site visit to finished garden",
        subtitle: "You see a plan before committing to a build.",
        steps: [
          {
            title: "Free site visit",
            description: "We walk the garden with you, survey conditions, and talk through how you want to use it.",
            image: { src: img("photo-1560448204-e02f11c3d0e2", 800), alt: "Designer discussing plans in a garden" },
          },
          {
            title: "Concept plan & phasing",
            description: "A drawn plan with a planting palette and, if you want, a staged build across seasons.",
          },
          {
            title: "Build, plant, establish",
            description: "The crew builds and plants, then returns through the first seasons while everything establishes.",
          },
        ],
      },
    },

    {
      type: "trust",
      data: {
        backgroundImage: {
          src: img("photo-1591857177580-dc82b9ac4e1e", 1400),
          alt: "Established garden with mature planting",
        },
        badges: [
          { icon: "🎓", title: "Qualified horticulturists", subtitle: "Planting chosen by people who trained in it" },
          { icon: "🛡️", title: "Insured crews", subtitle: "Public liability cover on every project" },
          { icon: "💧", title: "Water-wise planting", subtitle: "Drought-tolerant schemes offered first" },
          { icon: "🌱", title: "Establishment care", subtitle: "We return through the first two seasons" },
        ],
      },
    },

    {
      type: "reviews",
      data: {
        title: "What clients say",
        description: "Feedback from recent garden projects.",
        items: [
          {
            name: "Fiona",
            location: "Surrey",
            channel: "Google",
            avatar: { src: img("photo-1494790108377-be9c29b29330", 200), alt: "Fiona" },
            content: {
              text: "They told me my shady corner would never take the planting I'd set my heart on. Annoying to hear, right to hear.",
            },
          },
          {
            name: "Tom",
            location: "Kent",
            channel: "WhatsApp",
            avatar: { src: img("photo-1500648767791-00dcc994a43e", 200), alt: "Tom" },
            content: {
              text: "We built it over two seasons because of budget. It looked deliberate at every stage, not half-finished.",
            },
          },
          {
            name: "Amara",
            location: "Essex",
            channel: "Google",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Amara" },
            content: {
              text: "Two years on, almost everything they planted is thriving. The drainage work nobody sees is why.",
            },
          },
        ],
      },
    },

    {
      type: "guarantee",
      data: {
        title: "What we commit to",
        description: "From the first visit through establishment.",
        items: [
          { icon: "🆓", title: "Site visit costs nothing", subtitle: "Advice on site is free whether you proceed or not." },
          { icon: "🌱", title: "We replace failed planting", subtitle: "Anything that fails to establish in the first season is replaced." },
          { icon: "📄", title: "Written scope and phasing", subtitle: "You know what's in each stage before it starts." },
          { icon: "🧹", title: "Site cleared each day", subtitle: "Access kept usable while the work runs." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Common questions" },
        items: [
          {
            question: "Do I need a full design, or just planting?",
            answer:
              "Plenty of gardens only need the planting rethinking. If levels, drainage, and paving already work, we'll say so rather than sell you a full design.",
          },
          {
            question: "When is the best time to start?",
            answer:
              "Hard landscaping can run through most of the year; planting is best in autumn or spring. We'll phase the plan around the seasons rather than force everything into one window.",
          },
          {
            question: "Can the work be split across years?",
            answer:
              "Yes, and it often should be. A phased plan is designed so the garden looks intentional at the end of each stage.",
          },
          {
            question: "What happens if plants don't survive?",
            answer:
              "Anything that fails to establish in the first season is replaced. Establishment care visits through the first two seasons are part of the plan.",
          },
        ],
      },
    },
  ],

  leadForm: {
    enabled: true,
    title: "Book a free site visit",
    description:
      "Tell us about the space and how you want to use it. We'll arrange a visit and follow up with a concept plan.",
    submitText: "Book my site visit",
    successMessage: "Thanks — we'll be in touch to arrange your site visit.",
    fields: {
      name: { enabled: true, required: true, label: "Your name" },
      email: { enabled: true, required: true, label: "Email" },
      phone: { enabled: true, required: false, label: "Phone (optional)" },
      whatsapp: { enabled: false, required: false },
      telegram: { enabled: false, required: false },
      message: {
        enabled: true,
        required: true,
        label: "Rough garden size, what you'd like to change, and how you want to use it",
      },
    },
  },

  footer: {
    brandName: "Fernhill Landscapes",
    copyrightYear: "2026",
    privacyPolicy:
      "We collect only the property and contact details needed to arrange your site visit and prepare a concept plan. Photographs of your garden are used for design purposes and are never published without your written permission. Your details can be deleted on request.",
    termsOfService:
      "Concept plans, phasing, and timelines described here are indicative and are confirmed in writing after an on-site survey. Plant performance depends on soil, aspect, weather, and ongoing care. Nothing on this page constitutes a binding quotation.",
  },

  floatingButton: {
    text: "💬 Ask about maintenance",
    target: { kind: "channel", channel: "whatsapp", prefill: "Hi Fernhill, I'd like to talk about my garden" },
  },
};
