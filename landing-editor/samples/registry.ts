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

/**
 * 页面范式（数据键，非展示文案）。
 * 展示名见 lib/i18n/dictionaries 下各语言 templates.ts 的 archetype 映射。
 */
export type TemplateArchetype = "seeding" | "consult" | "compare" | "demo";

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

/** 双语文案。品牌名不在此列——它对所有语言相同。 */
export type LocalizedText = { en: string; zh: string };

/** 模板元数据（不含草稿体；草稿体见 registry.drafts.ts）。 */
export interface TemplateMeta {
  /** 唯一标识，作为 /admin/editor?template=<id> 的取值，也是草稿加载器的 key */
  id: string;
  /** 模板名称（选择页卡片标题）。品牌名，不翻译。 */
  name: string;
  /** 行业归类小标签 */
  industry: LocalizedText;
  /** 一句话简介（选择页卡片描述） */
  tagline: LocalizedText;
  /**
   * 模板详情页 SEO 独特简介（每语言 2–4 句）。用于详情页正文首段与 meta，
   * 提供每页真正独特的内容以支撑长尾词收录；留空则由 tagline + 标签派生兜底。
   */
  seoIntro?: LocalizedText;
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
    industry: { en: "Beauty / Skincare", zh: "美妆 / 护肤" },
    tagline: { en: "Skin-consult landing page — visitors claim a free skin analysis over WhatsApp.", zh: "皮肤咨询型落地页，访客经 WhatsApp 领取免费肤质分析。" },
    seoIntro: {
      en: "Aurae Skincare is a landing page template built for skincare brands selling overseas, turning ad traffic into WhatsApp inquiries with a free skin analysis as the hook. The hero leads with skin concerns and the fix, then layers ingredient explainers, genuine before-and-after shots, and customer voices to build trust and guide the opt-in. Made for DTC stores and agencies running skincare, anti-aging, and acne products on Meta or TikTok who want a consult-led, non-transactional capture page.",
      zh: "Aurae Skincare 是一套专为护肤品牌出海获客设计的落地页模板，用「免费肤质分析」作为钩子把广告流量转成 WhatsApp 咨询线索。首屏突出肤质痛点与解决方案，配合成分说明、真实前后对比与用户口碑，逐步建立信任并引导留资。适合通过 Meta / TikTok 投放护肤、抗老、祛痘类产品的独立站与代运营团队，想要「重咨询、轻交易」的获客承接页。",
    },
    thumbnail: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "beauty", subcategory: "skincare", archetype: "seeding", conversion: ["whatsapp"], risk: "medium", tone: "emotional" },
  },
  {
    id: "dental",
    name: "Lumora Dental Studio",
    industry: { en: "Dental / Aesthetics", zh: "牙科 / 医美" },
    tagline: { en: "Dental booking page — free smile assessment plus WhatsApp consultation booking.", zh: "牙科预约型落地页，免费微笑评估 + WhatsApp 预约咨询。" },
    seoIntro: {
      en: "Lumora Dental Studio is a local lead-gen template for dental, oral care, and aesthetic clinics, converting ad clicks into WhatsApp booking inquiries around a free smile assessment. Case comparisons, practitioner credentials, and patient reviews establish professional credibility, while a clear booking path lowers the hesitation barrier. Built for clinics and agencies marketing implants, clear aligners, and whitening — high-ticket services that need local traffic captured as booked inquiries.",
      zh: "Lumora Dental Studio 是面向牙科、口腔与医美诊所的本地获客落地页模板，围绕「免费微笑评估」把广告点击转化为 WhatsApp 预约咨询。页面以案例对比、医生资质与患者评价建立专业背书，用清晰的预约入口降低犹豫门槛。适合做种植牙、隐形正畸、美白等高客单服务的诊所与营销机构，用于承接本地投放并沉淀预约线索。",
    },
    thumbnail: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "medical", subcategory: "dental", archetype: "consult", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "solar",
    name: "Solterra Home Solar",
    industry: { en: "Home improvement / Solar", zh: "家装 / 太阳能" },
    tagline: { en: "Home solar landing page — free on-site assessment and energy-savings consultation.", zh: "家装太阳能落地页，免费上门测评 + 省电方案咨询。" },
    seoIntro: {
      en: "Solterra Home Solar is a high-intent lead capture template for residential solar, storage, and home energy retrofits, turning ad traffic into WhatsApp inquiries and form bookings with a free on-site assessment and savings plan. Savings math, the installation process, and real customer cases make the value concrete, using a rational case to defuse the anxiety of a large upfront spend. Built for solar installers, energy resellers, and home improvement firms running regional campaigns for leads that require an in-person quote.",
      zh: "Solterra Home Solar 是为家用太阳能、储能与家装节能服务打造的高意向获客落地页模板，用「免费上门测评 + 省电方案」把广告流量转成 WhatsApp 咨询与表单预约。页面以省电测算、安装流程与真实客户案例讲清价值，用理性说服打消大额投入的顾虑。适合太阳能安装商、能源代理与家装公司做区域投放，承接需要上门核算的高客单线索。",
    },
    thumbnail: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "home-improvement", subcategory: "solar", archetype: "consult", conversion: ["whatsapp"], risk: "medium", tone: "rational" },
  },
  {
    id: "radiantglow",
    name: "RadiantGlow Beauty",
    industry: { en: "Beauty / Skincare", zh: "美妆 / 护肤" },
    tagline: { en: "Skincare consult page (all 12 sections) — free WhatsApp consult plus before-and-after.", zh: "护肤咨询落地页（含全 12 区块），WhatsApp 免费咨询 + 前后对比。" },
    seoIntro: {
      en: "RadiantGlow Beauty is a content-complete skincare capture template — all 12 marketing sections included — that turns ad traffic into WhatsApp leads through a free skincare consultation. The page walks from pain point and ingredient science through to genuine before-and-after results, customer voices, and FAQs, giving you a full, escalating chain of persuasion. Made for skincare brands and agencies running heavy paid traffic, especially anti-aging and repair products that need a long page to properly educate a visitor.",
      zh: "RadiantGlow Beauty 是一套内容完整（含全 12 个营销区块）的护肤出海获客落地页模板，用免费护肤咨询把广告流量转成 WhatsApp 线索。页面从痛点、成分原理讲到真实前后对比、用户口碑与常见问题，说服链条完整、层层递进。适合护肤品牌与代运营团队做重投放承接，尤其是需要长页面充分教育访客的抗老、修护类产品。",
    },
    thumbnail: "https://images.unsplash.com/photo-1519084278803-b94f11e1c63b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920",
    tier: "t1",
    tags: { category: "beauty", subcategory: "skincare", archetype: "seeding", conversion: ["whatsapp"], risk: "medium", tone: "emotional" },
  },

  // ===== 第一梯队 · 美妆个护 =====
  {
    id: "makeup",
    name: "Velvet Studio Makeup",
    industry: { en: "Beauty / Color cosmetics", zh: "美妆 / 彩妆" },
    tagline: { en: "Makeup shade page — free WhatsApp shade matching and look recommendations.", zh: "彩妆配色落地页，WhatsApp 免费色号匹配 + 妆容方案。" },
    seoIntro: {
      en: "Velvet Studio Makeup is a discovery-capture template for colour cosmetics brands going global, turning ad clicks into WhatsApp inquiries with free shade matching and a look recommendation. Application results, swatch displays, and real customer looks create the discovery atmosphere that gets visitors to opt in for personalised colour advice. Made for lipstick, foundation, and eyeshadow lines running Meta or TikTok campaigns through DTC stores and creator teams.",
      zh: "Velvet Studio Makeup 是面向彩妆品牌出海的种草留资落地页模板，用「免费色号匹配 + 妆容方案」把广告点击转成 WhatsApp 咨询。页面以上妆效果、色卡展示与真实用户妆容建立种草氛围，引导访客留资获取个性化配色建议。适合口红、粉底、眼影等彩妆品类通过 Meta / TikTok 投放的独立站与红人团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "beauty", subcategory: "makeup", archetype: "seeding", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },
  {
    id: "beauty-device",
    name: "Lumio Skin Device",
    industry: { en: "Beauty / At-home devices", zh: "美妆 / 美容仪" },
    tagline: { en: "At-home beauty device page — free WhatsApp care plan and usage guidance.", zh: "家用美容仪落地页，WhatsApp 免费护理方案 + 使用指导。" },
    seoIntro: {
      en: "Lumio Skin Device is a discovery-capture template for at-home beauty devices, turning ad traffic into WhatsApp inquiries with a free care plan and usage guidance. Usage demos, how-it-works explainers, and genuine customer feedback build trust — substituting measured care content for exaggerated efficacy claims, so the page stays both persuasive and compliant. Built for brands and agencies marketing RF, microcurrent, and similar high-ticket devices.",
      zh: "Lumio Skin Device 是为家用美容仪打造的种草留资落地页模板，用「免费护理方案 + 使用指导」把广告流量转成 WhatsApp 咨询。页面以使用演示、原理说明与真实用户反馈建立信任，用理性护理内容替代夸张功效承诺，兼顾说服力与合规。适合射频、微电流、美容仪类高客单产品的品牌与代运营团队承接投放。",
    },
    thumbnail: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "beauty", subcategory: "beauty-device", archetype: "seeding", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "hair-growth",
    name: "Rooted Hair Care",
    industry: { en: "Beauty / Hair & scalp", zh: "美妆 / 生发防脱" },
    tagline: { en: "Scalp care page — free WhatsApp scalp assessment and daily anti-shedding routine.", zh: "头皮护理落地页，WhatsApp 免费头皮评估 + 防脱routine。" },
    seoIntro: {
      en: "Rooted Hair Care is a discovery-capture template for scalp care and anti-shedding products, turning ad traffic into WhatsApp inquiries with a free scalp assessment and daily routine. Scalp-condition education, ingredient explainers, and customer comparisons build trust, with deliberately gentle, non-exaggerated wording that steers clear of efficacy-claim violations. Made for overseas hair serum and anti-shedding care brands and their agencies.",
      zh: "Rooted Hair Care 是面向头皮护理与防脱产品的种草留资落地页模板，用「免费头皮评估 + 防脱日常方案」把广告流量转成 WhatsApp 咨询。页面以头皮问题科普、成分说明与用户对比建立信任，用温和、不夸大的表达规避功效违规风险。适合生发精华、防脱洗护类产品的出海品牌与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "beauty", subcategory: "hair-growth", archetype: "seeding", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "fragrance",
    name: "Maison Brume Fragrance",
    industry: { en: "Beauty / Fragrance", zh: "美妆 / 香水" },
    tagline: { en: "Scent-advisor page — free WhatsApp fragrance guidance and sample picks.", zh: "选香顾问落地页，WhatsApp 免费选香建议 + 小样推荐。" },
    seoIntro: {
      en: "Maison Brume Fragrance is a scent-advisor capture template for perfume brands going global, turning ad traffic into WhatsApp inquiries with free fragrance guidance and sample recommendations. Note stories, occasion pairings, and customer voices set the tone, guiding visitors to opt in for a personalised scent recommendation. Made for niche and salon fragrance lines and gift sets sold through DTC stores and creator marketing teams.",
      zh: "Maison Brume Fragrance 是为香水品牌出海设计的选香顾问型落地页模板，用「免费选香建议 + 小样推荐」把广告流量转成 WhatsApp 咨询。页面以香调故事、场景搭配与用户口碑营造格调，引导访客留资获取个性化选香方案。适合小众香、沙龙香与香氛礼盒类产品的独立站与红人营销团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "beauty", subcategory: "fragrance", archetype: "seeding", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },

  // ===== 第一梯队 · 服饰配饰 =====
  {
    id: "fast-fashion",
    name: "Lunela Style",
    industry: { en: "Apparel / Fast fashion", zh: "服饰 / 快时尚" },
    tagline: { en: "Fast-fashion styling page — free WhatsApp styling plus new-arrival and sizing help.", zh: "快时尚造型落地页，WhatsApp 免费穿搭 + 上新与尺码咨询。" },
    seoIntro: {
      en: "Lunela Style is a discovery-capture template for fast-fashion brands going global, turning ad traffic into WhatsApp leads with free styling advice plus new-arrival and sizing help. Outfit pairings, fresh drops, and genuine customer photos create the discovery atmosphere while defusing the cross-border worries of picking a style and getting the size right. Made for womenswear and trend-led DTC stores and creator teams that need a capture page keeping pace with frequent drops.",
      zh: "Lunela Style 是面向快时尚品牌出海的种草留资落地页模板，用「免费穿搭建议 + 上新与尺码咨询」把广告流量转成 WhatsApp 线索。页面以造型搭配、上新款式与真实买家秀营造种草氛围，降低跨境选款与尺码顾虑并引导留资。适合女装、潮流服饰类独立站与红人团队做高频上新投放承接。",
    },
    thumbnail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "apparel", subcategory: "fast-fashion", archetype: "seeding", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },
  {
    id: "plus-size",
    name: "Curvana",
    industry: { en: "Apparel / Plus size", zh: "服饰 / 大码" },
    tagline: { en: "Plus-size fit page — free WhatsApp fit advice and styling consultation.", zh: "大码合身落地页，WhatsApp 免费合身建议 + 造型咨询。" },
    seoIntro: {
      en: "Curvana is a discovery-capture template built specifically for plus-size apparel going global, turning ad traffic into WhatsApp leads with free fit advice and a styling consultation. Real on-body results across body types, inclusive styling, and customer voices build the trust that settles what plus-size shoppers care about most: whether it will actually fit and flatter. Made for plus-size womenswear and inclusive fashion brands and their agencies.",
      zh: "Curvana 是专为大码服饰出海打造的种草留资落地页模板，用「免费合身建议 + 造型咨询」把广告流量转成 WhatsApp 线索。页面以真实身材上身效果、包容性造型与买家口碑建立信任，打消大码人群最在意的合身与显瘦顾虑。适合大码女装、包容性时尚品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "apparel", subcategory: "plus-size", archetype: "seeding", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },
  {
    id: "activewear",
    name: "Strive Move",
    industry: { en: "Apparel / Activewear", zh: "服饰 / 运动服" },
    tagline: { en: "Yoga and activewear page — free WhatsApp style picks plus fit and training pairing.", zh: "瑜伽运动服落地页，WhatsApp 免费选款 + 合身与训练搭配。" },
    seoIntro: {
      en: "Strive Move is a discovery-capture template for yoga and activewear going global, turning ad traffic into WhatsApp leads with free style picks plus fit and training-pairing advice. Fabric performance, training contexts, and genuine wear feedback make the rational case, helping visitors pick the right piece for the way they actually train. Made for yoga wear, sports bra, and fitness apparel brands selling through DTC stores and agencies.",
      zh: "Strive Move 是面向瑜伽与运动服饰出海的种草留资落地页模板，用「免费选款 + 合身与训练搭配咨询」把广告流量转成 WhatsApp 线索。页面以面料功能、运动场景与真实穿着反馈理性说服，帮访客按训练类型选到合适款式。适合瑜伽服、运动内衣、健身服饰品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "apparel", subcategory: "activewear", archetype: "seeding", conversion: ["whatsapp"], risk: "low", tone: "rational" },
  },
  {
    id: "shapewear",
    name: "Sienne",
    industry: { en: "Apparel / Intimates & shapewear", zh: "服饰 / 内衣塑身" },
    tagline: { en: "Intimates and shapewear page — free WhatsApp fit advice and sizing help.", zh: "内衣塑身落地页，WhatsApp 免费合身建议 + 尺码咨询。" },
    seoIntro: {
      en: "Sienne is a discovery-capture template for intimates and shapewear going global, turning ad traffic into WhatsApp leads with free fit advice and sizing help. On-body results, fabric comfort, and genuine customer feedback build trust, with tactful wording that handles the sensitivity of an intimate category while still guiding the opt-in. Made for shapewear and seamless intimates brands selling through DTC stores and creator teams.",
      zh: "Sienne 是为内衣与塑身衣出海设计的种草留资落地页模板，用「免费合身建议 + 尺码咨询」把广告流量转成 WhatsApp 线索。页面以上身效果、面料舒适度与真实用户反馈建立信任，用得体表达处理贴身品类的敏感度并引导留资。适合塑身衣、无痕内衣类品牌的独立站与红人团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "apparel", subcategory: "shapewear", archetype: "seeding", conversion: ["whatsapp"], risk: "medium", tone: "emotional" },
  },
  {
    id: "footwear",
    name: "Atlas Footwear",
    industry: { en: "Apparel / Footwear", zh: "服饰 / 鞋靴" },
    tagline: { en: "Footwear fit page — free WhatsApp fit advice plus style and sizing help.", zh: "鞋靴合脚落地页，WhatsApp 免费合脚建议 + 选款与尺码咨询。" },
    seoIntro: {
      en: "Atlas Footwear is a discovery-capture template for footwear going global, turning ad traffic into WhatsApp leads with free fit advice plus style and sizing help. Construction details, occasion pairings, and genuine on-foot feedback make the rational case, defusing the single biggest worry in buying shoes cross-border: size and fit. Made for casual shoe, boot, and sneaker DTC stores and agencies capturing paid traffic.",
      zh: "Atlas Footwear 是面向鞋靴出海的种草留资落地页模板，用「免费合脚建议 + 选款与尺码咨询」把广告流量转成 WhatsApp 线索。页面以做工细节、场景搭配与真实上脚反馈理性说服，降低跨境买鞋最大的尺码与合脚顾虑。适合休闲鞋、靴子、运动鞋类独立站与代运营团队承接投放。",
    },
    thumbnail: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "apparel", subcategory: "footwear", archetype: "seeding", conversion: ["whatsapp"], risk: "low", tone: "rational" },
  },

  // ===== 第一梯队 · 3C 数码配件 =====
  {
    id: "phone-case",
    name: "Shieldly Cases",
    industry: { en: "Consumer tech / Cases & screen protection", zh: "3C / 手机壳膜" },
    tagline: { en: "Phone case and screen page — free WhatsApp device matching and protection advice.", zh: "手机壳膜落地页，WhatsApp 免费机型适配 + 防护方案咨询。" },
    seoIntro: {
      en: "Shieldly Cases is a discovery-capture template for phone cases and screen protection going global, turning ad traffic into WhatsApp leads with free device matching and protection advice. Drop tests, material detail, and genuine customer feedback make the rational case, helping visitors pick the right protection for their exact model and how they use it. Made for case, tempered glass, and lens protector accessory brands and their agencies.",
      zh: "Shieldly Cases 是为手机壳膜出海打造的种草留资落地页模板，用「免费机型适配 + 防护方案咨询」把广告流量转成 WhatsApp 线索。页面以防护测试、材质细节与真实用户反馈理性说服，帮访客按机型与使用场景选对壳膜。适合手机壳、钢化膜、镜头膜类配件的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "gadget", subcategory: "phone-case", archetype: "seeding", conversion: ["whatsapp"], risk: "low", tone: "rational" },
  },
  {
    id: "charging",
    name: "Voltway Charging",
    industry: { en: "Consumer tech / Charging & power", zh: "3C / 充电电源" },
    tagline: { en: "Charging and power page — free WhatsApp charging setup and compatibility advice.", zh: "充电电源落地页，WhatsApp 免费充电方案 + 兼容性咨询。" },
    seoIntro: {
      en: "Voltway Charging is a discovery-capture template for charging and power accessories going global, turning ad traffic into WhatsApp leads with a free charging setup and compatibility advice. Wattage specs, safety certifications, and genuine usage feedback make the rational case, helping visitors match the right charging solution to their devices. Made for power bank, GaN charger, and cable brands and the agencies running their campaigns.",
      zh: "Voltway Charging 是面向充电与电源配件出海的种草留资落地页模板，用「免费充电方案 + 兼容性咨询」把广告流量转成 WhatsApp 线索。页面以功率参数、安全认证与真实使用反馈理性说服，帮访客按设备选到合适的充电方案。适合充电宝、氮化镓充电器、数据线类 3C 配件品牌与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "gadget", subcategory: "charging", archetype: "seeding", conversion: ["whatsapp"], risk: "low", tone: "rational" },
  },
  {
    id: "audio",
    name: "Sonara Audio",
    industry: { en: "Consumer tech / Audio", zh: "3C / 耳机音频" },
    tagline: { en: "Headphone and audio page — free WhatsApp buying advice plus fit and sound guidance.", zh: "耳机音频落地页，WhatsApp 免费选购建议 + 适配与音质咨询。" },
    seoIntro: {
      en: "Sonara Audio is a discovery-capture template for headphones and audio products going global, turning ad traffic into WhatsApp leads with free buying advice plus fit and sound guidance. Sound specs, wearing contexts, and genuine listening feedback make the rational case, helping visitors pick the right pair for how they'll actually use them. Made for wireless earbud, noise-cancelling headphone, and speaker brands selling through DTC stores and agencies.",
      zh: "Sonara Audio 是为耳机与音频产品出海设计的种草留资落地页模板，用「免费选购建议 + 适配与音质咨询」把广告流量转成 WhatsApp 线索。页面以音质参数、佩戴场景与真实听感反馈理性说服，帮访客按用途选到合适的耳机。适合无线耳机、降噪耳机、音箱类 3C 品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "gadget", subcategory: "audio", archetype: "seeding", conversion: ["whatsapp"], risk: "low", tone: "rational" },
  },
  {
    id: "wearable",
    name: "Pulse Wearables",
    industry: { en: "Consumer tech / Wearables", zh: "3C / 智能穿戴" },
    tagline: { en: "Wearables page — free WhatsApp style picks plus compatibility and feature guidance.", zh: "智能穿戴落地页，WhatsApp 免费选款 + 适配与功能咨询。" },
    seoIntro: {
      en: "Pulse Wearables is a discovery-capture template for smart wearables going global, turning ad traffic into WhatsApp leads with free style picks plus compatibility and feature guidance. Feature demos, battery life and compatibility notes, and genuine customer feedback make the rational case, helping visitors match a device to their needs — with health readings framed as reference only, never for medical use. Made for smartwatch and fitness band brands and their agencies.",
      zh: "Pulse Wearables 是面向智能穿戴设备出海的种草留资落地页模板，用「免费选款 + 适配与功能咨询」把广告流量转成 WhatsApp 线索。页面以功能演示、续航与兼容性说明及真实用户反馈理性说服，帮访客按需求选对设备（健康数据仅作参考、不作医疗用途）。适合智能手表、手环类品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "gadget", subcategory: "wearable", archetype: "seeding", conversion: ["whatsapp"], risk: "medium", tone: "rational" },
  },
  {
    id: "smart-home",
    name: "Nestly Smart Home",
    industry: { en: "Consumer tech / Smart home", zh: "3C / 智能家居" },
    tagline: { en: "Smart home page — free WhatsApp setup plan and ecosystem compatibility advice.", zh: "智能家居落地页，WhatsApp 免费组网方案 + 生态兼容咨询。" },
    seoIntro: {
      en: "Nestly Smart Home is a discovery-capture template for smart home products going global, turning ad traffic into WhatsApp leads with a free setup plan and ecosystem compatibility advice. Room-by-room demos, ecosystem compatibility, and installation notes make the rational case, clarifying how the devices work together before guiding the opt-in. Made for smart lighting, lock, and sensor brands selling through DTC stores and agencies.",
      zh: "Nestly Smart Home 是为智能家居出海打造的种草留资落地页模板，用「免费组网方案 + 生态兼容咨询」把广告流量转成 WhatsApp 线索。页面以场景演示、生态兼容与安装说明理性说服，帮访客理清设备如何协同并引导留资。适合智能灯具、门锁、传感器等智能家居品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "gadget", subcategory: "smart-home", archetype: "seeding", conversion: ["whatsapp"], risk: "low", tone: "rational" },
  },

  // ===== 第一梯队 · 家居家纺 =====
  {
    id: "storage",
    name: "Tidely Organizing",
    industry: { en: "Home & living / Storage & organising", zh: "家居 / 收纳整理" },
    tagline: { en: "Storage and organising page — free WhatsApp storage plan and space consultation.", zh: "收纳整理落地页，WhatsApp 免费收纳方案 + 空间规划咨询。" },
    seoIntro: {
      en: "Tidely Organizing is a discovery-capture template for storage and organising products going global, turning ad traffic into WhatsApp leads with a free storage plan and space consultation. Before-and-after tidying results, room applications, and genuine customer feedback build trust, tapping the visitor's own clutter frustration and channelling it into an opt-in. Made for storage box, shelving, and organiser brands selling through DTC stores and agencies.",
      zh: "Tidely Organizing 是面向收纳整理用品出海的种草留资落地页模板，用「免费收纳方案 + 空间规划咨询」把广告流量转成 WhatsApp 线索。页面以整理前后对比、场景应用与真实用户反馈建立信任，激发访客的空间焦虑并引导留资。适合收纳盒、置物架、整理神器类家居品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "home", subcategory: "storage", archetype: "seeding", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },
  {
    id: "kitchen",
    name: "Cucina Kitchen",
    industry: { en: "Home & living / Kitchen tools", zh: "家居 / 厨房小工具" },
    tagline: { en: "Kitchen finds page — free WhatsApp product picks plus usage and recipe advice.", zh: "厨房好物落地页，WhatsApp 免费选品 + 用法与食谱咨询。" },
    seoIntro: {
      en: "Cucina Kitchen is a discovery-capture template for kitchen products going global, turning ad traffic into WhatsApp leads with free product picks plus usage and recipe advice. Usage demos, finished-dish results, and genuine buyer feedback create the discovery atmosphere that makes visitors want to try it themselves and opt in. Made for kitchen gadget, bakeware, and creative cookware brands selling through DTC stores and creator teams.",
      zh: "Cucina Kitchen 是为厨房好物出海设计的种草留资落地页模板，用「免费选品 + 用法与食谱咨询」把广告流量转成 WhatsApp 线索。页面以使用演示、成品效果与真实买家反馈营造种草氛围，让访客一看就想上手并留资。适合厨房小工具、烘焙器具、创意餐厨类品牌的独立站与红人团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "home", subcategory: "kitchen", archetype: "seeding", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },
  {
    id: "pet",
    name: "Pawsly Pet Care",
    industry: { en: "Home & living / Pet supplies", zh: "家居 / 宠物用品" },
    tagline: { en: "Pet supplies page — free WhatsApp product picks plus care and behaviour advice.", zh: "宠物用品落地页，WhatsApp 免费选品 + 养护与行为咨询。" },
    seoIntro: {
      en: "Pawsly Pet Care is a discovery-capture template for pet products going global, turning ad traffic into WhatsApp leads with free product picks plus care and behaviour advice. Usage contexts, real pet photography, and genuine owner voices create the emotional resonance that gets visitors to opt in for care guidance. Made for pet treat, toy, and grooming brands selling through DTC stores and agencies.",
      zh: "Pawsly Pet Care 是面向宠物用品出海的种草留资落地页模板，用「免费选品 + 养护与行为咨询」把广告流量转成 WhatsApp 线索。页面以使用场景、萌宠实拍与真实铲屎官口碑营造情感共鸣，引导访客留资获取养护建议。适合宠物零食、玩具、护理用品类品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "home", subcategory: "pet", archetype: "seeding", conversion: ["whatsapp"], risk: "medium", tone: "emotional" },
  },
  {
    id: "garden",
    name: "Verda Garden",
    industry: { en: "Home & living / Garden & outdoor", zh: "家居 / 园艺户外" },
    tagline: { en: "Garden and outdoor page — free WhatsApp yard planning plus planting and tool advice.", zh: "园艺户外落地页，WhatsApp 免费庭院规划 + 植栽与工具咨询。" },
    seoIntro: {
      en: "Verda Garden is a discovery-capture template for garden and outdoor products going global, turning ad traffic into WhatsApp leads with free yard planning plus planting and tool advice. Real garden scenes, growing results, and genuine customer shares create the aspiration that gets visitors to opt in for a planning consultation. Made for garden tool, outdoor planting, and yard decor brands selling through DTC stores and agencies.",
      zh: "Verda Garden 是为园艺与户外用品出海打造的种草留资落地页模板，用「免费庭院规划 + 植栽与工具咨询」把广告流量转成 WhatsApp 线索。页面以庭院实景、种植效果与真实用户分享营造向往感，引导访客留资获取规划建议。适合园艺工具、户外植栽、庭院装饰类品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "home", subcategory: "garden", archetype: "seeding", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },
  {
    id: "bedding",
    name: "Dwell Bedding",
    industry: { en: "Home & living / Bedding & textiles", zh: "家居 / 床品家纺" },
    tagline: { en: "Bedding and textiles page — free WhatsApp product picks plus sleep and fabric advice.", zh: "床品家纺落地页，WhatsApp 免费选品 + 睡眠与面料咨询。" },
    seoIntro: {
      en: "Dwell Bedding is a discovery-capture template for bedding and home textiles going global, turning ad traffic into WhatsApp leads with free product picks plus sleep and fabric advice. Fabric texture, bedroom scenes, and genuine feedback on how it sleeps create the comfort atmosphere that guides visitors to opt in. Made for duvet set, insert, and pillow brands selling through DTC stores and agencies.",
      zh: "Dwell Bedding 是面向床品家纺出海的种草留资落地页模板，用「免费选品 + 睡眠与面料咨询」把广告流量转成 WhatsApp 线索。页面以面料质感、卧室场景与真实用户睡感反馈营造舒适氛围，引导访客留资获取选品建议。适合四件套、被芯、枕头类家纺品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "home", subcategory: "bedding", archetype: "seeding", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },

  // ===== 第一梯队 · 健康保健品 =====
  {
    id: "vitamins",
    name: "Vitae Nutrition",
    industry: { en: "Supplements / Dietary supplements", zh: "保健 / 膳食补充剂" },
    tagline: { en: "Dietary supplement page — free WhatsApp nutrition assessment (strict compliance disclaimers).", zh: "膳食补充剂落地页，WhatsApp 免费营养评估（强合规免责）。" },
    seoIntro: {
      en: "Vitae Nutrition is a discovery-capture template for dietary supplements going global, turning ad traffic into WhatsApp inquiries with a free nutrition assessment. Ingredient explainers, usage contexts, and customer feedback build trust, with strict compliance disclaimers built in — nutrition education and lifestyle guidance only, never a claim to treat disease or deliver a specific outcome. Made for vitamin and supplement brands that need compliant lead capture in tightly regulated markets.",
      zh: "Vitae Nutrition 是面向膳食补充剂出海的种草留资落地页模板，用「免费营养评估」把广告流量转成 WhatsApp 咨询。页面以成分说明、使用场景与用户反馈建立信任，并内置强合规免责表达——只做营养科普与生活方式建议，不作任何疾病治疗或功效承诺。适合维生素、膳食补充类品牌在严监管市场做合规获客的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "supplement", subcategory: "vitamins", archetype: "seeding", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "weight-mgmt",
    name: "Balance Wellness",
    industry: { en: "Supplements / Weight management", zh: "保健 / 体重管理" },
    tagline: { en: "Weight management page — free WhatsApp habit assessment (no slimming claims).", zh: "体重管理落地页，WhatsApp 免费习惯评估（无瘦身承诺）。" },
    seoIntro: {
      en: "Balance Wellness is a discovery-capture template for weight management products going global, turning ad traffic into WhatsApp inquiries with a free habit assessment. The page centres on diet and lifestyle education plus shared customer experience, and explicitly makes no weight-loss or slimming claims, staying clear of efficacy-claim violations. Made for meal replacement, dietary fibre, and weight management brands that need a compliant page to capture paid traffic.",
      zh: "Balance Wellness 是为体重管理类产品出海设计的种草留资落地页模板，用「免费习惯评估」把广告流量转成 WhatsApp 咨询。页面聚焦饮食与生活习惯科普、用户经验分享，明确不作任何减重或瘦身效果承诺，规避功效违规风险。适合代餐、膳食纤维、体重管理类品牌做合规投放承接的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "supplement", subcategory: "weight-mgmt", archetype: "seeding", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "sleep",
    name: "Lull Sleep",
    industry: { en: "Supplements / Sleep", zh: "保健 / 助眠" },
    tagline: { en: "Sleep support page — free WhatsApp sleep assessment (no treatment claims).", zh: "助眠落地页，WhatsApp 免费睡眠评估（无治疗承诺）。" },
    seoIntro: {
      en: "Lull Sleep is a discovery-capture template for sleep support products going global, turning ad traffic into WhatsApp inquiries with a free sleep assessment. Sleep-habit education, relaxation methods, and customer feedback build trust, with no treatment or medical claims made anywhere on the page. Made for sleep gummy, aroma, and sleep-aid brands that need compliant lead capture in tightly regulated markets.",
      zh: "Lull Sleep 是面向助眠类产品出海的种草留资落地页模板，用「免费睡眠评估」把广告流量转成 WhatsApp 咨询。页面以睡眠习惯科普、放松方法与用户反馈建立信任，明确不作任何治疗或医疗功效承诺。适合助眠软糖、香氛、睡眠好物类品牌在严监管市场做合规获客的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1455642305367-68834a1da7ab?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "supplement", subcategory: "sleep", archetype: "seeding", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "joint",
    name: "Mobil Joint Care",
    industry: { en: "Supplements / Joint & bone", zh: "保健 / 关节骨骼" },
    tagline: { en: "Joint and bone page — free WhatsApp mobility assessment (no treatment claims).", zh: "关节骨骼落地页，WhatsApp 免费活动度评估（无治疗承诺）。" },
    seoIntro: {
      en: "Mobil Joint Care is a discovery-capture template for joint and bone health products going global, turning ad traffic into WhatsApp inquiries with a free mobility assessment. Everyday-movement education, ingredient explainers, and customer experience build trust, with no treatment or medical claims made anywhere on the page. Made for joint care and sports recovery supplement brands that need a compliant page to capture paid traffic.",
      zh: "Mobil Joint Care 是为关节与骨骼健康类产品出海打造的种草留资落地页模板，用「免费活动度评估」把广告流量转成 WhatsApp 咨询。页面以日常活动科普、成分说明与用户经验建立信任，明确不作任何治疗或医疗功效承诺。适合关节养护、运动恢复类保健品牌做合规投放承接的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "supplement", subcategory: "joint", archetype: "seeding", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "womens-health",
    name: "Aria Women's Wellness",
    industry: { en: "Supplements / Women's health", zh: "保健 / 女性健康" },
    tagline: { en: "Women's health page — free WhatsApp wellness assessment (strict compliance disclaimers).", zh: "女性健康落地页，WhatsApp 免费健康评估（强合规免责）。" },
    seoIntro: {
      en: "Aria Women's Wellness is a discovery-capture template for women's health products going global, turning ad traffic into WhatsApp inquiries with a free wellness assessment. Health education, ingredient explainers, and customer shares build trust, with strict compliance disclaimers built in — education and lifestyle guidance only, never a claim to treat disease or deliver a specific outcome. Made for women's supplement, cycle care, and prenatal wellness brands that need compliant lead capture.",
      zh: "Aria Women's Wellness 是面向女性健康类产品出海的种草留资落地页模板，用「免费健康评估」把广告流量转成 WhatsApp 咨询。页面以健康科普、成分说明与用户分享建立信任，并内置强合规免责——只做科普与生活方式建议，不作任何疾病治疗或功效承诺。适合女性膳食补充、经期与孕期养护类品牌做合规获客的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "supplement", subcategory: "womens-health", archetype: "seeding", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },

  // ===== 第一梯队 · 玩具母婴 =====
  {
    id: "educational-toy",
    name: "Sprout Play",
    industry: { en: "Toys & baby / Educational toys", zh: "母婴 / 益智玩具" },
    tagline: { en: "Educational toy page — free WhatsApp age-based picks and development advice.", zh: "益智教育玩具落地页，WhatsApp 免费按龄选玩具 + 发展咨询。" },
    seoIntro: {
      en: "Sprout Play is a discovery-capture template for educational toys going global, turning ad traffic into WhatsApp inquiries with free age-based picks and development advice. Play demos, developmental-benefit explainers, and parent voices build trust, helping parents find the right toy for their child's age and opt in. Made for early learning and STEM building toy brands selling through DTC stores and agencies.",
      zh: "Sprout Play 是面向益智教育玩具出海的种草留资落地页模板，用「免费按龄选玩具 + 发展咨询」把广告流量转成 WhatsApp 咨询。页面以玩法演示、能力发展说明与家长口碑建立信任，帮家长按孩子年龄选到合适玩具并留资。适合早教玩具、STEM 积木类品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "toys-baby", subcategory: "educational-toy", archetype: "seeding", conversion: ["whatsapp"], risk: "medium", tone: "emotional" },
  },
  {
    id: "fidget",
    name: "Calmly Sensory",
    industry: { en: "Toys & baby / Sensory toys", zh: "母婴 / 解压玩具" },
    tagline: { en: "Sensory toy page — free WhatsApp product picks plus focus and calming guidance.", zh: "解压玩具落地页，WhatsApp 免费选品 + 专注与舒缓用途咨询。" },
    seoIntro: {
      en: "Calmly Sensory is a discovery-capture template for fidget and sensory toys going global, turning ad traffic into WhatsApp inquiries with free product picks plus focus and calming guidance. Play demos, usage contexts, and genuine customer feedback create the soothing atmosphere that guides visitors to opt in. Made for fidget toy and sensory play brands selling through DTC stores and creator teams.",
      zh: "Calmly Sensory 是为解压与感统玩具出海设计的种草留资落地页模板，用「免费选品 + 专注与舒缓用途咨询」把广告流量转成 WhatsApp 咨询。页面以玩法演示、使用场景与真实用户反馈营造治愈氛围，引导访客留资。适合解压玩具、感统训练类产品的独立站与红人团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "toys-baby", subcategory: "fidget", archetype: "seeding", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },
  {
    id: "baby-care",
    name: "Nido Baby",
    industry: { en: "Toys & baby / Feeding", zh: "母婴 / 婴童喂养" },
    tagline: { en: "Baby feeding page — free WhatsApp product picks and feeding-stage advice.", zh: "婴童喂养用品落地页，WhatsApp 免费选品 + 喂养阶段咨询。" },
    seoIntro: {
      en: "Nido Baby is a discovery-capture template for baby feeding products going global, turning ad traffic into WhatsApp inquiries with free product picks and feeding-stage advice. Safe-material explainers, feeding contexts, and genuine parent voices build trust, with carefully measured wording that respects the sensitivity of the baby category while guiding the opt-in. Made for bottle, weaning tool, and feeding accessory brands and their agencies.",
      zh: "Nido Baby 是面向婴童喂养用品出海的种草留资落地页模板，用「免费选品 + 喂养阶段咨询」把广告流量转成 WhatsApp 咨询。页面以安全材质说明、喂养场景与真实家长口碑建立信任，用审慎表达处理母婴品类的敏感度并引导留资。适合奶瓶、辅食工具、喂养用品类品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "toys-baby", subcategory: "baby-care", archetype: "seeding", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "maternity",
    name: "Bloom Maternity",
    industry: { en: "Toys & baby / Maternity", zh: "母婴 / 孕产用品" },
    tagline: { en: "Maternity page — free WhatsApp pregnancy essentials picks and comfort advice.", zh: "孕产用品落地页，WhatsApp 免费孕期好物 + 舒适咨询。" },
    seoIntro: {
      en: "Bloom Maternity is a discovery-capture template for maternity products going global, turning ad traffic into WhatsApp inquiries with free pregnancy essentials picks and comfort advice. Usage contexts, comfort explainers, and genuine expectant-parent voices build trust, with gentle, careful wording that accompanies people through pregnancy while guiding the opt-in. Made for maternity wear, care, and pregnancy accessory brands selling through DTC stores and agencies.",
      zh: "Bloom Maternity 是为孕产用品出海打造的种草留资落地页模板，用「免费孕期好物推荐 + 舒适咨询」把广告流量转成 WhatsApp 咨询。页面以使用场景、舒适度说明与真实孕妈口碑建立信任，用温和审慎的表达陪伴孕期人群并引导留资。适合孕妇装、护理与孕产周边类品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "toys-baby", subcategory: "maternity", archetype: "seeding", conversion: ["whatsapp"], risk: "high", tone: "emotional" },
  },
  {
    id: "outdoor-toy",
    name: "Romp Outdoor",
    industry: { en: "Toys & baby / Outdoor toys", zh: "母婴 / 户外玩具" },
    tagline: { en: "Outdoor toy page — free WhatsApp age-based picks and activity advice.", zh: "户外运动玩具落地页，WhatsApp 免费按龄选品 + 活动咨询。" },
    seoIntro: {
      en: "Romp Outdoor is a discovery-capture template for outdoor active toys going global, turning ad traffic into WhatsApp inquiries with free age-based picks and activity advice. Play demos, outdoor scenes, and parent voices create the energetic atmosphere that helps parents choose by age and activity type, then opt in. Made for scooter, balance bike, and outdoor active toy brands selling through DTC stores and agencies.",
      zh: "Romp Outdoor 是面向户外运动玩具出海的种草留资落地页模板，用「免费按龄选品 + 活动咨询」把广告流量转成 WhatsApp 咨询。页面以玩法演示、户外场景与家长口碑营造活力氛围，帮家长按年龄与活动类型选品并留资。适合滑板车、平衡车、户外运动玩具类品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "toys-baby", subcategory: "outdoor-toy", archetype: "seeding", conversion: ["whatsapp"], risk: "low", tone: "emotional" },
  },

  // ---------------------------------------------------------------------
  // 第二梯队 · 服务与 B2B 线索
  // 与第一梯队（实物消费品种草）不同，本组品类天然靠留资转化，故多以页内
  // 留资表单为主 CTA（hero.cta 指向 #lead-form），WhatsApp / 电话作次通道。
  // ---------------------------------------------------------------------
  {
    id: "b2b-sourcing",
    name: "Meridian Sourcing",
    industry: { en: "B2B / OEM manufacturing", zh: "B2B / OEM 制造" },
    tagline: { en: "OEM enquiry page — buyers send specs and get an engineer-led quote.", zh: "OEM 询价落地页，采购方提交规格获取工程师报价。" },
    seoIntro: {
      en: "Meridian Sourcing is a request-for-quote template for manufacturers and trading companies selling overseas, turning ad traffic into engineering-qualified enquiries through an on-page RFQ form. Capability lines, staged inspection, and export documentation answer the questions procurement teams actually ask, while an NDA-first stance removes the biggest hesitation buyers have. Built for OEM factories, private-label suppliers, and sourcing agencies running Meta or LinkedIn campaigns that need spec-rich leads rather than casual chats.",
      zh: "Meridian Sourcing 是面向制造企业与外贸公司出海获客的 RFQ 询价落地页模板，用页内询价表单把广告流量转成带规格的工程询盘。页面以产能线、分阶段质检与出口单证回答采购团队真正关心的问题，并以「先签 NDA」打消图纸外泄顾虑。适合 OEM 工厂、贴牌供应商与采购代理投放 Meta / LinkedIn，承接需要规格与数量的高质量线索。",
    },
    thumbnail: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "b2b", subcategory: "oem-manufacturing", archetype: "consult", conversion: ["form", "whatsapp"], risk: "low", tone: "rational" },
  },
  {
    id: "saas-demo",
    name: "Flowlane",
    industry: { en: "B2B / SaaS", zh: "B2B / SaaS" },
    tagline: { en: "SaaS demo booking page — visitors request a live 30-minute session.", zh: "SaaS demo 预约落地页，访客预约 30 分钟实时演示。" },
    seoIntro: {
      en: "Flowlane is a demo-booking template for B2B SaaS going global, turning ad traffic into scheduled sales conversations through an on-page booking form. Outcome metrics, security badges, and an explicitly no-pressure follow-up policy address the two things buyers weigh before giving up their calendar: is this real, and will I be chased. Made for operations, logistics, and workflow SaaS teams running paid acquisition who need qualified demo requests rather than raw newsletter signups.",
      zh: "Flowlane 是面向出海 B2B SaaS 的 demo 预约落地页模板，用页内预约表单把广告流量转成有排期的销售对话。页面以成效数据、安全合规徽章与「不追着推销」的明确承诺，回应买家交出日历前最在意的两件事：是否靠谱、会不会被骚扰。适合运营、物流与流程类 SaaS 团队做付费投放，承接合格的演示预约而非泛泛订阅。",
    },
    thumbnail: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "b2b", subcategory: "saas-demo", archetype: "demo", conversion: ["form", "email"], risk: "low", tone: "rational" },
  },
  {
    id: "study-abroad",
    name: "Northbridge Education",
    industry: { en: "Education / Study abroad", zh: "教育 / 留学" },
    tagline: { en: "Study abroad page — free WhatsApp course shortlist and study plan.", zh: "留学咨询落地页，WhatsApp 免费选校规划与学习计划。" },
    seoIntro: {
      en: "Northbridge Education is a consultation template for study-abroad and language-training agencies, turning ad traffic into WhatsApp enquiries around a free personalised study plan. Course shortlists, entry requirements, and honest timelines replace brochure-speak, while an explicit no-guarantee stance keeps the page compliant in a category where overpromising is rife. Built for education agencies and language schools running Meta or TikTok campaigns that need students to start a real conversation, not just download a PDF.",
      zh: "Northbridge Education 是面向留学与语言培训机构的咨询留资落地页模板，围绕「免费个性化学习计划」把广告流量转成 WhatsApp 咨询。页面用选校清单、入学要求与真实时间线取代宣传册话术，并明确写出「无人能保证录取」，在这个普遍夸大承诺的品类里守住合规底线。适合留学中介与语言学校投放 Meta / TikTok，承接愿意真正开口咨询的学生线索。",
    },
    thumbnail: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "education", subcategory: "study-abroad", archetype: "consult", conversion: ["whatsapp", "form"], risk: "medium", tone: "emotional" },
  },
  {
    id: "immigration-law",
    name: "Vantage Immigration",
    industry: { en: "Legal / Immigration", zh: "法律 / 移民" },
    tagline: { en: "Immigration consultation page — free written case assessment by form.", zh: "移民咨询落地页，表单提交获取免费书面案情评估。" },
    seoIntro: {
      en: "Vantage Immigration is a case-assessment template for immigration and legal practices, turning ad traffic into qualified consultation requests through an on-page assessment form. Eligibility reads, realistic timelines, and document checklists give applicants something concrete before they commit, while explicit disclaimers state that no outcome is guaranteed and that submitting the form creates no client relationship. Built for regulated practitioners and legal firms advertising in a high-scrutiny category where compliant, non-promissory copy is the difference between a running campaign and a banned one.",
      zh: "Vantage Immigration 是面向移民与法律服务机构的案情评估落地页模板，用页内评估表单把广告流量转成合格咨询线索。页面以资格判断、真实处理时长与材料清单，让申请人在付出任何成本前先拿到实在信息；同时明确声明「无人能保证获批」「提交表单不构成委托关系」。适合持牌顾问与律所在高审查品类投放——在这里，不作承诺的合规文案就是账号能否活下来的分界线。",
    },
    thumbnail: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "legal", subcategory: "immigration", archetype: "consult", conversion: ["form", "phone"], risk: "high", tone: "rational" },
  },
  {
    id: "home-cleaning",
    name: "Brightline Home Services",
    industry: { en: "Local services / Home cleaning", zh: "本地服务 / 家庭保洁" },
    tagline: { en: "Home cleaning page — send photos on WhatsApp, get a quote and a slot.", zh: "家庭保洁落地页，WhatsApp 发照片即获报价与可约时段。" },
    seoIntro: {
      en: "Brightline Home Services is a quote-request template for local service businesses, turning neighbourhood ad traffic into WhatsApp enquiries by asking only for photos and a postcode. Vetted-and-insured badges, an agreed checklist, and a no-deposit booking policy remove the trust barriers that stop people letting a stranger into their home. Made for cleaning, maintenance, and home-service operators running local campaigns who need bookable jobs rather than browsing traffic.",
      zh: "Brightline Home Services 是面向本地生活服务商家的上门报价落地页模板，只要照片和邮编就能把周边投放流量转成 WhatsApp 询价。页面用背调保险徽章、事先确认的清洁清单与「无需预付定金」打消让陌生人进家门的顾虑。适合保洁、维修与到家服务商家做本地投放，承接能直接排期的真实订单线索。",
    },
    thumbnail: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "local-service", subcategory: "home-cleaning", archetype: "consult", conversion: ["whatsapp", "form"], risk: "low", tone: "rational" },
  },
];

export const DEFAULT_TEMPLATE_ID = TEMPLATES[0].id;

/** 按 id 取模板元数据；缺省或未命中时回退默认模板。 */
export function getTemplate(id?: string | null): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
