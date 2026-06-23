// types/schema.draft.ts
//
// 由 `schema 的定义.md` 草稿忠实提取的代码级 TS schema 定义。
// 独立于 types/schema.ts（现有产品模型），仅按草稿的模块与字段粒度建模，
// 不引入定价/结账/订单等交易语义（套餐模块的 label / 价值点均为展示文案）。

// ============ 通用原子类型 ============

/** 图片引用 */
export interface ImageRef {
  src: string;
  alt?: string;
}

/** 富媒体素材：图片或视频 */
export type Media =
  | { type: 'image'; src: string; alt?: string }
  | { type: 'video'; src: string; poster?: string };

/** 顶部小标签：emoji + 文案 */
export interface Badge {
  emoji?: string;
  text: string;
}

/** 行动按钮（CTA）：文案 + 链接 */
export interface CtaButton {
  text: string; // 按钮文案
  link: string; // 按钮链接
}

/** 带图标的标题：icon + 文案 */
export interface IconHeading {
  icon?: string;
  text: string;
}

// ============ 1. 首屏 ============

export interface HeroSection {
  backgroundImage?: ImageRef;  // 背景图；缺省时由主题色兜底
  badge?: Badge;               // emoji + text
  title: string;               // 主标题
  subtitle?: string;           // 副标题
  cta: CtaButton;              // CTA 按钮
  secondaryCta?: CtaButton;    // 副按钮
  endorsementText?: string;    // 背书文字
  showcase?: Media;            // 产品展示：图片或视频
}

// ============ 2. 数据展示模块 ============

export interface StatItem {
  backgroundImage?: ImageRef;  // bgImg
  icon?: string;
  value: string;               // 草稿 text：指标数值/主文案
  label: string;               // 指标名称
}

export interface StatsSection {
  title: string;
  subtitle?: string;
  items: StatItem[];
}

// ============ 3. 套餐模块 ============
// 展示咨询/服务方案；label 与价值点均为展示文案，不含价格或账单字段。

export interface PlanItem {
  name: string;
  description: string;            // desc
  badge?: string;
  label?: string;                 // 展示用标签文案（非价格）
  valueProps: string[];           // 价值点（多行文本）
  countdown?: { endsAt: string }; // 倒计时：带时区的 ISO 截止时间
  cta: CtaButton;                 // 该方案对应的 CTA 按钮
}

export interface PlansSection {
  title: string;
  subtitle?: string;
  items: PlanItem[];
}

// ============ 4. 产品模块 ============

export interface ProductItem {
  name: string;
  description: string;         // desc
  backgroundImage?: ImageRef;  // bgImg
}

export interface ProductsSection {
  title: string;
  subtitle?: string;
  items: ProductItem[];
}

// ============ 5. 前后对比模块 ============

export interface BeforeAfterItem {
  crmName: string;             // 案例来源/客户名
  duration: string;            // 使用时长
  caseDescription: string;     // 案例描述
  beforeImage: ImageRef;       // beforeImg
  afterImage: ImageRef;        // afterImg
}

export interface BeforeAfterSection {
  title: string;
  subtitle?: string;
  disclaimer?: string;         // 免责声明
  items: BeforeAfterItem[];    // 对比项
}

// ============ 6. 服务流程模块 ============

export interface ProcessStep {
  title: string;               // 步骤标题
  description: string;         // 步骤描述
  image?: ImageRef;
}

export interface ProcessSection {
  title: string;
  subtitle?: string;
  steps: ProcessStep[];
}

// ============ 7. 信任模块 ============

export interface TrustBadgeItem {
  icon?: string;
  title: string;               // 主文案
  subtitle?: string;           // 副文案
}

export interface TrustSection {
  backgroundImage?: ImageRef;  // 背景图
  badges: TrustBadgeItem[];    // 信任徽章
}

// ============ 8. 特性模块 ============

export interface FeatureItem {
  icon?: string;
  title: string;               // 草稿写作 tile，应为 title
  description: string;         // desc
}

export interface FeaturesSection {
  title: string;
  subtitle?: string;
  items: FeatureItem[];        // 特性项
}

// ============ 9. 评价模块 ============

/** 评价内容：text + img */
export interface ReviewContent {
  text: string;
  image?: ImageRef;
}

export interface ReviewItem {
  avatar?: ImageRef;           // 草稿 avater
  name: string;
  location?: string;
  channel?: string;
  content: ReviewContent;      // 评价内容
}

export interface ReviewsSection {
  title: string;
  subtitle?: string;
  description?: string;        // desc
  items: ReviewItem[];         // 评价项
}

// ============ 10. 产品故事 ============

export interface StorySection {
  title: string;
  subtitle?: string;
  body: string;                // 正文段落 desc
  backgroundImage?: ImageRef;  // 背景 img
  signatureName?: string;      // 署名
  signatureRole?: string;      // 职位
}

// ============ 11. 倒计时模块 ============

export interface CountdownSection {
  title: IconHeading;          // 主标题：icon + text
  subtitle?: string;
  endsAt: string;              // 截止时间：带时区的 ISO 日期字符串
}

// ============ 12. 常见问题模块 ============

export interface FaqItem {
  question: string;            // q
  answer: string;              // a
}

export interface FaqSection {
  title: IconHeading;          // 主标题：icon + text
  subtitle?: string;
  items: FaqItem[];            // 问题项
}

// ============ 13. 安全保障模块 ============

export interface GuaranteeItem {
  icon?: string;
  title: string;               // 主标题
  subtitle?: string;           // 副标题
}

export interface GuaranteeSection {
  title: string;
  subtitle?: string;
  description?: string;        // desc
  items: GuaranteeItem[];      // 保障项
}

// ============ 14. 页脚模块 ============

export interface FooterSection {
  brandName: string;           // 品牌名称
  copyrightYear: string;       // 版权年份
  contactEmail: string;        // 联系邮箱
  privacyPolicy: string;       // 隐私政策
  termsOfService: string;      // 服务条款
}

// ============ 15. 悬浮按钮 ============

export interface FloatingButton {
  text: string;                // 按钮文案
  link: string;                // 按钮链接
}

// ============ 页面级追踪（Pixel / UTM / 同意）============
// 事件名不进 schema：内部事件→各平台标准事件映射为代码内置常量（见 landing-renderer/tracking/events.ts），
// 用户只填 Pixel ID，从根上杜绝越界交易事件名（非交易硬约束）。

/** 支持的 Pixel 平台（首刀 4 家；扩展只需在此与映射表增项）。 */
export type PixelProvider = 'meta' | 'ga4' | 'googleAds' | 'tiktok';

/** 单平台 Pixel 配置：用户只填 ID。 */
export interface PixelConfig {
  provider: PixelProvider;
  id: string;        // Pixel / Measurement / Conversion ID
  enabled: boolean;  // 关闭则不注入（保留已填 ID）
}

/** 页面级追踪配置。 */
export interface PageTracking {
  pixels: PixelConfig[];        // 多方 pixel，按 provider 去重
  utmPassthrough: boolean;      // 是否把 UTM 拼到 http(s) 外链 CTA
  consent: {
    enabled: boolean;           // 是否显示同意条并做 opt-in 门控
    text?: string;              // 同意条文案（留空用默认）
  };
}

// ============ 页面组合 ============
// 首屏 / 页脚为页面级必填单例，固定在顶部/底部，不进入可排序列表；
// 其余模块进入 sections[]，可自由增删与排序。

export type LandingSection =
  | { type: 'stats'; data: StatsSection }
  | { type: 'plans'; data: PlansSection }
  | { type: 'products'; data: ProductsSection }
  | { type: 'beforeAfter'; data: BeforeAfterSection }
  | { type: 'process'; data: ProcessSection }
  | { type: 'trust'; data: TrustSection }
  | { type: 'features'; data: FeaturesSection }
  | { type: 'reviews'; data: ReviewsSection }
  | { type: 'story'; data: StorySection }
  | { type: 'countdown'; data: CountdownSection }
  | { type: 'faq'; data: FaqSection }
  | { type: 'guarantee'; data: GuaranteeSection };

export type LandingSectionType = LandingSection['type'];

/** 留资表单单字段配置（预设字段，只能开关 + 必填）。 */
export interface LeadFormFieldConfig {
  enabled: boolean;
  required: boolean;
}

/** 兜底留资表单（页面级可选件，默认关；转化优先走深链）。 */
export interface LeadForm {
  enabled: boolean;
  title: string;
  description?: string;
  submitText: string;
  successMessage: string;
  fields: {
    name: LeadFormFieldConfig;
    email: LeadFormFieldConfig;
    phone: LeadFormFieldConfig;
    whatsapp: LeadFormFieldConfig;
    telegram: LeadFormFieldConfig;
    message: LeadFormFieldConfig;
  };
}

/** 联系方式字段键（用于「至少一个联系方式」校验）。 */
export type LeadContactField = "email" | "phone" | "whatsapp" | "telegram";
export const LEAD_CONTACT_FIELDS: LeadContactField[] = ["email", "phone", "whatsapp", "telegram"];

// 方案 A：首屏 / 页脚为顶层必填字段（编译期保证），且不在 sections[] 中 → 天然固定、不可排序。
export interface LandingPageDraft {
  hero: HeroSection;               // 必填，固定首屏
  sections: LandingSection[];      // 中部模块，可自由排序；必须性由下方注册表 + 校验保证
  footer: FooterSection;           // 必填，固定页脚
  floatingButton?: FloatingButton; // 悬浮按钮（可选）
  leadForm?: LeadForm;             // 兜底留资表单（可选）
  tracking?: PageTracking;         // 页面级追踪配置（缺省视为无 pixel）
}

// ============ 方案 C：模块注册表（必须性 / 唯一性元数据） ============
// 可排序模块的「必须出现」「至少其一」「能否重复」全部以数据声明，供编辑器与校验共用。
// 注：singleton 为默认策略（每类模块默认仅一个），按需放开即可。

/** 必须分组：组内至少出现一个模块即满足。core-value 覆盖「套餐 / 特性」等核心价值入口。 */
export type RequiredGroup = 'core-value';

export interface SectionMeta {
  type: LandingSectionType;
  label: string;
  required: boolean;             // 该模块本身必须单独出现
  singleton: boolean;            // 是否只能出现一次
  requiredGroup?: RequiredGroup; // 归属的「至少其一」分组
}

export const SECTION_REGISTRY: Record<LandingSectionType, SectionMeta> = {
  stats:       { type: 'stats',       label: '数据展示', required: false, singleton: true },
  plans:       { type: 'plans',       label: '套餐',     required: false, singleton: true, requiredGroup: 'core-value' },
  products:    { type: 'products',    label: '产品',     required: false, singleton: true },
  beforeAfter: { type: 'beforeAfter', label: '前后对比', required: false, singleton: true },
  process:     { type: 'process',     label: '服务流程', required: false, singleton: true },
  trust:       { type: 'trust',       label: '信任',     required: false, singleton: true },
  features:    { type: 'features',    label: '特性',     required: false, singleton: true, requiredGroup: 'core-value' },
  reviews:     { type: 'reviews',     label: '评价',     required: false, singleton: true },
  story:       { type: 'story',       label: '产品故事', required: false, singleton: true },
  countdown:   { type: 'countdown',   label: '倒计时',   required: false, singleton: true },
  faq:         { type: 'faq',         label: '常见问题', required: false, singleton: true },
  guarantee:   { type: 'guarantee',   label: '安全保障', required: false, singleton: true },
};

// ============ 方案 B：运行期校验 ============
// 编译期无法表达「无序数组必含某类型」，故必须性由此函数在编辑器保存等节点兜底校验。

export interface SectionValidationResult {
  missingRequired: LandingSectionType[];      // 缺失的单独必须模块
  unsatisfiedGroups: RequiredGroup[];         // 未满足「至少其一」的分组
  duplicatedSingletons: LandingSectionType[]; // 违反唯一性、重复出现的模块
}

export function validateSections(sections: LandingSection[]): SectionValidationResult {
  const counts = new Map<LandingSectionType, number>();
  for (const s of sections) counts.set(s.type, (counts.get(s.type) ?? 0) + 1);

  const metas = Object.values(SECTION_REGISTRY);

  const missingRequired = metas
    .filter((m) => m.required && !counts.has(m.type))
    .map((m) => m.type);

  const allGroups = new Set<RequiredGroup>(
    metas.map((m) => m.requiredGroup).filter((g): g is RequiredGroup => Boolean(g)),
  );
  const satisfiedGroups = new Set<RequiredGroup>(
    metas
      .filter((m) => m.requiredGroup && counts.has(m.type))
      .map((m) => m.requiredGroup as RequiredGroup),
  );
  const unsatisfiedGroups = [...allGroups].filter((g) => !satisfiedGroups.has(g));

  const duplicatedSingletons = metas
    .filter((m) => m.singleton && (counts.get(m.type) ?? 0) > 1)
    .map((m) => m.type);

  return { missingRequired, unsatisfiedGroups, duplicatedSingletons };
}

/** 页面结构是否满足全部必须性约束（首屏/页脚由类型保证，此处校验可排序区块）。 */
export function isLandingPageStructureValid(page: LandingPageDraft): boolean {
  const r = validateSections(page.sections);
  return (
    r.missingRequired.length === 0 &&
    r.unsatisfiedGroups.length === 0 &&
    r.duplicatedSingletons.length === 0
  );
}
