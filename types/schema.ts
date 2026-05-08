
// types/schema.ts

// 已知图标 key 的 registry，供编辑器自动补全；同时保留任意 string 作为渲染层兜底（无运行时区别）
export type IconType =
  | 'WhatsApp' | 'Telegram' | 'Line' | 'Phone' | 'Mail' | 'ArrowRight'
  | 'Check' | 'Shield' | 'Star' | 'Verified' | 'Secure'
  | 'MessageCircle' | 'Calendar' | 'Clock' | 'Award'
  | (string & {});

export type CtaChannel = 'whatsapp' | 'telegram' | 'line' | 'phone' | 'email' | 'form' | 'booking' | 'contact_link';
export type LinkTarget = '_self' | '_blank';

export type LeadEventName =
  | 'Lead'
  | 'Contact'
  | 'FormSubmit'
  | 'WhatsAppClick'
  | 'TelegramClick'
  | 'LineClick'
  | 'PhoneClick'
  | 'EmailClick'
  | 'ScheduleClick'
  | 'QuoteRequest';

export interface CtaTrackingConfig {
  eventName?: LeadEventName; // 用于投放归因：记录哪个入口产生了咨询/留资动作
  label?: string;            // 如 "hero_primary" / "sticky_whatsapp" / "faq_contact"
}

// 通用的行动呼吁按钮 (CTA) 模型 —— 核心转化组件
export interface CallToAction {
  text: string;           // 按钮文案 (e.g., "Chat on WhatsApp")
  url?: string;           // 咨询/预约/联系方式链接；禁止指向 payment / checkout / cart / order 等交易路径；form 类 CTA 可不填
  icon?: IconType;        // 按钮图标
  channel: CtaChannel;    // 引流渠道类型；所有 CTA 必须能归因到咨询/预约/留资入口
  target?: LinkTarget;    // 链接打开方式
  prefilledMessage?: string; // 私域沟通时预填消息，减少用户输入成本
  tracking?: CtaTrackingConfig;
}

export type ConversionDestination =
  | { type: 'url'; url: string }
  | { type: 'phone'; phone: string }
  | { type: 'email'; email: string }
  | { type: 'form'; formId: string };

// 页面级主转化目标：让全页 CTA 默认围绕同一个咨询/留资动作，避免多入口归因混乱
export interface PrimaryConversion {
  channel: CtaChannel;
  label: string;               // 如 "Book a Free Consultation" / "Chat on WhatsApp"
  destination: ConversionDestination; // 主转化必须能落到真实入口：私域/电话/邮箱/预约链接/表单
  prefilledMessage?: string;   // 私域沟通预填消息
}

// 移动端悬浮 CTA：海外引流页常用 WhatsApp / Telegram / 电话入口
export interface StickyCtaConfig extends CallToAction {
  position?: 'bottom-left' | 'bottom-right';
  showAfterScrollPercent?: number; // 滚动到页面百分比后出现，0 表示首屏即展示
}

// 图片模型 (支持传入图片 URL 和 Alt 文本以优化 SEO)
export interface ImageMeta {
  src: string;
  alt: string;
}

export interface HeroStat {
  id: string;
  label: string;          // 指标名称，如 "Clients", "Client rating", "Free consultation"
  value?: string;         // 指标数值，如 "10k+", "4.9/5"；无明确数值时可只用 label
  icon?: IconType;
}

export interface HeroMedia {
  type: 'image' | 'video';
  src: string;
  alt?: string;
  poster?: string;        // 视频封面
}

// 倒计时（真实活动截止、预约档期或咨询名额）—— 作为独立可选 Block 使用
export interface CountdownSchema {
  title?: string;
  subtitle?: string;
  endsAt: string;               // 必须带时区的 ISO 日期字符串，如 "2026-12-31T23:59:59+08:00"
  expiredFallback?: {           // 过期后的兜底文案，避免显示负数
    title?: string;
    subtitle?: string;
  };
  cta?: CallToAction;
}

// HeroSection (首屏主视觉)
export interface HeroSchema {
  badge?: string;               // 顶部小标签，如 "Free Consultation" / "Limited Booking Slots"
  title: string;                // 主标题，支持换行
  subtitle: string;             // 副标题
  background: {
    type: 'image' | 'color' | 'video';
    value: string;              // 图片/视频URL 或 颜色代码
  };
  cta: CallToAction;            // 主按钮
  secondaryCta?: CallToAction;  // 次按钮，如 "See Results" / "Learn More" / "Check Cases"
  trustText?: string;           // 按钮下方的小字背书，如 "Free consultation" / "Reply within 10 minutes"
  stats?: HeroStat[];           // 首屏利益点/证明信息，快速降低跳出并建立初始信任
  media?: HeroMedia;            // 首屏辅助视觉
}


// 核心咨询入口 —— 展示服务咨询路径，引导点击咨询、预约或留资；不承载定价/购买/结账语义
export interface OfferOption {
  id: string;
  name: string;                 // 咨询入口名称，如 "Free Consultation", "Priority Callback", "Expert Assessment"
  description: string;          // 简短描述
  valueProps: string[];         // 核心价值点列表
  badge?: string;               // 展示标签，如 "Free Quote" / "Recommended" / "Fastest Response"
  image?: string;               // 咨询入口配图；showImages 为 true 时 options 建议全部提供
  urgencyText?: string;         // 真实稀缺提示，如 "Only 12 consultation slots left this week"
  cta: CallToAction;            // 该咨询入口对应的咨询/留资按钮
}

export interface OfferSchema {
  title: string;
  subtitle?: string;
  options: OfferOption[];       // 通常 1 到 3 个咨询/服务入口，避免做成价格表
  showImages?: boolean;         // 统一控制卡片是否展示图片，避免部分卡片有图导致视觉不齐
}

// 引导用户如何通过 WhatsApp/TG 联系，打消疑虑
export interface StepItem {
  id: string;
  icon: IconType;               // 如 "MessageCircle", "Check", "Calendar"
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
  url?: string;                 // 真正需要外跳时使用
  content?: string;             // 单页落地页内联展示的政策正文
}

export interface SocialLink {
  platform: 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'youtube' | 'x' | 'whatsapp' | 'telegram' | (string & {});
  url: string;
}

export interface MicroFooterSchema {
  brandName: string;            // 品牌名称
  copyrightYear: string;        // 年份
  contactEmail?: string;        // 投诉/联系邮箱
  socialLinks?: SocialLink[];   // 社媒入口，帮助海外访客验证品牌真实性
  links: FooterLink[];          // 法律条款链接列表
  disclaimer?: string;          // 针对医疗/金融/黑五类的免责声明 (如 "Investment involves risk...")
}

// 提炼服务、方案或咨询价值的优势
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
}

// Reviews section
export interface ReviewItem {
  id: string;
  authorName: string;
  authorRole?: string;          // 如 "Verified Client", "Member since 2023"
  avatar?: string;              // 头像URL
  rating: number;               // 1-5 星
  content: string;              // 评价文字
  proofImage?: string;          // 证据截图（如聊天记录截图）
  proofVideo?: string;          // 视频见证链接（如 TikTok/Meta 投放页常用的客户反馈视频）
  sourcePlatform?: string;      // 如 "Trustpilot", "WhatsApp", "Telegram"
  country?: string;             // 评价用户国家/地区
}

export interface ReviewsSchema {
  title: string;
  subtitle?: string;
  ratingSummary?: {
    average: number;
    scale?: number;             // 默认可按 5 分制理解
    totalLabel?: string;        // 如 "Based on 2,384 reviews"
  };
  items: ReviewItem[];
  disclaimer?: string;             // 如 "Results may vary"，医疗/金融/减肥类目合规必备
}

// 一排横向排列的信任徽章
export interface TrustBadge {
  id: string;
  icon: IconType;
  text: string;                 // 如 "24/7 Human Support", "Free Consultation"
  subtext?: string;
}

export interface TrustBannerSchema {
  badges: TrustBadge[];
}

// 媒体报道 / 客户 logo 墙：用于快速建立第三方信任，不替代 TrustBanner 的短文案信任点
export interface LogoWallItem {
  id: string;
  src: string;
  alt: string;
  url?: string;
}

export interface LogoWallSchema {
  title?: string;               // 如 "As Featured In" / "Trusted By"
  logos: LogoWallItem[];
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
  paragraphs: string[];         // 品牌/专家故事描述，建议 1-3 段
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

// Lead 表单（高客单服务类替代 WhatsApp 直跳）：明确收集哪些基础联系方式，允许少量行业意向字段
export type LeadContactField = 'name' | 'phone' | 'email' | 'whatsapp' | 'telegram';
export type ReachableLeadContactField = Exclude<LeadContactField, 'name'>;
export type LeadFormRequiredFields =
  | [ReachableLeadContactField, ...LeadContactField[]]
  | ['name', ReachableLeadContactField, ...LeadContactField[]];
export type LeadFormExtraFieldType = 'text' | 'select';

export interface LeadFormExtraField {
  id: string;
  name: string;                 // 提交时的字段 key
  label: string;
  type: LeadFormExtraFieldType;
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[]; // 用于 select
}

export interface LeadFormSchema {
  id: string;                   // primaryConversion.destination.formId 指向该表单；MVP 全页最多一个
  title: string;
  subtitle?: string;
  submitText: string;
  successMessage?: string;
  requiredFields: LeadFormRequiredFields; // 至少包含一个真实可联系字段，不能只收姓名
  optionalFields?: LeadContactField[];
  consentText?: string;         // GDPR 同意文本
  includeMessage?: boolean;     // 是否展示可选留言字段，默认由渲染器按 true 处理
  extraFields?: LeadFormExtraField[]; // 少量行业意向字段，如 treatment / target country / budget range
  eventName?: LeadEventName;    // 提交埋点事件名，仅允许留资/咨询类事件
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
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  robots?: 'index,follow' | 'noindex,nofollow';
  generatedAt?: string;
}

export type PixelEventTrigger =
  | 'page_view'
  | 'cta_click'
  | 'block_in_view'
  | 'form_submit'
  | 'time_on_page';

export type PixelEventName = LeadEventName;

export interface PixelEvent {
  trigger: PixelEventTrigger;
  name: PixelEventName;                          // 仅允许咨询、联系、预约、留资类事件
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
  | 'LogoWall'
  | 'AuthorityStory'
  | 'FAQ'
  | 'Countdown'
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
  | BlockBase<'LogoWall', LogoWallSchema>
  | BlockBase<'AuthorityStory', AuthoritySchema>
  | BlockBase<'FAQ', FAQSchema>
  | BlockBase<'Countdown', CountdownSchema>
  | BlockBase<'Assurance', AssuranceSchema>;

// 1. 抽离可选模块的联合类型
export type OptionalBlockType =
  | 'Features'
  | 'Reviews'
  | 'TrustBanner'
  | 'LogoWall'
  | 'AuthorityStory'
  | 'FAQ'
  | 'Countdown'
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
  primaryConversion: PrimaryConversion; // 页面级主咨询/留资目标；必须指向真实私域/电话/邮箱/预约/表单入口

  // ==========================================
  // 🔴 核心模块：Hero / Footer 必须存在；Offer / HowItWorks 是推荐漏斗模块，但不强制
  // ==========================================
  hero: HeroSchema;               // 必须有首屏 (漏斗顶部)
  offer?: OfferSchema;            // 推荐展示核心咨询/服务入口 (漏斗核心)
  howItWorks?: HowItWorksSchema;  // 推荐展示联系流程说明 (打消疑虑)
  footer: MicroFooterSchema;      // 必须有合规页脚 (防封号底线)

  // ==========================================
  // 🟢 可选动态区：允许用户在规定区域内增删改排
  // ==========================================

  // 页面渲染顺序固定为：hero -> offer -> howItWorks -> blocks -> leadForm -> footer。
  // 可选动态模块内部顺序由数组位置决定；推荐漏斗顺序：Trust / Features → Social Proof → FAQ / Countdown
  blocks?: OptionalBlock[];

  // 页面级线索表单：MVP 仅允许一个；当 primaryConversion.destination.type 为 form 时必须存在同 id 表单
  leadForm?: LeadFormSchema;

  // 全站悬浮 CTA（移动端转化主力，常用于 WhatsApp/Telegram 直跳）
  stickyCta?: StickyCtaConfig;

}
