// landing-editor/samples/outdoorToyDraft.ts
//
// 玩具母婴 / 户外运动玩具「选品 & 活动咨询」营销落地页样例（海外 leadgen，非交易）。
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
  "https://wa.me/15551234567?text=Hi%20Romp%2C%20I%27d%20like%20a%20free%20outdoor%20toy%20match";

export const outdoorToyDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1502086223501-7ea6ecd79368", 1600),
      alt: "Kids playing outdoors",
    },
    badge: { emoji: "⚽", text: "Get them moving, get them outside" },
    title: "Outdoor toys that get kids off the screen",
    subtitle:
      "Tell us your kids' ages and your space. We send a free, age-matched outdoor play guide over WhatsApp — active, durable, screen-free fun.",
    cta: { text: "Get my free play match", link: WHATSAPP },
    secondaryCta: { text: "See play ideas", link: "https://instagram.com/romp.outdoor" },
    endorsementText: "Trusted by 100,000+ active families worldwide",
    showcase: {
      type: "image",
      src: img("photo-1530021232320-687d8e3dba54"),
      alt: "Outdoor play equipment",
    },
  },

  sections: [
    {
      type: "features",
      data: {
        title: "Why Romp matches better",
        subtitle: "Active, durable, and matched to your space.",
        items: [
          {
            icon: "🎯",
            title: "Matched to age & energy",
            description:
              "Toddler to tween — we match toys to their stage, motor skills, and activity level.",
          },
          {
            icon: "🌳",
            title: "Fits your space",
            description:
              "Balcony, backyard, or park — picks that work for the space you actually have.",
          },
          {
            icon: "🛡️",
            title: "Built to last outdoors",
            description:
              "Weather-resistant, durable, safety-standard toys that survive real play.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp help",
            description:
              "As kids grow, message us for the next stage of active play — free.",
          },
        ],
      },
    },

    {
      type: "trust",
      data: {
        badges: [
          { icon: "✅", title: "Safety-standard picks", subtitle: "We only recommend toys meeting recognized safety standards." },
          { icon: "🌦️", title: "Weather-durable", subtitle: "Built to handle sun, rain, and rough play." },
          { icon: "🏃", title: "Active & screen-free", subtitle: "Toys that get kids moving and outdoors." },
          { icon: "🔒", title: "Privacy first", subtitle: "Your family's details stay confidential and are never sold." },
        ],
      },
    },

    {
      type: "stats",
      data: {
        title: "Why families trust us",
        subtitle: "A few numbers behind our play guides.",
        items: [
          { icon: "⚽", value: "100,000+", label: "Play guides created" },
          { icon: "🌍", value: "40+", label: "Countries served" },
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
            name: "Mark",
            location: "United States",
            channel: "WhatsApp",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Mark" },
            content: {
              text: "Matched perfectly to our small backyard and the kids' ages. They're outside every day now.",
            },
          },
          {
            name: "Elena",
            location: "Spain",
            channel: "Trustpilot",
            avatar: { src: img("photo-1544005313-94ddf0286df2", 200), alt: "Elena" },
            content: {
              text: "Durable toys that survive my rough-and-tumble boys. Honest advice, no upselling a giant set.",
            },
          },
          {
            name: "Tariq",
            location: "Morocco",
            channel: "Instagram",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Tariq" },
            content: {
              text: "Screen-free play ideas that actually stuck. Safety-first picks and zero pressure to buy.",
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
            question: "Is the play match really free?",
            answer: "Yes. Your match and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "Can you match for a small space?",
            answer: "Absolutely. We recommend toys that suit balconies and small yards as easily as big gardens.",
          },
          {
            question: "Are the toys safe and durable?",
            answer: "We only recommend safety-standard, weather-durable toys, but always supervise play and check age labels.",
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
    brandName: "Romp",
    copyrightYear: "2026",
    contactEmail: "hello@romp-outdoor.com",
    privacyPolicy:
      "We use the details you share about your family only to provide your play match. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Romp provides toy and outdoor-play guidance for informational purposes only. Always supervise children, follow age recommendations, and check safety labels.",
  },

  floatingButton: {
    text: "⚽ Free play match",
    link: WHATSAPP,
  },
};
