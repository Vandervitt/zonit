export const billing = {
  title: "账户与计费",
  subtitle: "管理你的订阅套餐",

  toast: {
    subscribed: {
      message: "订阅成功",
      description: "套餐将在几秒内生效，稍后刷新本页即可看到。",
    },
    toppedUp: {
      message: "充值成功",
      description: "AI 额度将在几秒内到账，稍后刷新页面即可看到最新余额。",
    },
    checkoutOpened: {
      message: "支付页已在新标签页打开",
      forPlan: "完成支付后请刷新本页查看最新套餐。",
      forCredits: "完成支付后请刷新本页查看最新额度余额。",
    },
  },

  errors: {
    checkoutLink: "无法创建结账链接",
    creditsLink: "无法创建充值链接",
    portalLink: "无法获取管理链接",
    changePlan: "套餐切换失败",
    resume: "恢复订阅失败",
    retryLater: "请稍后重试。",
    retryOrContact: "请稍后重试或联系支持。",
  },

  changePlan: {
    cancelScheduled: {
      message: "订阅已安排取消，暂不能换档",
      description:
        "当前订阅将在本计费周期结束时取消。请先在上方提示条点击「恢复订阅」，恢复后即可切换档位。",
    },
    noSubscription: {
      message: "当前套餐无法在此切换",
      description: "你的套餐来自管理员赠送、暂无自助订阅，无法在此升降档。如需调整请联系我们。",
    },
    submitted: {
      message: "套餐切换请求已提交",
      description: "生效后刷新本页即可看到新档位。",
    },
  },

  resumed: {
    message: "订阅已恢复",
    description: "将正常续费，现在可以切换档位了。",
  },

  cancelledBanner: {
    title: "订阅已取消",
    withDate: (plan: string, date: string) =>
      `当前 ${plan} 套餐权益保留至 ${date}，到期后自动回落 Free。取消期间无法切换档位，恢复订阅后即可正常续费与换档。`,
    withoutDate: (plan: string) =>
      `当前 ${plan} 订阅已安排在本计费周期结束时取消，期间无法切换档位。点击「恢复订阅」可撤销取消并继续正常续费。`,
    resume: "恢复订阅",
  },

  awaitingRefresh: {
    title: "操作完成后请刷新页面",
    description: "支付或套餐切换生效后，点击右侧按钮刷新以显示最新的订阅档位。",
    action: "刷新页面",
  },

  currentPlan: {
    title: "当前套餐",
    managePortal: "管理订阅",
    compare: "查看完整对比",
    labels: {
      plan: "套餐",
      subscription: "订阅档位",
      pages: "落地页上限",
      domains: "域名上限",
      watermark: "品牌水印",
    },
    grantedByAdmin: "管理员赠送",
    grantedUntil: (date: string) => `（至 ${date}）`,
    domainsNotIncluded: "不支持",
    watermarkOn: "有",
    watermarkOff: "无",
  },

  compedNotice: {
    message: "当前套餐由管理员赠送",
    description: "赠送套餐没有可自助管理的订阅，无法在此升级或降级。如需调整套餐，请联系我们。",
  },

  switcher: {
    fromFree: "可升级套餐",
    change: "更换套餐（立即生效，差额按比例计费/抵扣）",
    giftedNotice: (paid: string, comp: string) =>
      `升降档只调整付费订阅（当前 ${paid}），不影响管理员赠送的 ${comp} 权益。`,
    upgrade: "升级",
    downgrade: "降级",
    includesPrevious: (plan: string) => `包含 ${plan} 全部权益`,
    downgradeConfirm: {
      title: "确认降级？",
      description: (plan: string) => `将立即切换到 ${plan}，超出新档上限的功能会受限，差额按比例抵扣。`,
      ok: "确认降级",
      cancel: "再想想",
    },
  },

  credits: {
    title: "AI 额度充值",
    description:
      "额度仅用于「AI 整页生成」，当月免费额度用尽后自动消耗、永不过期。AI 文案改写不使用额度：当月改写额度用尽需等次月重置或升级套餐。一次性付款，不影响订阅。",
    balanceTitle: "当前可用充值额度",
    balanceSuffix: "次",
    neverExpire: ["充值额度永不过期，", "免费额度用尽后自动消耗。"],
    packLabel: (n: number) => `${n} 次整页生成额度`,
    packDesc: {
      50: "适合偶尔补量",
      200: "单价更低，重度使用推荐",
    },
    buy: "购买",
  },

  cancelHint: "如需取消订阅，请通过 管理订阅 进入收款渠道的客户门户操作",
};
