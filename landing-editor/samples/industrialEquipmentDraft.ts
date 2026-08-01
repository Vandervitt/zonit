// landing-editor/samples/industrialEquipmentDraft.ts
//
// 工业设备 / 机械「选型咨询 + 样机演示」营销落地页样例（海外 leadgen，非交易）。
// 主转化走页内留资表单（hero CTA 指向 #lead-form）——设备选型需要产能、物料、
// 场地等参数，一次性填表比即时聊天更有效；WhatsApp 作次通道。
// 页面不出现设备价格、订金、付款条件：商务条件一律留到销售对话中。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** 页内留资表单锚点：主转化落点。 */


export const industrialEquipmentDraft: LandingPageDraft = {
  contact: {
    primary: "form",
    whatsapp: "+15551234567",
    email: "engineering@axelon-machinery.example",
  },
  hero: {
    backgroundImage: {
      src: img("photo-1565043666747-69f6646db940", 1600),
      alt: "Industrial production machinery on a factory floor",
    },
    badge: { emoji: "⚙️", text: "Packaging & processing machinery" },
    title: "Pick the right machine the first time",
    subtitle:
      "Send us your output target, material, and floor space. An application engineer comes back with a recommended configuration, throughput figures, and a sample-run plan.",
    cta: { text: "Get a configuration proposal", target: { kind: "primary" } },
    secondaryCta: { text: "Watch a line in operation", target: { kind: "url", url: "https://example.com/axelon-line-video" } },
    endorsementText: "1,200+ lines commissioned across 45 countries",
    showcase: {
      type: "image",
      src: img("photo-1504328345606-18bbc8c9d7d1"),
      alt: "Engineer calibrating a production machine",
    },
  },

  sections: [
    {
      type: "stats",
      data: {
        title: "What buyers evaluate us on",
        subtitle: "Figures our application engineers are held to.",
        items: [
          { icon: "🏭", value: "1,200+", label: "Lines commissioned" },
          { icon: "🌍", value: "45", label: "Countries served" },
          { icon: "🔧", value: "48 h", label: "Spare-part dispatch target" },
          { icon: "📈", value: "24 mo", label: "Standard warranty period" },
        ],
      },
    },

    {
      type: "features",
      data: {
        title: "Why buyers shortlist Axelon",
        subtitle: "Engineering answers, not a brochure.",
        items: [
          {
            icon: "📐",
            title: "Configuration before commitment",
            description:
              "We size the machine to your actual throughput and material — not to whatever we have in stock.",
          },
          {
            icon: "🧪",
            title: "Sample runs with your material",
            description:
              "Send your product and we run it on the proposed configuration, then share the results and settings.",
          },
          {
            icon: "🛠️",
            title: "Commissioning and training",
            description:
              "Installation, line balancing, and operator training included in every project plan.",
          },
          {
            icon: "📦",
            title: "Parts availability stated up front",
            description:
              "Wear-part lists and dispatch times are given before you decide, not discovered a year in.",
          },
        ],
      },
    },

    {
      type: "products",
      data: {
        title: "Equipment lines",
        subtitle: "Tell us your product and we'll point to the right family.",
        items: [
          {
            name: "Filling & dosing",
            description: "Volumetric and gravimetric filling for liquids, powders, and granules.",
            backgroundImage: { src: img("photo-1553413077-190dd305871c", 800), alt: "Filling line in operation" },
          },
          {
            name: "Labelling & coding",
            description: "Wrap-around and top-bottom labelling with inline date and batch coding.",
            backgroundImage: { src: img("photo-1587293852726-70cdb56c2866", 800), alt: "Labelled products moving along a conveyor" },
          },
          {
            name: "End-of-line packing",
            description: "Case packing, shrink wrapping, and palletising sized to your shift output.",
            backgroundImage: { src: img("photo-1601598851547-4302969d0614", 800), alt: "Palletised cases in a warehouse" },
          },
        ],
      },
    },

    {
      type: "process",
      data: {
        title: "From enquiry to commissioning",
        subtitle: "Four stages, each with a written output you keep.",
        steps: [
          {
            title: "Share your requirements",
            description: "Output target, material, container format, and available floor space.",
            image: { src: img("photo-1454165804606-c3d57bc86b40", 800), alt: "Engineers reviewing a line layout" },
          },
          {
            title: "Configuration proposal",
            description: "A recommended machine configuration with throughput figures and a layout drawing.",
          },
          {
            title: "Sample run",
            description: "We run your material and share settings, output rate, and any adjustments needed.",
          },
          {
            title: "Install & train",
            description: "Commissioning on site, line balancing, and hands-on operator training.",
          },
        ],
      },
    },

    {
      type: "trust",
      data: {
        backgroundImage: {
          src: img("photo-1581091226825-a6a2a5aee158", 1400),
          alt: "Modern manufacturing facility interior",
        },
        badges: [
          { icon: "📋", title: "CE conformity", subtitle: "Machinery built to EU safety directives" },
          { icon: "🔩", title: "Standard components", subtitle: "Siemens / SEW parts sourced locally worldwide" },
          { icon: "🎓", title: "Operator training included", subtitle: "On-site handover, not a PDF manual" },
          { icon: "🛰️", title: "Remote diagnostics", subtitle: "Engineers can dial in before flying out" },
        ],
      },
    },

    {
      type: "reviews",
      data: {
        title: "What plant managers say",
        description: "Feedback from teams running our lines daily.",
        items: [
          {
            name: "Jorge M.",
            location: "Mexico",
            channel: "Email",
            avatar: { src: img("photo-1500648767791-00dcc994a43e", 200), alt: "Jorge M." },
            content: {
              text: "They ran our product before we ordered and told us the format needed changing. Saved us a very expensive mistake.",
            },
          },
          {
            name: "Ilona V.",
            location: "Poland",
            channel: "Email",
            avatar: { src: img("photo-1487412720507-e7ab37603c6f", 200), alt: "Ilona V." },
            content: {
              text: "Commissioning finished a day early and both shifts were trained before the engineer left.",
            },
          },
          {
            name: "Rahul T.",
            location: "India",
            channel: "WhatsApp",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Rahul T." },
            content: {
              text: "Wear parts arrived in three days when a belt failed. That response time is why we bought the second line.",
            },
          },
        ],
      },
    },

    {
      type: "guarantee",
      data: {
        title: "What we commit to",
        description: "Applies from the first enquiry through the warranty period.",
        items: [
          { icon: "📄", title: "Written specifications", subtitle: "Throughput and tolerances stated in the proposal." },
          { icon: "🧪", title: "Proven on your material", subtitle: "No configuration is proposed without a sample run." },
          { icon: "👤", title: "One application engineer", subtitle: "The same person from enquiry through commissioning." },
          { icon: "🔧", title: "Parts availability stated", subtitle: "Wear-part lists and dispatch targets given up front." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Common questions" },
        items: [
          {
            question: "What information do you need to propose a configuration?",
            answer:
              "Your target output per shift, the material or product, container format, and available floor space. If you're unsure on any of it, describe what you have and an engineer will ask.",
          },
          {
            question: "Can you test with our actual product?",
            answer:
              "Yes. Send a sample and we run it on the proposed configuration, then share the output rate and the settings used.",
          },
          {
            question: "What are typical lead times?",
            answer:
              "It depends on the configuration and current build slots. Your engineer confirms a realistic date in the proposal rather than quoting a best case.",
          },
          {
            question: "Do you handle installation abroad?",
            answer:
              "Yes. Commissioning and operator training on site are part of the project plan, with remote diagnostics available afterwards.",
          },
        ],
      },
    },
  ],

  leadForm: {
    enabled: true,
    title: "Get a configuration proposal",
    description:
      "Tell us what you need to produce. An application engineer replies with a recommended configuration and a sample-run plan.",
    submitText: "Send my requirements",
    successMessage: "Thanks — an application engineer will be in touch within one business day.",
    fields: {
      name: { enabled: true, required: true, label: "Your name" },
      email: { enabled: true, required: true, label: "Work email" },
      phone: { enabled: false, required: false },
      whatsapp: { enabled: true, required: false, label: "WhatsApp (optional)" },
      telegram: { enabled: false, required: false },
      message: {
        enabled: true,
        required: true,
        label: "Product, target output per shift, and available floor space",
      },
    },
  },

  footer: {
    brandName: "Axelon Machinery",
    copyrightYear: "2026",
    privacyPolicy:
      "We collect only the production details you share in order to prepare your configuration proposal. Product samples and specifications are treated as confidential, are never shared outside the project team, and can be returned or destroyed on request.",
    termsOfService:
      "Throughput figures, lead times, and configuration details on this page are indicative and are confirmed in writing after an engineering review and sample run. Nothing on this page constitutes a binding offer.",
  },

  floatingButton: {
    text: "💬 Ask an engineer",
    target: { kind: "channel", channel: "whatsapp", prefill: "Hi Axelon, I'd like help selecting a machine" },
  },
};
