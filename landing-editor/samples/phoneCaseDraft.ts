// landing-editor/samples/phoneCaseDraft.ts
//
// 3C 配件 / 手机壳膜「机型适配 & 防护咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费机型适配 / 防护方案咨询，无任何下单 / 结账 / 订阅语义。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Shieldly%2C%20I%27d%20like%20a%20free%20case%20match";

export const phoneCaseDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1601784551446-20c9e07cdbdb", 1600),
      alt: "Phone cases arranged on a desk",
    },
    badge: { emoji: "📱", text: "Exact-fit protection for your model" },
    title: "The right case for your exact phone",
    subtitle:
      "Tell us your model and how you use your phone. We send a free match over WhatsApp — drop protection, MagSafe, and slim options that actually fit.",
    cta: { text: "Get my free case match", link: WHATSAPP },
    secondaryCta: { text: "See drop tests", link: "https://youtube.com/@shieldly" },
    endorsementText: "Trusted by 200,000+ phone owners worldwide",
    showcase: {
      type: "image",
      src: img("photo-1556656793-08538906a9f8"),
      alt: "Protective phone case product shot",
    },
  },

  sections: [
    {
      type: "features",
      data: {
        title: "Why Shieldly matches better",
        subtitle: "Precise fit and real-world protection.",
        items: [
          {
            icon: "🎯",
            title: "Exact model fit",
            description:
              "Cutouts, buttons, and cameras aligned to your specific phone — no loose or blocked ports.",
          },
          {
            icon: "🛡️",
            title: "Protection that's tested",
            description:
              "Drop-rated options matched to how clumsy (or careful) you actually are.",
          },
          {
            icon: "🧲",
            title: "MagSafe & wireless ready",
            description:
              "We flag which cases keep wireless charging and magnets working properly.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp help",
            description:
              "Upgrading your phone later? Message us and we'll rematch you — free.",
          },
        ],
      },
    },

    {
      type: "stats",
      data: {
        title: "Why people trust us",
        subtitle: "A few numbers behind our matches.",
        items: [
          { icon: "📱", value: "200,000+", label: "Cases matched" },
          { icon: "📐", value: "500+", label: "Models supported" },
          { icon: "⭐", value: "4.8/5", label: "Average match rating" },
          { icon: "⏱️", value: "<10 min", label: "Avg. WhatsApp reply" },
        ],
      },
    },

    {
      type: "products",
      data: {
        title: "Popular protection styles",
        subtitle: "A few favorites across use cases.",
        items: [
          {
            name: "Armor Drop-Proof",
            description: "Reinforced corners and raised lips for heavy-duty everyday protection.",
            backgroundImage: { src: img("photo-1592890288564-76628a30a657", 800), alt: "Rugged case" },
          },
          {
            name: "Slim Clear",
            description: "Minimal, anti-yellowing clarity that shows off your phone.",
            backgroundImage: { src: img("photo-1574944985070-8f3ebc6b79d2", 800), alt: "Clear case" },
          },
          {
            name: "MagSafe Leather",
            description: "Premium feel with strong magnets and full wireless support.",
            backgroundImage: { src: img("photo-1605236453806-6ff36851218e", 800), alt: "Leather case" },
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
            name: "Ryan",
            location: "United States",
            channel: "WhatsApp",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Ryan" },
            content: {
              text: "Perfect fit, buttons click cleanly, and wireless charging still works. They matched it in two minutes.",
            },
          },
          {
            name: "Mei",
            location: "Singapore",
            channel: "Trustpilot",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Mei" },
            content: {
              text: "Dropped my phone twice already — not a scratch. Honest advice on protection level, no upsell.",
            },
          },
          {
            name: "Pablo",
            location: "Argentina",
            channel: "Instagram",
            avatar: { src: img("photo-1500648767791-00dcc994a43e", 200), alt: "Pablo" },
            content: {
              text: "Finally a clear case that doesn't turn yellow. They knew exactly which one to recommend.",
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
            question: "Is the case match really free?",
            answer: "Yes. Your match and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "How do you know it'll fit my phone?",
            answer: "We match to your exact model and confirm cutouts, buttons, and camera alignment before recommending.",
          },
          {
            question: "Will it work with MagSafe and wireless charging?",
            answer: "We'll flag exactly which options keep magnets and wireless charging fully working.",
          },
          {
            question: "Do I have to buy anything?",
            answer: "No. Our matching is independent — purchasing is entirely up to you.",
          },
        ],
      },
    },
  ],

  footer: {
    brandName: "Shieldly",
    copyrightYear: "2026",
    contactEmail: "help@shieldly.com",
    privacyPolicy:
      "We use the device details you share only to provide your case match. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Shieldly provides device-accessory matching guidance for informational purposes only. Protection ratings are based on manufacturer testing and real-world use varies.",
  },

  floatingButton: {
    text: "📱 Free case match",
    link: WHATSAPP,
  },
};
