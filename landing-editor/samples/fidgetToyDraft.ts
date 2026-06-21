// landing-editor/samples/fidgetToyDraft.ts
//
// 玩具母婴 / 解压玩具「选品 & 用途咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费选品建议，无任何下单 / 结账 / 订阅语义。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Calmly%2C%20I%27d%20like%20a%20free%20fidget%20match";

export const fidgetToyDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1516627145497-ae6968895b74", 1600),
      alt: "Colorful sensory fidget toys",
    },
    badge: { emoji: "🌀", text: "Calm in your hands" },
    title: "Fidget tools that actually help you focus",
    subtitle:
      "Tell us who they're for and what helps. We send a free match over WhatsApp — quiet, durable, classroom- and desk-friendly sensory tools.",
    cta: { text: "Get my free fidget match", link: WHATSAPP },
    secondaryCta: { text: "See the range", link: "https://instagram.com/calmly.sensory" },
    endorsementText: "Trusted by 95,000+ focused minds worldwide",
    showcase: {
      type: "image",
      src: img("photo-1559535332-db9971090158"),
      alt: "Sensory fidget tools",
    },
  },

  sections: [
    {
      type: "features",
      data: {
        title: "Why Calmly matches better",
        subtitle: "Matched to the person and the setting.",
        items: [
          {
            icon: "🎯",
            title: "Matched to the need",
            description:
              "Focus, calm, or sensory input — we match tools to what actually helps, for kids or adults.",
          },
          {
            icon: "🤫",
            title: "Quiet & discreet",
            description:
              "Classroom- and office-friendly picks that don't distract others.",
          },
          {
            icon: "🛡️",
            title: "Durable & safe",
            description:
              "Sturdy, non-toxic materials built to survive constant use, with age-appropriate options.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp help",
            description:
              "Tell us how it's working and we'll fine-tune the recommendation — free.",
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
          { icon: "🌀", value: "95,000+", label: "Fidget matches done" },
          { icon: "🌍", value: "38+", label: "Countries served" },
          { icon: "⭐", value: "4.8/5", label: "Average match rating" },
          { icon: "⏱️", value: "<10 min", label: "Avg. WhatsApp reply" },
        ],
      },
    },

    {
      type: "products",
      data: {
        title: "Popular picks by need",
        subtitle: "A few favorites across settings.",
        items: [
          {
            name: "Quiet Focus Set",
            description: "Silent, pocket-sized tools perfect for classrooms and meetings.",
            backgroundImage: { src: img("photo-1610890716171-6b1bb98ffd09", 800), alt: "Quiet fidget set" },
          },
          {
            name: "Sensory Calm Kit",
            description: "Textured, squishable tools for soothing and grounding.",
            backgroundImage: { src: img("photo-1587654780291-39c9404d746b", 800), alt: "Sensory kit" },
          },
          {
            name: "Desk Companion",
            description: "Sturdy, satisfying tools that keep restless hands busy at work.",
            backgroundImage: { src: img("photo-1606092195730-5d7b9af1efc5", 800), alt: "Desk fidget" },
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
            name: "Karen",
            location: "United States",
            channel: "WhatsApp",
            avatar: { src: img("photo-1544005313-94ddf0286df2", 200), alt: "Karen" },
            content: {
              text: "Quiet enough for my son's classroom and it genuinely helps him focus. They matched it to his needs perfectly.",
            },
          },
          {
            name: "Lars",
            location: "Germany",
            channel: "Trustpilot",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Lars" },
            content: {
              text: "Durable desk tools that survive all day. Honest advice, no pressure to buy a huge bundle.",
            },
          },
          {
            name: "Priya",
            location: "India",
            channel: "Instagram",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Priya" },
            content: {
              text: "The sensory kit helps me stay grounded in meetings. Discreet and genuinely calming.",
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
            question: "Is the fidget match really free?",
            answer: "Yes. Your match and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "Are these safe for young children?",
            answer: "We recommend age-appropriate options and flag small-parts cautions — always supervise young children.",
          },
          {
            question: "Are they quiet enough for class or work?",
            answer: "Yes. We can match silent, discreet tools suited to classrooms and offices.",
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
    brandName: "Calmly",
    copyrightYear: "2026",
    contactEmail: "hello@calmly-sensory.com",
    privacyPolicy:
      "We use the details you share only to provide your fidget match. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Calmly provides sensory-tool guidance for informational purposes only. Always follow age recommendations and supervise young children during use.",
  },

  floatingButton: {
    text: "🌀 Free fidget match",
    link: WHATSAPP,
  },
};
