export const templates = {
  meta: {
    title: "{templates} 套海外获客落地页模板 — 按行业挑选，直接开始 | Zap Bridge",
    description:
      "覆盖 {industries} 个行业的海外获客落地页模板：牙科诊所与医疗、法律移民、教育培训、家装与本地服务、B2B 批发与工厂，以及美妆、服饰、3C、家居、保健、母婴。留资渠道可选表单、WhatsApp、电话、邮箱或 Telegram，一键切换，合规页脚开箱即用。",
    ogTitle: "{templates} 套海外获客落地页模板 | Zap Bridge",
    ogDescription: "按行业挑一套获客落地页模板，改内容、绑域名、发布上线——不用从空白页开始。",
  },
  gallery: {
    kicker: "Templates",
    title: "海外获客落地页模板库",
    /** `{templates}` 与 `{industries}` 会被替换为实际数量。 */
    subtitle:
      "{templates} 套留资模板，覆盖 {industries} 个行业，全部自带合规页脚。每套模板都能配任意渠道——下面的标签只是它的预设，选完之后一键就能改成表单、WhatsApp、电话、邮箱或 Telegram。",
    cta: "免费开始 · 注册即赠 Pro 7 天",
    /** 卡片上的转化标签，如「WhatsApp 留资」。`{channel}` 为渠道名。 */
    /**
     * 卡片上的转化标签。措辞强调「预设」而非「只能用」——渠道现在是页面级设置，
     * 选完模板一键就能改。旧文案「{channel}留资」会让人以为模板锁死了渠道。
     * 不加空格：渠道名可能是「表单」等中文词，「预设 表单」会显得断开。
     */
    captureTag: "预设{channel}",
    /** `{name}` 为模板名。 */
    thumbnailAlt: "{name} 模板预览图",
  },
  detail: {
    h1: "{name} — {industry}落地页模板",
    backToGallery: "← 返回模板库",
    useTemplate: "用这个模板开始",
    includedHeading: "包含哪些板块",
    whoForHeading: "适合谁",
    howToHeading: "怎么用",
    faqHeading: "常见问题",
    detailIntroNote: "↓ 以下为模板样稿实时渲染（文案与图片均可在编辑器中替换；预览中留资入口不产生真实提交）",
    includedHeading2: "这套模板包含什么",
    howToHeading2: "如何用它获客",
    relatedHeading: "同行业模板",
    otherTemplates: "看其他模板",
    breadcrumbRoot: "模板库",
  },
  /** 页面范式（数据键为英文 slug，此处为展示名）。 */
  archetype: {
    seeding: "种草留资",
    consult: "预约咨询",
    compare: "比价线索",
    demo: "demo 预约",
  },
  /** 行业大类。 */
  category: {
    beauty: "美妆个护",
    apparel: "服饰配饰",
    gadget: "3C 数码",
    home: "家居家纺",
    supplement: "健康保健",
    "toys-baby": "玩具母婴",
    medical: "医疗",
    "home-improvement": "家装",
    b2b: "B2B 与批发",
    education: "教育培训",
    legal: "法律移民",
    "local-service": "本地服务",
  },
  /** 转化渠道。 */
  conversion: {
    whatsapp: "WhatsApp",
    form: "表单",
    telegram: "Telegram",
    phone: "电话",
    email: "邮件",
  },
};
