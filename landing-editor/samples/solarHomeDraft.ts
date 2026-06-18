// landing-editor/samples/solarHomeDraft.ts
//
// 家装太阳能「免费上门测评 + 省电方案咨询」营销落地页样例（海外 leadgen，非交易）。
// 仅使用 /admin/editor 各表单可见可编辑的字段，确保在编辑器中可完整复刻与调整。
// 转化全程经 WhatsApp 预约上门测评，"savings estimate / quote" 仅为留资话术，
// 无任何下单 / 结账 / 在线付款 / 订阅语义。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15553219876 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

/** Unsplash 图片地址助手：统一裁剪与画质参数。 */
const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** WhatsApp 预约链接（占位号码 + 预填咨询语）。 */
const WHATSAPP =
  "https://wa.me/15553219876?text=Hi%20Solterra%2C%20I%27d%20like%20a%20free%20home%20solar%20assessment";

export const solarHomeDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: img("photo-1509391366360-2e959784a276", 1600),
      alt: "Solar panels on a modern home roof at sunset",
    },
    badge: { emoji: "☀️", text: "Certified home solar installers" },
    title: "Power your home with the sun — and cut your bills",
    subtitle:
      "Book a free home assessment and get a personalized savings estimate from our solar advisors over WhatsApp. No obligation, no hard sell.",
    cta: { text: "Get my free solar assessment", link: WHATSAPP },
    secondaryCta: { text: "See real installations", link: "https://instagram.com/solterra.home" },
    endorsementText: "Trusted by 12,000+ homeowners across 15+ regions",
    showcase: {
      type: "image",
      src: img("photo-1613665813446-82a78c468a1d"),
      alt: "Technician installing rooftop solar panels",
    },
  },

  sections: [
    // 1. 数据展示
    {
      type: "stats",
      data: {
        title: "Real impact for real homes",
        subtitle: "A few numbers behind our solar advisors.",
        items: [
          { icon: "🏠", value: "12,000+", label: "Homes assessed" },
          { icon: "⚡", value: "Up to 70%", label: "Avg. bill reduction" },
          { icon: "⭐", value: "4.9/5", label: "Average homeowner rating" },
          { icon: "⏱️", value: "<20 min", label: "Avg. WhatsApp reply" },
        ],
      },
    },

    // 2. 特性（core-value 组）
    {
      type: "features",
      data: {
        title: "Why homeowners choose Solterra",
        subtitle: "Transparent, expert guidance from assessment to switch-on.",
        items: [
          {
            icon: "📐",
            title: "Tailored to your roof",
            description:
              "We design around your roof, sunlight, and energy use — never a one-size-fits-all kit.",
          },
          {
            icon: "💡",
            title: "Clear savings, no jargon",
            description:
              "Your estimate explains expected savings and payback in plain language, before you decide anything.",
          },
          {
            icon: "🔧",
            title: "Certified installers",
            description:
              "Accredited technicians handle every install to strict safety and quality standards.",
          },
          {
            icon: "💬",
            title: "WhatsApp support throughout",
            description:
              "Ask questions anytime — from assessment to aftercare — and get a fast, helpful reply.",
          },
        ],
      },
    },

    // 3. 服务流程
    {
      type: "process",
      data: {
        title: "How your free assessment works",
        subtitle: "Three simple steps, all starting on WhatsApp.",
        steps: [
          {
            title: "Message us on WhatsApp",
            description: "Tap the button and tell us about your home and recent energy bills.",
            image: { src: img("photo-1559302504-64aae6ca6b6d", 800), alt: "Advisor reviewing a home solar plan" },
          },
          {
            title: "Free home & roof assessment",
            description: "We review your roof, sunlight, and usage to size the right system for you.",
          },
          {
            title: "Get your savings estimate",
            description: "An advisor shares a personalized plan and estimated savings — no obligation.",
          },
        ],
      },
    },

    // 4. 信任徽章（资质 / 认证）
    {
      type: "trust",
      data: {
        backgroundImage: {
          src: img("photo-1466611653911-95081537e5b7", 1400),
          alt: "Solar panel field under a clear sky",
        },
        badges: [
          { icon: "✅", title: "Accredited installers", subtitle: "Certified to regional safety standards" },
          { icon: "🛡️", title: "25-year panel warranty", subtitle: "Backed by leading manufacturers" },
          { icon: "🔋", title: "Battery-ready designs", subtitle: "Future-proofed for energy storage" },
          { icon: "🌱", title: "Cleaner energy", subtitle: "Lower your home's carbon footprint" },
        ],
      },
    },

    // 5. 前后对比（含免责声明，省电幅度因人而异）
    {
      type: "beforeAfter",
      data: {
        title: "Before & after going solar",
        subtitle: "Shared with permission from our customers.",
        disclaimer:
          "Savings vary by home, roof orientation, energy use, weather, and local tariffs. Estimates are not guarantees and are confirmed only after an on-site assessment.",
        items: [
          {
            crmName: "The Alvarez family",
            duration: "6 months after install",
            caseDescription:
              "Cut their monthly electricity bill dramatically with a rooftop system sized to their usage.",
            beforeImage: { src: img("photo-1558449028-b53a39d100fc", 800), alt: "Home before solar install" },
            afterImage: { src: img("photo-1611365892117-00ac5ef43c90", 800), alt: "Home after solar install" },
          },
          {
            crmName: "Priya & Sam",
            duration: "1 year after install",
            caseDescription:
              "Added panels and a battery to power most of their home through the evening.",
            beforeImage: { src: img("photo-1448630360428-65456885c650", 800), alt: "Roof before solar install" },
            afterImage: { src: img("photo-1592833159155-c62df1b65634", 800), alt: "Roof after solar install" },
          },
        ],
      },
    },

    // 6. 评价
    {
      type: "reviews",
      data: {
        title: "What homeowners say",
        description: "Real messages from people we've helped switch to solar.",
        items: [
          {
            name: "Marco",
            location: "Italy",
            channel: "WhatsApp",
            avatar: { src: img("photo-1507003211169-0a1dd7228f2d", 200), alt: "Marco" },
            content: {
              text: "The estimate was clear and honest. No pressure — they just laid out the numbers and let me decide.",
            },
          },
          {
            name: "Hannah",
            location: "Australia",
            channel: "Google",
            avatar: { src: img("photo-1494790108377-be9c29b29330", 200), alt: "Hannah" },
            content: {
              text: "Install was tidy and on time, and my bills dropped fast. The team answered every question on WhatsApp.",
            },
          },
          {
            name: "Tobias",
            location: "Germany",
            channel: "Trustpilot",
            avatar: { src: img("photo-1500648767791-00dcc994a43e", 200), alt: "Tobias" },
            content: {
              text: "Loved that they sized the system to my actual usage instead of overselling. Genuinely helpful advisors.",
            },
          },
        ],
      },
    },

    // 7. 品牌故事
    {
      type: "story",
      data: {
        title: "Our story",
        subtitle: "Why we started Solterra.",
        body: "We founded Solterra to make home solar simple and honest. Switching to solar can feel overwhelming — confusing quotes, pushy sales, and unclear savings. Our advisors take the time to understand your home and energy use, then explain everything in plain language, so you can make a confident decision on your own terms.",
        backgroundImage: {
          src: img("photo-1521618755572-156ae0cdd74d", 1400),
          alt: "Rooftop solar installation in progress",
        },
        signatureName: "Erik Lindholm",
        signatureRole: "Founder",
      },
    },

    // 8. 安全保障（非交易：资质 / 隐私 / 无推销 / 免费跟进）
    {
      type: "guarantee",
      data: {
        title: "Confidence at every step",
        description: "Standards you can rely on, before and after your install.",
        items: [
          { icon: "🧰", title: "Certified workmanship", subtitle: "Every install meets strict safety and quality standards." },
          { icon: "🔒", title: "Privacy first", subtitle: "Your home and bill details stay confidential and are never sold." },
          { icon: "🙅", title: "No pushy sales", subtitle: "Honest guidance — we only recommend what makes sense for your home." },
          { icon: "🤝", title: "Free follow-ups", subtitle: "Ongoing support over WhatsApp at no extra cost." },
        ],
      },
    },

    // 9. 常见问题
    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Frequently asked questions" },
        items: [
          {
            question: "Is the home assessment really free?",
            answer: "Yes. Your assessment, savings estimate, and follow-up questions are completely free.",
          },
          {
            question: "Am I committing to anything?",
            answer: "No. The assessment is informational — you decide if and when to move forward.",
          },
          {
            question: "How much could I actually save?",
            answer: "It depends on your roof, usage, and local tariffs. Your personalized estimate will show realistic figures.",
          },
          {
            question: "How fast will an advisor reply?",
            answer: "Our advisors usually reply within 20 minutes during business hours.",
          },
        ],
      },
    },
  ],

  footer: {
    brandName: "Solterra Home Solar",
    copyrightYear: "2026",
    contactEmail: "hello@solterra-home.com",
    privacyPolicy:
      "We collect only the home and energy information you share with us to prepare your assessment. Your data is kept confidential, never sold, and you can request its deletion at any time.",
    termsOfService:
      "Solterra provides solar information and savings estimates for guidance only. Estimates are not guarantees and are confirmed only after an on-site assessment by a qualified installer.",
  },

  floatingButton: {
    text: "💬 Free solar assessment",
    link: WHATSAPP,
  },
};
