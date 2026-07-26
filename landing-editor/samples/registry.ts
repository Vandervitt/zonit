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
  /**
   * 模板详情页 SEO 独特简介（2–4 句中文）。用于详情页正文首段与 meta，
   * 提供每页真正独特的内容以支撑长尾词收录；留空则由 tagline + 标签派生兜底。
   */
  seoIntro?: string;
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
    seoIntro:
      "Aurae Skincare 是一套专为护肤品牌出海获客设计的落地页模板，用「免费肤质分析」作为钩子把广告流量转成 WhatsApp 咨询线索。首屏突出肤质痛点与解决方案，配合成分说明、真实前后对比与用户口碑，逐步建立信任并引导留资。适合通过 Meta / TikTok 投放护肤、抗老、祛痘类产品的独立站与代运营团队，想要「重咨询、轻交易」的获客承接页。",
    thumbnail: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "beauty", subcategory: "skincare", archetype: "种草留资", conversion: ["whatsapp"], risk: "medium", tone: "emotional" },
  },
  {
    id: "dental",
    name: "Lumora Dental Studio",
    industry: "牙科 / 医美",
    tagline: "牙科预约型落地页，免费微笑评估 + WhatsApp 预约咨询。",
    seoIntro:
      "Lumora Dental Studio 是面向牙科、口腔与医美诊所的本地获客落地页模板，围绕「免费微笑评估」把广告点击转化为 WhatsApp 预约咨询。页面以案例对比、医生资质与患者评价建立专业背书，用清晰的预约入口降低犹豫门槛。适合做种植牙、隐形正畸、美白等高客单服务的诊所与营销机构，用于承接本地投放并沉淀预约线索。",
    thumbnail: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "medical", subcategory: "dental", archetype: "预约咨询", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "solar",
    name: "Solterra Home Solar",
    industry: "家装 / 太阳能",
    tagline: "家装太阳能落地页，免费上门测评 + 省电方案咨询。",
    seoIntro:
      "Solterra Home Solar 是为家用太阳能、储能与家装节能服务打造的高意向获客落地页模板，用「免费上门测评 + 省电方案」把广告流量转成 WhatsApp 咨询与表单预约。页面以省电测算、安装流程与真实客户案例讲清价值，用理性说服打消大额投入的顾虑。适合太阳能安装商、能源代理与家装公司做区域投放，承接需要上门核算的高客单线索。",
    thumbnail: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "home-improvement", subcategory: "solar", archetype: "预约咨询", conversion: ["whatsapp", "form"], risk: "medium", tone: "rational" },
  },
  {
    id: "radiantglow",
    name: "RadiantGlow Beauty",
    industry: "美妆 / 护肤",
    tagline: "护肤咨询落地页（含全 12 区块），WhatsApp 免费咨询 + 前后对比。",
    seoIntro:
      "RadiantGlow Beauty 是一套内容完整（含全 12 个营销区块）的护肤出海获客落地页模板，用免费护肤咨询把广告流量转成 WhatsApp 线索。页面从痛点、成分原理讲到真实前后对比、用户口碑与常见问题，说服链条完整、层层递进。适合护肤品牌与代运营团队做重投放承接，尤其是需要长页面充分教育访客的抗老、修护类产品。",
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
    seoIntro:
      "Velvet Studio Makeup 是面向彩妆品牌出海的种草留资落地页模板，用「免费色号匹配 + 妆容方案」把广告点击转成 WhatsApp 咨询。页面以上妆效果、色卡展示与真实用户妆容建立种草氛围，引导访客留资获取个性化配色建议。适合口红、粉底、眼影等彩妆品类通过 Meta / TikTok 投放的独立站与红人团队。",
    thumbnail: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "beauty", subcategory: "makeup", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },
  {
    id: "beauty-device",
    name: "Lumio Skin Device",
    industry: "美妆 / 美容仪",
    tagline: "家用美容仪落地页，WhatsApp 免费护理方案 + 使用指导。",
    seoIntro:
      "Lumio Skin Device 是为家用美容仪打造的种草留资落地页模板，用「免费护理方案 + 使用指导」把广告流量转成 WhatsApp 咨询。页面以使用演示、原理说明与真实用户反馈建立信任，用理性护理内容替代夸张功效承诺，兼顾说服力与合规。适合射频、微电流、美容仪类高客单产品的品牌与代运营团队承接投放。",
    thumbnail: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "beauty", subcategory: "beauty-device", archetype: "种草留资", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "hair-growth",
    name: "Rooted Hair Care",
    industry: "美妆 / 生发防脱",
    tagline: "头皮护理落地页，WhatsApp 免费头皮评估 + 防脱routine。",
    seoIntro:
      "Rooted Hair Care 是面向头皮护理与防脱产品的种草留资落地页模板，用「免费头皮评估 + 防脱日常方案」把广告流量转成 WhatsApp 咨询。页面以头皮问题科普、成分说明与用户对比建立信任，用温和、不夸大的表达规避功效违规风险。适合生发精华、防脱洗护类产品的出海品牌与代运营团队。",
    thumbnail: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "beauty", subcategory: "hair-growth", archetype: "种草留资", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "fragrance",
    name: "Maison Brume Fragrance",
    industry: "美妆 / 香水",
    tagline: "选香顾问落地页，WhatsApp 免费选香建议 + 小样推荐。",
    seoIntro:
      "Maison Brume Fragrance 是为香水品牌出海设计的选香顾问型落地页模板，用「免费选香建议 + 小样推荐」把广告流量转成 WhatsApp 咨询。页面以香调故事、场景搭配与用户口碑营造格调，引导访客留资获取个性化选香方案。适合小众香、沙龙香与香氛礼盒类产品的独立站与红人营销团队。",
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
    seoIntro:
      "Lunela Style 是面向快时尚品牌出海的种草留资落地页模板，用「免费穿搭建议 + 上新与尺码咨询」把广告流量转成 WhatsApp 线索。页面以造型搭配、上新款式与真实买家秀营造种草氛围，降低跨境选款与尺码顾虑并引导留资。适合女装、潮流服饰类独立站与红人团队做高频上新投放承接。",
    thumbnail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "apparel", subcategory: "fast-fashion", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },
  {
    id: "plus-size",
    name: "Curvana",
    industry: "服饰 / 大码",
    tagline: "大码合身落地页，WhatsApp 免费合身建议 + 造型咨询。",
    seoIntro:
      "Curvana 是专为大码服饰出海打造的种草留资落地页模板，用「免费合身建议 + 造型咨询」把广告流量转成 WhatsApp 线索。页面以真实身材上身效果、包容性造型与买家口碑建立信任，打消大码人群最在意的合身与显瘦顾虑。适合大码女装、包容性时尚品牌的独立站与代运营团队。",
    thumbnail: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "apparel", subcategory: "plus-size", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },
  {
    id: "activewear",
    name: "Strive Move",
    industry: "服饰 / 运动服",
    tagline: "瑜伽运动服落地页，WhatsApp 免费选款 + 合身与训练搭配。",
    seoIntro:
      "Strive Move 是面向瑜伽与运动服饰出海的种草留资落地页模板，用「免费选款 + 合身与训练搭配咨询」把广告流量转成 WhatsApp 线索。页面以面料功能、运动场景与真实穿着反馈理性说服，帮访客按训练类型选到合适款式。适合瑜伽服、运动内衣、健身服饰品牌的独立站与代运营团队。",
    thumbnail: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "apparel", subcategory: "activewear", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "rational" },
  },
  {
    id: "shapewear",
    name: "Sienne",
    industry: "服饰 / 内衣塑身",
    tagline: "内衣塑身落地页，WhatsApp 免费合身建议 + 尺码咨询。",
    seoIntro:
      "Sienne 是为内衣与塑身衣出海设计的种草留资落地页模板，用「免费合身建议 + 尺码咨询」把广告流量转成 WhatsApp 线索。页面以上身效果、面料舒适度与真实用户反馈建立信任，用得体表达处理贴身品类的敏感度并引导留资。适合塑身衣、无痕内衣类品牌的独立站与红人团队。",
    thumbnail: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "apparel", subcategory: "shapewear", archetype: "种草留资", conversion: ["whatsapp"], risk: "medium", tone: "emotional" },
  },
  {
    id: "footwear",
    name: "Atlas Footwear",
    industry: "服饰 / 鞋靴",
    tagline: "鞋靴合脚落地页，WhatsApp 免费合脚建议 + 选款与尺码咨询。",
    seoIntro:
      "Atlas Footwear 是面向鞋靴出海的种草留资落地页模板，用「免费合脚建议 + 选款与尺码咨询」把广告流量转成 WhatsApp 线索。页面以做工细节、场景搭配与真实上脚反馈理性说服，降低跨境买鞋最大的尺码与合脚顾虑。适合休闲鞋、靴子、运动鞋类独立站与代运营团队承接投放。",
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
    seoIntro:
      "Shieldly Cases 是为手机壳膜出海打造的种草留资落地页模板，用「免费机型适配 + 防护方案咨询」把广告流量转成 WhatsApp 线索。页面以防护测试、材质细节与真实用户反馈理性说服，帮访客按机型与使用场景选对壳膜。适合手机壳、钢化膜、镜头膜类配件的独立站与代运营团队。",
    thumbnail: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "gadget", subcategory: "phone-case", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "rational" },
  },
  {
    id: "charging",
    name: "Voltway Charging",
    industry: "3C / 充电电源",
    tagline: "充电电源落地页，WhatsApp 免费充电方案 + 兼容性咨询。",
    seoIntro:
      "Voltway Charging 是面向充电与电源配件出海的种草留资落地页模板，用「免费充电方案 + 兼容性咨询」把广告流量转成 WhatsApp 线索。页面以功率参数、安全认证与真实使用反馈理性说服，帮访客按设备选到合适的充电方案。适合充电宝、氮化镓充电器、数据线类 3C 配件品牌与代运营团队。",
    thumbnail: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "gadget", subcategory: "charging", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "rational" },
  },
  {
    id: "audio",
    name: "Sonara Audio",
    industry: "3C / 耳机音频",
    tagline: "耳机音频落地页，WhatsApp 免费选购建议 + 适配与音质咨询。",
    seoIntro:
      "Sonara Audio 是为耳机与音频产品出海设计的种草留资落地页模板，用「免费选购建议 + 适配与音质咨询」把广告流量转成 WhatsApp 线索。页面以音质参数、佩戴场景与真实听感反馈理性说服，帮访客按用途选到合适的耳机。适合无线耳机、降噪耳机、音箱类 3C 品牌的独立站与代运营团队。",
    thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "gadget", subcategory: "audio", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "rational" },
  },
  {
    id: "wearable",
    name: "Pulse Wearables",
    industry: "3C / 智能穿戴",
    tagline: "智能穿戴落地页，WhatsApp 免费选款 + 适配与功能咨询。",
    seoIntro:
      "Pulse Wearables 是面向智能穿戴设备出海的种草留资落地页模板，用「免费选款 + 适配与功能咨询」把广告流量转成 WhatsApp 线索。页面以功能演示、续航与兼容性说明及真实用户反馈理性说服，帮访客按需求选对设备（健康数据仅作参考、不作医疗用途）。适合智能手表、手环类品牌的独立站与代运营团队。",
    thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "gadget", subcategory: "wearable", archetype: "种草留资", conversion: ["whatsapp"], risk: "medium", tone: "rational" },
  },
  {
    id: "smart-home",
    name: "Nestly Smart Home",
    industry: "3C / 智能家居",
    tagline: "智能家居落地页，WhatsApp 免费组网方案 + 生态兼容咨询。",
    seoIntro:
      "Nestly Smart Home 是为智能家居出海打造的种草留资落地页模板，用「免费组网方案 + 生态兼容咨询」把广告流量转成 WhatsApp 线索。页面以场景演示、生态兼容与安装说明理性说服，帮访客理清设备如何协同并引导留资。适合智能灯具、门锁、传感器等智能家居品牌的独立站与代运营团队。",
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
    seoIntro:
      "Tidely Organizing 是面向收纳整理用品出海的种草留资落地页模板，用「免费收纳方案 + 空间规划咨询」把广告流量转成 WhatsApp 线索。页面以整理前后对比、场景应用与真实用户反馈建立信任，激发访客的空间焦虑并引导留资。适合收纳盒、置物架、整理神器类家居品牌的独立站与代运营团队。",
    thumbnail: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "home", subcategory: "storage", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },
  {
    id: "kitchen",
    name: "Cucina Kitchen",
    industry: "家居 / 厨房小工具",
    tagline: "厨房好物落地页，WhatsApp 免费选品 + 用法与食谱咨询。",
    seoIntro:
      "Cucina Kitchen 是为厨房好物出海设计的种草留资落地页模板，用「免费选品 + 用法与食谱咨询」把广告流量转成 WhatsApp 线索。页面以使用演示、成品效果与真实买家反馈营造种草氛围，让访客一看就想上手并留资。适合厨房小工具、烘焙器具、创意餐厨类品牌的独立站与红人团队。",
    thumbnail: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "home", subcategory: "kitchen", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },
  {
    id: "pet",
    name: "Pawsly Pet Care",
    industry: "家居 / 宠物用品",
    tagline: "宠物用品落地页，WhatsApp 免费选品 + 养护与行为咨询。",
    seoIntro:
      "Pawsly Pet Care 是面向宠物用品出海的种草留资落地页模板，用「免费选品 + 养护与行为咨询」把广告流量转成 WhatsApp 线索。页面以使用场景、萌宠实拍与真实铲屎官口碑营造情感共鸣，引导访客留资获取养护建议。适合宠物零食、玩具、护理用品类品牌的独立站与代运营团队。",
    thumbnail: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "home", subcategory: "pet", archetype: "种草留资", conversion: ["whatsapp"], risk: "medium", tone: "emotional" },
  },
  {
    id: "garden",
    name: "Verda Garden",
    industry: "家居 / 园艺户外",
    tagline: "园艺户外落地页，WhatsApp 免费庭院规划 + 植栽与工具咨询。",
    seoIntro:
      "Verda Garden 是为园艺与户外用品出海打造的种草留资落地页模板，用「免费庭院规划 + 植栽与工具咨询」把广告流量转成 WhatsApp 线索。页面以庭院实景、种植效果与真实用户分享营造向往感，引导访客留资获取规划建议。适合园艺工具、户外植栽、庭院装饰类品牌的独立站与代运营团队。",
    thumbnail: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "home", subcategory: "garden", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },
  {
    id: "bedding",
    name: "Dwell Bedding",
    industry: "家居 / 床品家纺",
    tagline: "床品家纺落地页，WhatsApp 免费选品 + 睡眠与面料咨询。",
    seoIntro:
      "Dwell Bedding 是面向床品家纺出海的种草留资落地页模板，用「免费选品 + 睡眠与面料咨询」把广告流量转成 WhatsApp 线索。页面以面料质感、卧室场景与真实用户睡感反馈营造舒适氛围，引导访客留资获取选品建议。适合四件套、被芯、枕头类家纺品牌的独立站与代运营团队。",
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
    seoIntro:
      "Vitae Nutrition 是面向膳食补充剂出海的种草留资落地页模板，用「免费营养评估」把广告流量转成 WhatsApp 咨询。页面以成分说明、使用场景与用户反馈建立信任，并内置强合规免责表达——只做营养科普与生活方式建议，不作任何疾病治疗或功效承诺。适合维生素、膳食补充类品牌在严监管市场做合规获客的独立站与代运营团队。",
    thumbnail: "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "supplement", subcategory: "vitamins", archetype: "种草留资", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "weight-mgmt",
    name: "Balance Wellness",
    industry: "保健 / 体重管理",
    tagline: "体重管理落地页，WhatsApp 免费习惯评估（无瘦身承诺）。",
    seoIntro:
      "Balance Wellness 是为体重管理类产品出海设计的种草留资落地页模板，用「免费习惯评估」把广告流量转成 WhatsApp 咨询。页面聚焦饮食与生活习惯科普、用户经验分享，明确不作任何减重或瘦身效果承诺，规避功效违规风险。适合代餐、膳食纤维、体重管理类品牌做合规投放承接的独立站与代运营团队。",
    thumbnail: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "supplement", subcategory: "weight-mgmt", archetype: "种草留资", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "sleep",
    name: "Lull Sleep",
    industry: "保健 / 助眠",
    tagline: "助眠落地页，WhatsApp 免费睡眠评估（无治疗承诺）。",
    seoIntro:
      "Lull Sleep 是面向助眠类产品出海的种草留资落地页模板，用「免费睡眠评估」把广告流量转成 WhatsApp 咨询。页面以睡眠习惯科普、放松方法与用户反馈建立信任，明确不作任何治疗或医疗功效承诺。适合助眠软糖、香氛、睡眠好物类品牌在严监管市场做合规获客的独立站与代运营团队。",
    thumbnail: "https://images.unsplash.com/photo-1455642305367-68834a1da7ab?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "supplement", subcategory: "sleep", archetype: "种草留资", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "joint",
    name: "Mobil Joint Care",
    industry: "保健 / 关节骨骼",
    tagline: "关节骨骼落地页，WhatsApp 免费活动度评估（无治疗承诺）。",
    seoIntro:
      "Mobil Joint Care 是为关节与骨骼健康类产品出海打造的种草留资落地页模板，用「免费活动度评估」把广告流量转成 WhatsApp 咨询。页面以日常活动科普、成分说明与用户经验建立信任，明确不作任何治疗或医疗功效承诺。适合关节养护、运动恢复类保健品牌做合规投放承接的独立站与代运营团队。",
    thumbnail: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "supplement", subcategory: "joint", archetype: "种草留资", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "womens-health",
    name: "Aria Women's Wellness",
    industry: "保健 / 女性健康",
    tagline: "女性健康落地页，WhatsApp 免费健康评估（强合规免责）。",
    seoIntro:
      "Aria Women's Wellness 是面向女性健康类产品出海的种草留资落地页模板，用「免费健康评估」把广告流量转成 WhatsApp 咨询。页面以健康科普、成分说明与用户分享建立信任，并内置强合规免责——只做科普与生活方式建议，不作任何疾病治疗或功效承诺。适合女性膳食补充、经期与孕期养护类品牌做合规获客的独立站与代运营团队。",
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
    seoIntro:
      "Sprout Play 是面向益智教育玩具出海的种草留资落地页模板，用「免费按龄选玩具 + 发展咨询」把广告流量转成 WhatsApp 咨询。页面以玩法演示、能力发展说明与家长口碑建立信任，帮家长按孩子年龄选到合适玩具并留资。适合早教玩具、STEM 积木类品牌的独立站与代运营团队。",
    thumbnail: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "toys-baby", subcategory: "educational-toy", archetype: "种草留资", conversion: ["whatsapp"], risk: "medium", tone: "emotional" },
  },
  {
    id: "fidget",
    name: "Calmly Sensory",
    industry: "母婴 / 解压玩具",
    tagline: "解压玩具落地页，WhatsApp 免费选品 + 专注与舒缓用途咨询。",
    seoIntro:
      "Calmly Sensory 是为解压与感统玩具出海设计的种草留资落地页模板，用「免费选品 + 专注与舒缓用途咨询」把广告流量转成 WhatsApp 咨询。页面以玩法演示、使用场景与真实用户反馈营造治愈氛围，引导访客留资。适合解压玩具、感统训练类产品的独立站与红人团队。",
    thumbnail: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "toys-baby", subcategory: "fidget", archetype: "种草留资", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },
  {
    id: "baby-care",
    name: "Nido Baby",
    industry: "母婴 / 婴童喂养",
    tagline: "婴童喂养用品落地页，WhatsApp 免费选品 + 喂养阶段咨询。",
    seoIntro:
      "Nido Baby 是面向婴童喂养用品出海的种草留资落地页模板，用「免费选品 + 喂养阶段咨询」把广告流量转成 WhatsApp 咨询。页面以安全材质说明、喂养场景与真实家长口碑建立信任，用审慎表达处理母婴品类的敏感度并引导留资。适合奶瓶、辅食工具、喂养用品类品牌的独立站与代运营团队。",
    thumbnail: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "toys-baby", subcategory: "baby-care", archetype: "种草留资", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "maternity",
    name: "Bloom Maternity",
    industry: "母婴 / 孕产用品",
    tagline: "孕产用品落地页，WhatsApp 免费孕期好物 + 舒适咨询。",
    seoIntro:
      "Bloom Maternity 是为孕产用品出海打造的种草留资落地页模板，用「免费孕期好物推荐 + 舒适咨询」把广告流量转成 WhatsApp 咨询。页面以使用场景、舒适度说明与真实孕妈口碑建立信任，用温和审慎的表达陪伴孕期人群并引导留资。适合孕妇装、护理与孕产周边类品牌的独立站与代运营团队。",
    thumbnail: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "toys-baby", subcategory: "maternity", archetype: "种草留资", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "outdoor-toy",
    name: "Romp Outdoor",
    industry: "母婴 / 户外玩具",
    tagline: "户外运动玩具落地页，WhatsApp 免费按龄选品 + 活动咨询。",
    seoIntro:
      "Romp Outdoor 是面向户外运动玩具出海的种草留资落地页模板，用「免费按龄选品 + 活动咨询」把广告流量转成 WhatsApp 咨询。页面以玩法演示、户外场景与家长口碑营造活力氛围，帮家长按年龄与活动类型选品并留资。适合滑板车、平衡车、户外运动玩具类品牌的独立站与代运营团队。",
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
