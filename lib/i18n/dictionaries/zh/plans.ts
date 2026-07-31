export const plans = {
  free: "免费",
  unlimited: "无限",
  perMonthSuffix: "/月",
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
    description: "说明",
    mostPopular: "最受欢迎",
    ctaFree: "免费开始",
    ctaUpgrade: "立即升级",
  },
  rows: {
    landingPages: { label: "落地页数量", desc: "可创建并保存的落地页总数" },
    customDomain: { label: "自定义域名", desc: "把页面发布到你自己的品牌域名" },
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
  highlights: {
    free: ["1 张落地页", "全量海外获客模板库", "可视化内容编辑器", "可发布到平台提供的地址（带水印），自有品牌域名需付费"],
    starter: ["5 张落地页，可挂在同一个域名的不同路径下", "1 个自定义域名", "适合单品牌多服务页（诊所、律所、教培）", "1× Meta Pixel 追踪"],
    pro: ["20 张落地页 + 5 个域名", "多域名隔离，适合同时投多个 offer", "去除品牌水印", "Meta / TikTok / Google 追踪 + Meta / TikTok CAPI"],
    agency: ["无限落地页 + 无限域名", "反同质化", "AI 生成额度提升至 300 次/月"],
  },
};
