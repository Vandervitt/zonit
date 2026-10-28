export const plans = {
  free: "免费",
  unlimited: "无限",
  perMonthSuffix: "/月",
  perYearSuffix: "/年",
  // 年付价下方的说明：{monthly} 为折合月价（向下截断到分），{saved} 为相对月付全年的节省额。
  yearlyNote: "相当于 {monthly}/月 · 省 {saved}",
  // 收款货币为美元，人民币仅按参考汇率换算展示，故必须保留「约」字。
  approxCny: "约 ¥{amount}",
  // 中文量词无单复数变化，两个形态取同值（形状须与英文字典一致）。
  units: {
    pages: { one: "张", other: "张" },
    domains: { one: "个", other: "个" },
    perMonth: { one: "次/月", other: "次/月" },
  },
  table: {
    feature: "功能",
    includedInAll: "所有套餐都包含",
    included: "包含",
    notIncluded: "不包含",
    // 窄屏卡片里「权益名：额度」的分隔符。
    valueSeparator: "：",
    // {days} 由 SIGNUP_TRIAL_DAYS 填充，不写死天数。
    trialBadge: "注册即送 {days} 天",
    currentBadge: "当前套餐",
    ctaFree: "免费开始",
    ctaTrial: "免费试用 {days} 天",
    ctaChoose: "选择 {plan}",
    // 月付 / 年付切换；{months} = 12 - YEARLY_PRICE_MONTHS。
    billingPeriod: "计费周期",
    intervalMonth: "月付",
    intervalYear: "年付",
    yearSave: "省 {months} 个月",
  },
  groups: { publish: "发布", tracking: "追踪与线索", ai: "AI 生成", scale: "批量投放风控" },
  // 每档「适合谁」：访客按身份选档，而不是逐行比功能。
  fit: {
    free: "先免费发一张页，验证有没有询盘",
    pro: "同时投多个 offer，用 CAPI 把转化回传广告平台",
    agency: "代运营方，为多个客户批量投放",
  },
  rows: {
    landingPages: { label: "落地页数量", desc: "可创建并保存的落地页总数" },
    // freeValue：Free 没有自有域名槽位，但能发布到平台分配的子域——
    // 若沿用 0 → 破折号，客户会误以为免费档根本发不出页面。
    customDomain: { label: "发布地址", desc: "把页面发布到你自己的品牌域名；没有域名也能先用平台提供的地址", freeValue: "平台提供的地址" },
    // 不写死数量：模板库还在增长，而本表在客户端渲染，拿不到注册表口径。
    templates: { label: "海外获客模板", desc: "模板库全部咨询与留资模板，可直接作为编辑起点" },
    editor: { label: "可视化内容编辑器", desc: "表单编辑文案与图片，支持区块排序和实时预览" },
    basicPixel: { label: "基础数据追踪 (1× Meta Pixel)", desc: "接入 1 个 Meta Pixel，追踪落地页转化" },
    watermark: { label: "去除品牌水印", desc: "移除页面底部平台水印，纯你的品牌" },
    advancedTracking: {
      label: "多平台追踪与 CAPI",
      desc: "Meta / TikTok / Google 追踪 + Meta / TikTok 服务端回传",
    },
    antiBan: {
      label: "反同质化",
      desc: "更换页面变体种子打散结构指纹，降低同模板页面被判重的概率",
    },
    leadWebhook: { label: "线索 Webhook 推送", desc: "新线索实时 POST 到你的 CRM / Zapier（含签名）" },
    aiPage: { label: "AI 整页生成", desc: "输入业务资料，AI 按当前模板生成整页营销文案" },
    aiRewrite: { label: "AI 智能改写", desc: "逐段润色改写文案，快速产出多个版本" },
  },
};
