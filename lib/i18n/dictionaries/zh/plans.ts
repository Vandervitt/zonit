export const plans = {
  free: "免费",
  unlimited: "无限",
  perMonthSuffix: "/月",
  units: { pages: "张", domains: "个", perMonth: "次/月" },
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
    templates: { label: "海外获客模板", desc: "30+ 咨询与留资模板，可直接作为编辑起点" },
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
    free: ["1 张落地页", "全量 30+ 海外获客模板", "可视化内容编辑器", "在线预览（发布需升级绑定域名）"],
    starter: ["3 张落地页 + 1 个自定义域名", "1× Meta Pixel 追踪"],
    pro: ["20 张落地页 + 5 个域名", "去除品牌水印", "Meta / TikTok / Google 追踪 + Meta / TikTok CAPI"],
    agency: ["无限落地页 + 无限域名", "反同质化", "AI 生成额度提升至 300 次/月"],
  },
};
