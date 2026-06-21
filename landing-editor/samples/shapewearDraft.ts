// landing-editor/samples/shapewearDraft.ts
//
// 服饰 / 内衣塑身「合身咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费合身建议 / 尺码与穿搭咨询，无任何下单 / 结账 / 订阅语义。
// 身材相关表述均配 disclaimer，避免承诺确定的身形改变效果。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Sienne%2C%20I%27d%20like%20a%20free%20fit%20consult";

export const shapewearDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1469334031218-e382a71b716b", 1600),
      alt: "Soft neutral fashion editorial",
    },
    badge: { emoji: "🤍", text: "Comfort-first shaping, fitted by experts" },
    title: "Smooth confidence under everything you wear",
    subtitle:
      "Get a free fit consult over WhatsApp. We help you choose comfortable, breathable shaping that suits your shape and the outfit you have in mind.",
    cta: { text: "Get my free fit consult", link: WHATSAPP },
    secondaryCta: { text: "See the range", link: "https://instagram.com/sienne.fit" },
    endorsementText: "Trusted by 100,000+ for everyday comfort",
    showcase: {
      type: "image",
      src: img("photo-1487412947147-5cebf100ffc2"),
      alt: "Neutral-toned essentials",
    },
  },

  sections: [
    {
      type: "features",
      data: {
        title: "Why Sienne fits better",
        subtitle: "Comfortable, honest, and matched to your outfit.",
        items: [
          {
            icon: "🫶",
            title: "Comfort-first shaping",
            description:
              "Breathable, no-dig fabrics that smooth gently — never squeeze you out of your day.",
          },
          {
            icon: "👗",
            title: "Matched to your outfit",
            description:
              "Seamless under dresses, support for tailoring — we pick shaping for the look you're wearing.",
          },
          {
            icon: "📏",
            title: "True-to-body sizing",
            description:
              "Honest sizing guidance so it fits and feels right the first time.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp help",
            description:
              "Tell us how it felt and we'll fine-tune the next pick — free, anytime.",
          },
        ],
      },
    },

    {
      type: "products",
      data: {
        title: "Pieces our fitters recommend",
        subtitle: "A few comfortable everyday favorites.",
        items: [
          {
            name: "Seamless Smoothing Slip",
            description: "Invisible under dresses with a soft, breathable second-skin feel.",
            backgroundImage: { src: img("photo-1515886657613-9f3515b0c78f", 800), alt: "Smoothing slip" },
          },
          {
            name: "Everyday Support Brief",
            description: "Light, all-day comfort with a no-roll waistband.",
            backgroundImage: { src: img("photo-1503342217505-b0a15ec3261c", 800), alt: "Support brief" },
          },
          {
            name: "Tailoring Bodysuit",
            description: "Clean lines under blazers and fitted shirts, breathable all day.",
            backgroundImage: { src: img("photo-1495121605193-b116b5b9c5fe", 800), alt: "Bodysuit" },
          },
        ],
      },
    },

    {
      type: "reviews",
      data: {
        title: "What our community says",
        description: "Real messages from people we've fitted.",
        items: [
          {
            name: "Diana",
            location: "Spain",
            channel: "WhatsApp",
            avatar: { src: img("photo-1544005313-94ddf0286df2", 200), alt: "Diana" },
            content: {
              text: "Finally shaping I can wear all day without counting the minutes till I take it off. Honest fit advice.",
            },
          },
          {
            name: "Keisha",
            location: "United States",
            channel: "Trustpilot",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Keisha" },
            content: {
              text: "They matched the right piece to my dress and nailed the size. Comfortable and invisible.",
            },
          },
          {
            name: "Lina",
            location: "Sweden",
            channel: "Instagram",
            avatar: { src: img("photo-1438761681033-6461ffad8d80", 200), alt: "Lina" },
            content: {
              text: "Kind, no-pressure guidance. It feels like underwear, not a corset.",
            },
          },
        ],
      },
    },

    {
      type: "guarantee",
      data: {
        title: "Comfort you can trust",
        description: "Honest fit support, before and after.",
        items: [
          { icon: "🔒", title: "Privacy first", subtitle: "Your measurements stay confidential and are never sold." },
          { icon: "🫁", title: "Comfort, not compression", subtitle: "We prioritize breathable, all-day comfort over extreme shaping." },
          { icon: "🙅", title: "No body pressure", subtitle: "We celebrate your shape — shaping is about confidence, not changing you." },
          { icon: "🤝", title: "Free follow-ups", subtitle: "Keep messaging us for sizing and styling, at no cost." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Frequently asked questions" },
        items: [
          {
            question: "Is the fit consult really free?",
            answer: "Yes. Your fit consult and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "Will shapewear change my body?",
            answer: "Shapewear smooths your silhouette under clothing while worn — it's about comfort and confidence, not permanent body change.",
          },
          {
            question: "How do I pick the right size?",
            answer: "Share your measurements and we'll guide you to a comfortable, true-to-body fit.",
          },
          {
            question: "Do I have to buy anything?",
            answer: "No. Our fit guidance is independent — purchasing is entirely up to you.",
          },
        ],
      },
    },
  ],

  footer: {
    brandName: "Sienne",
    copyrightYear: "2026",
    contactEmail: "fit@sienne.com",
    privacyPolicy:
      "We use the measurements you share only to provide your fit consult. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Sienne provides garment fit guidance for informational purposes only. Shaping garments smooth the silhouette while worn and do not provide permanent body change.",
  },

  floatingButton: {
    text: "🤍 Free fit consult",
    link: WHATSAPP,
  },
};
