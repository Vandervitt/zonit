export const analytics = {
  title: "投放分析",
  allPages: "全部落地页",
  range: { d7: "近 7 天", d30: "近 30 天", d90: "近 90 天", from: "自定义开始", to: "结束" },
  loadError: { data: "分析数据", pages: "落地页筛选列表" },

  totals: {
    views: "访问量 (PV)",
    clicks: "CTA 点击",
    leads: "线索",
    ctr: "点击率",
  },
  change: {
    new: "较上一段：新增",
    flat: "较上一段：持平",
    suffix: " 较上一段",
  },
  comparisonNote: (views: number, clicks: number, leads: number) =>
    `环比对照的是紧邻的等长上一段（曝光 ${views} · 点击 ${clicks} · 线索 ${leads}）。用等长紧邻段而不是「上月同期」，因为投放按投放周期走，不按自然月。`,

  funnel: {
    title: "转化漏斗",
    empty: "该区间还没有数据",
    steps: { views: "曝光", clicks: "CTA 点击", leads: "线索" },
    fromPrevious: (pct: string) => `较上一步 ${pct}`,
    cvr: (pct: string) => `线索转化率（线索 / 曝光）：${pct}`,
  },

  formFunnel: {
    title: "表单漏斗",
    note: "只统计页内留资表单",
    empty: "该区间还没有访客开始填写表单",
    starts: "开始填写",
    submits: "提交成功",
    completion: "完成率",
    rejected: (n: number) => `提交被拒 ${n} 次——占比高的错误码通常意味着某个字段让访客卡住了：`,
  },

  trend: { title: "趋势", empty: "该区间还没有数据", views: "访问量", clicks: "CTA 点击" },

  attribution: {
    title: "归因下钻",
    dimensions: { source: "来源", medium: "媒介", campaign: "广告系列", content: "广告 / 创意", term: "关键词" },
    empty: (param: string) => `该区间没有带 ${param} 的流量`,
    columns: { views: "曝光", clicks: "CTA 点击", leads: "线索", cvr: "线索转化率" },
    unlabeled: "(未标注)",
    note: (param: string, unlabeled: string) =>
      `按线索数排序。线索只统计页内表单提交；WhatsApp / 电话只计入 CTA 点击。广告链接上带 ${param} 才会在这里分组，未带的归入「${unlabeled}」。`,
  },

  channels: {
    title: "CTA 渠道分布",
    empty: "暂无点击",
    columns: { channel: "渠道", clicks: "点击数" },
  },

  capiHealth: {
    title: "服务端回传（CAPI）",
    verdict: { idle: "无回传", healthy: "正常", degraded: "有失败", failing: "大量失败" },
    idleHint: ["该区间没有服务端回传记录。在", "里配置账号级凭据后，表单转化会从服务端直接送回平台，补上被拦截插件吃掉的那部分。"],
    settingsLink: "设置",
    sent: "已送达",
    pending: "重试中",
    failed: "失败",
    deliveryRate: "送达率",
    lastFailure: (provider: string) => `${provider} 最近一次失败`,
    platformReturned: "平台返回：",
    columns: { provider: "平台", sent: "已送达", pending: "重试中", failed: "失败", lastErrorAt: "最近失败时间" },
    note: "送达率 = 已送达 /（已送达 + 失败）。重试中的事件尚未定局，不计入分母；连续失败到上限（5 次）才计为失败。",
  },

  pageComparison: {
    title: "落地页对比",
    hint: "点任一行可把下方全部图表筛到该页",
    empty: "还没有落地页",
    columns: { page: "落地页", views: "曝光", clicks: "CTA 点击", leads: "线索", cvr: "线索转化率" },
    noLeads: "无线索",
    noTraffic: "无流量",
  },
};
