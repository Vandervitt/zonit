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
      en: "A skincare visitor arrives with one concern and one question: do you understand it well enough to be worth a reply. Aurae leads with the concern rather than the product, offers a free skin analysis as the reason to start talking, and backs it with ingredient explainers, unretouched before-and-afters, and customer voices. Made for DTC stores and agencies running skincare, anti-aging, and acne products on Meta or TikTok who want a consult-led, non-transactional capture page.",
      zh: "护肤访客带着一个具体困扰而来，心里只有一个问题：你是否足够理解它，值得他回一句话。Aurae 以困扰而非产品开场，用「免费肤质分析」给出开口的理由，再以成分讲解、未修图的前后对比与用户原声把信任垫起来。。适合通过 Meta / TikTok 投放护肤、抗老、祛痘类产品的独立站与代运营团队，想要「重咨询、轻交易」的获客承接页。",
    },
    thumbnail: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "beauty", subcategory: "skincare", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "medium", tone: "emotional" },
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
    tags: { category: "medical", subcategory: "dental", archetype: "consult", conversion: ["whatsapp", "form"], risk: "high", tone: "emotional" },
  },
  {
    id: "solar",
    name: "Solterra Home Solar",
    industry: { en: "Home improvement / Solar", zh: "家装 / 太阳能" },
    tagline: { en: "Home solar landing page — free on-site assessment and energy-savings consultation.", zh: "家装太阳能落地页，免费上门测评 + 省电方案咨询。" },
    seoIntro: {
      en: "Nothing in home solar can be quoted honestly without seeing the roof, so Solterra is built to earn a survey booking rather than close a sale. Savings maths with its assumptions stated, the installation process step by step, and real local cases defuse the anxiety of a large upfront spend. Built for solar installers, energy resellers, and home improvement firms running regional campaigns for leads that require an in-person quote.",
      zh: "家用太阳能不上门看过屋顶就没法诚实报价，所以 Solterra 的目标是拿到一次勘测预约，而不是当场成交。写明假设前提的省电测算、逐步拆解的安装流程与本地真实案例，一起化解大额投入的顾虑。。适合太阳能安装商、能源代理与家装公司做区域投放，承接需要上门核算的高客单线索。",
    },
    thumbnail: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "home-improvement", subcategory: "solar", archetype: "consult", conversion: ["whatsapp", "form"], risk: "medium", tone: "rational" },
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
    tags: { category: "beauty", subcategory: "skincare", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "medium", tone: "emotional" },
  },

  // ===== 第一梯队 · 美妆个护 =====
  {
    id: "makeup",
    name: "Velvet Studio Makeup",
    industry: { en: "Beauty / Color cosmetics", zh: "美妆 / 彩妆" },
    tagline: { en: "Makeup shade page — free WhatsApp shade matching and look recommendations.", zh: "彩妆配色落地页，WhatsApp 免费色号匹配 + 妆容方案。" },
    seoIntro: {
      en: "Shade matching is the doubt that decides a colour cosmetics purchase, and a person answers it far better than a chart does. Velvet Studio opens with free shade matching and a look recommendation, using application results, swatch walls across skin tones, and real customer looks to make that offer credible. Made for lipstick, foundation, and eyeshadow lines running Meta or TikTok campaigns through DTC stores and creator teams.",
      zh: "色号是决定彩妆购买的那个疑虑，而它由真人解答远比一张色卡表有效。Velvet Studio 以「免费色号匹配 + 妆容方案」开场，用上妆效果、覆盖多种肤色的色卡墙与真实用户妆容，让这个承诺显得可信。。适合口红、粉底、眼影等彩妆品类通过 Meta / TikTok 投放的独立站与红人团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "beauty", subcategory: "makeup", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "low", tone: "emotional" },
  },
  {
    id: "beauty-device",
    name: "Lumio Skin Device",
    industry: { en: "Beauty / At-home devices", zh: "美妆 / 美容仪" },
    tagline: { en: "At-home beauty device page — free WhatsApp care plan and usage guidance.", zh: "家用美容仪落地页，WhatsApp 免费护理方案 + 使用指导。" },
    seoIntro: {
      en: "At-home devices sell on mechanism, not on promises — outcomes vary too much per person to put on a public page. Lumio explains how the device works, demonstrates the routine, and converts on a free care plan over chat, which is where individual results can be discussed responsibly. Built for brands and agencies marketing RF, microcurrent, and similar high-ticket devices.",
      zh: "家用美容仪靠原理而不是靠承诺——效果因人差异太大，不适合写在公开页面上。Lumio 讲清仪器怎么工作、演示护理流程，并以聊天里的「免费护理方案」完成转化——个体效果该在那里被负责任地讨论。。适合射频、微电流、美容仪类高客单产品的品牌与代运营团队承接投放。",
    },
    thumbnail: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "beauty", subcategory: "beauty-device", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "high", tone: "emotional" },
  },
  {
    id: "hair-growth",
    name: "Rooted Hair Care",
    industry: { en: "Beauty / Hair & scalp", zh: "美妆 / 生发防脱" },
    tagline: { en: "Scalp care page — free WhatsApp scalp assessment and daily anti-shedding routine.", zh: "头皮护理落地页，WhatsApp 免费头皮评估 + 防脱routine。" },
    seoIntro: {
      en: "In hair loss the most persuasive version of the copy is also the non-compliant one, so Rooted deliberately stays on scalp condition and daily routine. A free scalp assessment carries the conversion, moving the results conversation into a private reply where it can be qualified case by case. Made for hair serum and anti-shedding care brands and the agencies running them.",
      zh: "在脱发这个类目里，最有说服力的写法恰恰是最不合规的那种，所以 Rooted 刻意只谈头皮状况与日常护理。承担转化的是免费头皮评估——它把效果讨论移进私下回复，逐个案例确认。。适合生发精华、防脱洗护类产品的品牌与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "beauty", subcategory: "hair-growth", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "high", tone: "emotional" },
  },
  {
    id: "fragrance",
    name: "Maison Brume Fragrance",
    industry: { en: "Beauty / Fragrance", zh: "美妆 / 香水" },
    tagline: { en: "Scent-advisor page — free WhatsApp fragrance guidance and sample picks.", zh: "选香顾问落地页，WhatsApp 免费选香建议 + 小样推荐。" },
    seoIntro: {
      en: "Nobody can smell a landing page, so Maison Brume sells the recommendation instead of the bottle. Note stories and occasion pairings let a visitor recognise themselves, and a personalised scent suggestion with sample picks turns that recognition into a conversation. Made for niche and salon fragrance lines and gift sets sold through DTC stores and creator marketing teams.",
      zh: "没人能闻到落地页，所以 Maison Brume 卖的是「推荐」而不是那瓶香水。香调故事与场景搭配让访客对号入座，再用个性化选香建议与小样推荐，把这份共鸣变成一段对话。。适合小众香、沙龙香与香氛礼盒类产品的独立站与红人营销团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "beauty", subcategory: "fragrance", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "low", tone: "emotional" },
  },

  // ===== 第一梯队 · 服饰配饰 =====
  {
    id: "fast-fashion",
    name: "Lunela Style",
    industry: { en: "Apparel / Fast fashion", zh: "服饰 / 快时尚" },
    tagline: { en: "Fast-fashion styling page — free WhatsApp styling plus new-arrival and sizing help.", zh: "快时尚造型落地页，WhatsApp 免费穿搭 + 上新与尺码咨询。" },
    seoIntro: {
      en: "Trend-led stores live or die on how fast the page keeps up, so Lunela isolates new arrivals as the only block you touch and leaves the rest stable. Outfit pairings and genuine customer photos carry the discovery, while free styling advice absorbs the size and style questions — including the sizing conventions that differ market to market — that would otherwise end the visit. Made for womenswear and trend-led DTC stores and creator teams that need a capture page keeping pace with frequent drops.",
      zh: "趋势驱动的店铺，成败取决于页面跟不跟得上，所以 Lunela 把「上新」独立成唯一需要动的区块，其余保持稳定。造型搭配与真实买家秀负责种草，「免费穿搭建议」则接住那些原本会终结访问的选款与尺码问题——包括各市场尺码标准不一致带来的那部分。。适合女装、潮流服饰类独立站与红人团队做高频上新投放承接。",
    },
    thumbnail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "apparel", subcategory: "fast-fashion", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "low", tone: "emotional" },
  },
  {
    id: "plus-size",
    name: "Curvana",
    industry: { en: "Apparel / Plus size", zh: "服饰 / 大码" },
    tagline: { en: "Plus-size fit page — free WhatsApp fit advice and styling consultation.", zh: "大码合身落地页，WhatsApp 免费合身建议 + 造型咨询。" },
    seoIntro: {
      en: "Fit is the doubt that stops the purchase, and plus-size shoppers have been let down by size charts before. Curvana leads with fit rather than styling, shows the same garment on genuinely different body types with the size worn stated, and converts on free fit advice. Made for plus-size womenswear and inclusive fashion brands and their agencies.",
      zh: "拦住购买的是「合不合身」，而大码顾客已经被尺码表辜负过太多次。Curvana 先讲合身、后讲穿搭，用同一件衣服在真正不同体型上的实穿图并标明所穿尺码，再以「免费合身建议」完成转化。。适合大码女装、包容性时尚品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "apparel", subcategory: "plus-size", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "low", tone: "emotional" },
  },
  {
    id: "activewear",
    name: "Strive Move",
    industry: { en: "Apparel / Activewear", zh: "服饰 / 运动服" },
    tagline: { en: "Yoga and activewear page — free WhatsApp style picks plus fit and training pairing.", zh: "瑜伽运动服落地页，WhatsApp 免费选款 + 合身与训练搭配。" },
    seoIntro: {
      en: "Looks bring the click and performance closes the doubt, which is the order Strive Move puts them in. Fabric claims stay specific enough to be checkable, and free style picks turn a size question into a training question — easier to answer well, and far more revealing about the buyer. Made for yoga wear, sports bra, and fitness apparel brands selling through DTC stores and agencies.",
      zh: "好看带来点击，性能打消疑虑——Strive Move 用的就是这个顺序。面料说法具体到可以被验证，而「免费选款」把尺码问题变成训练场景问题：更容易答好，也更能看清这个买家。。适合瑜伽服、运动内衣、健身服饰品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "apparel", subcategory: "activewear", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "low", tone: "rational" },
  },
  {
    id: "shapewear",
    name: "Sienne",
    industry: { en: "Apparel / Intimates & shapewear", zh: "服饰 / 内衣塑身" },
    tagline: { en: "Intimates and shapewear page — free WhatsApp fit advice and sizing help.", zh: "内衣塑身落地页，WhatsApp 免费合身建议 + 尺码咨询。" },
    seoIntro: {
      en: "An intimate category needs copy that is candid without being intrusive, so Sienne keeps the page factual about fabric and construction and moves anything about the body into a private reply. On-body results and genuine feedback carry the trust; free fit advice carries the conversion. Made for shapewear and seamless intimates brands selling through DTC stores and creator teams.",
      zh: "贴身品类需要坦率而不冒犯的表达，所以 Sienne 页面上只讲面料与剪裁这些事实，把一切与身材有关的话题留给私下回复。上身效果与真实反馈负责建立信任，「免费合身建议」负责转化。。适合塑身衣、无痕内衣类品牌的独立站与红人团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "apparel", subcategory: "shapewear", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "medium", tone: "emotional" },
  },
  {
    id: "footwear",
    name: "Atlas Footwear",
    industry: { en: "Apparel / Footwear", zh: "服饰 / 鞋靴" },
    tagline: { en: "Footwear fit page — free WhatsApp fit advice plus style and sizing help.", zh: "鞋靴合脚落地页，WhatsApp 免费合脚建议 + 选款与尺码咨询。" },
    seoIntro: {
      en: "Sizing runs differently in every brand, so Atlas converts on a fit conversation instead of publishing a conversion chart and hoping. Construction details a buyer feels in the first week — sole flex, insole support, break-in — carry the rational case alongside genuine on-foot feedback, and the fit conversation is what makes buying shoes from another market survivable at all. Made for casual shoe, boot, and sneaker DTC stores and agencies capturing paid traffic.",
      zh: "各家鞋码都不一样，所以 Atlas 靠一次「合脚对话」完成转化，而不是贴张换算表听天由命。买家第一周就能感受到的做工细节——鞋底柔韧、鞋垫支撑、磨合期——与真实上脚反馈一起完成理性说服；而跨市场买鞋之所以还能成立，靠的正是这场合脚对话。。适合休闲鞋、靴子、运动鞋类独立站与代运营团队承接投放。",
    },
    thumbnail: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "apparel", subcategory: "footwear", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "low", tone: "rational" },
  },

  // ===== 第一梯队 · 3C 数码配件 =====
  {
    id: "phone-case",
    name: "Shieldly Cases",
    industry: { en: "Consumer tech / Cases & screen protection", zh: "3C / 手机壳膜" },
    tagline: { en: "Phone case and screen page — free WhatsApp device matching and protection advice.", zh: "手机壳膜落地页，WhatsApp 免费机型适配 + 防护方案咨询。" },
    seoIntro: {
      en: "Compatibility is a yes-or-no question, so Shieldly asks for the device model before anything else and treats everything after that as a recommendation. Drop tests with the actual footage, material detail, and genuine feedback help a visitor pick protection that matches how they really use the phone. Made for case, tempered glass, and lens protector accessory brands and their agencies.",
      zh: "兼容性是个是非题，所以 Shieldly 一上来就问机型，之后的一切都作为推荐来处理。带真实录像的防摔测试、材质细节与用户反馈，帮访客按自己真正的使用方式选对壳膜。。适合手机壳、钢化膜、镜头膜类配件的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "gadget", subcategory: "phone-case", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "low", tone: "rational" },
  },
  {
    id: "charging",
    name: "Voltway Charging",
    industry: { en: "Consumer tech / Charging & power", zh: "3C / 充电电源" },
    tagline: { en: "Charging and power page — free WhatsApp charging setup and compatibility advice.", zh: "充电电源落地页，WhatsApp 免费充电方案 + 兼容性咨询。" },
    seoIntro: {
      en: "Charging specs filter out most of the people who would have bought, so Voltway leads with what the number means — time to full, how many charges, whether it runs a laptop — and keeps wattage and protocol detail below. Free setup advice turns a product question into a situation question. Made for power bank, GaN charger, and cable brands and the agencies running their campaigns.",
      zh: "参数会把大部分本来会买的人筛掉，所以 Voltway 先讲数字的含义——多久充满、能充几次、带不带得动笔电——把瓦数与协议细节放在下方。「免费充电方案」则把产品问题变成场景问题。。适合充电宝、氮化镓充电器、数据线类 3C 配件品牌与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "gadget", subcategory: "charging", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "low", tone: "rational" },
  },
  {
    id: "audio",
    name: "Sonara Audio",
    industry: { en: "Consumer tech / Audio", zh: "3C / 耳机音频" },
    tagline: { en: "Headphone and audio page — free WhatsApp buying advice plus fit and sound guidance.", zh: "耳机音频落地页，WhatsApp 免费选购建议 + 适配与音质咨询。" },
    seoIntro: {
      en: "Sound cannot be demonstrated on a page, so Sonara convinces through use case and fit instead: which environment, how it handles a commute or a call, whether it stays in during exercise. Free buying advice picks up the question a spec sheet was never going to answer. Made for wireless earbud, noise-cancelling headphone, and speaker brands selling through DTC stores and agencies.",
      zh: "音质在页面上没法演示，所以 Sonara 改从使用场景与佩戴切入：用在什么环境、通勤和通话表现如何、运动时会不会掉。「免费选购建议」接住的，正是参数表永远答不了的那个问题。。适合无线耳机、降噪耳机、音箱类 3C 品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "gadget", subcategory: "audio", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "low", tone: "rational" },
  },
  {
    id: "wearable",
    name: "Pulse Wearables",
    industry: { en: "Consumer tech / Wearables", zh: "3C / 智能穿戴" },
    tagline: { en: "Wearables page — free WhatsApp style picks plus compatibility and feature guidance.", zh: "智能穿戴落地页，WhatsApp 免费选款 + 适配与功能咨询。" },
    seoIntro: {
      en: "A wearable that will not pair with the visitor's phone is not a purchase at any price, so Pulse puts compatibility in the first screen. Feature demos and battery notes make the case, with health readings framed as reference only and never as medical monitoring. Made for smartwatch and fitness band brands and their agencies.",
      zh: "一块无法与访客手机配对的设备，多便宜都不会被买，所以 Pulse 把兼容性放进首屏。功能演示与续航说明完成说服，健康数据一律标注为仅供参考，绝不写成医疗监测。。适合智能手表、手环类品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "gadget", subcategory: "wearable", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "medium", tone: "rational" },
  },
  {
    id: "smart-home",
    name: "Nestly Smart Home",
    industry: { en: "Consumer tech / Smart home", zh: "3C / 智能家居" },
    tagline: { en: "Smart home page — free WhatsApp setup plan and ecosystem compatibility advice.", zh: "智能家居落地页，WhatsApp 免费组网方案 + 生态兼容咨询。" },
    seoIntro: {
      en: "Almost nobody buys one smart home device — they buy a working arrangement, so Nestly converts on a free setup plan rather than on a product. Room-by-room demos, named ecosystem compatibility, and installation notes clarify how the pieces work together before the visitor commits. Made for smart lighting, lock, and sensor brands selling through DTC stores and agencies.",
      zh: "几乎没人只买一件智能家居设备——他们买的是一套能用起来的组合，所以 Nestly 的转化点是「免费组网方案」而不是某个产品。分场景演示、明确写出的生态兼容与安装说明，先把设备如何协同讲清楚。。适合智能灯具、门锁、传感器等智能家居品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "gadget", subcategory: "smart-home", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "low", tone: "rational" },
  },

  // ===== 第一梯队 · 家居家纺 =====
  {
    id: "storage",
    name: "Tidely Organizing",
    industry: { en: "Home & living / Storage & organising", zh: "家居 / 收纳整理" },
    tagline: { en: "Storage and organising page — free WhatsApp storage plan and space consultation.", zh: "收纳整理落地页，WhatsApp 免费收纳方案 + 空间规划咨询。" },
    seoIntro: {
      en: "The free storage plan exists to get a photo of the actual space, because that is the only way to recommend with confidence. Tidely pairs honest before-and-after room shots with room-by-room applications, tapping the visitor's own clutter frustration and channelling it into a conversation. Made for storage box, shelving, and organiser brands selling through DTC stores and agencies.",
      zh: "「免费收纳方案」的存在是为了换来一张真实空间的照片——那是唯一能让推荐变得笃定的方式。Tidely 用诚实的房间前后对比配合分场景应用，把访客自己的空间焦虑导向一次对话。。适合收纳盒、置物架、整理神器类家居品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "home", subcategory: "storage", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "low", tone: "emotional" },
  },
  {
    id: "kitchen",
    name: "Cucina Kitchen",
    industry: { en: "Home & living / Kitchen tools", zh: "家居 / 厨房小工具" },
    tagline: { en: "Kitchen finds page — free WhatsApp product picks plus usage and recipe advice.", zh: "厨房好物落地页，WhatsApp 免费选品 + 用法与食谱咨询。" },
    seoIntro: {
      en: "A kitchen tool is bought for a dish, not for its specifications, so Cucina asks what the visitor cooks and recommends from there. Usage demos and finished-dish results create the pull, while hob and appliance compatibility facts sit on the page to stop the most common return in the category. Made for kitchen gadget, bakeware, and creative cookware brands selling through DTC stores and creator teams.",
      zh: "厨房用具是为了某道菜而买的，不是为了参数，所以 Cucina 先问访客常做什么菜，再据此推荐。使用演示与成品效果负责勾人，灶具与电器兼容信息则明确写在页面上，挡掉这个类目最常见的退货。。适合厨房小工具、烘焙器具、创意餐厨类品牌的独立站与红人团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "home", subcategory: "kitchen", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "low", tone: "emotional" },
  },
  {
    id: "pet",
    name: "Pawsly Pet Care",
    industry: { en: "Home & living / Pet supplies", zh: "家居 / 宠物用品" },
    tagline: { en: "Pet supplies page — free WhatsApp product picks plus care and behaviour advice.", zh: "宠物用品落地页，WhatsApp 免费选品 + 养护与行为咨询。" },
    seoIntro: {
      en: "Breed, age, and weight change the recommendation more than any product feature does, so Pawsly asks about the animal before the product. Real pet photography and genuine owner voices carry the emotional pull, with health questions routed to a vet rather than answered on the page. Made for pet treat, toy, and grooming brands selling through DTC stores and agencies.",
      zh: "品种、年龄和体重对推荐结果的影响大过任何产品参数，所以 Pawsly 先问宠物、后问产品。萌宠实拍与真实铲屎官口碑营造情感共鸣，健康问题一律引向兽医，不在页面上作答。。适合宠物零食、玩具、护理用品类品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "home", subcategory: "pet", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "medium", tone: "emotional" },
  },
  {
    id: "garden",
    name: "Verda Garden",
    industry: { en: "Home & living / Garden & outdoor", zh: "家居 / 园艺户外" },
    tagline: { en: "Garden and outdoor page — free WhatsApp yard planning plus planting and tool advice.", zh: "园艺户外落地页，WhatsApp 免费庭院规划 + 植栽与工具咨询。" },
    seoIntro: {
      en: "Garden demand swings hard by season, so Verda keeps the yard-planning hook constant and rotates only what the plan is about. Real garden scenes and growing results create the aspiration, and the planning conversation collects the space, sun, and time commitment that make a recommendation useful. Made for garden tool, outdoor planting, and yard decor brands selling through DTC stores and agencies.",
      zh: "园艺需求随季节剧烈波动，所以 Verda 保持「庭院规划」这个钩子不变，只轮换规划的主题。庭院实景与种植效果营造向往感，规划对话则收集面积、日照与愿意投入的时间——这些才让推荐有用。。适合园艺工具、户外植栽、庭院装饰类品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "home", subcategory: "garden", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "low", tone: "emotional" },
  },
  {
    id: "bedding",
    name: "Dwell Bedding",
    industry: { en: "Home & living / Bedding & textiles", zh: "家居 / 床品家纺" },
    tagline: { en: "Bedding and textiles page — free WhatsApp product picks plus sleep and fabric advice.", zh: "床品家纺落地页，WhatsApp 免费选品 + 睡眠与面料咨询。" },
    seoIntro: {
      en: "Bedding is judged on how it sleeps, not on a number on the label, so Dwell leads with temperature, texture, and how the fabric behaves after ten washes. Bedroom scenes and genuine sleep feedback build the comfort case, and the conversation about bed size usually surfaces two or three gaps at once. Made for duvet set, insert, and pillow brands selling through DTC stores and agencies.",
      zh: "床品的评判标准是「睡起来什么感觉」，不是标签上的数字，所以 Dwell 先讲控温、手感和洗过十次之后的表现。卧室场景与真实睡感反馈完成舒适度说服，而关于床型的对话通常一次就能问出两三处缺口。。适合四件套、被芯、枕头类家纺品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "home", subcategory: "bedding", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "low", tone: "emotional" },
  },

  // ===== 第一梯队 · 健康保健品 =====
  {
    id: "vitamins",
    name: "Vitae Nutrition",
    industry: { en: "Supplements / Dietary supplements", zh: "保健 / 膳食补充剂" },
    tagline: { en: "Dietary supplement page — free WhatsApp nutrition assessment (strict compliance disclaimers).", zh: "膳食补充剂落地页，WhatsApp 免费营养评估（强合规免责）。" },
    seoIntro: {
      en: "In supplements the fastest-converting copy is also the copy that gets accounts restricted, so Vitae converts through mechanism and credibility rather than through outcomes. Ingredient explainers and usage contexts carry the page, qualifiers sit beside each statement rather than pooled in the footer, and a free nutrition assessment moves the individual conversation off the public page. Made for vitamin and supplement brands that need compliant lead capture in tightly regulated markets.",
      zh: "保健品里转化最快的写法，恰恰也是让账户受限的那种，所以 Vitae 改走机制与可信度的路线。成分讲解与使用场景撑起页面，限定语放在每处表述旁边而不是堆在页脚，「免费营养评估」则把个体沟通移出公开页面。。适合维生素、膳食补充类品牌在严监管市场做合规获客的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "supplement", subcategory: "vitamins", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "high", tone: "emotional" },
  },
  {
    id: "weight-mgmt",
    name: "Balance Wellness",
    industry: { en: "Supplements / Weight management", zh: "保健 / 体重管理" },
    tagline: { en: "Weight management page — free WhatsApp habit assessment (no slimming claims).", zh: "体重管理落地页，WhatsApp 免费习惯评估（无瘦身承诺）。" },
    seoIntro: {
      en: "Balance sells habit rather than outcome, because every outcome-led version of this pitch is either unprovable or unapprovable. Diet and lifestyle education plus shared customer experience carry the page, with no weight-loss claims and no body transformation imagery anywhere on it. Made for meal replacement, dietary fibre, and weight management brands that need a compliant page to capture paid traffic.",
      zh: "Balance 卖的是「习惯」而不是「结果」，因为这个类目里所有结果导向的说法，不是无法举证就是无法过审。饮食与生活习惯科普加上用户经验分享撑起页面，全页不作任何减重承诺，也不放身材变化对比图。。适合代餐、膳食纤维、体重管理类品牌做合规投放承接的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "supplement", subcategory: "weight-mgmt", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "high", tone: "emotional" },
  },
  {
    id: "sleep",
    name: "Lull Sleep",
    industry: { en: "Supplements / Sleep", zh: "保健 / 助眠" },
    tagline: { en: "Sleep support page — free WhatsApp sleep assessment (no treatment claims).", zh: "助眠落地页，WhatsApp 免费睡眠评估（无治疗承诺）。" },
    seoIntro: {
      en: "Lull talks about routine and environment rather than about a condition, which is exactly where sleep pages usually cross the line. Wind-down habits, light, and timing carry the education, and a free sleep assessment collects the four specifics that make a reply worth reading. Made for sleep gummy, aroma, and sleep-aid brands that need compliant lead capture in tightly regulated markets.",
      zh: "Lull 谈的是作息与环境而不是病症——睡眠类页面通常就是在这里越界的。睡前习惯、光线与时间安排承担科普，「免费睡眠评估」则收集那四项让回复值得一读的具体信息。。适合助眠软糖、香氛、睡眠好物类品牌在严监管市场做合规获客的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1455642305367-68834a1da7ab?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "supplement", subcategory: "sleep", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "high", tone: "emotional" },
  },
  {
    id: "joint",
    name: "Mobil Joint Care",
    industry: { en: "Supplements / Joint & bone", zh: "保健 / 关节骨骼" },
    tagline: { en: "Joint and bone page — free WhatsApp mobility assessment (no treatment claims).", zh: "关节骨骼落地页，WhatsApp 免费活动度评估（无治疗承诺）。" },
    seoIntro: {
      en: "This audience skews older, so type size, contrast, and a visible phone option stop being polish and become conversion factors. Mobil stays on mobility and daily activity rather than naming conditions, using everyday-movement education and customer experience to make the case without asserting a medical effect. Made for joint care and sports recovery supplement brands that need a compliant page to capture paid traffic.",
      zh: "这个受众偏年长，所以字号、对比度和显眼的电话入口不再是打磨细节，而是转化因素。Mobil 只谈活动能力与日常，不指名疾病——用日常活动科普与用户经验完成说服，不主张医疗效果。。适合关节养护、运动恢复类保健品牌做合规投放承接的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "supplement", subcategory: "joint", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "high", tone: "emotional" },
  },
  {
    id: "womens-health",
    name: "Aria Women's Wellness",
    industry: { en: "Supplements / Women's health", zh: "保健 / 女性健康" },
    tagline: { en: "Women's health page — free WhatsApp wellness assessment (strict compliance disclaimers).", zh: "女性健康落地页，WhatsApp 免费健康评估（强合规免责）。" },
    seoIntro: {
      en: "These topics sit closest to regulated medical territory, and several are restricted advertising categories in their own right. Aria names the subject plainly and keeps the claims narrow, putting qualifiers next to every statement and moving the outcome discussion into a private wellness assessment. Made for women's supplement, cycle care, and prenatal wellness brands that need compliant lead capture.",
      zh: "这些话题离受监管的医疗范畴最近，其中几项本身就是广告受限类目。Aria 把话题直白讲清、把宣称收窄，每处表述旁边都带限定语，并把效果讨论移进私下的健康评估里。。适合女性膳食补充、经期与孕期养护类品牌做合规获客的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "supplement", subcategory: "womens-health", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "high", tone: "emotional" },
  },

  // ===== 第一梯队 · 玩具母婴 =====
  {
    id: "educational-toy",
    name: "Sprout Play",
    industry: { en: "Toys & baby / Educational toys", zh: "母婴 / 益智玩具" },
    tagline: { en: "Educational toy page — free WhatsApp age-based picks and development advice.", zh: "益智教育玩具落地页，WhatsApp 免费按龄选玩具 + 发展咨询。" },
    seoIntro: {
      en: "Naming the skill and the age band is what convinces here; 'boosts intelligence' is what parents and ad reviewers have both learned to distrust. Sprout Play pairs play demos with specific developmental benefits and parent voices, and converts on an age-based recommendation that qualifies the lead in a single question. Made for early learning and STEM building toy brands selling through DTC stores and agencies.",
      zh: "在这里，点明「锻炼哪项能力、适合哪个年龄」才有说服力；「开发智力」则是家长和广告审核都已学会不信的说法。Sprout Play 把玩法演示与具体的发展益处、家长口碑放在一起，并以「按龄推荐」完成转化——一个问题就筛清了线索。。适合早教玩具、STEM 积木类品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "toys-baby", subcategory: "educational-toy", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "medium", tone: "emotional" },
  },
  {
    id: "fidget",
    name: "Calmly Sensory",
    industry: { en: "Toys & baby / Sensory toys", zh: "母婴 / 解压玩具" },
    tagline: { en: "Sensory toy page — free WhatsApp product picks plus focus and calming guidance.", zh: "解压玩具落地页，WhatsApp 免费选品 + 专注与舒缓用途咨询。" },
    seoIntro: {
      en: "Sensory toys are often bought for a diagnosed need, so Calmly describes what the toy does — texture, resistance, repetition — without claiming it addresses a condition. Play demos and usage contexts create the calm the category promises, and the recommendation conversation serves parents and adult desk buyers equally well. Made for fidget toy and sensory play brands selling through DTC stores and creator teams.",
      zh: "感统玩具常因确诊需求而被购买，所以 Calmly 只描述玩具本身做了什么——材质、阻力、重复动作——不宣称它能应对某种状况。玩法演示与使用场景营造出这个类目承诺的平静感，而推荐对话对家长和成年买家同样成立。。适合解压玩具、感统训练类产品的独立站与红人团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "toys-baby", subcategory: "fidget", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "low", tone: "emotional" },
  },
  {
    id: "baby-care",
    name: "Nido Baby",
    industry: { en: "Toys & baby / Feeding", zh: "母婴 / 婴童喂养" },
    tagline: { en: "Baby feeding page — free WhatsApp product picks and feeding-stage advice.", zh: "婴童喂养用品落地页，WhatsApp 免费选品 + 喂养阶段咨询。" },
    seoIntro: {
      en: "Parents check safety before they read a single benefit, so Nido puts materials, certifications, and age grading above the product photos rather than below them. Feeding contexts and genuine parent voices carry the trust, and the stage question qualifies the lead while telling you when the next need arrives. Made for bottle, weaning tool, and feeding accessory brands and their agencies.",
      zh: "家长在读任何一条卖点之前先确认安全，所以 Nido 把材质、认证与适用年龄放在产品图上方而不是下方。喂养场景与真实家长口碑建立信任，而「处于哪个阶段」这个问题既筛选了线索，也告诉你下一次需求什么时候到。。适合奶瓶、辅食工具、喂养用品类品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "toys-baby", subcategory: "baby-care", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "high", tone: "emotional" },
  },
  {
    id: "maternity",
    name: "Bloom Maternity",
    industry: { en: "Toys & baby / Maternity", zh: "母婴 / 孕产用品" },
    tagline: { en: "Maternity page — free WhatsApp pregnancy essentials picks and comfort advice.", zh: "孕产用品落地页，WhatsApp 免费孕期好物 + 舒适咨询。" },
    seoIntro: {
      en: "Pregnancy copy has to be useful without assuming how the pregnancy will go, so Bloom stays on comfort and practicality and avoids anything implying a health outcome. Trimester-based recommendations give the visitor a reason to say where they are, which is the least intrusive qualifying question this category allows. Made for maternity wear, care, and pregnancy accessory brands selling through DTC stores and agencies.",
      zh: "孕产文案要有用，又不能默认孕程会如何发展，所以 Bloom 只谈舒适与实用，回避任何暗示健康作用的表述。按孕期阶段推荐，让访客有理由说出自己所处的阶段——这是这个类目里最不冒犯的筛选问题。。适合孕妇装、护理与孕产周边类品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "toys-baby", subcategory: "maternity", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "high", tone: "emotional" },
  },
  {
    id: "outdoor-toy",
    name: "Romp Outdoor",
    industry: { en: "Toys & baby / Outdoor toys", zh: "母婴 / 户外玩具" },
    tagline: { en: "Outdoor toy page — free WhatsApp age-based picks and activity advice.", zh: "户外运动玩具落地页，WhatsApp 免费按龄选品 + 活动咨询。" },
    seoIntro: {
      en: "Outdoor play carries fall risk, so Romp puts supervision guidance, weight and height limits, and surface requirements where a cautious parent will actually see them. Play demos and outdoor scenes create the energy, and the activity advice rotates with the season so the page stays current without being rebuilt every spring. Made for scooter, balance bike, and outdoor active toy brands selling through DTC stores and agencies.",
      zh: "户外玩耍有跌落风险，所以 Romp 把看护提示、承重与身高限制、场地要求放在谨慎家长真正看得到的位置。玩法演示与户外场景营造活力，活动建议随季节轮换——页面因此常新，不必每年春天重做一次。。适合滑板车、平衡车、户外运动玩具类品牌的独立站与代运营团队。",
    },
    thumbnail: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1600&q=80",
    tier: "t1",
    tags: { category: "toys-baby", subcategory: "outdoor-toy", archetype: "seeding", conversion: ["whatsapp", "form"], risk: "low", tone: "emotional" },
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
      en: "A procurement team decides whether you are a credible supplier before they will spend a reply, so Meridian front-loads capability rather than brand story. The on-page RFQ asks for specification, volume, destination, and timeline so the first response can be a quote; capability lines, staged inspection, and export documentation answer what procurement actually asks, and an NDA-first stance removes the biggest hesitation buyers have. Built for OEM factories, private-label suppliers, and sourcing agencies running Meta or LinkedIn campaigns that need spec-rich leads rather than casual chats.",
      zh: "采购团队要先判断你是不是可信的供应商，才肯花一次回复，所以 Meridian 把「能力」前置，而不是先讲品牌故事。页内询价表单收集规格、数量、目的地与时间，让第一次回复就能是报价；产能线、分阶段质检与出口单证回答采购真正关心的问题，「先签 NDA」则打消图纸外泄这个最大顾虑。。适合 OEM 工厂、贴牌供应商与采购代理投放 Meta / LinkedIn，承接需要规格与数量的高质量线索。",
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
      en: "A live 30-minute session is expensive to staff, so Flowlane gates it behind a short qualifying form rather than an open calendar — a few fields buy back more sales time than they cost in submissions. Outcome metrics, security badges, and an explicitly no-pressure follow-up policy address the two things buyers weigh before giving up their calendar: is this real, and will I be chased. Made for operations, logistics, and workflow SaaS teams running paid acquisition who need qualified demo requests rather than raw newsletter signups.",
      zh: "30 分钟的真人演示成本很高，所以 Flowlane 用一张简短的资格表单而不是开放日程来承接——几个字段省下的销售时间，多过它损失的提交量。成效数据、安全合规徽章与「不追着推销」的明确承诺，回应买家交出日历前最在意的两件事：是否靠谱、会不会被骚扰。。适合运营、物流与流程类 SaaS 团队做付费投放，承接合格的演示预约而非泛泛订阅。",
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
      en: "Education decisions are slow, expensive, and usually made by someone other than the student, so Northbridge is built around a low-commitment first step: a free personalised study plan. Course shortlists, entry requirements, and honest timelines replace brochure-speak, and an explicit no-guarantee stance keeps the page compliant in a category where overpromising is rife. Built for education agencies and language schools running Meta or TikTok campaigns that need students to start a real conversation, not just download a PDF.",
      zh: "教育决策周期长、金额大，而且拍板的往往不是学生本人，所以 Northbridge 围绕一个低门槛的第一步来搭：免费个性化学习计划。选校清单、入学要求与真实时间线取代宣传册话术，并明确写出「无人能保证录取」——在这个普遍夸大承诺的品类里守住合规底线。。适合留学中介与语言学校投放 Meta / TikTok，承接愿意真正开口咨询的学生线索。",
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
      en: "Someone looking for legal help wants to know whether their case is viable and whether this firm handles cases like theirs, so Vantage answers the second directly and converts the first into an assessment. The on-page form collects case facts rather than returning a verdict; eligibility reads, realistic timelines, and document checklists give applicants something concrete, while explicit disclaimers state that no outcome is guaranteed and that submitting the form creates no client relationship. Built for regulated practitioners and legal firms advertising in a high-scrutiny category where compliant, non-promissory copy is the difference between a running campaign and a banned one.",
      zh: "来找法律帮助的人想弄清两件事：案子有没有可能，以及这家机构办不办这类案子。Vantage 直接回答第二件，把第一件转化成一次评估。页内表单只收集案件事实、不给结论；资格判断、真实处理时长与材料清单让申请人先拿到实在信息；同时明确声明「无人能保证获批」「提交表单不构成委托关系」。。适合持牌顾问与律所在高审查品类投放——在这里，不作承诺的合规文案就是账号能否活下来的分界线。",
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
  {
    id: "industrial-equipment",
    name: "Axelon Machinery",
    industry: { en: "B2B / Industrial equipment", zh: "B2B / 工业设备" },
    tagline: { en: "Machinery enquiry page — buyers get a configuration proposal and sample run.", zh: "工业设备询价落地页，提交产能参数获取选型方案与试机。" },
    seoIntro: {
      en: "Machinery is a months-long evaluation, so Axelon aims to enter the shortlist early rather than to close on the page. The requirements form collects capacity, tolerances, and site constraints an engineer can quote from, while sample runs with the buyer's own material, stated wear-part availability, and included commissioning answer what plant managers actually weigh before committing capital. Built for packaging, processing, and production-line manufacturers running Meta or LinkedIn campaigns that need throughput-specific enquiries rather than catalogue downloads.",
      zh: "设备采购是以月计的评估过程，所以 Axelon 的目标是尽早进入候选名单，而不是在页面上成交。需求表单收集工程师可据以报价的产能、公差与场地限制；「用你的物料实际试机」「明示易损件供应时效」「含安装培训」，回答工厂负责人在投入设备资金前真正衡量的问题。。适合包装、加工与产线设备厂商投放 Meta / LinkedIn，承接带明确产能要求的询盘而非泛泛的样本索取。",
    },
    thumbnail: "https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "b2b", subcategory: "industrial-equipment", archetype: "consult", conversion: ["form", "whatsapp"], risk: "low", tone: "rational" },
  },
  {
    id: "custom-packaging",
    name: "Kraftline Packaging",
    industry: { en: "B2B / Custom packaging", zh: "B2B / 定制包装" },
    tagline: { en: "Packaging quote page — brands send specs and get a mock-up plus printed sample.", zh: "定制包装询价落地页，提交规格获取结构样与印刷打样。" },
    seoIntro: {
      en: "Kraftline Packaging is a sampling-enquiry template for packaging and print suppliers, turning brand traffic into specification-rich leads through an on-page quote form. Structural mock-ups before printing, physical printed samples instead of renders, and transit testing address the failures that cost brands an entire production run. Made for carton, corrugated, and label manufacturers serving DTC and retail brands who need dimensions and quantities up front rather than vague enquiries.",
      zh: "Kraftline Packaging 是面向包装印刷供应商的打样询价落地页模板，用页内询价表单把品牌方流量转成带完整规格的线索。页面以「先出结构样再印刷」「给实物打样而非效果图」「可做运输测试」直击那些会让品牌报废整批产能的失误点。适合彩盒、瓦楞与标签厂服务 DTC 与零售品牌，承接自带尺寸与数量的实质询盘。",
    },
    thumbnail: "https://images.unsplash.com/photo-1607166452427-7e4477079cb9?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "b2b", subcategory: "custom-packaging", archetype: "consult", conversion: ["form", "whatsapp"], risk: "low", tone: "rational" },
  },
  {
    id: "freight-forwarding",
    name: "Portway Freight",
    industry: { en: "B2B / Freight forwarding", zh: "B2B / 国际物流" },
    tagline: { en: "Freight quote page — shippers get rates, transit times, and customs docs on WhatsApp.", zh: "货代运价落地页，WhatsApp 获取运价、时效与清关单证清单。" },
    seoIntro: {
      en: "Portway Freight is a rate-enquiry template for freight forwarders and logistics providers, turning shipper traffic into WhatsApp enquiries by promising a full landed cost rather than a headline rate. All-in quoting, prepared customs documentation, and a named coordinator target the two things that lose forwarders business: surprise local charges and silence when a vessel slips. Built for forwarders and 3PLs running trade-lane campaigns who need route and volume details, not brochure requests.",
      zh: "Portway Freight 是面向货代与物流服务商的运价咨询落地页模板，以「给全包落地成本而非表面运价」把货主流量转成 WhatsApp 询价。页面用一口价报关杂费、代办清关单证与专属跟单员，直击货代最容易流失客户的两件事：突然冒出的地方杂费，以及船期延误时的失联。适合货代与三方物流投放特定贸易航线，承接带路线与货量的真实询盘。",
    },
    thumbnail: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "b2b", subcategory: "freight-forwarding", archetype: "consult", conversion: ["whatsapp", "form"], risk: "low", tone: "rational" },
  },
  {
    id: "language-training",
    name: "Lexicon Language Lab",
    industry: { en: "Education / Language training", zh: "教育 / 语言培训" },
    tagline: { en: "IELTS & TOEFL prep page — students book a free level test and get a study plan.", zh: "雅思托福备考落地页，预约免费水平测试并获取提分规划。" },
    seoIntro: {
      en: "Lexicon Language Lab is a level-test enquiry template for IELTS, TOEFL, and PTE preparation schools, converting ad traffic into qualified students through an on-page booking form. Diagnosis before enrolment, examiner-marked writing, and honest advice about whether a test date is realistic answer what candidates weigh before paying for a course. Built for language schools running Meta or Google campaigns that need target score and test date up front rather than anonymous brochure requests.",
      zh: "Lexicon Language Lab 是面向雅思 / 托福 / PTE 备考机构的水平测试询单落地页模板，用页内预约表单把广告流量转成带目标分与考期的有效学员线索。页面以「先测后报」「考官批改写作」「考期不现实就直说」回答考生在付费报班前真正犹豫的问题。适合语言学校投放 Meta / Google，承接自带目标分与考试日期的咨询而非泛泛的课程索取。",
    },
    thumbnail: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "education", subcategory: "language-training", archetype: "consult", conversion: ["form", "whatsapp"], risk: "medium", tone: "rational" },
  },
  {
    id: "online-skills",
    name: "Northlane Skills Academy",
    industry: { en: "Education / Online career courses", zh: "教育 / 职业技能在线课" },
    tagline: { en: "Career-course page — career changers request an advisor call and a track recommendation.", zh: "职业技能在线课落地页，转行学员预约顾问获取课程方向建议。" },
    seoIntro: {
      en: "Northlane Skills Academy is an advisor-call template for online career course providers, turning career-changer traffic into qualified enrolment conversations through an on-page form. Mentor-led projects, an honest weekly-hours estimate, and an explicit refusal to promise employment outcomes address the scepticism this category has earned. Made for bootcamps and part-time upskilling programmes running paid social campaigns that need a learner's background and available hours before pitching a track.",
      zh: "Northlane Skills Academy 是面向职业技能在线课机构的顾问咨询落地页模板，用页内表单把转行人群的流量转成有背景信息的招生线索。页面以「导师带项目」「如实说明每周投入」「不承诺就业结果」正面回应这个品类长期积累的信任问题。适合训练营与在职提升课程投放付费社媒，先拿到学员背景与可投入时间再推荐方向。",
    },
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "education", subcategory: "online-skills", archetype: "consult", conversion: ["form", "whatsapp"], risk: "high", tone: "rational" },
  },
  {
    id: "k12-tutoring",
    name: "Sparkpath Tutoring",
    industry: { en: "Education / K-12 tutoring", zh: "教育 / K12 课外辅导" },
    tagline: { en: "Tutoring page — parents book a free assessment over WhatsApp and get a tutor match.", zh: "K12 辅导落地页，家长经 WhatsApp 预约免费学情评估并匹配老师。" },
    seoIntro: {
      en: "Sparkpath Tutoring is an assessment-booking template for K-12 tutoring providers, converting parent traffic into enquiries through WhatsApp with an on-page form as a second landing point. Diagnosing gaps from earlier years, background-checked tutors, recorded sessions, and a per-session report speak to what parents actually judge a tutoring service on. Built for tutoring centres and online tutoring platforms whose enquiries come from parents on mobile and need year group, subject, and availability captured up front.",
      zh: "Sparkpath Tutoring 是面向 K12 课外辅导机构的学情评估预约落地页模板，主转化走家长最常用的 WhatsApp，页内表单作第二落点。页面以「先查早年知识断层」「老师背景审查」「课程录像家长可回看」「每节课书面反馈」回应家长真正评判辅导机构的标准。适合线下辅导中心与线上一对一平台承接移动端家长咨询，直接拿到年级、科目与时间偏好。",
    },
    thumbnail: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "education", subcategory: "k12-tutoring", archetype: "consult", conversion: ["whatsapp", "form"], risk: "medium", tone: "emotional" },
  },
  {
    id: "moving",
    name: "Cartwell Movers",
    industry: { en: "Local services / Moving", zh: "本地服务 / 搬家搬迁" },
    tagline: { en: "Moving quote page — customers send a video walk-through and get a fixed quote.", zh: "搬家报价落地页，访客发房屋视频获取固定报价与档期。" },
    seoIntro: {
      en: "Cartwell Movers is a quote-enquiry template for removal companies, converting mobile traffic into bookings through WhatsApp with an on-page form as a second landing point. A fixed quote from a video walk-through, goods-in-transit cover, and free date changes target the two things that lose movers business: hourly-rate creep and property chains that slip. Built for local and long-distance removal firms running area-targeted campaigns that need addresses, property size, and dates rather than anonymous price enquiries.",
      zh: "Cartwell Movers 是面向搬家公司的报价询单落地页模板，主转化走移动端最顺手的 WhatsApp，页内表单作第二落点。页面以「看视频出固定报价、当天不涨价」「在途保险」「改期免费」直击搬家最容易流失客户的两件事：按小时计费的价格漂移，以及交房档期临时变动。适合本地与长途搬家公司投放区域定向广告，直接拿到起止地址、房型与日期而非泛泛问价。",
    },
    thumbnail: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "local-service", subcategory: "moving", archetype: "consult", conversion: ["whatsapp", "form"], risk: "low", tone: "rational" },
  },
  {
    id: "hvac",
    name: "Northaire Heating & Cooling",
    industry: { en: "Local services / HVAC repair", zh: "本地服务 / 暖通空调维修" },
    tagline: { en: "Emergency HVAC page — same-day callouts converted by a direct phone CTA.", zh: "空调暖通急修落地页，电话直拨承接同日上门需求。" },
    seoIntro: {
      en: "Northaire Heating & Cooling is an emergency-callout template for HVAC contractors, converting urgent traffic with a direct phone CTA and an on-page form for non-urgent maintenance enquiries. Diagnosis before work, a written price approved up front, and a stated preference for repair over replacement counter the overselling this trade is best known for. Made for heating and air conditioning contractors running seasonal campaigns where a visitor with a failed system needs to reach a technician immediately, not fill in a form.",
      zh: "Northaire Heating & Cooling 是面向暖通空调维修商的紧急上门落地页模板，主转化用电话直拨承接急修流量，页内表单收非紧急的保养与更换咨询。页面以「先诊断后报价」「书面价格经你确认才动工」「能修就不劝换」正面回应这个行业最被诟病的过度推销问题。适合冷暖设备维修商投放季节性广告——设备罢工的访客要的是立刻接通技师，而不是填表等回电。",
    },
    thumbnail: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "local-service", subcategory: "hvac", archetype: "consult", conversion: ["phone", "form"], risk: "low", tone: "rational" },
  },
  {
    id: "roofing",
    name: "Ridgeway Roofing & Exteriors",
    industry: { en: "Local services / Roofing & exteriors", zh: "本地服务 / 屋顶外墙翻新" },
    tagline: { en: "Roof inspection page — homeowners book a free inspection and get a photo report.", zh: "屋顶翻新落地页，业主预约免费检查并获取带照片的检查报告。" },
    seoIntro: {
      en: "Ridgeway Roofing & Exteriors is an inspection-booking template for roofing and exterior contractors, turning homeowner traffic into surveyed leads through an on-page form, with a phone CTA for active leaks. Photo evidence of every defect, a stated willingness to recommend repair over replacement, and insurance-claim documentation address the fear of being oversold that dominates this category. Built for roofing, siding, and gutter contractors running storm-season and neighbourhood campaigns that need property details before a truck is dispatched.",
      zh: "Ridgeway Roofing & Exteriors 是面向屋顶与外墙翻新承包商的免费检查预约落地页模板，主转化走页内表单收房产信息，漏水等紧急情况用电话兜底。页面以「每处缺陷都有照片」「能修就不劝换」「按理赔要求出具报告」直击这个品类最强的顾虑——被忽悠做整屋更换。适合屋顶、外墙与檐槽承包商投放风灾季与社区定向广告，先拿到房产信息再派车。",
    },
    thumbnail: "https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "local-service", subcategory: "roofing", archetype: "consult", conversion: ["form", "phone"], risk: "medium", tone: "rational" },
  },
  {
    id: "landscaping",
    name: "Fernhill Landscapes",
    industry: { en: "Local services / Landscaping", zh: "本地服务 / 园艺景观" },
    tagline: { en: "Garden design page — clients book a free site visit and receive a concept plan.", zh: "园艺景观落地页，客户预约免费看场并获取设计概念方案。" },
    seoIntro: {
      en: "Fernhill Landscapes is a site-visit enquiry template for garden design, build, and maintenance firms, converting homeowner traffic into design consultations through an on-page form. Surveying sun, drainage, and soil before proposing anything, planting chosen to survive rather than to render well, and phased builds across seasons answer why so many expensive gardens fail in year two. Made for landscapers and garden designers running local campaigns that need plot size, aspiration, and usage before a designer's time is committed.",
      zh: "Fernhill Landscapes 是面向园艺设计、施工与养护公司的上门看场落地页模板，用页内表单把业主流量转成设计咨询线索。页面以「先测日照排水与土壤再谈方案」「选能活下来的植物而不是效果图好看的」「可跨季分期施工」解释了为什么很多花大钱的庭院第二年就垮掉。适合景观公司与花园设计师投放本地广告，在派设计师上门前先拿到面积、诉求与使用场景。",
    },
    thumbnail: "https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "local-service", subcategory: "landscaping", archetype: "consult", conversion: ["form", "whatsapp"], risk: "low", tone: "emotional" },
  },

  // ---------------------------------------------------------------------
  // 第二梯队 · 医疗与诊所
  // 高客单、决策周期长、监管严格：主转化一律走页内表单——病情描述与照片
  // 需要成段文字才收得全，即时通讯拿不到完整信息。全组 risk: high，文案
  // 不得承诺疗效，前后对比区块必须带 disclaimer。
  // ---------------------------------------------------------------------
  {
    id: "hair-transplant",
    name: "Meridian Hair Restoration",
    industry: { en: "Medical / Hair restoration", zh: "医疗 / 植发" },
    tagline: { en: "Hair restoration page — patients send photos and get a written surgical assessment.", zh: "植发落地页，患者提交照片获取书面手术评估。" },
    seoIntro: {
      en: "Hair restoration has earned its scepticism through overselling, so Meridian answers it with specifics rather than with results imagery. The on-page form asks for named photo angles and returns a written graft range and technique recommendation, with an explicit willingness to advise against surgery when the case does not warrant it. Built for surgical clinics running international campaigns where patients travel to treat, and where the assessment — not the booking — is what has to be earned first.",
      zh: "植发行业的信任问题是过度销售换来的，所以 Meridian 用具体信息而不是效果图来回应。页内表单按指定角度收集照片，回给一份书面的移植量区间与术式建议，并明确写出「不合适就劝你别做」。。适合跨境接诊的手术机构投放国际广告——在这里要先赢得的是评估，而不是预约。",
    },
    thumbnail: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "medical", subcategory: "hair-transplant", archetype: "consult", conversion: ["form", "whatsapp"], risk: "high", tone: "rational" },
  },
  {
    id: "medical-aesthetics",
    name: "Aurelle Aesthetic Medicine",
    industry: { en: "Medical / Aesthetic medicine", zh: "医疗 / 医美" },
    tagline: { en: "Aesthetic clinic page — patients request a doctor-led consultation by form.", zh: "医美诊所落地页，表单预约医生面诊评估。" },
    seoIntro: {
      en: "Aesthetic outcomes are individual, so Aurelle sells a doctor-led assessment rather than treatments from a menu. Whole-face assessment, batch-traceable products, and a stated policy of never treating on the day of a first consultation answer the safety questions serious patients ask — and keep the page clear of the package pricing that gets medical advertisers rejected. Built for clinics competing on clinical judgement rather than discounting.",
      zh: "医美效果因人而异，所以 Aurelle 卖的是医生主导的面诊评估，而不是照着项目菜单卖疗程。「整脸评估」「产品批号可追溯」「初诊当天不做治疗」回应认真患者最在意的安全问题，同时避开疗程包价这类会导致医疗广告被拒的促销语义。。适合靠临床判断而非折扣竞争的诊所投放。",
    },
    thumbnail: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "medical", subcategory: "aesthetic-medicine", archetype: "consult", conversion: ["form", "whatsapp"], risk: "high", tone: "rational" },
  },
  {
    id: "fertility",
    name: "Willowbrook Fertility Centre",
    industry: { en: "Medical / Fertility", zh: "医疗 / 生殖辅助" },
    tagline: { en: "Fertility centre page — patients request a first consultation by form or phone.", zh: "生殖中心落地页，表单或电话预约初诊咨询。" },
    seoIntro: {
      en: "Willowbrook Fertility Centre is a first-consultation template for regulated fertility clinics, converting a high-anxiety audience into enquiries through an on-page form with a phone line as the second route. Investigation before treatment, one consultant throughout, counselling included from day one, and a refusal to quote headline success rates address what this audience has learned to distrust. Made for licensed centres advertising in a category where overpromising is both a compliance risk and a reputational one.",
      zh: "Willowbrook Fertility Centre 是面向持牌生殖医学中心的初诊预约落地页模板，用页内表单承接高焦虑人群的咨询，电话作为第二通道。页面以「先查清楚再谈治疗」「全程同一位主诊」「首诊即配心理咨询」「拒绝拿漂亮成功率当噱头」回应这个人群早已学会怀疑的那些话术。适合持牌机构在这个「夸大承诺既踩合规红线也毁口碑」的品类投放。",
    },
    thumbnail: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "medical", subcategory: "fertility", archetype: "consult", conversion: ["form", "phone"], risk: "high", tone: "emotional" },
  },
  {
    id: "vision-correction",
    name: "Clearview Vision Centre",
    industry: { en: "Medical / Vision correction", zh: "医疗 / 屈光矫正" },
    tagline: { en: "Refractive surgery page — three procedures compared, then a suitability assessment.", zh: "屈光手术落地页，三种术式并排对比后预约适应性评估。" },
    seoIntro: {
      en: "Clearview Vision Centre is a comparison-led template for refractive surgery centres — the library's first built around weighing options rather than pushing one. LASIK, SMILE, and implantable lenses are set side by side with the patients each suits and the trade-offs each carries, so a visitor who arrived to compare can do so honestly, then convert into a diagnostic assessment. A published decline rate does the persuading that discount offers can't. Built for any high-consideration category where visitors shop procedures before they shop clinics.",
      zh: "Clearview Vision Centre 是面向屈光手术中心的对比型落地页模板，也是模板库中第一套以「帮访客权衡」而非「单向种草」为结构的样例。LASIK、SMILE 与 ICL 三种术式并排摆开，写清各自适合谁、代价是什么，让本来就是来比较的访客真的比得明白，再转化为适应性评估预约。用公开的「劝退率」建立信任，这比任何折扣都更管用。适合访客习惯先比方案再挑机构的高决策成本品类。",
    },
    thumbnail: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1600&q=80",
    tier: "t2",
    tags: { category: "medical", subcategory: "vision-correction", archetype: "compare", conversion: ["form", "whatsapp"], risk: "high", tone: "rational" },
  },
];

export const DEFAULT_TEMPLATE_ID = TEMPLATES[0].id;

/** 按 id 取模板元数据；缺省或未命中时回退默认模板。 */
export function getTemplate(id?: string | null): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
