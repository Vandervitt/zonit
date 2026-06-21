// landing-editor/samples/fragranceDraft.ts
//
// 美妆 / 香水「选香顾问」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费选香建议 / 小样咨询，无任何下单 / 结账 / 订阅语义。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Maison%20Brume%2C%20I%27d%20like%20a%20free%20scent%20match";

export const fragranceDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1541643600914-78b084683601", 1600),
      alt: "Perfume bottles on a marble surface",
    },
    badge: { emoji: "🌸", text: "Your signature scent, discovered" },
    title: "Find a fragrance that feels like you",
    subtitle:
      "Tell us your taste and the moments you want it for. Our scent advisors send a free, personalized fragrance profile over WhatsApp — no scrolling endless bottles.",
    cta: { text: "Get my free scent match", link: WHATSAPP },
    secondaryCta: { text: "Explore scent families", link: "https://instagram.com/maison.brume" },
    endorsementText: "Trusted by 45,000+ fragrance lovers worldwide",
    showcase: {
      type: "image",
      src: img("photo-1592945403244-b3fbafd7f539"),
      alt: "Amber perfume bottle in soft light",
    },
  },

  sections: [
    {
      type: "stats",
      data: {
        title: "Why people trust our advisors",
        subtitle: "A few numbers behind our scent matching.",
        items: [
          { icon: "🌸", value: "45,000+", label: "Scent profiles created" },
          { icon: "🌍", value: "35+", label: "Countries served" },
          { icon: "⭐", value: "4.9/5", label: "Average advisor rating" },
          { icon: "⏱️", value: "<10 min", label: "Avg. WhatsApp reply" },
        ],
      },
    },

    {
      type: "features",
      data: {
        title: "Why Maison Brume works",
        subtitle: "Personal, considered, and pressure-free.",
        items: [
          {
            icon: "👃",
            title: "Matched to your taste",
            description:
              "We read the notes you love and the mood you want, then map you to the right scent families.",
          },
          {
            icon: "🕯️",
            title: "Built for your moments",
            description:
              "Daytime, office, evening, or signature — we suggest what fits your life, not just trends.",
          },
          {
            icon: "🧪",
            title: "Honest, brand-agnostic picks",
            description:
              "Recommendations across houses and budgets, plus sampling tips before you commit.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp guidance",
            description:
              "Tell us what you tried and we'll refine your profile — for free, anytime.",
          },
        ],
      },
    },

    {
      type: "process",
      data: {
        title: "How your free match works",
        subtitle: "Four steps, all over WhatsApp.",
        steps: [
          {
            title: "Say hi on WhatsApp",
            description: "Tap the button and tell us a scent you already love.",
            image: { src: img("photo-1588405748880-12d1d2a59f75", 800), alt: "Perfume bottle close-up" },
          },
          {
            title: "Quick scent quiz",
            description: "Answer a few questions about notes, intensity, and the occasions you have in mind.",
          },
          {
            title: "Get your scent profile",
            description: "An advisor sends matched fragrance families and specific bottles to sample.",
          },
          {
            title: "Refine after you try",
            description: "Share your impressions and we'll fine-tune the picks — free.",
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
            name: "Elise",
            location: "France",
            channel: "WhatsApp",
            avatar: { src: img("photo-1438761681033-6461ffad8d80", 200), alt: "Elise" },
            content: {
              text: "I'd been wearing the wrong scents for years. My profile finally feels like me — and I sampled before buying.",
            },
          },
          {
            name: "Marco",
            location: "Italy",
            channel: "Trustpilot",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Marco" },
            content: {
              text: "Brand-agnostic, honest advice. They suggested an affordable option that outperformed pricier bottles.",
            },
          },
          {
            name: "Nadia",
            location: "United Arab Emirates",
            channel: "Instagram",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Nadia" },
            content: {
              text: "The quiz nailed my taste. I found a signature scent for evenings and a lighter one for work.",
            },
          },
        ],
      },
    },

    {
      type: "story",
      data: {
        title: "Our story",
        subtitle: "Why we started Maison Brume.",
        body: "Choosing a fragrance online is overwhelming — thousands of bottles, no way to smell them. We built Maison Brume to bring back the feeling of a thoughtful advisor: someone who listens, understands your taste, and points you to scents worth sampling. No pressure, no upselling — just helping you find something that feels unmistakably yours.",
        backgroundImage: {
          src: img("photo-1557170334-a9632e77c6e4", 1400),
          alt: "Perfumer's desk with ingredients",
        },
        signatureName: "Camille Rousseau",
        signatureRole: "Lead Scent Advisor",
      },
    },

    {
      type: "guarantee",
      data: {
        title: "Advice you can trust",
        description: "Considered guidance, before and after your match.",
        items: [
          { icon: "🔒", title: "Privacy first", subtitle: "Your preferences stay confidential and are never sold." },
          { icon: "🧪", title: "Sample before you commit", subtitle: "We always suggest trying before buying any bottle." },
          { icon: "🙅", title: "No pushy sales", subtitle: "Brand-agnostic picks — buy from anywhere, or nowhere." },
          { icon: "🤝", title: "Free follow-ups", subtitle: "Refine your profile anytime as your taste evolves." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Frequently asked questions" },
        items: [
          {
            question: "Is the scent match really free?",
            answer: "Yes. Your scent profile and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "Do I have to buy from you?",
            answer: "No. We recommend bottles across brands and budgets — where you buy is entirely up to you.",
          },
          {
            question: "I don't know any fragrance terms — can you still help?",
            answer: "Absolutely. Just describe scents or moments you like and we'll translate that into a profile.",
          },
          {
            question: "Can you suggest budget-friendly options?",
            answer: "Yes. We match great scents at every price point and flag strong value picks.",
          },
        ],
      },
    },
  ],

  footer: {
    brandName: "Maison Brume",
    copyrightYear: "2026",
    contactEmail: "hello@maison-brume.com",
    privacyPolicy:
      "We use the preferences you share only to build your scent profile. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Maison Brume provides fragrance recommendations for informational purposes only. Please review ingredient lists for allergies and patch-test new products.",
  },

  floatingButton: {
    text: "🌸 Free scent match",
    link: WHATSAPP,
  },
};
