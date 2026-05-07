
// types/schema.ts

// 已知图标 key 的 registry，供编辑器自动补全；同时保留任意 string 作为渲染层兜底（无运行时区别）
export type IconType =
  | 'WhatsApp' | 'Telegram' | 'Line' | 'Phone' | 'Mail' | 'ArrowRight'
  | 'Check' | 'Shield' | 'Star' | 'Verified' | 'Secure'
  | 'MessageCircle' | 'Truck'
  | (string & {});

export type CtaChannel = 'whatsapp' | 'telegram' | 'line' | 'phone' | 'email' | 'form' | 'external';
export type LinkTarget = '_self' | '_blank';

// 通用的行动呼吁按钮 (CTA) 模型 —— 核心转化组件
export interface CallToAction {
  text: string;           // 按钮文案 (e.g., "Chat on WhatsApp")
  url: string;            // 跳转链接 (e.g., "https://wa.me/...")
  icon?: IconType;        // 按钮图标
  theme?: 'primary' | 'secondary' | 'whatsapp' | 'telegram'; // 按钮颜色风格
  channel?: CtaChannel;   // 渠道类型
  target?: LinkTarget;    // 链接打开方式
  prefilledMessage?: string; // 私域沟通时预填消息，减少用户输入成本
}

// 图片模型 (支持传入图片 URL 和 Alt 文本以优化 SEO)
export interface ImageMeta {
  src: string;
  alt: string;
}

export interface HeroHighlight {
  id: string;
  text: string;
  icon?: IconType;
}

export interface HeroProofPoint {
  label: string;          // 如 "4.9/5 Rating", "10k+ Customers"
  value?: string;         // 可选数值，用于强调
}

export interface HeroMedia {
  type: 'image' | 'video';
  src: string;
  alt?: string;
  poster?: string;        // 视频封面
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;  // iOS 不写会强制全屏播放
}

// 倒计时（限时优惠真正起作用的形式）—— 既可独立成 Block，也可内嵌在 Hero
export interface CountdownSchema {
  title?: string;
  subtitle?: string;
  endsAt: string;               // ISO 日期字符串
  expiredFallback?: {           // 过期后的兜底文案，避免显示负数
    title?: string;
    subtitle?: string;
  };
  cta?: CallToAction;
  variant?: 'banner' | 'section';
}

// HeroSection (首屏主视觉)
export interface HeroSchema {
  badge?: string;               // 顶部小标签，如 "🔥 Limited Time Offer"
  title: string;                // 主标题，支持换行
  subtitle: string;             // 副标题
  background: {
    type: 'image' | 'color' | 'video';
    value: string;              // 图片/视频URL 或 颜色代码
    overlayOpacity?: number;    // 暗化遮罩透明度 (0-1)，用于凸显白色文字
  };
  cta: CallToAction;            // 主按钮
  secondaryCta?: CallToAction;  // 次按钮，如 "See Results" / "Learn More" / "Check Cases"
  trustText?: string;           // 按钮下方的小字背书，如 "No credit card required"
  highlights?: HeroHighlight[]; // 首屏利益点，快速降低跳出
  proofPoints?: HeroProofPoint[]; // 首屏证明信息，建立初始信任
  media?: HeroMedia;            // 首屏辅助视觉
  countdown?: CountdownSchema;  // 首屏内嵌倒计时（限时活动）
  // split-left / split-right 需配合 media 字段使用；overlay 使用 background 叠加遮罩
  variant?: 'overlay' | 'split-left' | 'split-right';
}


// 核心转化 Offer —— 展示服务/方案，引导点击咨询或留资
export interface OfferTier {
  id: string;
  name: string;                 // 方案名称，如 "入门咨询", "家庭套餐", "专属服务"
  labelText?: string;           // 展示标签，如 "Free Quote", "Book Consultation", "Limited Slots"
  description: string;          // 简短描述
  valueProps: string[];         // 核心价值点列表
  tag?: string;                 // 推荐标签，如 "Most Popular", "Best Value"
  image?: string;               // 方案配图
  urgencyText?: string;         // 如 "Only 12 slots left this week"
  isRecommended?: boolean;      // 推荐方案，便于视觉突出
  cta: CallToAction;            // 该方案对应的咨询/留资按钮
}

export interface OfferSchema {
  title: string;
  subtitle?: string;
  tiers: OfferTier[];           // 通常 1 到 3 个
  variant?: 'cards-row' | 'cards-column';
}

// 引导用户如何通过 WhatsApp/TG 联系，打消疑虑
export interface StepItem {
  id: string;
  icon: IconType;               // 如 "MessageCircle", "Check", "Truck"
  title: string;                // 如 "Step 1: Contact Us"
  description: string;          // 如 "Click the button to chat with our team on WhatsApp."
}

export interface HowItWorksSchema {
  title: string;
  subtitle?: string;
  steps: StepItem[];            // 通常 3 步最佳
}

// 合规模块，防封号必备，全局只能存在一个
export interface FooterLink {
  text: string;                 // 如 "Privacy Policy", "Terms of Service"
  url: string;                  // 跳转链接
}

export interface MicroFooterSchema {
  brandName: string;            // 品牌名称
  copyrightYear: string;        // 年份
  contactEmail?: string;        // 投诉/联系邮箱
  links: FooterLink[];          // 法律条款链接列表
  disclaimer?: string;          // 针对医疗/金融/黑五类的免责声明 (如 "Investment involves risk...")
}

// 提炼商品或服务的优势
export interface FeatureItem {
  id: string;
  icon: IconType;               // 卖点图标
  title: string;
  description: string;
}

export interface FeaturesSchema {
  title: string;
  subtitle?: string;
  items: FeatureItem[];
  layout?: 'grid' | 'list';     // 支持网格展示或列表展示
}

// Reviews section
export interface ReviewItem {
  id: string;
  authorName: string;
  authorRole?: string;          // 如 "Verified Buyer", "Member since 2023"
  avatar?: string;              // 头像URL
  rating: number;               // 1-5 星
  content: string;              // 评价文字
  proofImage?: string;          // 证据截图（如聊天记录截图）
  videoUrl?: string;            // 短视频证言（YouTube/Vimeo/直链均可）
  sourcePlatform?: string;      // 如 "Trustpilot", "WhatsApp", "Telegram"
  verified?: boolean;           // 是否为已验证评价
  reviewDate?: string;          // ISO 日期字符串
  country?: string;             // 评价用户国家/地区
}

export interface ReviewsSchema {
  title: string;
  subtitle?: string;
  averageRating?: number;       // 如 4.9
  totalReviews?: string;        // 如 "10k+ Reviews"
  ratingSummary?: {
    average: number;
    scale?: number;             // 默认可按 5 分制理解
    totalLabel?: string;        // 如 "Based on 2,384 reviews"
  };
  items: ReviewItem[];
  disclaimer?: string;             // 如 "Results may vary"，医疗/金融/减肥类目合规必备
  variant?: 'grid' | 'carousel';
}

// 一排横向排列的信任徽章
export interface TrustBadge {
  id: string;
  icon: IconType;
  text: string;                 // 如 "24/7 Human Support", "Free Consultation"
  subtext?: string;
}

export interface TrustBannerSchema {
  theme?: 'light' | 'dark' | 'brand';
  badges: TrustBadge[];
}

// 权威背书 / 品牌故事
export interface AuthorityCredential {
  id: string;
  label: string;                // 如 "ISO 9001", "10yr+ Experience", "Industry Award"
  image?: string;               // 证书/奖项 logo URL
}

export interface AuthoritySchema {
  title: string;
  subtitle?: string;
  paragraphs: string[];         // 多段落的故事描述
  image: ImageMeta;             // 创始人/医生照片 或 诊所环境图
  stats?: {                     // 履历数字展示
    label: string;              // 如 "Years Exp"
    value: string;              // 如 "15+"
  }[];
  credentials?: AuthorityCredential[]; // 资质/获奖/认证清单（医美/医疗/金融场景）
  signature?: {
    name: string;
    role: string;
  };
  variant?: 'image-left' | 'image-right';
}

// 常见问题解答
export interface FAQItem {
  id: string;
  question: string;
  answer: string;               // 建议换行
}

export interface FAQSchema {
  title: string;
  subtitle?: string;
  items: FAQItem[];
  contactCta?: CallToAction;    // 底部追加一个 "还有问题？联系客服" 的按钮
}

// Lead 表单（高客单服务类替代 WhatsApp 直跳）
export type LeadFormFieldType = 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox';

export interface LeadFormField {
  id: string;
  name: string;                 // 提交时的字段 key
  label: string;
  type: LeadFormFieldType;
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[]; // 用于 select
}

export interface LeadFormSchema {
  title: string;
  subtitle?: string;
  fields: LeadFormField[];
  submitText: string;
  successMessage?: string;
  webhookUrl?: string;          // 外部线索接收 URL（高级配置），未填则提交到平台默认 API
  consentText?: string;         // GDPR 同意文本
  eventName?: string;           // 提交埋点事件名
}

// 服务承诺 / 信任保障（免费咨询、响应时效、隐私保护等，不绑定退款/交易语义）
export interface AssuranceBadge {
  id: string;
  icon: IconType;
  text: string;
  subtext?: string;
}

export interface AssuranceSchema {
  title: string;
  subtitle?: string;
  description?: string;         // 承诺正文
  badges?: AssuranceBadge[];
  image?: string;               // 徽章/印章图
  cta?: CallToAction;
}

export interface SeoMeta {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  robots?: string;
  jsonLd?: {
    // 默认只自动派生 Organization / FAQPage；Product/Offer/Review 需显式开启
    autoDerive?: boolean;       // 开启 Organization + FAQPage 自动派生（默认 true）
    deriveReviews?: boolean;    // 额外派生 Review / AggregateRating（显式开启）
    custom?: object[];          // 手写补充的 JSON-LD 节点
  };
}

export type PixelEventTrigger =
  | 'page_view'
  | 'cta_click'
  | 'block_in_view'
  | 'form_submit'
  | 'time_on_page';

export interface PixelEvent {
  trigger: PixelEventTrigger;
  name: string;                                  // 事件名，如 "Lead", "Contact", "FormSubmit", "WhatsAppClick"
  blockType?: BlockType;                         // block_in_view / cta_click 时定位的目标 block
  delaySeconds?: number;                         // time_on_page 用
  params?: Record<string, string | number>;
}

export interface AnalyticsPixel {
  provider: 'meta' | 'google' | 'tiktok' | 'linkedin' | 'x' | 'custom';
  id: string;
  events?: PixelEvent[];
}

export interface AnalyticsConfig {
  pixels?: AnalyticsPixel[];
}

export interface PageMeta {
  locale?: string;              // 如 "en-US"
  market?: string;              // 如 "US", "SEA", "MENA"
  seo?: SeoMeta;
  analytics?: AnalyticsConfig;
}

// PageBlock 包装器
// 定义模块的标识符
export type BlockType =
  | 'Hero'
  | 'Offer'
  | 'HowItWorks'
  | 'MicroFooter'
  | 'Features'
  | 'Reviews'
  | 'TrustBanner'
  | 'AuthorityStory'
  | 'FAQ'
  | 'Countdown'
  | 'LeadForm'
  | 'Assurance';

type BlockBase<TType extends BlockType, TData> = {
  id: string;
  type: TType;
  data: TData;
};

// 万能的页面区块包装器：用 discriminated union 约束 type 和 data 一一对应
export type PageBlock =
  | BlockBase<'Hero', HeroSchema>
  | BlockBase<'Offer', OfferSchema>
  | BlockBase<'HowItWorks', HowItWorksSchema>
  | BlockBase<'MicroFooter', MicroFooterSchema>
  | BlockBase<'Features', FeaturesSchema>
  | BlockBase<'Reviews', ReviewsSchema>
  | BlockBase<'TrustBanner', TrustBannerSchema>
  | BlockBase<'AuthorityStory', AuthoritySchema>
  | BlockBase<'FAQ', FAQSchema>
  | BlockBase<'Countdown', CountdownSchema>
  | BlockBase<'LeadForm', LeadFormSchema>
  | BlockBase<'Assurance', AssuranceSchema>;

// 1. 抽离可选模块的联合类型
export type OptionalBlockType =
  | 'Features'
  | 'Reviews'
  | 'TrustBanner'
  | 'AuthorityStory'
  | 'FAQ'
  | 'Countdown'
  | 'LeadForm'
  | 'Assurance';

// 用 Extract 派生，避免与 PageBlock 手抄造成漂移
export type OptionalBlock = Extract<PageBlock, { type: OptionalBlockType }>;

// 2. 强约束的落地页包装器模型 (核心！)
export interface LandingPageTemplate {
  templateId: string;
  templateName: string;
  themeConfig: {
    mode: 'light' | 'dark';
    primaryColor: string;    // 主色调
  };
  pageMeta?: PageMeta;

  // ==========================================
  // 🔴 强制模块：作为根属性存在，不可删除，位置固定
  // ==========================================
  hero: HeroSchema;               // 必须有首屏 (漏斗顶部)
  offer: OfferSchema;             // 必须有核心转化 offer (漏斗核心)
  howItWorks: HowItWorksSchema;   // 必须有联系流程说明 (打消疑虑)
  footer: MicroFooterSchema;      // 必须有合规页脚 (防封号底线)

  // ==========================================
  // 🟢 可选动态区：允许用户在规定区域内增删改排
  // ==========================================

  // 位于 Hero 和 Offer 之间的区域（适合放：信任条、卖点、权威背书、媒体 logo 墙）
  upperBlocks: OptionalBlock[];

  // 位于 Offer 和 HowItWorks 之间的区域（适合放：用户评价、服务承诺）
  afterOffer?: OptionalBlock[];

  // 位于 HowItWorks 和 Footer 之间的区域（适合放：FAQ、Lead 表单、底部 CTA 倒计时）
  lowerBlocks: OptionalBlock[];

  // 全站悬浮 CTA（移动端转化主力，常用于 WhatsApp/Telegram 直跳）
  stickyCta?: CallToAction;

}
