// landing-editor/samples/storageDraft.ts
//
// 家居 / 收纳整理「空间规划咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费收纳方案 / 空间规划咨询，无任何下单 / 结账 / 订阅语义。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Tidely%2C%20I%27d%20like%20a%20free%20organizing%20plan";

export const storageDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1558997519-83ea9252edf8", 1600),
      alt: "Neatly organized shelving",
    },
    badge: { emoji: "🧺", text: "Clutter-free, room by room" },
    title: "An organized home, without the overwhelm",
    subtitle:
      "Send us a photo of your messy space and get a free organizing plan over WhatsApp — the right bins, layout, and steps to finally keep it tidy.",
    cta: { text: "Get my free organizing plan", link: WHATSAPP },
    secondaryCta: { text: "See before & afters", link: "https://instagram.com/tidely.home" },
    endorsementText: "Trusted by 85,000+ tidy homes worldwide",
    showcase: {
      type: "image",
      src: img("photo-1584622650111-993a426fbf0a"),
      alt: "Organized pantry containers",
    },
  },

  sections: [
    {
      type: "features",
      data: {
        title: "Why Tidely plans work",
        subtitle: "Practical, personalized, and easy to keep up.",
        items: [
          {
            icon: "📐",
            title: "Matched to your space",
            description:
              "We plan around your actual measurements and layout — not generic one-size bins.",
          },
          {
            icon: "🏷️",
            title: "Systems that stick",
            description:
              "Simple, label-friendly setups your whole household can maintain effortlessly.",
          },
          {
            icon: "💸",
            title: "Budget-smart picks",
            description:
              "We suggest what works at your budget and what you can repurpose from home.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp help",
            description:
              "Send progress photos and we'll fine-tune the plan room by room — free.",
          },
        ],
      },
    },

    {
      type: "beforeAfter",
      data: {
        title: "Real spaces, transformed",
        subtitle: "Shared with permission from our community.",
        disclaimer:
          "Results depend on your space, products, and consistency. Photos are real client spaces shared with permission.",
        items: [
          {
            crmName: "Hannah's pantry",
            duration: "1 weekend",
            caseDescription:
              "Decanted staples into clear bins with a simple zone-and-label system.",
            beforeImage: { src: img("photo-1601599963565-b7f49deb352e", 800), alt: "Pantry before" },
            afterImage: { src: img("photo-1586023492125-27b2c045efd7", 800), alt: "Pantry after" },
          },
          {
            crmName: "Leo's entryway",
            duration: "1 afternoon",
            caseDescription:
              "Added vertical storage and a drop zone to end the daily clutter pile-up.",
            beforeImage: { src: img("photo-1513694203232-719a280e022f", 800), alt: "Entryway before" },
            afterImage: { src: img("photo-1556909114-f6e7ad7d3136", 800), alt: "Entryway after" },
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
            name: "Megan",
            location: "United States",
            channel: "WhatsApp",
            avatar: { src: img("photo-1544005313-94ddf0286df2", 200), alt: "Megan" },
            content: {
              text: "Sent one messy photo and got a plan that actually fit my tiny kitchen. It's stayed tidy for months.",
            },
          },
          {
            name: "Ingrid",
            location: "Norway",
            channel: "Trustpilot",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Ingrid" },
            content: {
              text: "They reused half my existing bins instead of selling me more. Honest and so practical.",
            },
          },
          {
            name: "Felipe",
            location: "Brazil",
            channel: "Instagram",
            avatar: { src: img("photo-1500648767791-00dcc994a43e", 200), alt: "Felipe" },
            content: {
              text: "The label system finally got my kids to put things back. Zero pressure to buy anything.",
            },
          },
        ],
      },
    },

    {
      type: "stats",
      data: {
        title: "Why people keep coming back",
        subtitle: "A few numbers behind our plans.",
        items: [
          { icon: "🧺", value: "85,000+", label: "Spaces organized" },
          { icon: "🌍", value: "36+", label: "Countries served" },
          { icon: "⭐", value: "4.9/5", label: "Average plan rating" },
          { icon: "⏱️", value: "<10 min", label: "Avg. WhatsApp reply" },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Frequently asked questions" },
        items: [
          {
            question: "Is the organizing plan really free?",
            answer: "Yes. Your plan and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "How does it work over WhatsApp?",
            answer: "Send a photo and rough measurements of your space and we'll send back a tailored plan and product list.",
          },
          {
            question: "Do I have to buy specific products?",
            answer: "No. We suggest budget options and what to repurpose — purchasing is entirely up to you.",
          },
          {
            question: "Can you help small or rental spaces?",
            answer: "Absolutely. We specialize in compact, renter-friendly, no-damage solutions.",
          },
        ],
      },
    },
  ],

  footer: {
    brandName: "Tidely",
    copyrightYear: "2026",
    contactEmail: "hello@tidely-home.com",
    privacyPolicy:
      "We use the photos and details you share only to provide your organizing plan. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Tidely provides home-organizing guidance for informational purposes only. Results vary based on your space and consistency.",
  },

  floatingButton: {
    text: "🧺 Free organizing plan",
    link: WHATSAPP,
  },
};
