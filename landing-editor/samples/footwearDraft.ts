// landing-editor/samples/footwearDraft.ts
//
// 服饰 / 鞋靴「合脚 & 选款咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费合脚建议 / 选款与尺码咨询，无任何下单 / 结账 / 订阅语义。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Atlas%2C%20I%27d%20like%20a%20free%20fit%20%26%20shoe%20consult";

export const footwearDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1460353581641-37baddab0fa2", 1600),
      alt: "Premium footwear on a clean backdrop",
    },
    badge: { emoji: "👟", text: "The right shoe, for the right step" },
    title: "Shoes that fit your feet and your day",
    subtitle:
      "Tell us how you walk, work, and train. Our fit advisors send a free shoe-and-size guide over WhatsApp — comfort first, no more guessing sizes online.",
    cta: { text: "Get my free fit consult", link: WHATSAPP },
    secondaryCta: { text: "Browse styles", link: "https://instagram.com/atlas.footwear" },
    endorsementText: "Trusted by 110,000+ across 40+ countries",
    showcase: {
      type: "image",
      src: img("photo-1542291026-7eec264c27ff"),
      alt: "Sneaker product shot",
    },
  },

  sections: [
    {
      type: "products",
      data: {
        title: "Styles our advisors love",
        subtitle: "A few favorites across daily wear.",
        items: [
          {
            name: "All-Day Walker",
            description: "Cushioned, supportive, and light — built for long days on your feet.",
            backgroundImage: { src: img("photo-1525966222134-fcfa99b8ae77", 800), alt: "Walking shoe" },
          },
          {
            name: "Everyday Sneaker",
            description: "A clean silhouette that pairs with everything, with arch support that lasts.",
            backgroundImage: { src: img("photo-1595950653106-6c9ebd614d3a", 800), alt: "Everyday sneaker" },
          },
          {
            name: "Smart Comfort Loafer",
            description: "Office-ready polish with a sneaker-soft footbed.",
            backgroundImage: { src: img("photo-1533867617858-e7b97e060509", 800), alt: "Loafer" },
          },
        ],
      },
    },

    {
      type: "features",
      data: {
        title: "Why Atlas fits better",
        subtitle: "Comfort-led, honest, and matched to your feet.",
        items: [
          {
            icon: "🦶",
            title: "Matched to your foot",
            description:
              "Width, arch, and how you walk — we recommend shapes that actually fit, not just look good.",
          },
          {
            icon: "📏",
            title: "Size help that works",
            description:
              "Honest sizing across brands so they fit the first time and you avoid returns.",
          },
          {
            icon: "🛣️",
            title: "Built for your day",
            description:
              "Commuting, standing, training, or travel — the right cushioning for how you move.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp help",
            description:
              "Tell us how they felt and we'll fine-tune the next pick — free.",
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
            name: "Owen",
            location: "United States",
            channel: "WhatsApp",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Owen" },
            content: {
              text: "Wide feet have always been a nightmare online. Their size advice nailed it — comfiest pair I own.",
            },
          },
          {
            name: "Priya",
            location: "India",
            channel: "Trustpilot",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Priya" },
            content: {
              text: "On my feet 10 hours a day. They matched the right cushioning and my back thanks them.",
            },
          },
          {
            name: "Lukas",
            location: "Austria",
            channel: "Instagram",
            avatar: { src: img("photo-1500648767791-00dcc994a43e", 200), alt: "Lukas" },
            content: {
              text: "Quick, honest fit help with no pressure to buy. Got the size right first try.",
            },
          },
        ],
      },
    },

    {
      type: "stats",
      data: {
        title: "Why people keep coming back",
        subtitle: "A few numbers behind our fit advisors.",
        items: [
          { icon: "👟", value: "110,000+", label: "Fit consults done" },
          { icon: "🌍", value: "40+", label: "Countries served" },
          { icon: "⭐", value: "4.9/5", label: "Average fit rating" },
          { icon: "↩️", value: "-38%", label: "Fewer size returns" },
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
            answer: "Yes. Your fit-and-size guide and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "Can you help with wide or narrow feet?",
            answer: "Absolutely. Share your foot width and any pain points and we'll recommend shapes that fit.",
          },
          {
            question: "Do I have to buy anything?",
            answer: "No. Our fit guidance is independent — purchasing is entirely up to you.",
          },
          {
            question: "Can you size me across different brands?",
            answer: "Yes. We give brand-agnostic sizing advice so you can shop wherever fits best.",
          },
        ],
      },
    },
  ],

  footer: {
    brandName: "Atlas Footwear",
    copyrightYear: "2026",
    contactEmail: "fit@atlas-footwear.com",
    privacyPolicy:
      "We use the foot and size details you share only to provide your fit consult. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Atlas provides footwear fit guidance for informational purposes only. Fit suggestions are estimates based on the details you provide.",
  },

  floatingButton: {
    text: "👟 Free fit consult",
    link: WHATSAPP,
  },
};
