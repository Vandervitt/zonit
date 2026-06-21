// landing-editor/samples/petDraft.ts
//
// 家居 / 宠物用品「养宠好物 & 行为咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费选品 / 养护与行为咨询，无任何下单 / 结账 / 订阅语义。
// 健康相关表述配 disclaimer，建议就医由兽医判断。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Pawsly%2C%20I%27d%20like%20free%20pet%20gear%20advice";

export const petDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1450778869180-41d0601e046e", 1600),
      alt: "Happy dog at home",
    },
    badge: { emoji: "🐾", text: "Happier pets, calmer homes" },
    title: "The right gear for your pet's needs",
    subtitle:
      "Tell us about your pet and what you're struggling with. We send a free recommendation over WhatsApp — gear and tips matched to their breed, age, and behavior.",
    cta: { text: "Get my free pet advice", link: WHATSAPP },
    secondaryCta: { text: "See happy tails", link: "https://instagram.com/pawsly" },
    endorsementText: "Trusted by 115,000+ pet parents worldwide",
    showcase: {
      type: "image",
      src: img("photo-1583511655857-d19b40a7a54e"),
      alt: "Pet supplies flat lay",
    },
  },

  sections: [
    {
      type: "features",
      data: {
        title: "Why Pawsly advice works",
        subtitle: "Matched to your pet, not a generic catalog.",
        items: [
          {
            icon: "🐕",
            title: "Breed & age aware",
            description:
              "We match gear to your pet's size, energy, and life stage — puppy to senior.",
          },
          {
            icon: "🦴",
            title: "Behavior-led picks",
            description:
              "Chewing, anxiety, pulling on walks — we recommend tools that target the real issue.",
          },
          {
            icon: "🧪",
            title: "Safe, durable materials",
            description:
              "Non-toxic, chew-tested gear we'd trust with our own pets.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp help",
            description:
              "Send a photo or video and we'll fine-tune our suggestions — free, anytime.",
          },
        ],
      },
    },

    {
      type: "reviews",
      data: {
        title: "What pet parents say",
        description: "Real messages from people we've helped.",
        items: [
          {
            name: "Olivia",
            location: "United States",
            channel: "WhatsApp",
            avatar: { src: img("photo-1544005313-94ddf0286df2", 200), alt: "Olivia" },
            content: {
              text: "The harness they matched finally stopped my dog pulling. They asked about his behavior, not just his size.",
            },
          },
          {
            name: "Mateo",
            location: "Spain",
            channel: "Trustpilot",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Mateo" },
            content: {
              text: "Honest advice for my anxious rescue. They even suggested seeing a vet for one issue — real care, no upsell.",
            },
          },
          {
            name: "Chloe",
            location: "Australia",
            channel: "Instagram",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Chloe" },
            content: {
              text: "Durable chew toys that actually survive my puppy. So much better than guessing online.",
            },
          },
        ],
      },
    },

    {
      type: "stats",
      data: {
        title: "Why people trust us",
        subtitle: "A few numbers behind our recommendations.",
        items: [
          { icon: "🐾", value: "115,000+", label: "Pets matched" },
          { icon: "🌍", value: "39+", label: "Countries served" },
          { icon: "⭐", value: "4.9/5", label: "Average advice rating" },
          { icon: "⏱️", value: "<10 min", label: "Avg. WhatsApp reply" },
        ],
      },
    },

    {
      type: "guarantee",
      data: {
        title: "Care you can trust",
        description: "Honest, pet-first guidance.",
        items: [
          { icon: "🔒", title: "Privacy first", subtitle: "Your details stay confidential and are never sold." },
          { icon: "🧪", title: "Safe materials", subtitle: "Non-toxic, durable gear we'd use with our own pets." },
          { icon: "🩺", title: "We flag vet issues", subtitle: "For health or behavior concerns, we'll point you to a vet." },
          { icon: "🤝", title: "Free follow-ups", subtitle: "Keep messaging us as your pet grows, at no cost." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Frequently asked questions" },
        items: [
          {
            question: "Is the pet advice really free?",
            answer: "Yes. Your recommendation and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "Can you help with behavior issues?",
            answer: "We suggest gear and training tips, and we'll recommend a vet or trainer for issues that need a professional.",
          },
          {
            question: "Is this a substitute for a vet?",
            answer: "No. Our advice is for general care and products only — always consult a vet for medical or serious behavior concerns.",
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
    brandName: "Pawsly",
    copyrightYear: "2026",
    contactEmail: "hello@pawsly.com",
    privacyPolicy:
      "We use the pet details you share only to provide your recommendation. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Pawsly provides pet-product and general-care guidance for informational purposes only and is not a substitute for veterinary advice. Always consult a vet for medical concerns.",
  },

  floatingButton: {
    text: "🐾 Free pet advice",
    link: WHATSAPP,
  },
};
