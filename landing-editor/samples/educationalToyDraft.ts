// landing-editor/samples/educationalToyDraft.ts
//
// 玩具母婴 / 益智教育玩具「选玩具 & 发展咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费选玩具建议，无任何下单 / 结账 / 订阅语义。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Sprout%2C%20I%27d%20like%20a%20free%20toy%20recommendation";

export const educationalToyDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1545558014-8692077e9b5c", 1600),
      alt: "Colorful educational toys",
    },
    badge: { emoji: "🧩", text: "Play that grows with your child" },
    title: "The right toys for your child's stage",
    subtitle:
      "Tell us your child's age and interests. Our play advisors send a free, age-matched toy guide over WhatsApp — built around real developmental milestones.",
    cta: { text: "Get my free toy guide", link: WHATSAPP },
    secondaryCta: { text: "See play ideas", link: "https://instagram.com/sprout.play" },
    endorsementText: "Trusted by 110,000+ parents and educators",
    showcase: {
      type: "image",
      src: img("photo-1503454537195-1dcabb73ffb9"),
      alt: "Wooden learning toys",
    },
  },

  sections: [
    {
      type: "features",
      data: {
        title: "Why Sprout guides work",
        subtitle: "Age-matched, developmental, and screen-free.",
        items: [
          {
            icon: "🎯",
            title: "Matched to their stage",
            description:
              "We match toys to your child's age and milestones — fine motor, language, problem-solving, and more.",
          },
          {
            icon: "🧠",
            title: "Backed by development",
            description:
              "Play ideas grounded in how children actually learn and grow, not just what's trending.",
          },
          {
            icon: "🪵",
            title: "Safe, durable picks",
            description:
              "Non-toxic, age-appropriate, well-made toys that survive real play.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp help",
            description:
              "As your child grows, message us for the next stage of play ideas — free.",
          },
        ],
      },
    },

    {
      type: "trust",
      data: {
        badges: [
          { icon: "✅", title: "Safety-tested picks", subtitle: "We only recommend toys meeting recognized safety standards." },
          { icon: "🌱", title: "Non-toxic materials", subtitle: "Child-safe, durable materials we'd give our own kids." },
          { icon: "🎓", title: "Educator-reviewed", subtitle: "Guides reviewed by early-childhood educators." },
          { icon: "🔒", title: "Privacy first", subtitle: "Your family's details stay confidential and are never sold." },
        ],
      },
    },

    {
      type: "stats",
      data: {
        title: "Why parents trust us",
        subtitle: "A few numbers behind our toy guides.",
        items: [
          { icon: "🧩", value: "110,000+", label: "Toy guides created" },
          { icon: "🌍", value: "42+", label: "Countries served" },
          { icon: "⭐", value: "4.9/5", label: "Average guide rating" },
          { icon: "⏱️", value: "<10 min", label: "Avg. WhatsApp reply" },
        ],
      },
    },

    {
      type: "reviews",
      data: {
        title: "What parents say",
        description: "Real messages from families we've helped.",
        items: [
          {
            name: "Rachel",
            location: "United States",
            channel: "WhatsApp",
            avatar: { src: img("photo-1544005313-94ddf0286df2", 200), alt: "Rachel" },
            content: {
              text: "Finally toys my toddler actually plays with and learns from. They matched everything to her exact stage.",
            },
          },
          {
            name: "Daniel",
            location: "United Kingdom",
            channel: "Trustpilot",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Daniel" },
            content: {
              text: "Safety-first and educator-backed. They suggested fewer, better toys instead of upselling a giant bundle.",
            },
          },
          {
            name: "Sofia",
            location: "Mexico",
            channel: "Instagram",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Sofia" },
            content: {
              text: "Loved the screen-free play ideas. My son is more focused and we have less clutter.",
            },
          },
        ],
      },
    },

    {
      type: "guarantee",
      data: {
        title: "Play you can trust",
        description: "Safe, thoughtful guidance for your family.",
        items: [
          { icon: "✅", title: "Safety-checked", subtitle: "Age-appropriate toys meeting recognized safety standards." },
          { icon: "🧠", title: "Developmentally sound", subtitle: "Educator-reviewed guidance for real learning." },
          { icon: "🙅", title: "No pushy sales", subtitle: "Independent advice — buy from anywhere, or nowhere." },
          { icon: "🤝", title: "Free follow-ups", subtitle: "Next-stage play ideas as your child grows, at no cost." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Frequently asked questions" },
        items: [
          {
            question: "Is the toy guide really free?",
            answer: "Yes. Your guide and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "How do you match toys to my child?",
            answer: "Share your child's age, interests, and any needs, and we'll recommend age- and stage-appropriate toys.",
          },
          {
            question: "Are the toys safe?",
            answer: "We only recommend toys meeting recognized safety standards, but always supervise play and check age labels.",
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
    brandName: "Sprout",
    copyrightYear: "2026",
    contactEmail: "hello@sprout-play.com",
    privacyPolicy:
      "We use the details you share about your child only to provide your toy guide. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Sprout provides toy and play guidance for informational purposes only. Always supervise children, follow age recommendations, and check safety labels.",
  },

  floatingButton: {
    text: "🧩 Free toy guide",
    link: WHATSAPP,
  },
};
