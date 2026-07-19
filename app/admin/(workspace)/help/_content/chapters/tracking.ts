import type { HelpChapterData } from "../types";

export const tracking: HelpChapterData = {
  slug: "tracking",
  title: "投放追踪与归因",
  summary: "像素配置、服务端回传（CAPI）、UTM 归因、欧盟 Cookie 同意与反同质化。",
  intro:
    "追踪配置决定广告平台能否学到「什么样的人会留资」，直接影响投放成本。追踪配置入口在编辑器的追踪面板中，按页面独立配置。",
  sections: [
    {
      id: "basic-pixel",
      heading: "基础追踪：Meta Pixel（全套餐可用）",
      blocks: [
        {
          t: "steps",
          items: [
            { title: "获取 Pixel ID", desc: "在 Meta 事件管理工具（Events Manager）中创建或找到你的 Pixel，复制纯数字 ID（如 1234567890）。" },
            { title: "填入追踪面板", desc: "编辑器 → 追踪面板 → 「Meta Pixel ID」粘贴保存。" },
            { title: "验证", desc: "发布后访问页面，用 Meta Pixel Helper 浏览器插件或事件管理工具的测试事件功能确认事件触发。" },
          ],
        },
        {
          t: "p",
          text: "页面会自动上报以下 lead-gen 事件，无需手动埋点：",
        },
        {
          t: "table",
          head: ["事件", "触发时机", "投放用途"],
          rows: [
            ["Lead", "页面产生有效线索", "转化目标事件，广告优化的核心信号"],
            ["Contact", "访客点击联系类 CTA", "浅层转化信号"],
            ["FormSubmit", "留资表单提交", "表单路径的转化事件"],
            ["WhatsAppClick", "点击 WhatsApp 按钮", "WhatsApp 路径的转化事件"],
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "事件全部是留资导向，没有 Purchase / Checkout 等电商事件——投放时转化目标请选 Lead（潜在客户）类目标。",
        },
      ],
    },
    {
      id: "advanced-pixels",
      heading: "多平台追踪（Pro 及以上）",
      blocks: [
        {
          t: "p",
          text: "Pro / Agency 套餐可同时接入多个平台的追踪，各平台在追踪面板分别填 ID：",
        },
        {
          t: "table",
          head: ["平台", "填什么", "格式示例", "去哪拿"],
          rows: [
            ["Meta", "Pixel ID", "1234567890", "Meta 事件管理工具"],
            ["Google Analytics", "GA4 衡量 ID", "G-XXXXXXX", "GA4 管理 → 数据流"],
            ["Google Ads", "转化 ID", "AW-XXXXXXXXX", "Google Ads → 转化设置"],
            ["TikTok", "Pixel ID", "CXXXXXXXXXXXXXXXXX", "TikTok Events Manager"],
          ],
        },
      ],
    },
    {
      id: "capi",
      heading: "服务端回传 CAPI（Pro 及以上）",
      blocks: [
        {
          t: "p",
          text: "iOS 隐私限制和广告拦截器会吃掉相当比例的客户端像素事件。服务端回传（Conversions API）从我们的服务器直接把转化事件发给 Meta / TikTok，不受浏览器拦截影响，能显著提升归因完整度和 ROAS 优化效果。",
        },
        {
          t: "steps",
          items: [
            { title: "开启开关", desc: "追踪面板 → 勾选「启用服务端回传（CAPI）」，Meta 与 TikTok 分别开启。" },
            { title: "填入凭据", desc: "Meta 填 Dataset ID + Access Token（事件管理工具 → 设置 → 转化 API 生成）；TikTok 填 Pixel Code + Access Token（Events Manager 生成）。" },
            { title: "保存并验证", desc: "保存后显示「已配置 ✓」。在 Meta / TikTok 后台的事件工具中应能看到服务器来源的事件进入。" },
          ],
        },
        {
          t: "callout",
          tone: "warning",
          text: "Access Token 保存后不会回显（安全设计）。需要更换时直接重填覆盖即可；取消勾选会删除已存凭据。",
        },
        {
          t: "p",
          text: "回传机制：线索产生后立即尝试实时回传，失败自动重试，并有每日兜底补发——正常情况下无需关心投递细节。",
        },
      ],
    },
    {
      id: "utm",
      heading: "UTM 参数与归因",
      blocks: [
        {
          t: "p",
          text: "在广告落地页链接上带 UTM 参数（utm_source / utm_medium / utm_campaign 等），系统会自动捕获并随线索与转化事件透传，让你知道每条线索来自哪个渠道、哪组广告。",
        },
        {
          t: "list",
          items: [
            "示例：https://example.com/?utm_source=facebook&utm_medium=cpc&utm_campaign=summer_sale",
            "Meta / TikTok / Google 投放后台都支持在广告层级统一配置 URL 参数，建议用动态宏（如 Meta 的 {{campaign.name}}）避免手填。",
            "线索收件箱与分析看板中可结合来源信息判断各渠道的线索质量。",
          ],
        },
      ],
    },
    {
      id: "cmp",
      heading: "欧盟访客 Cookie 同意（CMP）",
      blocks: [
        {
          t: "p",
          text: "面向欧盟 / 欧洲经济区 / 英国的访客，页面会自动弹出 Cookie 同意横幅：访客同意前不触发追踪采集，同意后正常上报。非欧盟访客不受影响。",
        },
        {
          t: "list",
          items: [
            "这是 GDPR 的合规要求，系统按访客地理位置自动判定，无需你配置。",
            "投放欧盟流量时，报表中的事件量会略低于实际访问量（未同意的访客不计入），属正常现象。",
          ],
        },
      ],
    },
    {
      id: "anti-ban",
      heading: "反同质化（Agency 专属）",
      blocks: [
        {
          t: "p",
          text: "同一套模板被大量广告主使用时，页面结构指纹高度相似，可能被投放平台判定为重复 / 低质页面而限流。反同质化功能为你的页面打散 DOM 结构、属性与 meta 指纹，使其与同模板的其它页面不再雷同。",
        },
        {
          t: "list",
          items: [
            "对访客与平台爬虫展示的内容完全一致，只改结构指纹不改内容——这不是 cloaking，不违反平台政策。",
            "使用方式：编辑器 → 反同质化面板。页面被判重或限流时，点「重新打散指纹」换一枚新种子后重新发布。",
            "该能力仅 Agency 套餐可用；其他套餐页面使用默认结构。",
          ],
        },
      ],
    },
  ],
};
