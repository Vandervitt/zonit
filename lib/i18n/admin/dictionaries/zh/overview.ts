export const overview = {
  title: "概览",
  loadError: { pages: "落地页数据", domains: "域名数据", usage: "AI 用量数据" },

  onboarding: {
    title: "4 步上线你的获客落地页",
    steps: {
      page_created: { title: "创建落地页", desc: "选行业模板或 AI 一键生成" },
      publish_address: { title: "拿到发布地址", desc: "领取免费平台子域，或绑定自有域名" },
      page_published: { title: "发布上线", desc: "页面上线到该地址，即可开始投放" },
      first_lead: { title: "收到首条线索", desc: "访客留资后在线索收件箱查看" },
    },
  },

  stats: {
    pages: "落地页",
    pagesBreakdown: (published: number, drafts: number) => `已发布 ${published} · 草稿 ${drafts}`,
    domains: "绑定域名",
    domainsVerified: (n: number) => `已验证 ${n}`,
    aiPages: "本月 AI 成页",
    creditBalance: (balance: string | number) => `credit 余额 ${balance}`,
    plan: "当前套餐",
    pageQuota: (used: number, limit: string) => `落地页 ${used}${limit}`,
    unlimitedSuffix: "（不限）",
  },

  recent: {
    title: "最近落地页",
    all: "全部",
    columns: { name: "名称", status: "状态", updatedAt: "更新时间", actions: "操作" },
    published: "已发布",
    draft: "草稿",
    edit: "编辑",
    preview: "预览",
  },

  quickActions: {
    title: "快捷操作",
    newPage: "新建落地页",
    connectDomain: "绑定域名",
    viewPlans: "查看套餐",
  },

  analyticsCard: {
    title: "投放分析",
    description: "访问量 / CTA 点击 / 来源归因，实时查看落地页表现。",
    cta: "查看投放分析",
  },
};
