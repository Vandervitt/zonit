// landing-editor/store/defaults.ts
// 各节点 / 列表项的默认值工厂，供 store 的 addSection 与表单 RepeatableList 复用。

import type {
  FloatingButton,
  LeadForm,
  LandingSection,
  LandingSectionType,
  CtaButton,
  StatItem,
  PlanItem,
  ProductItem,
  BeforeAfterItem,
  LogoItem,
  CaseStudyItem,
  ProcessStep,
  TrustBadgeItem,
  FeatureItem,
  ReviewItem,
  FaqItem,
  GuaranteeItem,
  PageTracking,
  Branding,
  PageSeo,
} from "@/types/schema.draft";

export const createFloatingButton = (): FloatingButton => ({
  // 与 createLeadForm 同一口径：这些默认值写进客户的落地页、给**海外访客**看，
  // 与后台界面语言无关——产品是出海获客，页面的读者始终在海外。
  text: "Chat with us",
  // 钉死主渠道的同一渠道会更啰嗦，这里直接跟随主渠道；
  // 用户想让悬浮按钮独立于主渠道，在联系方式面板里改（阶段 2）。
  target: { kind: "primary" },
});

export const createLeadForm = (): LeadForm => ({
  enabled: true,
  // 落地页面向海外访客，默认文案用英文；需要其它语言时在编辑器里改。
  title: "Leave your details and we'll get back to you",
  description: "",
  submitText: "Send",
  successMessage: "Thanks — we'll be in touch shortly.",
  fields: {
    name:     { enabled: true,  required: false },
    email:    { enabled: true,  required: false },
    phone:    { enabled: false, required: false },
    whatsapp: { enabled: true,  required: false },
    telegram: { enabled: false, required: false },
    message:  { enabled: true,  required: false },
  },
});

export const createTracking = (): PageTracking => ({
  pixels: [],
  utmPassthrough: true,
  consent: { enabled: true },
});

export const createBranding = (): Branding => ({ theme: "teal" });

export const createSeo = (): PageSeo => ({});

/**
 * 新建区块的默认内容。
 *
 * 标题一律英文，理由同 createLeadForm：这是**写进客户落地页**的内容，读者是海外访客，
 * 不随后台界面语言变化。此前是中文，等于中文后台用户一加区块就在给海外访客的页面上
 * 放了个中文标题。
 */
/**
 * 区块级 CTA 的默认值。
 *
 * 落点默认 `primary`（跟随页面主渠道），这样它会自动跟着「联系方式」面板走，
 * 也会被 switchPrimaryChannel 的文案跟随覆盖到——钉死渠道要用户显式去改。
 * 文案留空：空文案的 CTA 线上不渲染，比替用户编一句更安全。
 */
export function createSectionCta(): CtaButton {
  return { text: "", target: { kind: "primary" } };
}

export function createSection(type: LandingSectionType): LandingSection {
  switch (type) {
    case "stats":
      return { type, data: { title: "By the numbers", items: [] } };
    case "plans":
      return { type, data: { title: "Plans", items: [] } };
    case "products":
      return { type, data: { title: "Products", items: [] } };
    case "beforeAfter":
      return { type, data: { title: "Before & after", items: [] } };
    case "process":
      return { type, data: { title: "How it works", steps: [] } };
    case "trust":
      return { type, data: { badges: [] } };
    case "features":
      return { type, data: { title: "What you get", items: [] } };
    case "reviews":
      return { type, data: { title: "What customers say", items: [] } };
    case "story":
      return { type, data: { title: "Our story", body: "" } };
    case "countdown":
      return { type, data: { title: { text: "Limited time" }, endsAt: "" } };
    case "faq":
      return { type, data: { title: { text: "FAQ" }, items: [] } };
    case "guarantee":
      return { type, data: { title: "Our guarantee", items: [] } };
    case "logoWall":
      return { type, data: { title: "Trusted by", items: [] } };
    case "caseStudy":
      return { type, data: { title: "Client results", items: [] } };
  }
}

// ---- 列表项工厂 ----
export const createStatItem = (): StatItem => ({ value: "", label: "" });
export const createPlanItem = (): PlanItem => ({
  name: "",
  description: "",
  valueProps: [],
  cta: { text: "", target: { kind: "primary" } },
});
export const createProductItem = (): ProductItem => ({ name: "", description: "" });
export const createBeforeAfterItem = (): BeforeAfterItem => ({
  crmName: "",
  duration: "",
  caseDescription: "",
  beforeImage: { src: "" },
  afterImage: { src: "" },
});
export const createProcessStep = (): ProcessStep => ({ title: "", description: "" });
export const createTrustBadge = (): TrustBadgeItem => ({ title: "" });
export const createFeatureItem = (): FeatureItem => ({ title: "", description: "" });
export const createReviewItem = (): ReviewItem => ({ name: "", content: { text: "" } });
export const createLogoItem = (): LogoItem => ({ image: { src: "" }, name: "" });
// 指标默认不给：留空即不渲染，避免平台替用户「先摆个数字上去」。
export const createCaseStudyItem = (): CaseStudyItem => ({ client: "", summary: "" });
export const createFaqItem = (): FaqItem => ({ question: "", answer: "" });
export const createGuaranteeItem = (): GuaranteeItem => ({ title: "" });
