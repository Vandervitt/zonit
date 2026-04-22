
// types/schema.ts

// 支持的第三方平台图标类型
export type IconType = 'WhatsApp' | 'Telegram' | 'Line' | 'Phone' | 'Mail' | 'ArrowRight' | string;

// 通用的行动呼吁按钮 (CTA) 模型 —— 核心转化组件
export interface CallToAction {
  text: string;           // 按钮文案 (e.g., "Chat on WhatsApp")
  url: string;            // 跳转链接 (e.g., "https://wa.me/...")
  icon?: IconType;        // 按钮图标
  theme?: 'primary' | 'secondary' | 'whatsapp' | 'telegram'; // 按钮颜色风格
}

// 图片模型 (支持传入图片 URL 和 Alt 文本以优化 SEO)
export interface ImageMeta {
  src: string;
  alt: string;
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
  trustText?: string;           // 按钮下方的小字背书，如 "No credit card required"
}


// 向用户展示价格或服务梯队，引导点击咨询。
export interface BundleTier {
  id: string;
  name: string;                 // 套餐名称，如 "Basic", "Family Pack", "VIP Signal"
  price: string;                // 价格文案，如 "$49", "Free Quote"
  originalPrice?: string;       // 原价 (用于划线价，制造优惠感)
  description: string;          // 简短描述
  features: string[];           // 包含的权益列表 (打钩项)
  tag?: string;                 // 推荐标签，如 "Most Popular", "Best Value"
  image?: string;               // 套餐配图 (卖实体商品时必填)
  cta: CallToAction;            // 该套餐对应的专属咨询按钮
}

export interface BundlesSchema {
  title: string;
  subtitle?: string;
  tiers: BundleTier[];          // 通常 1 到 3 个
}

// 引导用户如何通过 WhatsApp/TG 交易，打消疑虑
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
  proofImage?: string;          // 证据截图！(适用于展示 TG 聊天记录、减肥前后图、收益截图)
}

export interface ReviewsSchema {
  title: string;
  subtitle?: string;
  averageRating?: number;       // 如 4.9
  totalReviews?: string;        // 如 "10k+ Reviews"
  items: ReviewItem[];
}

// 一排横向排列的信任徽章
export interface TrustBadge {
  id: string;
  icon: IconType;
  text: string;                 // 如 "24/7 Human Support", "Cash on Delivery"
}

export interface TrustBannerSchema {
  theme?: 'light' | 'dark' | 'brand'; 
  badges: TrustBadge[];
}

// 权威背书 / 品牌故事
export interface AuthoritySchema {
  title: string;
  subtitle?: string;
  paragraphs: string[];         // 多段落的故事描述
  image: ImageMeta;             // 创始人/医生照片 或 诊所环境图
  stats?: {                     // 履历数字展示
    label: string;              // 如 "Years Exp"
    value: string;              // 如 "15+"
  }[];
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

// PageBlock 包装器
// 定义模块的标识符
export type BlockType = 
  | 'Hero' 
  | 'ProductBundles' 
  | 'HowItWorks' 
  | 'MicroFooter' 
  | 'Features' 
  | 'Reviews' 
  | 'TrustBanner' 
  | 'AuthorityStory' 
  | 'FAQ';

// 万能的页面区块包装器
export interface PageBlock {
  id: string;          // 唯一ID (UUID)
  type: BlockType;     // 告诉引擎渲染哪个 React 组件
  data: 
    | HeroSchema 
    | BundlesSchema 
    | HowItWorksSchema 
    | MicroFooterSchema 
    | FeaturesSchema 
    | ReviewsSchema 
    | TrustBannerSchema 
    | AuthoritySchema 
    | FAQSchema;       // 对应的具体数据
}

// 整个落地页的最终数据结构 (存入数据库的 JSON)
export interface LandingPageData {
  pageId: string;
  theme: string;       // 行业主题皮肤标识，如 "crypto-dark", "beauty-light"
  blocks: PageBlock[]; // 按顺序排列的页面模块
}

// 1. 抽离可选模块的联合类型
export type OptionalBlockType = 
  | 'Features' 
  | 'Reviews' 
  | 'TrustBanner' 
  | 'AuthorityStory' 
  | 'FAQ';

export interface OptionalBlock {
  id: string;
  type: OptionalBlockType;
  data: FeaturesSchema | ReviewsSchema | TrustBannerSchema | AuthoritySchema | FAQSchema;
}

// 2. 强约束的落地页包装器模型 (核心！)
export interface LandingPageTemplate {
  templateId: string;
  templateName: string;
  themeConfig: {
    mode: 'light' | 'dark';
    primaryColor: string;    // 主色调
  };

  // ==========================================
  // 🔴 强制模块：作为根属性存在，不可删除，位置固定
  // ==========================================
  hero: HeroSchema;               // 必须有首屏 (漏斗顶部)
  bundles: BundlesSchema;         // 必须有产品/服务报价 (漏斗核心)
  howItWorks: HowItWorksSchema;   // 必须有私域交易流程说明 (打消疑虑)
  footer: MicroFooterSchema;      // 必须有合规页脚 (防封号底线)

  // ==========================================
  // 🟢 可选动态区：允许用户在规定区域内增删改排
  // ==========================================
  
  // 位于 Hero 和 Bundles 之间的区域（适合放：信任条、卖点、权威背书）
  upperBlocks: OptionalBlock[];   

  // 位于 HowItWorks 和 Footer 之间的区域（适合放：评价截图、FAQ）
  lowerBlocks: OptionalBlock[];   
}
