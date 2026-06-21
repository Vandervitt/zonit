// landing-editor/samples/registry.ts
//
// 模板注册表：集中登记 /admin/editor 可用的 LandingPageDraft 样例模板。
// 选择页与编辑器种子共用本表 —— 新增模板只需在此追加一条。
import type { LandingPageDraft } from "@/types/schema.draft";
import { skincareConsultDraft } from "./skincareConsultDraft";
import { dentalClinicDraft } from "./dentalClinicDraft";
import { solarHomeDraft } from "./solarHomeDraft";
import { radiantGlowBeautyDraft } from "./radiantGlowBeautyDraft";
// 第一梯队 · 美妆个护
import { makeupConsultDraft } from "./makeupConsultDraft";
import { beautyDeviceDraft } from "./beautyDeviceDraft";
import { hairGrowthDraft } from "./hairGrowthDraft";
import { fragranceDraft } from "./fragranceDraft";
// 第一梯队 · 服饰配饰
import { fastFashionDraft } from "./fastFashionDraft";
import { plusSizeDraft } from "./plusSizeDraft";
import { activewearDraft } from "./activewearDraft";
import { shapewearDraft } from "./shapewearDraft";
import { footwearDraft } from "./footwearDraft";
// 第一梯队 · 3C 数码配件
import { phoneCaseDraft } from "./phoneCaseDraft";
import { chargingDraft } from "./chargingDraft";
import { audioDraft } from "./audioDraft";
import { wearableDraft } from "./wearableDraft";
import { smartHomeDraft } from "./smartHomeDraft";
// 第一梯队 · 家居家纺
import { storageDraft } from "./storageDraft";
import { kitchenDraft } from "./kitchenDraft";
import { petDraft } from "./petDraft";
import { gardenDraft } from "./gardenDraft";
import { beddingDraft } from "./beddingDraft";
// 第一梯队 · 健康保健品
import { vitaminsDraft } from "./vitaminsDraft";
import { weightMgmtDraft } from "./weightMgmtDraft";
import { sleepDraft } from "./sleepDraft";
import { jointDraft } from "./jointDraft";
import { womensHealthDraft } from "./womensHealthDraft";
// 第一梯队 · 玩具母婴
import { educationalToyDraft } from "./educationalToyDraft";
import { fidgetToyDraft } from "./fidgetToyDraft";
import { babyCareDraft } from "./babyCareDraft";
import { maternityDraft } from "./maternityDraft";
import { outdoorToyDraft } from "./outdoorToyDraft";

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

export interface TemplateMeta {
  /** 唯一标识，作为 /admin/editor?template=<id> 的取值 */
  id: string;
  /** 模板名称（选择页卡片标题） */
  name: string;
  /** 行业归类小标签 */
  industry: string;
  /** 一句话简介（选择页卡片描述） */
  tagline: string;
  /** 卡片缩略图（在线占位图） */
  thumbnail: string;
  /** 投放梯队 */
  tier: TemplateTier;
  /** 多维筛选标签 */
  tags: TemplateTags;
  /** 模板数据 */
  draft: LandingPageDraft;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "skincare",
    name: "Aurae Skincare",
    industry: "美妆 / 护肤",
    tagline: "皮肤咨询型落地页，访客经 WhatsApp 领取免费肤质分析。",
    thumbnail: skincareConsultDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "beauty",
      subcategory: "skincare",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "medium",
      tone: "emotional",
    },
    draft: skincareConsultDraft,
  },
  {
    id: "dental",
    name: "Lumora Dental Studio",
    industry: "牙科 / 医美",
    tagline: "牙科预约型落地页，免费微笑评估 + WhatsApp 预约咨询。",
    thumbnail: dentalClinicDraft.hero.backgroundImage?.src ?? "",
    tier: "t2",
    tags: {
      category: "medical",
      subcategory: "dental",
      archetype: "预约咨询",
      conversion: ["whatsapp"],
      risk: "high",
      tone: "emotional",
    },
    draft: dentalClinicDraft,
  },
  {
    id: "solar",
    name: "Solterra Home Solar",
    industry: "家装 / 太阳能",
    tagline: "家装太阳能落地页，免费上门测评 + 省电方案咨询。",
    thumbnail: solarHomeDraft.hero.backgroundImage?.src ?? "",
    tier: "t2",
    tags: {
      category: "home-improvement",
      subcategory: "solar",
      archetype: "预约咨询",
      conversion: ["whatsapp", "form"],
      risk: "medium",
      tone: "rational",
    },
    draft: solarHomeDraft,
  },
  {
    id: "radiantglow",
    name: "RadiantGlow Beauty",
    industry: "美妆 / 护肤",
    tagline: "护肤咨询落地页（含全 12 区块），WhatsApp 免费咨询 + 前后对比。",
    thumbnail: radiantGlowBeautyDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "beauty",
      subcategory: "skincare",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "medium",
      tone: "emotional",
    },
    draft: radiantGlowBeautyDraft,
  },

  // ===== 第一梯队 · 美妆个护 =====
  {
    id: "makeup",
    name: "Velvet Studio Makeup",
    industry: "美妆 / 彩妆",
    tagline: "彩妆配色落地页，WhatsApp 免费色号匹配 + 妆容方案。",
    thumbnail: makeupConsultDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "beauty",
      subcategory: "makeup",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "low",
      tone: "emotional",
    },
    draft: makeupConsultDraft,
  },
  {
    id: "beauty-device",
    name: "Lumio Skin Device",
    industry: "美妆 / 美容仪",
    tagline: "家用美容仪落地页，WhatsApp 免费护理方案 + 使用指导。",
    thumbnail: beautyDeviceDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "beauty",
      subcategory: "beauty-device",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "high",
      tone: "emotional",
    },
    draft: beautyDeviceDraft,
  },
  {
    id: "hair-growth",
    name: "Rooted Hair Care",
    industry: "美妆 / 生发防脱",
    tagline: "头皮护理落地页，WhatsApp 免费头皮评估 + 防脱routine。",
    thumbnail: hairGrowthDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "beauty",
      subcategory: "hair-growth",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "high",
      tone: "emotional",
    },
    draft: hairGrowthDraft,
  },
  {
    id: "fragrance",
    name: "Maison Brume Fragrance",
    industry: "美妆 / 香水",
    tagline: "选香顾问落地页，WhatsApp 免费选香建议 + 小样推荐。",
    thumbnail: fragranceDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "beauty",
      subcategory: "fragrance",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "low",
      tone: "emotional",
    },
    draft: fragranceDraft,
  },

  // ===== 第一梯队 · 服饰配饰 =====
  {
    id: "fast-fashion",
    name: "Lunela Style",
    industry: "服饰 / 快时尚",
    tagline: "快时尚造型落地页，WhatsApp 免费穿搭 + 上新与尺码咨询。",
    thumbnail: fastFashionDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "apparel",
      subcategory: "fast-fashion",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "low",
      tone: "emotional",
    },
    draft: fastFashionDraft,
  },
  {
    id: "plus-size",
    name: "Curvana",
    industry: "服饰 / 大码",
    tagline: "大码合身落地页，WhatsApp 免费合身建议 + 造型咨询。",
    thumbnail: plusSizeDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "apparel",
      subcategory: "plus-size",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "low",
      tone: "emotional",
    },
    draft: plusSizeDraft,
  },
  {
    id: "activewear",
    name: "Strive Move",
    industry: "服饰 / 运动服",
    tagline: "瑜伽运动服落地页，WhatsApp 免费选款 + 合身与训练搭配。",
    thumbnail: activewearDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "apparel",
      subcategory: "activewear",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "low",
      tone: "rational",
    },
    draft: activewearDraft,
  },
  {
    id: "shapewear",
    name: "Sienne",
    industry: "服饰 / 内衣塑身",
    tagline: "内衣塑身落地页，WhatsApp 免费合身建议 + 尺码咨询。",
    thumbnail: shapewearDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "apparel",
      subcategory: "shapewear",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "medium",
      tone: "emotional",
    },
    draft: shapewearDraft,
  },
  {
    id: "footwear",
    name: "Atlas Footwear",
    industry: "服饰 / 鞋靴",
    tagline: "鞋靴合脚落地页，WhatsApp 免费合脚建议 + 选款与尺码咨询。",
    thumbnail: footwearDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "apparel",
      subcategory: "footwear",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "low",
      tone: "rational",
    },
    draft: footwearDraft,
  },

  // ===== 第一梯队 · 3C 数码配件 =====
  {
    id: "phone-case",
    name: "Shieldly Cases",
    industry: "3C / 手机壳膜",
    tagline: "手机壳膜落地页，WhatsApp 免费机型适配 + 防护方案咨询。",
    thumbnail: phoneCaseDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "gadget",
      subcategory: "phone-case",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "low",
      tone: "rational",
    },
    draft: phoneCaseDraft,
  },
  {
    id: "charging",
    name: "Voltway Charging",
    industry: "3C / 充电电源",
    tagline: "充电电源落地页，WhatsApp 免费充电方案 + 兼容性咨询。",
    thumbnail: chargingDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "gadget",
      subcategory: "charging",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "low",
      tone: "rational",
    },
    draft: chargingDraft,
  },
  {
    id: "audio",
    name: "Sonara Audio",
    industry: "3C / 耳机音频",
    tagline: "耳机音频落地页，WhatsApp 免费选购建议 + 适配与音质咨询。",
    thumbnail: audioDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "gadget",
      subcategory: "audio",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "low",
      tone: "rational",
    },
    draft: audioDraft,
  },
  {
    id: "wearable",
    name: "Pulse Wearables",
    industry: "3C / 智能穿戴",
    tagline: "智能穿戴落地页，WhatsApp 免费选款 + 适配与功能咨询。",
    thumbnail: wearableDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "gadget",
      subcategory: "wearable",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "medium",
      tone: "rational",
    },
    draft: wearableDraft,
  },
  {
    id: "smart-home",
    name: "Nestly Smart Home",
    industry: "3C / 智能家居",
    tagline: "智能家居落地页，WhatsApp 免费组网方案 + 生态兼容咨询。",
    thumbnail: smartHomeDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "gadget",
      subcategory: "smart-home",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "low",
      tone: "rational",
    },
    draft: smartHomeDraft,
  },

  // ===== 第一梯队 · 家居家纺 =====
  {
    id: "storage",
    name: "Tidely Organizing",
    industry: "家居 / 收纳整理",
    tagline: "收纳整理落地页，WhatsApp 免费收纳方案 + 空间规划咨询。",
    thumbnail: storageDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "home",
      subcategory: "storage",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "low",
      tone: "emotional",
    },
    draft: storageDraft,
  },
  {
    id: "kitchen",
    name: "Cucina Kitchen",
    industry: "家居 / 厨房小工具",
    tagline: "厨房好物落地页，WhatsApp 免费选品 + 用法与食谱咨询。",
    thumbnail: kitchenDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "home",
      subcategory: "kitchen",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "low",
      tone: "emotional",
    },
    draft: kitchenDraft,
  },
  {
    id: "pet",
    name: "Pawsly Pet Care",
    industry: "家居 / 宠物用品",
    tagline: "宠物用品落地页，WhatsApp 免费选品 + 养护与行为咨询。",
    thumbnail: petDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "home",
      subcategory: "pet",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "medium",
      tone: "emotional",
    },
    draft: petDraft,
  },
  {
    id: "garden",
    name: "Verda Garden",
    industry: "家居 / 园艺户外",
    tagline: "园艺户外落地页，WhatsApp 免费庭院规划 + 植栽与工具咨询。",
    thumbnail: gardenDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "home",
      subcategory: "garden",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "low",
      tone: "emotional",
    },
    draft: gardenDraft,
  },
  {
    id: "bedding",
    name: "Dwell Bedding",
    industry: "家居 / 床品家纺",
    tagline: "床品家纺落地页，WhatsApp 免费选品 + 睡眠与面料咨询。",
    thumbnail: beddingDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "home",
      subcategory: "bedding",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "low",
      tone: "emotional",
    },
    draft: beddingDraft,
  },

  // ===== 第一梯队 · 健康保健品 =====
  {
    id: "vitamins",
    name: "Vitae Nutrition",
    industry: "保健 / 膳食补充剂",
    tagline: "膳食补充剂落地页，WhatsApp 免费营养评估（强合规免责）。",
    thumbnail: vitaminsDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "supplement",
      subcategory: "vitamins",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "high",
      tone: "emotional",
    },
    draft: vitaminsDraft,
  },
  {
    id: "weight-mgmt",
    name: "Balance Wellness",
    industry: "保健 / 体重管理",
    tagline: "体重管理落地页，WhatsApp 免费习惯评估（无瘦身承诺）。",
    thumbnail: weightMgmtDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "supplement",
      subcategory: "weight-mgmt",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "high",
      tone: "emotional",
    },
    draft: weightMgmtDraft,
  },
  {
    id: "sleep",
    name: "Lull Sleep",
    industry: "保健 / 助眠",
    tagline: "助眠落地页，WhatsApp 免费睡眠评估（无治疗承诺）。",
    thumbnail: sleepDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "supplement",
      subcategory: "sleep",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "high",
      tone: "emotional",
    },
    draft: sleepDraft,
  },
  {
    id: "joint",
    name: "Mobil Joint Care",
    industry: "保健 / 关节骨骼",
    tagline: "关节骨骼落地页，WhatsApp 免费活动度评估（无治疗承诺）。",
    thumbnail: jointDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "supplement",
      subcategory: "joint",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "high",
      tone: "emotional",
    },
    draft: jointDraft,
  },
  {
    id: "womens-health",
    name: "Aria Women's Wellness",
    industry: "保健 / 女性健康",
    tagline: "女性健康落地页，WhatsApp 免费健康评估（强合规免责）。",
    thumbnail: womensHealthDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "supplement",
      subcategory: "womens-health",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "high",
      tone: "emotional",
    },
    draft: womensHealthDraft,
  },

  // ===== 第一梯队 · 玩具母婴 =====
  {
    id: "educational-toy",
    name: "Sprout Play",
    industry: "母婴 / 益智玩具",
    tagline: "益智教育玩具落地页，WhatsApp 免费按龄选玩具 + 发展咨询。",
    thumbnail: educationalToyDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "toys-baby",
      subcategory: "educational-toy",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "medium",
      tone: "emotional",
    },
    draft: educationalToyDraft,
  },
  {
    id: "fidget",
    name: "Calmly Sensory",
    industry: "母婴 / 解压玩具",
    tagline: "解压玩具落地页，WhatsApp 免费选品 + 专注与舒缓用途咨询。",
    thumbnail: fidgetToyDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "toys-baby",
      subcategory: "fidget",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "low",
      tone: "emotional",
    },
    draft: fidgetToyDraft,
  },
  {
    id: "baby-care",
    name: "Nido Baby",
    industry: "母婴 / 婴童喂养",
    tagline: "婴童喂养用品落地页，WhatsApp 免费选品 + 喂养阶段咨询。",
    thumbnail: babyCareDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "toys-baby",
      subcategory: "baby-care",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "high",
      tone: "emotional",
    },
    draft: babyCareDraft,
  },
  {
    id: "maternity",
    name: "Bloom Maternity",
    industry: "母婴 / 孕产用品",
    tagline: "孕产用品落地页，WhatsApp 免费孕期好物 + 舒适咨询。",
    thumbnail: maternityDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "toys-baby",
      subcategory: "maternity",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "high",
      tone: "emotional",
    },
    draft: maternityDraft,
  },
  {
    id: "outdoor-toy",
    name: "Romp Outdoor",
    industry: "母婴 / 户外玩具",
    tagline: "户外运动玩具落地页，WhatsApp 免费按龄选品 + 活动咨询。",
    thumbnail: outdoorToyDraft.hero.backgroundImage?.src ?? "",
    tier: "t1",
    tags: {
      category: "toys-baby",
      subcategory: "outdoor-toy",
      archetype: "种草留资",
      conversion: ["whatsapp"],
      risk: "low",
      tone: "emotional",
    },
    draft: outdoorToyDraft,
  },
];

export const DEFAULT_TEMPLATE_ID = TEMPLATES[0].id;

/** 按 id 取模板；缺省或未命中时回退默认模板。 */
export function getTemplate(id?: string | null): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
