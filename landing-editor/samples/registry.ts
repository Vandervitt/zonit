// landing-editor/samples/registry.ts
//
// 模板注册表（纯元数据）：集中登记 /admin/editor 可用模板的展示信息与筛选标签。
// 本文件刻意「不导入任何草稿体」——草稿体经 registry.drafts.ts 的 loadTemplateDraft
// 动态 import 按需加载，使画廊 / 编辑器路由首次编译不必把全部模板草稿拖进模块图。
// 故 thumbnail 在此为字面量 URL（不再从 draft.hero 派生）。
// 新增模板：① 在此追加一条 TemplateMeta；② 在 registry.drafts.ts 的 loaders 补同 id 的草稿加载器。

/** 投放梯队：t1=电商种草留资 / t2=本地服务线索。 */
export type TemplateTier = "t1" | "t2";

/** 转化渠道（与 primaryConversion 的真实 lead 路径一致）。 */
export type TemplateConversion = "form" | "whatsapp" | "telegram" | "phone" | "email";

/** 页面范式。 */
export type TemplateArchetype = "种草留资" | "预约咨询" | "比价线索" | "demo预约";

/** 合规风险等级（high 表示功效/收益类表述需强制 disclaimer）。 */
export type TemplateRisk = "low" | "medium" | "high";

/** 文案情绪强度。 */
export type TemplateTone = "emotional" | "rational";

/** 多维筛选标签：供模板画廊按梯队 / 行业 / 风险等维度筛选。 */
export interface TemplateTags {
  /** 行业大类，如 beauty / apparel / gadget / home / supplement / toys-baby。 */
  category: string;
  /** 典型子品类，如 makeup / hair-growth / charging。 */
  subcategory: string;
  /** 页面范式。 */
  archetype: TemplateArchetype;
  /** 转化渠道（可多选）。 */
  conversion: TemplateConversion[];
  /** 合规风险等级。 */
  risk: TemplateRisk;
  /** 文案情绪强度。 */
  tone: TemplateTone;
}

/** 模板元数据（不含草稿体；草稿体见 registry.drafts.ts）。 */
export interface TemplateMeta {
  /** 唯一标识，作为 /admin/editor?template=<id> 的取值，也是草稿加载器的 key */
  id: string;
  /** 模板名称（选择页卡片标题） */
  name: string;
  /** 行业归类小标签 */
  industry: string;
  /** 一句话简介（选择页卡片描述） */
  tagline: string;
  /** 卡片缩略图（在线占位图，与该模板 hero 背景图一致的字面量 URL） */
  thumbnail: string;
  /** 投放梯队 */
  tier: TemplateTier;
  /** 多维筛选标签 */
  tags: TemplateTags;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "skincare",
    name: "Aurae Skincare",
    industry: "美妆 / 护肤",
    tagline: "皮肤咨询型落地页，访客经 WhatsApp 领取免费肤质分析。",
    thumbnail: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "beauty", subcategory: "skincare", archetype: "种草留资", conversion: ["whatsapp"], risk: "medium", tone: "emotional" },
  },
  {
    id: "dental",
    name: "Lumora Dental Studio",
    industry: "牙科 / 医美",
    tagline: "牙科预约型落地页，免费微笑评估 + WhatsApp 预约咨询。",
    thumbnail: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "medical", subcategory: "dental", archetype: "预约咨询", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "solar",
    name: "Solterra Home Solar",
    industry: "家装 / 太阳能",
    tagline: "家装太阳能落地页，免费上门测评 + 省电方案咨询。",
    thumbnail: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "home-improvement", subcategory: "solar", archetype: "预约咨询", conversion: ["whatsapp", "form"], risk: "medium", tone: "rational" },
  },
  {
    id: "radiantglow",
    name: "RadiantGlow Beauty",
    industry: "美妆 / 护肤",
    tagline: "护肤咨询落地页（含全 12 区块），WhatsApp 免费咨询 + 前后对比。",
    thumbnail: "https://images.unsplash.com/photo-1519084278803-b94f11e1c63b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920",
    tier: "t1",
    tags: { category: "beauty", subcategory: "skincare", archetype: "种草留资", conversion: ["whatsapp"], risk: "medium", tone: "emotional" },
  },

  // ===== 第一梯队 · 美妆个护 =====
  {
    id: "makeup",
    name: "Velvet Studio Makeup",
    industry: "美妆 / 彩妆",
    tagline: "彩妆配色落地页，WhatsApp 免费色号匹配 + 妆容方案。",
    thumbnail: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "beauty", subcategory: "makeup", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },
  {
    id: "beauty-device",
    name: "Lumio Skin Device",
    industry: "美妆 / 美容仪",
    tagline: "家用美容仪落地页，WhatsApp 免费护理方案 + 使用指导。",
    thumbnail: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "beauty", subcategory: "beauty-device", archetype: "种草留资", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "hair-growth",
    name: "Rooted Hair Care",
    industry: "美妆 / 生发防脱",
    tagline: "头皮护理落地页，WhatsApp 免费头皮评估 + 防脱routine。",
    thumbnail: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "beauty", subcategory: "hair-growth", archetype: "种草留资", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "fragrance",
    name: "Maison Brume Fragrance",
    industry: "美妆 / 香水",
    tagline: "选香顾问落地页，WhatsApp 免费选香建议 + 小样推荐。",
    thumbnail: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "beauty", subcategory: "fragrance", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },

  // ===== 第一梯队 · 服饰配饰 =====
  {
    id: "fast-fashion",
    name: "Lunela Style",
    industry: "服饰 / 快时尚",
    tagline: "快时尚造型落地页，WhatsApp 免费穿搭 + 上新与尺码咨询。",
    thumbnail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "apparel", subcategory: "fast-fashion", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },
  {
    id: "plus-size",
    name: "Curvana",
    industry: "服饰 / 大码",
    tagline: "大码合身落地页，WhatsApp 免费合身建议 + 造型咨询。",
    thumbnail: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "apparel", subcategory: "plus-size", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },
  {
    id: "activewear",
    name: "Strive Move",
    industry: "服饰 / 运动服",
    tagline: "瑜伽运动服落地页，WhatsApp 免费选款 + 合身与训练搭配。",
    thumbnail: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "apparel", subcategory: "activewear", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "rational" },
  },
  {
    id: "shapewear",
    name: "Sienne",
    industry: "服饰 / 内衣塑身",
    tagline: "内衣塑身落地页，WhatsApp 免费合身建议 + 尺码咨询。",
    thumbnail: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "apparel", subcategory: "shapewear", archetype: "种草留资", conversion: ["whatsapp"], risk: "medium", tone: "emotional" },
  },
  {
    id: "footwear",
    name: "Atlas Footwear",
    industry: "服饰 / 鞋靴",
    tagline: "鞋靴合脚落地页，WhatsApp 免费合脚建议 + 选款与尺码咨询。",
    thumbnail: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "apparel", subcategory: "footwear", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "rational" },
  },

  // ===== 第一梯队 · 3C 数码配件 =====
  {
    id: "phone-case",
    name: "Shieldly Cases",
    industry: "3C / 手机壳膜",
    tagline: "手机壳膜落地页，WhatsApp 免费机型适配 + 防护方案咨询。",
    thumbnail: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "gadget", subcategory: "phone-case", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "rational" },
  },
  {
    id: "charging",
    name: "Voltway Charging",
    industry: "3C / 充电电源",
    tagline: "充电电源落地页，WhatsApp 免费充电方案 + 兼容性咨询。",
    thumbnail: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "gadget", subcategory: "charging", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "rational" },
  },
  {
    id: "audio",
    name: "Sonara Audio",
    industry: "3C / 耳机音频",
    tagline: "耳机音频落地页，WhatsApp 免费选购建议 + 适配与音质咨询。",
    thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "gadget", subcategory: "audio", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "rational" },
  },
  {
    id: "wearable",
    name: "Pulse Wearables",
    industry: "3C / 智能穿戴",
    tagline: "智能穿戴落地页，WhatsApp 免费选款 + 适配与功能咨询。",
    thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "gadget", subcategory: "wearable", archetype: "种草留资", conversion: ["whatsapp"], risk: "medium", tone: "rational" },
  },
  {
    id: "smart-home",
    name: "Nestly Smart Home",
    industry: "3C / 智能家居",
    tagline: "智能家居落地页，WhatsApp 免费组网方案 + 生态兼容咨询。",
    thumbnail: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "gadget", subcategory: "smart-home", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "rational" },
  },

  // ===== 第一梯队 · 家居家纺 =====
  {
    id: "storage",
    name: "Tidely Organizing",
    industry: "家居 / 收纳整理",
    tagline: "收纳整理落地页，WhatsApp 免费收纳方案 + 空间规划咨询。",
    thumbnail: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "home", subcategory: "storage", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },
  {
    id: "kitchen",
    name: "Cucina Kitchen",
    industry: "家居 / 厨房小工具",
    tagline: "厨房好物落地页，WhatsApp 免费选品 + 用法与食谱咨询。",
    thumbnail: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "home", subcategory: "kitchen", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },
  {
    id: "pet",
    name: "Pawsly Pet Care",
    industry: "家居 / 宠物用品",
    tagline: "宠物用品落地页，WhatsApp 免费选品 + 养护与行为咨询。",
    thumbnail: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "home", subcategory: "pet", archetype: "种草留资", conversion: ["whatsapp"], risk: "medium", tone: "emotional" },
  },
  {
    id: "garden",
    name: "Verda Garden",
    industry: "家居 / 园艺户外",
    tagline: "园艺户外落地页，WhatsApp 免费庭院规划 + 植栽与工具咨询。",
    thumbnail: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "home", subcategory: "garden", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },
  {
    id: "bedding",
    name: "Dwell Bedding",
    industry: "家居 / 床品家纺",
    tagline: "床品家纺落地页，WhatsApp 免费选品 + 睡眠与面料咨询。",
    thumbnail: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "home", subcategory: "bedding", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },

  // ===== 第一梯队 · 健康保健品 =====
  {
    id: "vitamins",
    name: "Vitae Nutrition",
    industry: "保健 / 膳食补充剂",
    tagline: "膳食补充剂落地页，WhatsApp 免费营养评估（强合规免责）。",
    thumbnail: "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "supplement", subcategory: "vitamins", archetype: "种草留资", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "weight-mgmt",
    name: "Balance Wellness",
    industry: "保健 / 体重管理",
    tagline: "体重管理落地页，WhatsApp 免费习惯评估（无瘦身承诺）。",
    thumbnail: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "supplement", subcategory: "weight-mgmt", archetype: "种草留资", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "sleep",
    name: "Lull Sleep",
    industry: "保健 / 助眠",
    tagline: "助眠落地页，WhatsApp 免费睡眠评估（无治疗承诺）。",
    thumbnail: "https://images.unsplash.com/photo-1455642305367-68834a1da7ab?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "supplement", subcategory: "sleep", archetype: "种草留资", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "joint",
    name: "Mobil Joint Care",
    industry: "保健 / 关节骨骼",
    tagline: "关节骨骼落地页，WhatsApp 免费活动度评估（无治疗承诺）。",
    thumbnail: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "supplement", subcategory: "joint", archetype: "种草留资", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "womens-health",
    name: "Aria Women's Wellness",
    industry: "保健 / 女性健康",
    tagline: "女性健康落地页，WhatsApp 免费健康评估（强合规免责）。",
    thumbnail: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "supplement", subcategory: "womens-health", archetype: "种草留资", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },

  // ===== 第一梯队 · 玩具母婴 =====
  {
    id: "educational-toy",
    name: "Sprout Play",
    industry: "母婴 / 益智玩具",
    tagline: "益智教育玩具落地页，WhatsApp 免费按龄选玩具 + 发展咨询。",
    thumbnail: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "toys-baby", subcategory: "educational-toy", archetype: "种草留资", conversion: ["whatsapp"], risk: "medium", tone: "emotional" },
  },
  {
    id: "fidget",
    name: "Calmly Sensory",
    industry: "母婴 / 解压玩具",
    tagline: "解压玩具落地页，WhatsApp 免费选品 + 专注与舒缓用途咨询。",
    thumbnail: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "toys-baby", subcategory: "fidget", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },
  {
    id: "baby-care",
    name: "Nido Baby",
    industry: "母婴 / 婴童喂养",
    tagline: "婴童喂养用品落地页，WhatsApp 免费选品 + 喂养阶段咨询。",
    thumbnail: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "toys-baby", subcategory: "baby-care", archetype: "种草留资", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "maternity",
    name: "Bloom Maternity",
    industry: "母婴 / 孕产用品",
    tagline: "孕产用品落地页，WhatsApp 免费孕期好物 + 舒适咨询。",
    thumbnail: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "toys-baby", subcategory: "maternity", archetype: "种草留资", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "outdoor-toy",
    name: "Romp Outdoor",
    industry: "母婴 / 户外玩具",
    tagline: "户外运动玩具落地页，WhatsApp 免费按龄选品 + 活动咨询。",
    thumbnail: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "toys-baby", subcategory: "outdoor-toy", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },
];

export const DEFAULT_TEMPLATE_ID = TEMPLATES[0].id;

/** 按 id 取模板元数据；缺省或未命中时回退默认模板。 */
export function getTemplate(id?: string | null): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
