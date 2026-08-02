// landing-editor/samples/roofingExteriorDraft.ts
//
// 本地生活服务（屋顶 / 外墙翻新）「免费屋顶检查 + 书面报价」营销落地页样例（海外 leadgen，非交易）。
// 主转化走页内留资表单（hero CTA 指向 #lead-form）——翻新是高客单、慢决策，访客更愿意
// 留地址与房龄等信息约检查，而非即时聊天；电话作次通道承接漏水等紧急情况。
// 页面不出现价目表、分期、在线支付、预付定金："quote / inspection" 仅为留资话术。
//
// 合规口径：翻新前后对比属真实案例展示，须带 disclaimer 说明工期与结果因房况而异。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - 电话 +1 555 246 7130 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** 页内留资表单锚点：主转化落点。 */

/** 漏水等紧急情况直拨。 */

export const roofingExteriorDraft: LandingPageDraft = {
  contact: {
    primary: "form",
    phone: "+15552467130",
    email: "inspections@ridgeway-roofing.example",
  },
  hero: {
    backgroundImage: {
      src: img("photo-1632759145351-1d592919f522", 1600),
      alt: "Roofers working on a residential roof",
    },
    badge: { emoji: "🏠", text: "Roofing · Siding · Gutters" },
    title: "Know what your roof actually needs before anyone quotes it",
    subtitle:
      "Book a free inspection and you'll get photos of every problem area, a written scope, and an honest answer on whether it's a repair or a replacement.",
    cta: { text: "Book my free roof inspection", target: { kind: "primary" } },
    secondaryCta: { text: "Call about an active leak", target: { kind: "channel", channel: "phone" } },
    endorsementText: "11,500+ roofs inspected · Licensed and insured",
    showcase: {
      type: "image",
      src: img("photo-1503174971373-b1f69850bded"),
      alt: "Newly finished roof on a family home",
    },
  },

  sections: [
    {
      type: "stats",
      data: {
        title: "What homeowners weigh up",
        subtitle: "From inspections and projects in the last twelve months.",
        items: [
          { icon: "🔍", value: "11,500+", label: "Roofs inspected" },
          { icon: "🔧", value: "61%", label: "Inspections that needed repair, not replacement" },
          { icon: "📸", value: "100%", label: "Inspections with photo evidence" },
          { icon: "🛡️", value: "25 yr", label: "Workmanship warranty available" },
        ],
      },
    },

    {
      type: "features",
      data: {
        title: "Why the inspection comes first",
        subtitle: "Roofing is the trade people most fear being oversold in.",
        items: [
          {
            icon: "📸",
            title: "Photos of every problem area",
            description:
              "You see what we see — drone and close-up photos of each defect, not a verdict you have to take on faith.",
          },
          {
            icon: "🔧",
            title: "Repair when repair is enough",
            description:
              "Most roofs we inspect don't need replacing yet, and we say so even though repair is the smaller job.",
          },
          {
            icon: "📄",
            title: "Written scope, line by line",
            description:
              "Materials, layers, flashing, and disposal itemised, so you can compare quotes on the same basis.",
          },
          {
            icon: "🧾",
            title: "Insurance claim support",
            description:
              "Storm damage documented in the format adjusters expect, with our report shared directly if you ask.",
          },
        ],
      },
    },

    {
      type: "beforeAfter",
      data: {
        title: "Before & after",
        subtitle: "Recent projects, shared with the homeowners' permission.",
        disclaimer:
          "Photographs show completed work on specific properties. Scope, timeline, and results vary with roof condition, structure, materials, and weather, and are confirmed only after an on-site inspection.",
        items: [
          {
            crmName: "The Whitmore family",
            duration: "4-day replacement",
            caseDescription:
              "Storm-damaged shingles and failed flashing replaced, with new gutters fitted at the same time.",
            beforeImage: { src: img("photo-1416339306562-f3d12fefd36f", 800), alt: "Roof before replacement" },
            afterImage: { src: img("photo-1503174971373-b1f69850bded", 800), alt: "Roof after replacement" },
          },
          {
            crmName: "The Delgado residence",
            duration: "2-day repair",
            caseDescription:
              "Localised leak traced to valley flashing and repaired — full replacement wasn't needed.",
            beforeImage: { src: img("photo-1558036117-15d82a90b9b1", 800), alt: "Damaged roof section before repair" },
            afterImage: { src: img("photo-1632759145351-1d592919f522", 800), alt: "Repaired roof section" },
          },
        ],
      },
    },

    {
      type: "process",
      data: {
        title: "How a project runs",
        subtitle: "The inspection and the written quote both cost nothing.",
        steps: [
          {
            title: "Free inspection",
            description: "We survey the roof, photograph every defect, and check the loft or attic where accessible.",
            image: { src: img("photo-1503387762-592deb58ef4e", 800), alt: "Inspector assessing a roof" },
          },
          {
            title: "Photo report and written scope",
            description: "You get the photos, the recommendation, and an itemised scope you can compare elsewhere.",
          },
          {
            title: "Scheduled work",
            description: "Dates confirmed in writing, materials delivered, and the site cleared each evening.",
          },
        ],
      },
    },

    {
      type: "trust",
      data: {
        backgroundImage: {
          src: img("photo-1600607687939-ce8a6c25118c", 1400),
          alt: "Well-maintained residential exterior",
        },
        badges: [
          { icon: "🪪", title: "Licensed & insured", subtitle: "Liability and workers' cover on every job" },
          { icon: "🏭", title: "Manufacturer-approved", subtitle: "Certified installers for the systems we fit" },
          { icon: "📄", title: "Workmanship warranty", subtitle: "Written, transferable, and up to 25 years" },
          { icon: "🧹", title: "Magnet sweep daily", subtitle: "Nails cleared from the drive and lawn each evening" },
        ],
      },
    },

    {
      type: "reviews",
      data: {
        title: "What homeowners say",
        description: "Reviews from recent projects.",
        items: [
          {
            name: "Karen",
            location: "Ohio",
            channel: "Google",
            avatar: { src: img("photo-1494790108377-be9c29b29330", 200), alt: "Karen" },
            content: {
              text: "Two companies quoted a full replacement. These guys showed me photos and said it was one section of flashing. It was.",
            },
          },
          {
            name: "Doug",
            location: "Michigan",
            channel: "Phone",
            avatar: { src: img("photo-1500648767791-00dcc994a43e", 200), alt: "Doug" },
            content: {
              text: "Their report went straight to my adjuster in the format he wanted. Claim went through without the usual fight.",
            },
          },
          {
            name: "Yolanda",
            location: "Indiana",
            channel: "Google",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Yolanda" },
            content: {
              text: "They swept for nails every single evening. Small thing, but with kids and a dog it mattered a lot.",
            },
          },
        ],
      },
    },

    {
      type: "guarantee",
      data: {
        title: "What we commit to",
        description: "From the inspection through to the warranty period.",
        items: [
          { icon: "🆓", title: "Inspection and quote are free", subtitle: "The photo report is yours whether you hire us or not." },
          { icon: "🙅", title: "No pressure to replace", subtitle: "If a repair will do, that's what we'll recommend." },
          { icon: "📄", title: "Written workmanship warranty", subtitle: "Transferable if you sell the property." },
          { icon: "🧹", title: "Clean site every evening", subtitle: "Debris removed and nails swept daily." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Common questions" },
        items: [
          {
            question: "Does my roof need replacing or repairing?",
            answer:
              "Most of the roofs we inspect need a repair rather than a replacement. The inspection photos will show you the difference clearly, and the recommendation is written down so you can get a second opinion.",
          },
          {
            question: "How long does the work take?",
            answer:
              "A typical repair is one to two days and a full replacement three to five, weather permitting. Your written scope gives dates specific to your property.",
          },
          {
            question: "Can you help with an insurance claim?",
            answer:
              "Yes. We document storm damage in the format adjusters expect and can share the report directly with your insurer at your request.",
          },
          {
            question: "What happens if it rains mid-project?",
            answer:
              "Open sections are covered and secured before the crew leaves each day, and the schedule shifts rather than rushing work in bad weather.",
          },
        ],
      },
    },
  ],

  leadForm: {
    enabled: true,
    title: "Book your free roof inspection",
    description:
      "Tell us about the property and what you've noticed. We'll arrange the inspection and send the photo report afterwards.",
    submitText: "Book my inspection",
    successMessage: "Thanks — we'll be in touch to arrange your inspection.",
    fields: {
      name: { enabled: true, required: true, label: "Your name" },
      email: { enabled: true, required: false, label: "Email (optional)" },
      phone: { enabled: true, required: true, label: "Phone number" },
      whatsapp: { enabled: false, required: false },
      telegram: { enabled: false, required: false },
      message: {
        enabled: true,
        required: true,
        label: "Property address, roof age if known, and what you've noticed",
      },
    },
  },

  footer: {
    brandName: "Ridgeway Roofing & Exteriors",
    copyrightYear: "2026",
    privacyPolicy:
      "We collect only the property and contact details needed to arrange your inspection and prepare a scope of work. Inspection photos are shared with you and, at your request, your insurer; they are never published without written permission and can be deleted on request.",
    termsOfService:
      "Inspection findings, timelines, and warranty terms described here are indicative and are confirmed in writing after an on-site survey. Project duration depends on roof condition, structure, materials, and weather. Nothing on this page constitutes a binding quotation.",
  },

  floatingButton: {
    text: "📞 Active leak? Call now",
    target: { kind: "channel", channel: "phone" },
  },
};
