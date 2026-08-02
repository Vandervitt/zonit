// landing-editor/samples/b2bSourcingDraft.ts
//
// B2B 制造 / OEM「询价单（RFQ）」营销落地页样例（海外 leadgen，非交易）。
// 主转化走页内留资表单（hero CTA 指向 #lead-form），WhatsApp 作为次通道，
// 契合海外采购方的真实习惯：先留需求与规格，再由业务跟进。
// 全程无下单 / 报价成交 / 结账语义——"quote" 仅为留资话术，不产生交易。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

/** Unsplash 图片地址助手：统一裁剪与画质参数。 */
const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** 页内留资表单锚点：主转化落点。 */


export const b2bSourcingDraft: LandingPageDraft = {
  contact: {
    primary: "form",
    whatsapp: "+15551234567",
    email: "sales@meridian-sourcing.com",
  },
  hero: {
    backgroundImage: {
      src: img("photo-1581091226825-a6a2a5aee158", 1600),
      alt: "Production line inside a modern manufacturing facility",
    },
    badge: { emoji: "🏭", text: "OEM & private label manufacturing" },
    title: "Your product, built to spec — without the sourcing headache",
    subtitle:
      "Send us your specs and target quantity. An engineer replies with materials, lead time, and a sample plan — usually within one business day.",
    cta: { text: "Request a quote", target: { kind: "primary" } },
    secondaryCta: { text: "See our capabilities", target: { kind: "url", url: "https://example.com/meridian-capabilities" } },
    endorsementText: "Trusted by 400+ brands across 30 countries",
    showcase: {
      type: "image",
      src: img("photo-1618477388954-7852f32655ec"),
      alt: "Quality inspection of finished goods before shipment",
    },
  },

  sections: [
    // 1. 数据展示：把"靠谱"量化
    {
      type: "stats",
      data: {
        title: "Built for buyers who need it right",
        subtitle: "The numbers our clients care about most.",
        items: [
          { icon: "🏭", value: "18 yrs", label: "In-house manufacturing" },
          { icon: "📦", value: "400+", label: "Brands served" },
          { icon: "⏱️", value: "<24 h", label: "Avg. quote turnaround" },
          { icon: "✅", value: "99.2%", label: "On-time shipment rate" },
        ],
      },
    },

    // 2. 特性（core-value 组）
    {
      type: "features",
      data: {
        title: "Why buyers keep coming back",
        subtitle: "Engineering support, not just a price sheet.",
        items: [
          {
            icon: "📐",
            title: "Engineer-led quoting",
            description:
              "An engineer reviews your drawings and flags cost drivers before you commit to tooling.",
          },
          {
            icon: "🧪",
            title: "Samples before scale",
            description:
              "Pre-production samples and a written spec sheet, so what ships matches what you approved.",
          },
          {
            icon: "🔍",
            title: "Inspection at every stage",
            description:
              "Incoming materials, in-line, and pre-shipment checks — with photo reports you can share internally.",
          },
          {
            icon: "🌍",
            title: "Export documentation handled",
            description:
              "Certificates, packing lists, and compliance paperwork prepared for your destination market.",
          },
        ],
      },
    },

    // 3. 能力展示（产品线，不含价格）
    {
      type: "products",
      data: {
        title: "What we manufacture",
        subtitle: "Core capabilities — tell us which line fits your product.",
        items: [
          {
            name: "Injection moulding",
            description:
              "Precision tooling for housings and enclosures, with in-house mould design and maintenance.",
            backgroundImage: { src: img("photo-1565043666747-69f6646db940", 800), alt: "Injection moulding machinery" },
          },
          {
            name: "Metal fabrication",
            description:
              "Stamping, CNC machining, and finishing for structural and hardware components.",
            backgroundImage: { src: img("photo-1504328345606-18bbc8c9d7d1", 800), alt: "CNC machining a metal part" },
          },
          {
            name: "Assembly & packaging",
            description:
              "Multi-component assembly, retail-ready packaging, and private-label printing.",
            backgroundImage: { src: img("photo-1553413077-190dd305871c", 800), alt: "Assembly line packaging finished goods" },
          },
        ],
      },
    },

    // 4. 服务流程：从询价到量产
    {
      type: "process",
      data: {
        title: "From enquiry to production",
        subtitle: "Four steps, with a named contact throughout.",
        steps: [
          {
            title: "Send your specs",
            description: "Share drawings, reference samples, or just a description and target quantity.",
            image: { src: img("photo-1454165804606-c3d57bc86b40", 800), alt: "Reviewing technical drawings" },
          },
          {
            title: "Engineering review",
            description: "We confirm feasibility, propose materials, and outline tooling and lead time.",
          },
          {
            title: "Sample & approval",
            description: "You receive a pre-production sample and a written spec sheet to sign off.",
          },
          {
            title: "Production & inspection",
            description: "Scheduled production with staged inspections and photo reports before shipment.",
          },
        ],
      },
    },

    // 5. 信任徽章（体系认证）
    {
      type: "trust",
      data: {
        backgroundImage: {
          src: img("photo-1587293852726-70cdb56c2866", 1400),
          alt: "Warehouse aisle stacked with palletised goods",
        },
        badges: [
          { icon: "📋", title: "ISO 9001 quality system", subtitle: "Audited processes across every line" },
          { icon: "🤝", title: "Social compliance audited", subtitle: "BSCI / Sedex reports available on request" },
          { icon: "🔐", title: "NDA as standard", subtitle: "Your designs stay confidential from first contact" },
          { icon: "🚢", title: "Export-ready paperwork", subtitle: "Documentation prepared for your market" },
        ],
      },
    },

    // 6. 客户评价
    {
      type: "reviews",
      data: {
        title: "What buyers say",
        description: "Feedback from procurement and product teams we work with.",
        items: [
          {
            name: "Daniel R.",
            location: "Netherlands",
            channel: "Email",
            avatar: { src: img("photo-1500648767791-00dcc994a43e", 200), alt: "Daniel R." },
            content: {
              text: "They pushed back on a spec that would have cost us a fortune in tooling. That conversation alone paid for the project.",
            },
          },
          {
            name: "Aisha K.",
            location: "United Arab Emirates",
            channel: "WhatsApp",
            avatar: { src: img("photo-1580489944761-15a19d654956", 200), alt: "Aisha K." },
            content: {
              text: "Sample arrived in nine days with a full spec sheet. First supplier that made approval feel simple.",
            },
          },
          {
            name: "Marcus L.",
            location: "United States",
            channel: "Email",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Marcus L." },
            content: {
              text: "Photo reports at each inspection stage meant no surprises when the container landed.",
            },
          },
        ],
      },
    },

    // 7. 保障（非交易：保密 / 质检 / 沟通承诺）
    {
      type: "guarantee",
      data: {
        title: "How we protect your project",
        description: "Commitments that apply from the first enquiry, not just after an order.",
        items: [
          { icon: "🔐", title: "Confidential by default", subtitle: "NDA signed before any drawing changes hands." },
          { icon: "🧾", title: "Written specifications", subtitle: "Everything approved is documented — no verbal-only agreements." },
          { icon: "👤", title: "One named contact", subtitle: "The same engineer follows your project end to end." },
          { icon: "📸", title: "Inspection evidence", subtitle: "Photo and measurement reports shared before shipment." },
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
            question: "What do you need to prepare a quote?",
            answer:
              "Drawings or a reference sample, target quantity, and your destination market. If you only have a rough idea, describe it — an engineer will come back with questions.",
          },
          {
            question: "What is your minimum order quantity?",
            answer:
              "It depends on the process and tooling involved. Tell us your target volume and we'll be straight with you about whether it's viable.",
          },
          {
            question: "How long does a sample take?",
            answer:
              "Typically one to three weeks depending on tooling. Your engineer confirms the timeline before any work starts.",
          },
          {
            question: "Do you sign NDAs?",
            answer:
              "Yes — as standard, before we review your drawings. Confidentiality is not something you have to ask for.",
          },
        ],
      },
    },
  ],

  // 主转化：页内询价表单（hero CTA 的锚点落点）
  leadForm: {
    enabled: true,
    title: "Request a quote",
    description:
      "Tell us what you need and an engineer replies with materials, lead time, and next steps — usually within one business day.",
    submitText: "Send my enquiry",
    successMessage: "Thanks — an engineer will be in touch within one business day.",
    fields: {
      name: { enabled: true, required: true, label: "Your name" },
      email: { enabled: true, required: true, label: "Work email" },
      phone: { enabled: false, required: false },
      whatsapp: { enabled: true, required: false, label: "WhatsApp (optional)" },
      telegram: { enabled: false, required: false },
      message: {
        enabled: true,
        required: true,
        label: "Product, target quantity, and destination market",
      },
    },
  },

  footer: {
    brandName: "Meridian Sourcing",
    copyrightYear: "2026",
    privacyPolicy:
      "We collect only the project details you share with us in order to prepare your quote. Drawings and specifications are treated as confidential, are never sold or shared outside the project team, and can be deleted on request.",
    termsOfService:
      "Quotations, lead times, and capability information on this page are indicative and are confirmed in writing after an engineering review. Nothing on this page constitutes a binding offer.",
  },

  floatingButton: {
    text: "💬 Chat with an engineer",
    target: { kind: "channel", channel: "whatsapp", prefill: "Hi Meridian, I'd like to discuss an OEM order" },
  },
};
