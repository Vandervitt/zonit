// landing-editor/samples/smartHomeDraft.ts
//
// 3C 配件 / 智能家居小件「设备适配 & 组网方案咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 领取免费组网方案 / 生态兼容咨询，无任何下单 / 结账 / 订阅语义。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const WHATSAPP =
  "https://wa.me/15551234567?text=Hi%20Nestly%2C%20I%27d%20like%20a%20free%20smart-home%20plan";

export const smartHomeDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1558002038-1055907df827", 1600),
      alt: "Smart home devices in a modern living room",
    },
    badge: { emoji: "🏠", text: "A smart home that actually works together" },
    title: "Smart home, set up the right way",
    subtitle:
      "Tell us your home and which ecosystem you use. We send a free setup plan over WhatsApp — compatible devices, reliable Wi-Fi, no half-working gadgets.",
    cta: { text: "Get my free setup plan", link: WHATSAPP },
    secondaryCta: { text: "See sample setups", link: "https://youtube.com/@nestly.home" },
    endorsementText: "Trusted by 95,000+ smart homes worldwide",
    showcase: {
      type: "image",
      src: img("photo-1585060544812-6b45742d762f"),
      alt: "Smart speaker and hub",
    },
  },

  sections: [
    {
      type: "features",
      data: {
        title: "Why Nestly setups work",
        subtitle: "Compatible, reliable, and genuinely simple.",
        items: [
          {
            icon: "🔗",
            title: "Ecosystem-matched",
            description:
              "Alexa, Google Home, Apple Home, or Matter — we recommend devices that all play together.",
          },
          {
            icon: "📶",
            title: "Reliability first",
            description:
              "We plan hubs and Wi-Fi coverage so devices stay connected, not dropping offline.",
          },
          {
            icon: "🧩",
            title: "Start small, expand later",
            description:
              "A sensible starter setup you can grow room by room — no overbuying upfront.",
          },
          {
            icon: "💬",
            title: "Ongoing WhatsApp help",
            description:
              "Stuck on setup or automations? Message us and we'll walk you through it — free.",
          },
        ],
      },
    },

    {
      type: "process",
      data: {
        title: "How your free plan works",
        subtitle: "Four steps, all over WhatsApp.",
        steps: [
          {
            title: "Say hi on WhatsApp",
            description: "Tap the button and tell us your home size and current devices.",
            image: { src: img("photo-1556761175-5973dc0f32e7", 800), alt: "Smart home hub" },
          },
          {
            title: "Quick home check-in",
            description: "Tell us your ecosystem, Wi-Fi setup, and what you want to automate.",
          },
          {
            title: "Get your setup plan",
            description: "We send a compatible device list and a simple room-by-room rollout.",
          },
          {
            title: "Set up with support",
            description: "We help you pair devices and build your first automations — free.",
          },
        ],
      },
    },

    {
      type: "stats",
      data: {
        title: "Why people trust us",
        subtitle: "A few numbers behind our setup plans.",
        items: [
          { icon: "🏠", value: "95,000+", label: "Homes planned" },
          { icon: "🔗", value: "300+", label: "Devices supported" },
          { icon: "⭐", value: "4.8/5", label: "Average plan rating" },
          { icon: "⏱️", value: "<10 min", label: "Avg. WhatsApp reply" },
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
            name: "Marcus",
            location: "United States",
            channel: "WhatsApp",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Marcus" },
            content: {
              text: "No more gadgets that don't talk to each other. They planned a setup that just works with Apple Home.",
            },
          },
          {
            name: "Freya",
            location: "Denmark",
            channel: "Trustpilot",
            avatar: { src: img("photo-1534528741775-53994a69daeb", 200), alt: "Freya" },
            content: {
              text: "They fixed my Wi-Fi dead spots before suggesting devices. Honest and genuinely helpful, no upsell.",
            },
          },
          {
            name: "Raj",
            location: "India",
            channel: "Instagram",
            avatar: { src: img("photo-1500648767791-00dcc994a43e", 200), alt: "Raj" },
            content: {
              text: "Started with three devices and expanded room by room. The plan made it stress-free.",
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
            question: "Is the setup plan really free?",
            answer: "Yes. Your plan and all WhatsApp follow-ups are completely free.",
          },
          {
            question: "Will the devices work with my ecosystem?",
            answer: "We confirm compatibility with Alexa, Google Home, Apple Home, or Matter before recommending anything.",
          },
          {
            question: "What if my Wi-Fi is unreliable?",
            answer: "We assess coverage and suggest hubs or mesh options so your devices stay connected.",
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
    brandName: "Nestly",
    copyrightYear: "2026",
    contactEmail: "help@nestly-home.com",
    privacyPolicy:
      "We use the home and device details you share only to build your setup plan. Your data stays confidential, is never sold, and can be deleted on request.",
    termsOfService:
      "Nestly provides smart-home compatibility guidance for informational purposes only. Always follow each device manufacturer's installation and safety instructions.",
  },

  floatingButton: {
    text: "🏠 Free setup plan",
    link: WHATSAPP,
  },
};
