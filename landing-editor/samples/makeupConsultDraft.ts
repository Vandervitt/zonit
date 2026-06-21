// landing-editor/samples/makeupConsultDraft.ts
//
// 美妆 / 彩妆「色号 & 妆容咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 咨询（免费配色 / 妆容方案），无任何下单 / 结账 / 订阅语义。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

/** Unsplash 图片地址助手：统一裁剪与画质参数。 */
const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** WhatsApp 咨询链接（占位号码 + 预填咨询语）。 */
const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Velvet%2C%20I%27d%20like%20a%20free%20shade%20%26%20makeup%20consult";

export const makeupConsultDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1596462502278-27bfdc403348", 1600),
      alt: "Makeup palette and brushes on a soft background",
    },
    badge: { emoji: "💄", text: "Pro-matched makeup, made simple" },
    title: "Find your perfect shade — without the guesswork",
    subtitle:
      "Get a free shade-match and everyday makeup plan from our artists over WhatsApp. Built for your skin tone, features, and routine.",
    cta: { text: "Get my free shade match", link: WHATSAPP },
    secondaryCta: { text: "See real looks", link: "https://instagram.com/velvet.studio" },
    endorsementText: "Loved by 50,000+ makeup lovers worldwide",
    showcase: {
      type: "image",
      src: img("photo-1512496015851-a90fb38ba796"),
      alt: "Hand holding a lipstick and compact",
    },
  },

  sections: [
    {
      type: "stats",
      data: {
        title: "Why people trust our artists",
        subtitle: "A few numbers behind our shade-matching.",
        items: [
          { icon: "🎨", value: "50,000+", label: "Shade matches done" },
          { icon: "🌍", value: "40+", label: "Countries served" },
          { icon: "⭐", value: "4.9/5", label: "Average artist rating" },
          { icon: "⏱️", value: "<10 min", label: "Avg. WhatsApp reply" },
        ],
      },
    },

    {
      type: "features",
      data: {
        title: "Why Velvet works",
        subtitle: "Personalized, flattering, and genuinely wearable.",
        items: [
          {
            icon: "🧑‍🎨",
            title: "Matched by real artists",
            description:
              "We read your undertone, features, and lighting — not a generic shade chart.",
          },
          {
            icon: "🪞",
            title: "Looks you'll actually wear",
            description:
              "Everyday-first routines you can recreate in minutes, with optional glam upgrades.",
          },
          {
            icon: "🧴",
            title: "Honest product guidance",
            description:
              "Cruelty-free, skin-friendly picks across budgets — no pressure to buy anything.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp help",
            description:
              "Send a selfie anytime and we'll fine-tune your shades and technique for free.",
          },
        ],
      },
    },

    {
      type: "process",
      data: {
        title: "How your free match works",
        subtitle: "Four quick steps, all over WhatsApp.",
        steps: [
          {
            title: "Say hi on WhatsApp",
            description: "Tap the button and tell us the look you're going for.",
            image: { src: img("photo-1583241800698-9c2e0a3a3b3a", 800), alt: "Makeup brushes" },
          },
          {
            title: "Share a quick selfie",
            description: "Natural light, no filter — so we can read your true undertone.",
          },
          {
            title: "Get your shade card",
            description: "An artist sends matched shades and a simple step-by-step routine.",
          },
          {
            title: "Practice with us",
            description: "Send progress photos anytime and we'll refine it together — free.",
          },
        ],
      },
    },

    {
      type: "beforeAfter",
      data: {
        title: "Everyday transformations",
        subtitle: "Shared with permission from our community.",
        disclaimer:
          "Individual results vary. Makeup is a cosmetic routine — looks depend on products, lighting, and technique.",
        items: [
          {
            crmName: "Lena, 27",
            duration: "1 session",
            caseDescription:
              "Matched a warm-toned base and soft glam eye for an everyday office look.",
            beforeImage: { src: img("photo-1487412720507-e7ab37603c6f", 800), alt: "Portrait before makeup" },
            afterImage: { src: img("photo-1503104834685-7205e8607eb9", 800), alt: "Portrait after makeup" },
          },
          {
            crmName: "Priya, 31",
            duration: "1 session",
            caseDescription:
              "Found a true neutral foundation match and a no-makeup makeup routine for sensitive skin.",
            beforeImage: { src: img("photo-1499651681375-8afc5a4db253", 800), alt: "Portrait before makeup" },
            afterImage: { src: img("photo-1504703395950-b89145a5425b", 800), alt: "Portrait after makeup" },
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
            name: "Camila",
            location: "Mexico",
            channel: "WhatsApp",
            avatar: { src: img("photo-1544005313-94ddf0286df2", 200), alt: "Camila" },
            content: {
              text: "For the first time my foundation actually disappears into my skin. The shade card was spot on.",
            },
          },
          {
            name: "Hana",
            location: "Japan",
            channel: "Instagram",
            avatar: { src: img("photo-1438761681033-6461ffad8d80", 200), alt: "Hana" },
            content: {
              text: "They taught me a 5-minute routine I can do before work. No upselling, just real help.",
            },
          },
          {
            name: "Olivia",
            location: "Australia",
            channel: "Trustpilot",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Olivia" },
            content: {
              text: "Honest advice for my budget and sensitive skin. Felt like texting a knowledgeable friend.",
            },
          },
        ],
      },
    },

    {
      type: "guarantee",
      data: {
        title: "Beauty advice you can trust",
        description: "Care you can count on, before and after the consult.",
        items: [
          { icon: "🔒", title: "Privacy first", subtitle: "Your photos stay confidential and are never shared or sold." },
          { icon: "🐰", title: "Cruelty-free picks", subtitle: "We only suggest cruelty-free, skin-friendly products." },
          { icon: "🙅", title: "No pushy sales", subtitle: "Independent advice — buy from anywhere you like, or nowhere." },
          { icon: "🤝", title: "Free follow-ups", subtitle: "Keep messaging us as your style evolves, at no cost." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Frequently asked questions" },
        items: [
          {
            question: "Is the shade match really free?",
            answer: "Yes. Your shade match, routine, and all follow-ups over WhatsApp are completely free.",
          },
          {
            question: "Do I have to buy specific products?",
            answer: "No. We recommend options across brands and budgets — what you buy is entirely up to you.",
          },
          {
            question: "What photo should I send?",
            answer: "A clear selfie in natural daylight with a bare or lightly prepped face works best.",
          },
          {
            question: "Can you help mature or acne-prone skin?",
            answer: "Absolutely. We tailor techniques and finishes for mature, textured, and acne-prone skin.",
          },
        ],
      },
    },
  ],

  footer: {
    brandName: "Velvet Studio",
    copyrightYear: "2026",
    contactEmail: "hello@velvet-studio.com",
    privacyPolicy:
      "We use the photos and preferences you share only to provide your makeup consultation. Your data is kept confidential, never sold, and can be deleted on request.",
    termsOfService:
      "Velvet Studio provides cosmetic makeup guidance for informational purposes only and does not provide medical or dermatological advice.",
  },

  floatingButton: {
    text: "💄 Free shade match",
    link: WHATSAPP,
  },
};
