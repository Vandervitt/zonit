// landing-editor/store/defaults.ts
// 各节点 / 列表项的默认值工厂，供 store 的 addSection 与表单 RepeatableList 复用。

import type {
  HeroSection,
  FooterSection,
  FloatingButton,
  LeadForm,
  LandingSection,
  LandingSectionType,
  StatItem,
  PlanItem,
  ProductItem,
  BeforeAfterItem,
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

export const createHero = (): HeroSection => ({
  title: "用一句话说清你的核心价值",
  subtitle: "用副标题补充关键利益点，引导访客咨询。",
  cta: { text: "立即咨询", link: "" },
});

export const createFooter = (): FooterSection => ({
  brandName: "品牌名称",
  copyrightYear: String(new Date().getFullYear()),
  contactEmail: "",
  privacyPolicy: "隐私政策",
  termsOfService: "服务条款",
});

export const createFloatingButton = (): FloatingButton => ({
  text: "立即咨询",
  link: "",
});

export const createLeadForm = (): LeadForm => ({
  enabled: true,
  title: "留下联系方式，我们尽快回复",
  description: "",
  submitText: "提交",
  successMessage: "已收到，我们会尽快联系你！",
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

export function createSection(type: LandingSectionType): LandingSection {
  switch (type) {
    case "stats":
      return { type, data: { title: "数据展示", items: [] } };
    case "plans":
      return { type, data: { title: "套餐", items: [] } };
    case "products":
      return { type, data: { title: "产品", items: [] } };
    case "beforeAfter":
      return { type, data: { title: "前后对比", items: [] } };
    case "process":
      return { type, data: { title: "服务流程", steps: [] } };
    case "trust":
      return { type, data: { badges: [] } };
    case "features":
      return { type, data: { title: "特性", items: [] } };
    case "reviews":
      return { type, data: { title: "用户评价", items: [] } };
    case "story":
      return { type, data: { title: "品牌故事", body: "" } };
    case "countdown":
      return { type, data: { title: { text: "限时倒计时" }, endsAt: "" } };
    case "faq":
      return { type, data: { title: { text: "常见问题" }, items: [] } };
    case "guarantee":
      return { type, data: { title: "安全保障", items: [] } };
  }
}

// ---- 列表项工厂 ----
export const createStatItem = (): StatItem => ({ value: "", label: "" });
export const createPlanItem = (): PlanItem => ({
  name: "",
  description: "",
  valueProps: [],
  cta: { text: "", link: "" },
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
export const createFaqItem = (): FaqItem => ({ question: "", answer: "" });
export const createGuaranteeItem = (): GuaranteeItem => ({ title: "" });
