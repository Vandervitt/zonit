// landing-editor/samples/chargingDraft.ts
//
// 3C 配件 / 充电电源「设备适配 & 充电方案咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费充电方案 / 兼容性咨询，无任何下单 / 结账 / 订阅语义。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Voltway%2C%20I%27d%20like%20a%20free%20charging%20setup%20plan";

export const chargingDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1583863788434-e58a36330cf0", 1600),
      alt: "Charging cables and power bank on a desk",
    },
    badge: { emoji: "🔌", text: "Charging that matches your devices" },
    title: "Fast, safe charging for every device you own",
    subtitle:
      "List your devices and we'll send a free charging plan over WhatsApp — the right wattage, cables, and a tidy one-brick-for-everything setup.",
    cta: { text: "Get my free charging plan", link: WHATSAPP },
    secondaryCta: { text: "See the lineup", link: "https://youtube.com/@voltway" },
    endorsementText: "Trusted by 150,000+ households and travelers",
    showcase: {
      type: "image",
      src: img("photo-1591290619762-aedf3b80a4c9"),
      alt: "GaN charger product shot",
    },
  },

  sections: [
    {
      type: "features",
      data: {
        title: "Why Voltway gets it right",
        subtitle: "Compatible, fast, and safe by design.",
        items: [
          {
            icon: "⚡",
            title: "Right wattage, every device",
            description:
              "We match power output to your phone, tablet, and laptop so each charges at full speed.",
          },
          {
            icon: "🔗",
            title: "Cable & port clarity",
            description:
              "USB-C, Lightning, PD, fast-charge standards — we cut through the jargon for you.",
          },
          {
            icon: "🧳",
            title: "One setup for everything",
            description:
              "Consolidate to a single GaN brick and the right cables — less clutter, lighter travel.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp help",
            description:
              "New device later? Message us and we'll update your plan — free.",
          },
        ],
      },
    },

    {
      type: "stats",
      data: {
        title: "Why people trust us",
        subtitle: "A few numbers behind our charging plans.",
        items: [
          { icon: "🔌", value: "150,000+", label: "Setups planned" },
          { icon: "⚡", value: "100W+", label: "PD fast-charge ready" },
          { icon: "⭐", value: "4.8/5", label: "Average plan rating" },
          { icon: "⏱️", value: "<10 min", label: "Avg. WhatsApp reply" },
        ],
      },
    },

    {
      type: "products",
      data: {
        title: "Popular charging gear",
        subtitle: "A few favorites across needs.",
        items: [
          {
            name: "GaN Multi-Port Brick",
            description: "Charge a laptop and two phones at once from one compact charger.",
            backgroundImage: { src: img("photo-1588872657578-7efd1f1555ed", 800), alt: "GaN charger" },
          },
          {
            name: "Braided PD Cables",
            description: "Durable, fast-charge USB-C cables that won't fray at the connector.",
            backgroundImage: { src: img("photo-1606229365485-93a3b8ee0385", 800), alt: "USB-C cable" },
          },
          {
            name: "Travel Power Bank",
            description: "Airline-safe capacity with pass-through and fast wireless charging.",
            backgroundImage: { src: img("photo-1609592424823-3c9b5b1d3d1a", 800), alt: "Power bank" },
          },
        ],
      },
    },

    {
      type: "reviews",
      data: {
        title: "What our community says",
        description: "Real messages from people we've helped.",
        items: [
          {
            name: "Greg",
            location: "United States",
            channel: "WhatsApp",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Greg" },
            content: {
              text: "Replaced four chargers with one brick. They knew exactly what my laptop and phone needed.",
            },
          },
          {
            name: "Anya",
            location: "Netherlands",
            channel: "Trustpilot",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Anya" },
            content: {
              text: "Honest advice on which power bank is airline-safe. Saved me trouble at the airport.",
            },
          },
          {
            name: "Diego",
            location: "Chile",
            channel: "Instagram",
            avatar: { src: img("photo-1500648767791-00dcc994a43e", 200), alt: "Diego" },
            content: {
              text: "Finally understand wattage and cables. My phone charges twice as fast now — no upsell at all.",
            },
          },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Frequently asked questions" },
        items: [
          {
            question: "Is the charging plan really free?",
            answer: "Yes. Your plan and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "How do you know what my devices need?",
            answer: "Share your device models and we'll match the right wattage, standards, and cables.",
          },
          {
            question: "Is fast charging safe for my battery?",
            answer: "We recommend certified, properly-rated chargers and explain safe fast-charging for your devices.",
          },
          {
            question: "Do I have to buy anything?",
            answer: "No. Our guidance is independent — purchasing is entirely up to you.",
          },
        ],
      },
    },
  ],

  footer: {
    brandName: "Voltway",
    copyrightYear: "2026",
    contactEmail: "help@voltway.com",
    privacyPolicy:
      "We use the device details you share only to build your charging plan. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Voltway provides charging-compatibility guidance for informational purposes only. Always use certified chargers and follow your device manufacturer's guidance.",
  },

  floatingButton: {
    text: "🔌 Free charging plan",
    link: WHATSAPP,
  },
};
