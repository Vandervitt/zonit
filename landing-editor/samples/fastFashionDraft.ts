// landing-editor/samples/fastFashionDraft.ts
//
// 服饰 / 快时尚女装「造型 & 新品通知」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费穿搭建议 / 上新与尺码咨询，无任何下单 / 结账 / 订阅语义。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Lunela%2C%20I%27d%20like%20free%20styling%20advice";

export const fastFashionDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1483985988355-763728e1935b", 1600),
      alt: "Fashion rack with seasonal outfits",
    },
    badge: { emoji: "👗", text: "Personal styling, on WhatsApp" },
    title: "Outfits that fit your body and your life",
    subtitle:
      "Tell us your style and size, and our stylists send a free capsule of looks over WhatsApp — plus first dibs on new arrivals.",
    cta: { text: "Get free styling advice", link: WHATSAPP },
    secondaryCta: { text: "See this season's looks", link: "https://instagram.com/lunela.style" },
    endorsementText: "Styled 70,000+ wardrobes across 40+ countries",
    showcase: {
      type: "image",
      src: img("photo-1490481651871-ab68de25d43d"),
      alt: "Model in a curated seasonal outfit",
    },
  },

  sections: [
    {
      type: "products",
      data: {
        title: "This season's edit",
        subtitle: "A few looks our stylists are loving right now.",
        items: [
          {
            name: "The Everyday Capsule",
            description: "Five mix-and-match pieces that cover work, weekend, and dinner.",
            backgroundImage: { src: img("photo-1539109136881-3be0616acf4b", 800), alt: "Everyday capsule outfit" },
          },
          {
            name: "Soft Tailoring",
            description: "Relaxed blazers and trousers that look polished without the stiffness.",
            backgroundImage: { src: img("photo-1525507119028-ed4c629a60a3", 800), alt: "Soft tailoring look" },
          },
          {
            name: "Weekend Layers",
            description: "Easy knits and denim built for comfort and quick styling.",
            backgroundImage: { src: img("photo-1551488831-00ddcb6c6bd3", 800), alt: "Weekend layered look" },
          },
        ],
      },
    },

    {
      type: "reviews",
      data: {
        title: "What our community says",
        description: "Real messages from people we've styled.",
        items: [
          {
            name: "Bella",
            location: "United States",
            channel: "WhatsApp",
            avatar: { src: img("photo-1544005313-94ddf0286df2", 200), alt: "Bella" },
            content: {
              text: "The stylist read my vibe perfectly. I finally have outfits I reach for instead of a full closet of nothing-to-wear.",
            },
          },
          {
            name: "Yara",
            location: "Egypt",
            channel: "Instagram",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Yara" },
            content: {
              text: "Loved the size guidance — everything fit first try. And no pressure to buy anything.",
            },
          },
          {
            name: "Sophie",
            location: "Germany",
            channel: "Trustpilot",
            avatar: { src: img("photo-1438761681033-6461ffad8d80", 200), alt: "Sophie" },
            content: {
              text: "Quick replies and genuinely helpful capsule ideas. It made getting dressed so much easier.",
            },
          },
        ],
      },
    },

    {
      type: "features",
      data: {
        title: "Why Lunela styling works",
        subtitle: "Personal, practical, and pressure-free.",
        items: [
          {
            icon: "🎯",
            title: "Built around your body",
            description:
              "We style for your shape, proportions, and the fits you actually feel good in.",
          },
          {
            icon: "📏",
            title: "Size help that works",
            description:
              "Honest fit and sizing guidance so pieces work the first time.",
          },
          {
            icon: "♻️",
            title: "Versatile capsules",
            description:
              "Fewer, smarter pieces that mix and match — less clutter, more outfits.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp styling",
            description:
              "Send a photo before an event and we'll style you on the spot — free.",
          },
        ],
      },
    },

    {
      type: "stats",
      data: {
        title: "Why people keep coming back",
        subtitle: "A few numbers behind our stylists.",
        items: [
          { icon: "👗", value: "70,000+", label: "Wardrobes styled" },
          { icon: "🌍", value: "40+", label: "Countries served" },
          { icon: "⭐", value: "4.9/5", label: "Average stylist rating" },
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
            question: "Is the styling advice really free?",
            answer: "Yes. Your capsule, size guidance, and WhatsApp follow-ups are completely free.",
          },
          {
            question: "Do I have to buy anything?",
            answer: "No. We give independent styling advice — what you do with it is entirely up to you.",
          },
          {
            question: "Can you help with sizing?",
            answer: "Absolutely. Share your measurements or usual sizes and we'll guide the right fit.",
          },
          {
            question: "Will I hear about new arrivals?",
            answer: "If you'd like, we'll give you a heads-up on new drops over WhatsApp — no spam.",
          },
        ],
      },
    },
  ],

  footer: {
    brandName: "Lunela",
    copyrightYear: "2026",
    contactEmail: "style@lunela.com",
    privacyPolicy:
      "We use the style and size details you share only to provide your styling advice. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Lunela provides personal styling guidance for informational purposes only. Fit suggestions are estimates based on the details you provide.",
  },

  floatingButton: {
    text: "👗 Free styling advice",
    link: WHATSAPP,
  },
};
