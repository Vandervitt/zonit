// landing-editor/samples/saasDemoDraft.ts
//
// 出海 SaaS「预约产品演示」营销落地页样例（海外 leadgen，非交易）。
// 主转化走页内留资表单（hero CTA 指向 #lead-form），邮件作为次通道。
// 页面刻意不出现价格、套餐档位、试用扣款或订阅语义——演示预约本身即为线索，
// 商务条件一律留到销售对话中，落地页只负责把合格线索接住。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - 邮箱 hello@flowlane.example 为占位地址，上线前替换为真实业务邮箱。
import type { LandingPageDraft } from "@/types/schema.draft";

/** Unsplash 图片地址助手：统一裁剪与画质参数。 */
const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** 页内留资表单锚点：主转化落点。 */


export const saasDemoDraft: LandingPageDraft = {
  contact: {
    primary: "form",
    email: "hello@flowlane.example?subject=Demo%20request",
  },
  hero: {
    backgroundImage: {
      src: img("photo-1497366754035-f200968a6e72", 1600),
      alt: "Operations team reviewing dashboards in a modern office",
    },
    badge: { emoji: "📊", text: "Operations platform for growing teams" },
    title: "See where every order actually stands",
    subtitle:
      "Book a 30-minute live demo with a product specialist. We'll walk through your workflow, not a canned slide deck.",
    cta: { text: "Book a live demo", target: { kind: "primary" } },
    secondaryCta: { text: "Take the product tour", target: { kind: "url", url: "https://example.com/flowlane-tour" } },
    endorsementText: "Used by operations teams in 40+ countries",
    showcase: {
      type: "image",
      src: img("photo-1551288049-bebda4e38f71"),
      alt: "Analytics dashboard showing order status across regions",
    },
  },

  sections: [
    // 1. 数据展示
    {
      type: "stats",
      data: {
        title: "What teams see after switching",
        subtitle: "Aggregated from customers in their first six months.",
        items: [
          { icon: "⏱️", value: "6 hrs", label: "Saved per week, per ops lead" },
          { icon: "📉", value: "38%", label: "Fewer status-chasing emails" },
          { icon: "🚀", value: "2 wks", label: "Typical time to go live" },
          { icon: "⭐", value: "4.8/5", label: "Average customer rating" },
        ],
      },
    },

    // 2. 特性（core-value 组）
    {
      type: "features",
      data: {
        title: "Built for the messy middle of operations",
        subtitle: "The parts spreadsheets stop handling once you grow.",
        items: [
          {
            icon: "🧭",
            title: "One live view",
            description:
              "Every order, supplier, and shipment in one timeline — so nobody has to ask where things stand.",
          },
          {
            icon: "🔔",
            title: "Alerts that matter",
            description:
              "Get notified when something slips, not for every routine update that clears itself.",
          },
          {
            icon: "🔌",
            title: "Connects to your stack",
            description:
              "Sync with the tools your team already uses, so data stops living in three places at once.",
          },
          {
            icon: "🧑‍🤝‍🧑",
            title: "Roles and permissions",
            description:
              "Give suppliers and contractors exactly the visibility they need — and nothing else.",
          },
        ],
      },
    },

    // 3. 服务流程：演示到落地
    {
      type: "process",
      data: {
        title: "How the demo works",
        subtitle: "No pressure, no obligation — just a working session.",
        steps: [
          {
            title: "Tell us about your workflow",
            description: "A few lines about your team size and where things currently break down.",
            image: { src: img("photo-1600880292203-757bb62b4baf", 800), alt: "Specialist walking a customer through the product" },
          },
          {
            title: "30-minute live session",
            description: "A specialist maps your process onto the product and answers questions as they come up.",
          },
          {
            title: "Decide in your own time",
            description: "You get a written summary of what we covered. If it isn't a fit, we'll say so.",
          },
        ],
      },
    },

    // 4. 信任徽章（安全与可靠性，非交易）
    {
      type: "trust",
      data: {
        backgroundImage: {
          src: img("photo-1451187580459-43490279c0fa", 1400),
          alt: "Abstract network of connected nodes",
        },
        badges: [
          { icon: "🔐", title: "SOC 2 Type II", subtitle: "Independently audited security controls" },
          { icon: "🇪🇺", title: "GDPR ready", subtitle: "EU data residency available on request" },
          { icon: "📈", title: "99.9% uptime", subtitle: "Status page published and monitored" },
          { icon: "🧑‍💻", title: "Human support", subtitle: "Real specialists, not a ticket queue" },
        ],
      },
    },

    // 5. 客户评价
    {
      type: "reviews",
      data: {
        title: "What operations teams say",
        description: "From customers who sat through this exact demo.",
        items: [
          {
            name: "Priya S.",
            location: "Singapore",
            channel: "G2",
            avatar: { src: img("photo-1573497019940-1c28c88b4f3e", 200), alt: "Priya S." },
            content: {
              text: "The demo used our own workflow. By minute ten I knew whether it fit — that never happens.",
            },
          },
          {
            name: "Tom H.",
            location: "United Kingdom",
            channel: "Email",
            avatar: { src: img("photo-1519085360753-af0119f7cbe7", 200), alt: "Tom H." },
            content: {
              text: "We went live in under two weeks. The alerts alone killed most of our internal status chasing.",
            },
          },
          {
            name: "Lucia M.",
            location: "Spain",
            channel: "G2",
            avatar: { src: img("photo-1487412720507-e7ab37603c6f", 200), alt: "Lucia M." },
            content: {
              text: "They told us one of our use cases wasn't a good fit yet. That honesty is why we signed.",
            },
          },
        ],
      },
    },

    // 6. 保障（非交易：数据归属 / 无推销 / 迁移支持）
    {
      type: "guarantee",
      data: {
        title: "What you can count on",
        description: "Commitments that apply from the demo onwards.",
        items: [
          { icon: "🗄️", title: "Your data stays yours", subtitle: "Export everything at any time, in open formats." },
          { icon: "🙅", title: "No pushy follow-up", subtitle: "One summary email. If you're not interested, we stop." },
          { icon: "🧭", title: "Guided onboarding", subtitle: "A specialist helps you migrate your existing process." },
          { icon: "📄", title: "Clear documentation", subtitle: "Public docs and changelog — no black boxes." },
        ],
      },
    },

    // 7. 常见问题
    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Common questions" },
        items: [
          {
            question: "How long is the demo?",
            answer:
              "Thirty minutes, scheduled at a time that works for you. We can go longer if your team has more to cover.",
          },
          {
            question: "Who should join from our side?",
            answer:
              "Whoever owns the process day to day. Bringing one operations lead is usually more useful than a large audience.",
          },
          {
            question: "Do you need access to our data first?",
            answer:
              "No. The demo runs on sample data unless you specifically want to bring your own.",
          },
          {
            question: "What happens after the demo?",
            answer:
              "You get a written summary of what we covered and where the gaps are. Next steps are entirely your call.",
          },
        ],
      },
    },
  ],

  // 主转化：页内演示预约表单
  leadForm: {
    enabled: true,
    title: "Book your live demo",
    description: "Tell us a little about your team and we'll find a time that works.",
    submitText: "Request a demo",
    successMessage: "Thanks — a specialist will reach out to schedule your session.",
    fields: {
      name: { enabled: true, required: true, label: "Your name" },
      email: { enabled: true, required: true, label: "Work email" },
      phone: { enabled: true, required: false, label: "Phone (optional)" },
      whatsapp: { enabled: false, required: false },
      telegram: { enabled: false, required: false },
      message: {
        enabled: true,
        required: false,
        label: "What would you like the demo to cover?",
      },
    },
  },

  footer: {
    brandName: "Flowlane",
    copyrightYear: "2026",
    privacyPolicy:
      "We collect only the contact and workflow details you share in order to schedule and prepare your demo. We do not sell your data, and you can ask us to delete it at any time.",
    termsOfService:
      "Product capabilities, timelines, and results described on this page are illustrative and vary by team, data quality, and existing systems. Nothing here forms a commitment until agreed in writing.",
  },

  floatingButton: {
    text: "✉️ Email the team",
    target: { kind: "channel", channel: "email" },
  },
};
