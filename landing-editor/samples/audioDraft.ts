// landing-editor/samples/audioDraft.ts
//
// 3C 配件 / 耳机音频「选购 & 适配咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费选购建议 / 适配与音质咨询，无任何下单 / 结账 / 订阅语义。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Sonara%2C%20I%27d%20like%20a%20free%20headphone%20match";

export const audioDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1505740420928-5e560c06d30e", 1600),
      alt: "Headphones on a minimalist backdrop",
    },
    badge: { emoji: "🎧", text: "Sound matched to how you listen" },
    title: "Find headphones that fit your ears and your life",
    subtitle:
      "Tell us how and where you listen. Our audio advisors send a free match over WhatsApp — the right noise-cancelling, fit, and battery for you.",
    cta: { text: "Get my free headphone match", link: WHATSAPP },
    secondaryCta: { text: "Hear the difference", link: "https://youtube.com/@sonara.audio" },
    endorsementText: "Trusted by 130,000+ listeners worldwide",
    showcase: {
      type: "image",
      src: img("photo-1484704849700-f032a568e944"),
      alt: "Wireless earbuds product shot",
    },
  },

  sections: [
    {
      type: "features",
      data: {
        title: "Why Sonara matches better",
        subtitle: "Honest, ear-first audio guidance.",
        items: [
          {
            icon: "🔇",
            title: "ANC matched to your commute",
            description:
              "Noise-cancelling that suits flights, offices, or the gym — not overkill you'll never use.",
          },
          {
            icon: "👂",
            title: "Fit & comfort first",
            description:
              "Over-ear, on-ear, or buds — matched to comfort for long sessions and your ear shape.",
          },
          {
            icon: "🔋",
            title: "Battery for your day",
            description:
              "We match playtime and quick-charge to your real routine so you're never caught flat.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp help",
            description:
              "Tell us how they sound to you and we'll fine-tune the recommendation — free.",
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
          { icon: "🎧", value: "130,000+", label: "Headphones matched" },
          { icon: "🌍", value: "42+", label: "Countries served" },
          { icon: "⭐", value: "4.8/5", label: "Average match rating" },
          { icon: "⏱️", value: "<10 min", label: "Avg. WhatsApp reply" },
        ],
      },
    },

    {
      type: "products",
      data: {
        title: "Popular picks by use",
        subtitle: "A few favorites across listening styles.",
        items: [
          {
            name: "Travel ANC Over-Ear",
            description: "Deep noise-cancelling and all-day comfort for flights and commutes.",
            backgroundImage: { src: img("photo-1546435770-a3e426bf472b", 800), alt: "Over-ear headphones" },
          },
          {
            name: "Workout Earbuds",
            description: "Secure fit, sweat resistance, and a stable connection for training.",
            backgroundImage: { src: img("photo-1590658268037-6bf12165a8df", 800), alt: "Workout earbuds" },
          },
          {
            name: "Everyday Buds",
            description: "Balanced sound, comfy all-day fit, and reliable quick-charge.",
            backgroundImage: { src: img("photo-1572569511254-d8f925fe2cbb", 800), alt: "Everyday earbuds" },
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
            name: "Noah",
            location: "United States",
            channel: "WhatsApp",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Noah" },
            content: {
              text: "They asked how I actually listen and nailed it. The ANC is perfect for my open-plan office.",
            },
          },
          {
            name: "Sara",
            location: "Italy",
            channel: "Trustpilot",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Sara" },
            content: {
              text: "Buds that finally stay in during runs. Honest comparison, no pressure to pick the priciest pair.",
            },
          },
          {
            name: "Wei",
            location: "Taiwan",
            channel: "Instagram",
            avatar: { src: img("photo-1500648767791-00dcc994a43e", 200), alt: "Wei" },
            content: {
              text: "Saved me from overspending on features I'd never use. Sound is exactly what I wanted.",
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
            question: "Is the headphone match really free?",
            answer: "Yes. Your match and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "Can you match for a specific use, like flights or running?",
            answer: "Absolutely. Tell us where and how you listen and we'll match ANC, fit, and battery accordingly.",
          },
          {
            question: "Do you only recommend expensive models?",
            answer: "No. We match value at every price point and flag strong budget picks.",
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
    brandName: "Sonara",
    copyrightYear: "2026",
    contactEmail: "help@sonara-audio.com",
    privacyPolicy:
      "We use the listening preferences you share only to provide your headphone match. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Sonara provides audio-product matching guidance for informational purposes only. Sound preference is subjective and results vary by listener.",
  },

  floatingButton: {
    text: "🎧 Free headphone match",
    link: WHATSAPP,
  },
};
