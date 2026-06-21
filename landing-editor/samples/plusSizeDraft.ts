// landing-editor/samples/plusSizeDraft.ts
//
// 服饰 / 大码女装「合身造型咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费合身建议 / 造型与尺码咨询，无任何下单 / 结账 / 订阅语义。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Curvana%2C%20I%27d%20like%20a%20free%20fit%20%26%20style%20consult";

export const plusSizeDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1485462537746-965f33f7f6a7", 1600),
      alt: "Inclusive fashion editorial",
    },
    badge: { emoji: "💖", text: "Designed for real curves" },
    title: "Clothes that fit you — not the other way around",
    subtitle:
      "Get a free fit-and-style consult over WhatsApp. Our stylists know plus-size proportions and help you find pieces that flatter and feel great.",
    cta: { text: "Get my free fit consult", link: WHATSAPP },
    secondaryCta: { text: "See real fits", link: "https://instagram.com/curvana" },
    endorsementText: "Trusted by 90,000+ in the plus-size community",
    showcase: {
      type: "image",
      src: img("photo-1506629082955-511b1aa562c8"),
      alt: "Confident model in a flattering outfit",
    },
  },

  sections: [
    {
      type: "features",
      data: {
        title: "Why Curvana styling works",
        subtitle: "Inclusive, honest, and built for your shape.",
        items: [
          {
            icon: "📐",
            title: "True-to-curve fit",
            description:
              "We style for real plus-size proportions — bust, waist, hips, and length — not a scaled-up straight size.",
          },
          {
            icon: "💖",
            title: "Flattering by design",
            description:
              "Cuts, fabrics, and silhouettes chosen to feel confident and comfortable all day.",
          },
          {
            icon: "📏",
            title: "Size help that works",
            description:
              "Honest sizing guidance across brands so pieces fit the first time.",
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
      type: "products",
      data: {
        title: "Fits our stylists love",
        subtitle: "A few pieces that consistently flatter.",
        items: [
          {
            name: "The Confidence Dress",
            description: "A wrap silhouette that defines the waist and moves beautifully.",
            backgroundImage: { src: img("photo-1539008835657-9e8e9680c956", 800), alt: "Wrap dress" },
          },
          {
            name: "Everyday Tailoring",
            description: "Stretch-comfort trousers and blazers cut for curves.",
            backgroundImage: { src: img("photo-1551232864-3f0890e580d9", 800), alt: "Tailored set" },
          },
          {
            name: "Weekend Knits",
            description: "Soft, draping knits that layer without adding bulk.",
            backgroundImage: { src: img("photo-1576566588028-4147f3842f27", 800), alt: "Knit layers" },
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
            name: "Tanya",
            location: "United Kingdom",
            channel: "WhatsApp",
            avatar: { src: img("photo-1544005313-94ddf0286df2", 200), alt: "Tanya" },
            content: {
              text: "First time a stylist actually understood my proportions. Everything fit and I felt amazing.",
            },
          },
          {
            name: "Rosa",
            location: "Brazil",
            channel: "Instagram",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Rosa" },
            content: {
              text: "The size guidance saved me so many returns. Honest, kind, and zero pressure to buy.",
            },
          },
          {
            name: "Hayley",
            location: "Australia",
            channel: "Trustpilot",
            avatar: { src: img("photo-1438761681033-6461ffad8d80", 200), alt: "Hayley" },
            content: {
              text: "Finally felt seen by a brand. The capsule they built me gets compliments every week.",
            },
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
          { icon: "💖", value: "90,000+", label: "Fits styled" },
          { icon: "🌍", value: "38+", label: "Countries served" },
          { icon: "⭐", value: "4.9/5", label: "Average stylist rating" },
          { icon: "↩️", value: "-40%", label: "Fewer fit returns" },
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
            answer: "Yes. Your fit-and-style consult and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "What sizes do you style?",
            answer: "We specialize in the full plus-size range and tailor advice to your exact measurements.",
          },
          {
            question: "Do I have to buy anything?",
            answer: "No. We give independent styling and fit guidance — purchasing is entirely up to you.",
          },
          {
            question: "Can you help me shop other brands?",
            answer: "Absolutely. We give brand-agnostic sizing advice so you can shop wherever fits best.",
          },
        ],
      },
    },
  ],

  footer: {
    brandName: "Curvana",
    copyrightYear: "2026",
    contactEmail: "style@curvana.com",
    privacyPolicy:
      "We use the measurements and style details you share only to provide your fit consult. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Curvana provides personal styling and fit guidance for informational purposes only. Fit suggestions are estimates based on the details you provide.",
  },

  floatingButton: {
    text: "💖 Free fit consult",
    link: WHATSAPP,
  },
};
