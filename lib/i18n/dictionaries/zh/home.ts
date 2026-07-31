// 中文面受众是出海获客的中小企业与代运营，保留「海外获客」叙事（英文面则按本地读者视角改写）。
// 数量一律用 {templates} / {industries} 占位符，由 lib/templates/stats.ts 按注册表实际内容替换。
export const home = {
  meta: {
    title: "Zap Bridge — 把访客变成能打通的联系方式",
    description:
      "为海外获客打造的留资落地页：{templates} 套模板覆盖 {industries} 个行业，AI 整页成稿，几分钟出第一版。表单线索自动进收件箱，WhatsApp 与电话咨询的点击和来源也一样看得清。",
    ogDescription:
      "{templates} 套咨询与留资模板，覆盖 {industries} 个行业，AI 整页成稿几分钟出第一版；发布到自有品牌域名，所有线索归集到一个收件箱。",
  },
  hero: {
    badge: "为获客而生",
    titleLine1: "把访客变成",
    titleLine2: "能打通的联系方式",
    // 首屏讲结果不讲机制：像素 / UTM / CAPI 等术语一律留到下方追踪区再展开。
    // 也不锁死流量来源（广告 / SEO / 社媒同样成立）与转化渠道（表单 / WhatsApp / 电话）。
    subtitle:
      "选一套获客模板，让 AI 照着你的业务把整页写完，再发布到你自己的域名——一个下午就能上线第一版。表单线索直接进你的收件箱；WhatsApp 与电话咨询走各自渠道，点击与来源照样统计得清清楚楚。",
    ctaPrimary: "免费开始",
    ctaSecondary: "查看套餐",
    note: "注册即赠 Pro 全功能 7 天 · 无需信用卡 · 无需写一行代码",
  },
  editorMock: {
    pixelBadge: "Meta Pixel · 已触发",
    leadBadge: "Lead 转化 +1",
  },
  marquee: {
    heading: "支持接入这些投放与分析工具",
  },
  industries: {
    kicker: "适合谁",
    title: "不管你做哪一行，都有现成的起点",
    desc: "{templates} 套获客模板覆盖 {industries} 个行业——诊所与律所、装修与本地服务、教培与留学、B2B 批发与工厂，也包括美妆服饰家居保健。选你的行业，从一套已经懂你怎么接询盘的页面开始。",
    /** `{count}` 会被替换为该行业下的模板数；中文无单复数变化，两个形态取同值。 */
    countLabel: { one: "{count} 套", other: "{count} 套" },
    cta: "浏览完整模板库",
  },
  steps: {
    kicker: "三步上线",
    title: "从选模板到页面上线，只需三步",
    desc: "页面制作全程可视化，不用写一行代码，也不用等开发排期。创建、编辑与预览完全免费；发布到自有域名为付费套餐权益。",
    items: [
      {
        title: "选一套获客模板",
        desc: "从 {templates} 套模板中选择适合你行业、也贴合客户联系方式的一套，快速搭好页面结构和内容起点。",
      },
      {
        title: "可视化编辑内容",
        desc: "选择区块后修改文案与图片，支持区块拖拽排序、自动保存，以及移动端和桌面端实时预览。",
      },
      {
        title: "发布到你自己的域名",
        desc: "绑定品牌域名——平台直接算好那一条 DNS 记录，复制粘贴即可——随后发布页面并配置 SEO 信息。自有域名为付费套餐权益。",
      },
    ],
  },
  features: {
    kicker: "为转化而生",
    title: "转化所需的每一环，都替你备齐",
    desc: "页面、AI 文案、线索、域名、追踪——先把咨询与留资页做好，再按业务节奏逐步启用。",
    items: {
      templates: {
        title: "获客模板库",
        desc: "{templates} 套咨询与留资模板，覆盖 {industries} 个行业：牙科诊所与医疗、法律移民、教育培训、家装与本地服务、B2B 批发与工厂，以及美妆、服饰、家居、保健、母婴——不用从空白页开始。",
      },
      editor: {
        title: "可视化内容编辑",
        desc: "区块表单改文案与图片，拖拽排序、自动保存，桌面与移动端实时预览——所见即所得，不用等开发排期。",
      },
      leads: {
        title: "一条表单线索都不会丢",
        desc: "访客提交的表单线索统一进收件箱，新线索到达即发邮件，未跟进的第二天还会再提醒一次；WhatsApp 与电话咨询直接发生在你的聊天和来电里，平台负责把它们的点击与来源统计清楚。一键回拨或回信，能看到每封通知是否成功发出，随时导出 CSV；Pro 及以上还能把每条线索实时 POST 到你的 CRM 或 Zapier。",
      },
      domain: {
        title: "自有品牌域名发布",
        desc: "付费套餐绑定自有品牌域名，完成 DNS 验证即可发布；独立 SEO 标题、描述与分享图，访客看到的始终是你的品牌。",
      },
      tracking: {
        title: "看清哪些流量真的会转化",
        desc: "访问量、CTA 点击和每条线索的来源集中在一个看板里。按套餐接入 Meta、TikTok、GA4 与 Google Ads，让广告平台知道哪些点击变成了真实询盘，而不是靠猜。",
      },
      ai: {
        title: "AI 一键生成 & 智能改写",
        desc: "输入业务资料，AI 按当前模板生成整页营销文案与图库配图，也可逐段改写——初稿几分钟就有；发布前仍需核对事实、案例与素材。",
      },
      antiBan: {
        title: "反同质化",
        desc: "Agency 套餐可一键更换页面变体种子：内容不变，Hero 布局、包裹结构与 meta 标识随种子改变，降低同模板页面被平台判重的概率。",
        linkLabel: "了解反同质化机制",
      },
    },
  },
  tracking: {
    kicker: "转化归因",
    title: "看清哪些点击真的带来了询盘",
    desc: "看板汇总访问量、CTA 点击和每条线索的来源，你就不用再为不询盘的流量买单。同时把转化结果告诉广告平台——它们正是靠这个学会去找更多同类人群。",
    bullets: [
      "一个看板看完：访问、CTA 点击、表单完成率与每页线索来源",
      "按套餐接入 Meta、TikTok、GA4 与 Google Ads（Pro 及以上）",
      "转化以服务端方式回传 Meta / TikTok，少被广告拦截插件吃掉",
      "自带 Cookie 同意条，访客同意后才加载第三方追踪",
    ],
    funnel: {
      consent: { label: "访客同意", note: "同意之后才开始追踪" },
      pixels: { label: "已接入的平台", note: "Meta / TikTok / GA4 / Google Ads" },
      capture: { label: "询盘被记录", note: "表单提交、CTA 与 WhatsApp 点击" },
      forwarding: {
        label: "回传 + 看板",
        note: "转化回传 Meta / TikTok，来源进你的看板",
      },
    },
  },
  pricing: {
    kicker: "简单透明的定价",
    title: "先免费完成第一版，准备上线时再升级",
    desc: "Free 可创建、保存和在线预览；升级后绑定自有域名，并按套餐解锁更多页面、追踪与 AI 额度。",
    ctaFree: "免费开始",
    ctaPaid: "注册后升级",
  },
  finalCta: {
    titleLine1: "你的下一次获客",
    titleLine2: "值得一张真的能转化的页面",
    desc: "现在就能创建、编辑并预览，无需信用卡；准备好了再升级，发布到你自己的品牌域名。",
    ctaPrimary: "免费开始",
    ctaSecondary: "已有账号，登录",
  },
};
