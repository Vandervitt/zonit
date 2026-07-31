// landing-editor/samples/hvacRepairDraft.ts
//
// 本地生活服务（暖通空调维修 / 保养）「同日上门」营销落地页样例（海外 leadgen，非交易）。
// 主转化走电话（tel:）——设备故障属紧急需求，访客要的是立刻接通；页内留资表单作
// 第二落点承接非紧急的保养与更换咨询。
// 页面不出现价目表、在线支付、预付定金："diagnostic / quote" 仅为留资话术。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - 电话 +1 555 903 4180 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** 紧急需求走电话直拨。 */
const PHONE = "tel:+15559034180";

/** 页内留资表单锚点：第二落点（非紧急咨询）。 */
const FORM = "#lead-form";

export const hvacRepairDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1621905251189-08b45d6a269e", 1600),
      alt: "Technician servicing a heating and cooling unit",
    },
    badge: { emoji: "🛠️", text: "Licensed HVAC technicians" },
    title: "No heat? No cooling? We'll be there today",
    subtitle:
      "Call and speak to a technician, not a call centre. Same-day slots in most of the area, a diagnosis before any work starts, and a written price you approve first.",
    cta: { text: "Call now for same-day service", link: PHONE },
    secondaryCta: { text: "Book a service visit", link: FORM },
    endorsementText: "31,000+ callouts · Licensed and insured",
    showcase: {
      type: "image",
      src: img("photo-1607472586893-edb57bdc0e39"),
      alt: "Engineer checking an air conditioning system",
    },
  },

  sections: [
    {
      type: "stats",
      data: {
        title: "What matters when the system fails",
        subtitle: "Figures from the last twelve months of callouts.",
        items: [
          { icon: "🚨", value: "31,000+", label: "Callouts attended" },
          { icon: "⏱️", value: "Same day", label: "For most calls before 2pm" },
          { icon: "🔧", value: "89%", label: "Fixed on the first visit" },
          { icon: "🪪", value: "100%", label: "Licensed, insured technicians" },
        ],
      },
    },

    {
      type: "features",
      data: {
        title: "How we handle a callout",
        subtitle: "Diagnose, price, then fix — in that order.",
        items: [
          {
            icon: "🔍",
            title: "Diagnosis before any work",
            description:
              "The technician finds the actual fault and explains it before touching a single part.",
          },
          {
            icon: "🧾",
            title: "You approve the price first",
            description:
              "A written price for the repair, approved by you, before work begins. Nothing gets added silently.",
          },
          {
            icon: "🚐",
            title: "Common parts on the van",
            description:
              "Capacitors, contactors, sensors, and thermostats carried as standard, so most faults are fixed on the first visit.",
          },
          {
            icon: "🔁",
            title: "Repair before replacement",
            description:
              "We'll tell you when a unit is genuinely worth replacing — and when it isn't yet.",
          },
        ],
      },
    },

    {
      type: "process",
      data: {
        title: "From call to fixed",
        subtitle: "Most jobs finish in a single visit.",
        steps: [
          {
            title: "Call or book a slot",
            description: "Describe the symptoms. A technician gives you an arrival window on the call.",
            image: { src: img("photo-1581092160562-40aa08e78837", 800), alt: "Technician on a service call" },
          },
          {
            title: "Diagnosis on site",
            description: "The fault is identified and explained, with the written repair price given before work starts.",
          },
          {
            title: "Repair and test",
            description: "The technician repairs, runs the system, and shows you the readings before leaving.",
          },
        ],
      },
    },

    {
      type: "trust",
      data: {
        backgroundImage: {
          src: img("photo-1581094794329-c8112a89af12", 1400),
          alt: "Technician with diagnostic equipment",
        },
        badges: [
          { icon: "🪪", title: "Licensed technicians", subtitle: "Certified for refrigerant handling and gas work" },
          { icon: "🛡️", title: "Fully insured", subtitle: "Public liability cover on every visit" },
          { icon: "📄", title: "Written price up front", subtitle: "Approved by you before work begins" },
          { icon: "🔧", title: "Parts warranty", subtitle: "Repairs and parts covered after the visit" },
        ],
      },
    },

    {
      type: "reviews",
      data: {
        title: "What customers say",
        description: "Reviews from recent callouts.",
        items: [
          {
            name: "Denise",
            location: "Phoenix",
            channel: "Google",
            avatar: { src: img("photo-1494790108377-be9c29b29330", 200), alt: "Denise" },
            content: {
              text: "Called at nine, technician arrived by one, cooling back on before dinner. In August that's everything.",
            },
          },
          {
            name: "Ray",
            location: "Dallas",
            channel: "Phone",
            avatar: { src: img("photo-1500648767791-00dcc994a43e", 200), alt: "Ray" },
            content: {
              text: "Two other companies told me to replace the whole unit. This one replaced a capacitor and it's been fine since.",
            },
          },
          {
            name: "Marisol",
            location: "Houston",
            channel: "Google",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Marisol" },
            content: {
              text: "He showed me the readings before and after and explained what the fault actually was. No pressure to buy anything.",
            },
          },
        ],
      },
    },

    {
      type: "guarantee",
      data: {
        title: "What we commit to",
        description: "Applies to every callout and service visit.",
        items: [
          { icon: "📄", title: "Price approved before work", subtitle: "No work starts until you've said yes." },
          { icon: "🙅", title: "No upselling replacements", subtitle: "We repair when repair is the right answer." },
          { icon: "🔧", title: "Repairs warranted", subtitle: "If the same fault returns, we come back." },
          { icon: "🧹", title: "We clean up", subtitle: "Old parts removed, the space left as we found it." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Common questions" },
        items: [
          {
            question: "How quickly can someone come out?",
            answer:
              "Most calls placed before early afternoon get a same-day slot. When we're fully booked we'll say so on the call rather than give you a window we can't keep.",
          },
          {
            question: "Will I know the cost before work starts?",
            answer:
              "Yes. The technician diagnoses the fault, then gives you a written price for the repair. Work only begins once you approve it.",
          },
          {
            question: "Should I repair or replace my system?",
            answer:
              "It depends on the unit's age, the fault, and how it's been maintained. The technician will give you a straight answer, including when replacing isn't worth it yet.",
          },
          {
            question: "Do you service systems you didn't install?",
            answer:
              "Yes, all common makes and models. Tell us the brand and rough age when you call and we'll bring the likely parts.",
          },
        ],
      },
    },
  ],

  leadForm: {
    enabled: true,
    title: "Book a service visit",
    description: "Not urgent? Leave your details and we'll call back to arrange a maintenance or replacement assessment.",
    submitText: "Request a callback",
    successMessage: "Thanks — we'll call you back to arrange a visit.",
    fields: {
      name: { enabled: true, required: true, label: "Your name" },
      email: { enabled: false, required: false },
      phone: { enabled: true, required: true, label: "Phone number" },
      whatsapp: { enabled: false, required: false },
      telegram: { enabled: false, required: false },
      message: {
        enabled: true,
        required: true,
        label: "System type, symptoms, and your address or area",
      },
    },
  },

  footer: {
    brandName: "Northaire Heating & Cooling",
    copyrightYear: "2026",
    contactEmail: "service@northaire-hvac.example",
    privacyPolicy:
      "We collect only the contact and property details needed to schedule your visit and diagnose your system. Service records are kept for warranty purposes, are never sold, and can be deleted on request.",
    termsOfService:
      "Response times and first-visit fix rates on this page are historical averages and vary with location, demand, and parts availability. Repair prices are given in writing after on-site diagnosis and require your approval before work begins.",
  },

  floatingButton: {
    text: "📞 Call for same-day service",
    link: PHONE,
  },
};
