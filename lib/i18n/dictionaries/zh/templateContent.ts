// 模板详情页的派生内容句式。`{name}` / `{industry}` / `{archetype}` / `{conversion}`
// 会被替换为该模板的实际值，使每页文案天然不同。
export const templateContent = {
  sectionHero: "首屏主视觉",
  sectionLeadForm: "留资表单",
  /** 中文侧与 SECTION_REGISTRY 的 label 一致，恒等映射（形状须与英文字典相同）。 */
  sectionLabels: {
    数据展示: "数据展示",
    套餐: "套餐",
    产品: "产品",
    前后对比: "前后对比",
    服务流程: "服务流程",
    信任: "信任",
    特性: "特性",
    评价: "评价",
    产品故事: "产品故事",
    倒计时: "倒计时",
    常见问题: "常见问题",
    安全保障: "安全保障",
  } as Record<string, string | undefined>,

  detailMeta: {
    title: "{name} — {industry} 获客落地页模板 | Zap Bridge",
    description:
      "{tagline}{conversion} 留资、投放级结构、合规页脚开箱即用；改内容、绑定自有品牌域名，几分钟发布上线。",
  },

  introFallback:
    "{name} 是一套面向「{industry}」的{archetype}落地页模板，访客通过 {conversion} 完成留资咨询。投放级结构、合规页脚开箱即用，选用后改内容、绑定你自己的品牌域名即可发布。",

  whoFor:
    "适合做「{industry}」出海获客、以 {conversion} 承接线索的广告主与代运营团队；尤其契合{archetype}场景。",

  howToUse: [
    {
      step: "选用模板",
      detail: "点击「用这个模板开始」，{name} 会作为初始草稿载入编辑器。",
    },
    {
      step: "改内容 · 绑域名",
      detail: "替换文案、图片与卖点，配置 CTA 与留资表单，绑定你自己的品牌域名。",
    },
    {
      step: "发布投放",
      detail: "一键发布，平台自动配好 DNS 与 HTTPS 证书；接入像素与转化回传后即可投放引流。",
    },
  ],

  faqs: [
    {
      q: "{name} 模板可以随意修改吗？",
      a: "可以。文案、图片、配色与板块顺序都能在可视化编辑器里替换，改成你自己的品牌与卖点，全程无需写代码。",
    },
    {
      q: "访客怎么联系我、怎么留资？",
      a: "这套模板通过 {conversion} 收集线索：访客点击落地页上的 CTA 即发起 {conversion} 咨询或提交表单，线索会进入你的后台线索列表。",
    },
    {
      q: "发布到自己的域名复杂吗？",
      a: "不复杂。选用模板改好内容后绑定你自己的品牌域名，平台自动配置 DNS 与 HTTPS 证书，几分钟即可上线投放。",
    },
    {
      q: "用这套模板做广告投放合规吗？",
      a: "模板内置合规页脚（隐私政策 / 服务条款入口）并保持非交易的获客属性；Agency 套餐还提供反同质化风控，降低同模板页面被投放平台判重的概率。",
    },
  ],
};
