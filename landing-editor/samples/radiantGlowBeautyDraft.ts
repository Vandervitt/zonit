// landing-editor/samples/radiantGlowBeautyDraft.ts
//
// RadiantGlow Beauty「美妆 / 护肤咨询」落地页样例（海外 leadgen，非交易）。
// 文案与图片严格提取自 templates/template 的代码：
//   - 顶层数据：templates/template/data/beauty-landing-page.ts
//   - 组件内硬编码：StatsSection.tsx / ProductShowcase.tsx / BeforeAfter.tsx
// 仅保留 types/schema.draft.ts(LandingPageDraft) 定义的字段，源中多余结构
//（analytics / tracking / primaryConversion / LogoWall / VideoTestimonials 等）按需丢弃；
// 12 种区块全部填充。转化全程经 WhatsApp，无任何下单 / 结账 / 订阅语义。
import type { LandingPageDraft } from "@/types/schema.draft";

/** WhatsApp 咨询链接（占位号码 15551234567 + 预填咨询语，提取自源 CTA 的 prefilledMessage）。 */
const wa = (message: string) =>
  `https://wa.me/15551234567?text=${encodeURIComponent(message)}`;

export const radiantGlowBeautyDraft: LandingPageDraft = {
  hero: {
    backgroundImage: {
      src: "https://images.unsplash.com/photo-1519084278803-b94f11e1c63b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920",
      alt: "Premium beauty and skincare flatlay",
    },
    badge: { emoji: "✨", text: "Free Consultation Available" },
    title: "Transform Your Skin with\nPersonalized Beauty Solutions",
    subtitle:
      "Get expert skincare guidance tailored to your unique needs. Our certified beauty consultants help you achieve radiant, glowing skin.",
    cta: {
      text: "Start Free Consultation",
      link: wa("Hi! I'd like to book a free beauty consultation."),
    },
    secondaryCta: { text: "See Success Stories", link: "#reviews" },
    endorsementText: "✓ Reply within 10 minutes · Free skin analysis",
    showcase: {
      type: "image",
      src: "https://images.unsplash.com/photo-1747324831504-5ee9aa8eec59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      alt: "Woman holding premium skincare product",
    },
  },

  sections: [
    // 1. 数据展示（StatsSection.tsx 硬编码）
    {
      type: "stats",
      data: {
        title: "Trusted by Thousands Worldwide",
        subtitle: "Join our growing community of satisfied clients achieving their skincare goals",
        items: [
          {
            icon: "👥",
            value: "15,000+",
            label: "Happy Clients",
            backgroundImage: {
              src: "https://images.unsplash.com/photo-1733685373532-e67c3f68786a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
              alt: "Happy Clients",
            },
          },
          {
            icon: "⭐",
            value: "98%",
            label: "Success Rate",
            backgroundImage: {
              src: "https://images.unsplash.com/photo-1710196598595-7dcfd465bd77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
              alt: "Success Rate",
            },
          },
          {
            icon: "💎",
            value: "50+",
            label: "Expert Consultants",
            backgroundImage: {
              src: "https://images.unsplash.com/photo-1760488029475-41ff1eaa904b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
              alt: "Expert Consultants",
            },
          },
          {
            icon: "⚡",
            value: "10 min",
            label: "Average Response Time",
            backgroundImage: {
              src: "https://images.unsplash.com/photo-1747324831504-5ee9aa8eec59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
              alt: "Average Response Time",
            },
          },
        ],
      },
    },

    // 2. 套餐（offer，core-value 组）
    {
      type: "plans",
      data: {
        title: "Choose Your Beauty Journey",
        subtitle: "Select the consultation service that fits your needs",
        items: [
          {
            name: "Free Consultation",
            description: "Perfect for first-time clients",
            badge: "Most Popular",
            label: "Only 8 slots left this week",
            valueProps: [
              "One-on-one expert consultation",
              "Personalized skincare routine",
              "Product recommendations",
              "No obligation required",
            ],
            countdown: { endsAt: "2026-05-15T23:59:59-07:00" },
            cta: {
              text: "Book Free Consultation",
              link: wa("I want to book a free consultation"),
            },
          },
          {
            name: "Premium Assessment",
            description: "Advanced skin analysis & treatment plan",
            badge: "Recommended",
            valueProps: [
              "Comprehensive skin analysis",
              "Custom treatment roadmap",
              "3-month follow-up support",
              "Priority scheduling",
            ],
            cta: {
              text: "Get Premium Assessment",
              link: wa("I'm interested in the Premium Assessment"),
            },
          },
          {
            name: "Quick Chat",
            description: "Have questions? Chat with us now",
            valueProps: [
              "Instant response via WhatsApp",
              "Quick product advice",
              "General beauty tips",
              "Available 24/7",
            ],
            cta: {
              text: "Chat Now",
              link: wa("Hi! I have a quick question about skincare"),
            },
          },
        ],
      },
    },

    // 3. 产品（ProductShowcase.tsx 硬编码）
    {
      type: "products",
      data: {
        title: "Premium Products We Recommend",
        subtitle: "Our experts carefully select only the highest quality, dermatologist-approved products",
        items: [
          {
            name: "Premium Serums",
            description: "Scientifically formulated for maximum results",
            backgroundImage: {
              src: "https://images.unsplash.com/photo-1654973433534-1238e06f6b38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
              alt: "Premium Serums",
            },
          },
          {
            name: "Luxury Skincare",
            description: "Dermatologist-approved formulations",
            backgroundImage: {
              src: "https://images.unsplash.com/photo-1527632911563-ee5b6d53465b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
              alt: "Luxury Skincare",
            },
          },
          {
            name: "Daily Essentials",
            description: "Everything your skin needs",
            backgroundImage: {
              src: "https://images.unsplash.com/photo-1629380106682-6736d2c327ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
              alt: "Daily Essentials",
            },
          },
          {
            name: "Treatment Solutions",
            description: "Targeted care for specific concerns",
            backgroundImage: {
              src: "https://images.unsplash.com/photo-1619451379285-b8f2894897b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
              alt: "Treatment Solutions",
            },
          },
        ],
      },
    },

    // 4. 前后对比（BeforeAfter.tsx 硬编码）
    {
      type: "beforeAfter",
      data: {
        title: "Real Results from Real People",
        subtitle: "See the transformations our clients have achieved with personalized skincare guidance",
        disclaimer:
          "Individual results may vary. Photos are from real clients who followed our personalized skincare routines.",
        items: [
          {
            crmName: "Sarah M.",
            duration: "6 weeks",
            caseDescription: "Acne & Dark Spots",
            beforeImage: {
              src: "https://images.unsplash.com/photo-1684014286330-ddbeb4a40c92?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
              alt: "Sarah M. before",
            },
            afterImage: {
              src: "https://images.unsplash.com/photo-1710196598595-7dcfd465bd77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
              alt: "Sarah M. after",
            },
          },
          {
            crmName: "Jessica L.",
            duration: "8 weeks",
            caseDescription: "Dull Skin & Fine Lines",
            beforeImage: {
              src: "https://images.unsplash.com/photo-1733685373007-58f63acf3a60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
              alt: "Jessica L. before",
            },
            afterImage: {
              src: "https://images.unsplash.com/photo-1760488029475-41ff1eaa904b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
              alt: "Jessica L. after",
            },
          },
          {
            crmName: "Emily R.",
            duration: "4 weeks",
            caseDescription: "Uneven Skin Tone",
            beforeImage: {
              src: "https://images.unsplash.com/photo-1733685372988-69a356984436?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
              alt: "Emily R. before",
            },
            afterImage: {
              src: "https://images.unsplash.com/photo-1747324831504-5ee9aa8eec59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
              alt: "Emily R. after",
            },
          },
        ],
      },
    },

    // 5. 服务流程（howItWorks）
    {
      type: "process",
      data: {
        title: "How It Works",
        subtitle: "Get started in 3 simple steps",
        steps: [
          {
            title: "Step 1: Contact Us",
            description:
              "Click the WhatsApp button to start a conversation with our beauty experts. We respond within 10 minutes.",
          },
          {
            title: "Step 2: Share Your Goals",
            description:
              "Tell us about your skin concerns and beauty goals. Our consultants will ask a few questions to understand your needs.",
          },
          {
            title: "Step 3: Get Your Plan",
            description:
              "Receive a personalized skincare routine and product recommendations tailored just for you.",
          },
        ],
      },
    },

    // 6. 信任（TrustBanner block）
    {
      type: "trust",
      data: {
        badges: [
          { icon: "✅", title: "Certified Experts", subtitle: "Licensed professionals" },
          { icon: "🛡️", title: "Safe & Natural", subtitle: "100% organic products" },
          { icon: "⭐", title: "15K+ Happy Clients", subtitle: "4.9/5 rating" },
          { icon: "💬", title: "Fast Response", subtitle: "Reply within 10 min" },
        ],
      },
    },

    // 7. 特性（Features block，core-value 组）
    {
      type: "features",
      data: {
        title: "Why Choose RadiantGlow Beauty",
        subtitle: "Expert care for your unique beauty needs",
        items: [
          {
            icon: "🏆",
            title: "Expert Consultants",
            description:
              "Our team consists of certified beauty therapists and skincare specialists with 10+ years of experience.",
          },
          {
            icon: "🛡️",
            title: "Personalized Solutions",
            description:
              "Every skin is unique. We create customized routines based on your skin type, concerns, and lifestyle.",
          },
          {
            icon: "⭐",
            title: "Premium Products",
            description:
              "We only recommend dermatologist-approved, cruelty-free products that deliver real results.",
          },
          {
            icon: "💬",
            title: "24/7 Support",
            description:
              "Questions about your routine? Our team is always available via WhatsApp to guide you.",
          },
          {
            icon: "✅",
            title: "Proven Results",
            description:
              "Join 15,000+ satisfied clients who have transformed their skin with our expert guidance.",
          },
          {
            icon: "✔️",
            title: "No Commitments",
            description:
              "Start with a free consultation. No hidden fees, no pressure, just honest beauty advice.",
          },
        ],
      },
    },

    // 8. 评价（Reviews block）
    {
      type: "reviews",
      data: {
        title: "What Our Clients Say",
        subtitle: "Real results from real people",
        description: "Rated 4.9/5 — based on 2,847 reviews",
        items: [
          {
            name: "Sarah M.",
            location: "United States",
            channel: "WhatsApp",
            avatar: { src: "https://i.pravatar.cc/150?img=1", alt: "Sarah M." },
            content: {
              text: "The consultation was amazing! They helped me understand my skin type and created a perfect routine. My acne cleared up in just 6 weeks!",
              image: {
                src: "https://images.unsplash.com/photo-1684014286330-ddbeb4a40c92?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
                alt: "Sarah M. result",
              },
            },
          },
          {
            name: "Jessica L.",
            location: "Canada",
            channel: "Trustpilot",
            avatar: { src: "https://i.pravatar.cc/150?img=5", alt: "Jessica L." },
            content: {
              text: "I was skeptical at first, but the free consultation convinced me. The expert really knew what she was talking about. My skin has never looked better!",
              image: {
                src: "https://images.unsplash.com/photo-1733685373007-58f63acf3a60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
                alt: "Jessica L. result",
              },
            },
          },
          {
            name: "Emily R.",
            location: "United Kingdom",
            channel: "WhatsApp",
            avatar: { src: "https://i.pravatar.cc/150?img=9", alt: "Emily R." },
            content: {
              text: "Best decision ever! The personalized skincare routine they created for me actually works. I tried so many products before, nothing compared to this.",
              image: {
                src: "https://images.unsplash.com/photo-1710196598595-7dcfd465bd77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
                alt: "Emily R. result",
              },
            },
          },
          {
            name: "Amanda K.",
            location: "Australia",
            channel: "WhatsApp",
            avatar: { src: "https://i.pravatar.cc/150?img=10", alt: "Amanda K." },
            content: {
              text: "The team is so professional and responsive! They answered all my questions and helped me build confidence in my skincare journey.",
              image: {
                src: "https://images.unsplash.com/photo-1760488029475-41ff1eaa904b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
                alt: "Amanda K. result",
              },
            },
          },
        ],
      },
    },

    // 9. 产品故事（AuthorityStory block）
    {
      type: "story",
      data: {
        title: "Meet Our Founder",
        subtitle: "Dr. Rachel Chen, Licensed Esthetician & Skincare Expert",
        body:
          "With over 15 years of experience in the beauty industry, Dr. Rachel Chen founded RadiantGlow Beauty with a simple mission: make expert skincare advice accessible to everyone.\n\nAfter seeing countless clients struggle with confusing product claims and cookie-cutter routines, she created a personalized consultation service that puts your unique needs first.\n\nToday, our team of certified consultants has helped over 15,000 clients achieve their dream skin through science-backed, personalized guidance.",
        backgroundImage: {
          src: "https://images.unsplash.com/photo-1733685372988-69a356984436?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
          alt: "Dr. Rachel Chen, Founder and Lead Beauty Consultant",
        },
        signatureName: "Dr. Rachel Chen",
        signatureRole: "Founder & Lead Consultant",
      },
    },

    // 10. 倒计时（Countdown block）
    {
      type: "countdown",
      data: {
        title: { icon: "⏰", text: "Limited Time: Free Consultation Slots" },
        subtitle: "Only 8 consultation slots available this week. Book yours before they're gone!",
        endsAt: "2026-05-15T23:59:59-07:00",
      },
    },

    // 11. 常见问题（FAQ block）
    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Frequently Asked Questions" },
        subtitle: "Everything you need to know",
        items: [
          {
            question: "Is the consultation really free?",
            answer:
              "Yes! Your first consultation is completely free with no obligations. We want to help you understand your skin and provide value before you make any decisions.",
          },
          {
            question: "How does the consultation work?",
            answer:
              "Simply click the WhatsApp button, and one of our certified consultants will chat with you. We'll ask about your skin concerns, goals, and current routine, then provide personalized recommendations.",
          },
          {
            question: "Do I need to buy products from you?",
            answer:
              "Not at all! We provide honest recommendations based on your needs. Some clients prefer to purchase through us, while others buy elsewhere. Our goal is to guide you, not pressure you.",
          },
          {
            question: "How long does a consultation take?",
            answer:
              "Most consultations take 15-30 minutes via WhatsApp chat. You can take your time and ask as many questions as you need.",
          },
          {
            question: "What if I'm not satisfied?",
            answer:
              "Your satisfaction is our priority. If you're not happy with the recommendations, we'll work with you to adjust the plan. Our free consultation means zero risk for you.",
          },
          {
            question: "Can I contact you after the consultation?",
            answer:
              "Absolutely! We provide ongoing support via WhatsApp. Have questions about your routine? Just message us anytime.",
          },
        ],
      },
    },

    // 12. 安全保障（Assurance block）
    {
      type: "guarantee",
      data: {
        title: "Our Promise to You",
        subtitle: "Your trust means everything to us",
        description:
          "We're committed to providing honest, expert guidance that puts your skin health first. No gimmicks, no false promises—just real results from certified professionals.",
        items: [
          { icon: "🛡️", title: "Privacy Protected", subtitle: "Your information is safe" },
          { icon: "✅", title: "Certified Experts", subtitle: "Licensed professionals only" },
          { icon: "💬", title: "Fast Response", subtitle: "Reply within 10 minutes" },
          { icon: "✔️", title: "No Obligation", subtitle: "Free consultation, no strings" },
        ],
      },
    },
  ],

  footer: {
    brandName: "RadiantGlow Beauty",
    copyrightYear: "2026",
    contactEmail: "support@radiantglowbeauty.com",
    privacyPolicy:
      "We respect your privacy and are committed to protecting your personal information. Any information shared during consultations is kept strictly confidential.",
    termsOfService:
      "By using our consultation services, you agree to our terms. Consultations are for informational purposes only and do not replace professional medical advice.",
  },

  floatingButton: {
    text: "Chat on WhatsApp",
    link: wa("Hi! I'm interested in a beauty consultation."),
  },
};
