export const domains = {
  title: "域名",
  enabledCount: (used: number, limit: string) => `已启用 ${used}${limit} 个域名`,
  add: "添加域名",
  loadErrorLabel: "域名列表",
  empty: "还没有绑定任何域名",

  columns: { domain: "域名", verification: "验证状态", enabled: "启用", actions: "操作" },
  noPublishedPages: "未发布任何页面",
  rootMissing: (domain: string) => `根路径尚未发布，直接访问 ${domain} 会 404`,
  verified: "已验证",
  pending: "待验证",
  refreshVerification: "刷新验证状态",
  dns: {
    misconfigured: "DNS 未正确配置",
    misconfiguredTooltip:
      "域名所有权已验证，但 DNS 记录配置不正确，访客访问该域名看不到你的落地页。请到 DNS 服务商检查 A/CNAME 记录。",
    ok: "DNS 已正确配置",
    okTooltip: "域名所有权已验证，且 DNS 记录已正确指向，访客可以正常访问你的落地页。",
    recheck: "重新检测 DNS 配置",
  },
  deleteConfirm: { title: "确认删除该域名？", ok: "删除", cancel: "取消" },
  delete: "删除",

  addDialog: {
    title: "添加自定义域名",
    intro: "绑定你自己的域名，用户访问时地址栏显示你的品牌域名。",
    vercelTip: {
      message: "还没有域名？强烈建议在 Vercel 购买",
      linkText: "Vercel 官网",
      body: [
        "在 ",
        " 购买的域名解析默认托管在 Vercel，绑定到本平台后自动生效，无需手动配置 A/CNAME 等 DNS 记录，也不受大陆服务商政策影响。在其他服务商（GoDaddy / Namecheap / 阿里云等）购买的域名同样支持，但需要你到其解析控制台手动添加 DNS 记录后才能生效。",
      ],
    },
    label: "域名",
    required: "请输入域名",
    placeholder: "example.com 或 www.example.com",
    submit: "添加域名",
    submitting: "添加中…",
    errors: {
      invalid_domain: "域名格式不正确",
      domain_tld_blocked:
        "暂不支持中国大陆管辖域名（如 .cn），其解析受备案与注册局政策影响，请使用 .com / .net 等国际域名",
      domain_taken: "该域名已被其他账号绑定",
      vercel_api_error: "Vercel API 调用失败，请稍后重试",
      limit_exceeded: "已达到当前套餐的域名数量上限，请升级套餐或先禁用一个已有域名",
      fallback: "添加失败，请重试",
    },
    recordsIntro:
      "域名已添加。请前往你的 DNS 服务商（Cloudflare / AWS Route53 / Namecheap 等）添加以下记录，Vercel 将在 DNS 生效后自动签发 SSL 证书。",
    mainlandNs: {
      message: "检测到该域名使用中国大陆 DNS 服务商",
      description: (provider: string) =>
        `当前 NS 属于 ${provider}。域名本身可正常使用，但受大陆监管政策影响（如实名/备案要求变化），存在被服务商暂停解析的风险。做海外投放建议将 DNS 迁移到 Cloudflare 等海外服务商，或至少知晓此风险。`,
    },
    record: { type: "类型", name: "名称", value: "值" },
    recordHint:
      "⚠️ 顶级域名（如 example.com）用 A 记录，子域名（如 www.example.com）用 CNAME。如使用 Cloudflare，请将代理状态设为「仅 DNS」（灰色云朵），否则会阻断证书签发。",
    done: "完成",
  },

  upgradeDialog: {
    title: "已达到落地页上限",
    later: "稍后再说",
    cta: (plan: string, price: string) => `查看 ${plan} 套餐 · ${price}`,
    body: (current: string, currentLimit: string, target: string, targetLimit: string) =>
      `${current} 套餐最多创建 ${currentLimit}。升级到 ${target} 即可最多管理 ${targetLimit}。`,
    alsoGet: "升级后还可获得：",
    removeWatermark: "✓ 去除品牌水印",
    moreDomains: (n: string) => `✓ 绑定最多 ${n} 个自定义域名`,
  },

  quotaBanner: {
    expiredTitle: "已发布页数超出套餐额度，超出部分即将被取消发布",
    countdownTitle: (days: number) => `已发布页数超出套餐额度，还有 ${days} 天`,
    body: (published: number, limit: number, excess: number, deadline: string) =>
      `当前 ${published} 张已发布，套餐额度 ${limit} 张，超出 ${excess} 张。已上线的页面暂不受影响，但无法再发布新页面。${deadline}我们会自动取消发布超出的部分，优先保留域名根路径与最早发布的页面。`,
    deadlineWithin: (days: number) => `若 ${days} 天内仍未处理，`,
    deadlinePassed: "宽限期已结束，",
    contentSafe: "只是下线，页面内容不会被删除",
    contentSafeSuffix: "，升级套餐后可随时重新发布。",
    upgrade: "升级套餐",
    managePages: "管理落地页",
  },
};
