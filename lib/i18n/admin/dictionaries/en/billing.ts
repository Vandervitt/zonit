// 账户与计费页。
//
// 价格文案不在这里：金额、量词、每档要点走 lib/plans.ts 的展示层函数
// （planPriceLabel / formatPlanLimit / plans 字典），它们本来就是双语的，
// 只是此前被 admin 以写死的 "zh" 调用。本切片只放这一页自己的界面文案。
export const billing = {
  title: "Plan & billing",
  subtitle: "Manage your subscription",

  toast: {
    subscribed: {
      message: "Subscription active",
      description: "Your plan takes effect within a few seconds — refresh this page to see it.",
    },
    toppedUp: {
      message: "Payment received",
      description: "Your AI credits arrive within a few seconds — refresh to see the new balance.",
    },
    checkoutOpened: {
      message: "Checkout opened in a new tab",
      forPlan: "Refresh this page once payment is complete to see your new plan.",
      forCredits: "Refresh this page once payment is complete to see your new balance.",
    },
  },

  errors: {
    checkoutLink: "Could not create a checkout link",
    creditsLink: "Could not create a top-up link",
    portalLink: "Could not open the billing portal",
    changePlan: "Could not switch plans",
    resume: "Could not resume the subscription",
    retryLater: "Please try again in a moment.",
    retryOrContact: "Please try again later, or contact support.",
  },

  changePlan: {
    cancelScheduled: {
      message: "Plan changes are paused while cancellation is scheduled",
      description:
        "This subscription ends when the current billing period closes. Use “Resume subscription” in the banner above, then you can switch plans.",
    },
    noSubscription: {
      message: "This plan can't be changed here",
      description:
        "Your plan was granted by an administrator and has no self-serve subscription behind it. Contact us if you need it adjusted.",
    },
    submitted: {
      message: "Plan change submitted",
      description: "Refresh this page once it takes effect to see the new tier.",
    },
  },

  resumed: {
    message: "Subscription resumed",
    description: "It will renew as usual, and you can switch plans again.",
  },

  cancelledBanner: {
    title: "Subscription cancelled",
    withDate: (plan: string, date: string) =>
      `Your ${plan} benefits stay active until ${date}, then drop back to Free. Plan changes are unavailable until you resume.`,
    withoutDate: (plan: string) =>
      `Your ${plan} subscription is set to end when the current billing period closes, and plan changes are unavailable until then. “Resume subscription” cancels that and keeps it renewing.`,
    resume: "Resume subscription",
  },

  awaitingRefresh: {
    title: "Refresh once your change goes through",
    description: "After payment or a plan switch takes effect, refresh to show your current tier.",
    action: "Refresh page",
  },

  currentPlan: {
    title: "Current plan",
    managePortal: "Manage subscription",
    compare: "See full comparison",
    labels: {
      plan: "Plan",
      subscription: "Paid tier",
      pages: "Landing page limit",
      domains: "Domain limit",
      watermark: "Platform watermark",
    },
    grantedByAdmin: "Granted by an administrator",
    grantedUntil: (date: string) => ` (until ${date})`,
    domainsNotIncluded: "Not included",
    watermarkOn: "Shown",
    watermarkOff: "Removed",
  },

  compedNotice: {
    message: "Your plan was granted by an administrator",
    description:
      "A granted plan has no self-serve subscription, so it can't be upgraded or downgraded here. Contact us if you need it changed.",
  },

  switcher: {
    fromFree: "Available plans",
    change: "Change plan (effective immediately; the difference is prorated)",
    giftedNotice: (paid: string, comp: string) =>
      `Changing tiers only affects your paid subscription (currently ${paid}). It does not touch the ${comp} benefits granted by an administrator.`,
    upgrade: "Upgrade",
    downgrade: "Downgrade",
    includesPrevious: (plan: string) => `Everything in ${plan}`,
    downgradeConfirm: {
      title: "Downgrade?",
      description: (plan: string) =>
        `You'll switch to ${plan} right away. Anything above the new limits becomes restricted, and the difference is prorated.`,
      ok: "Downgrade",
      cancel: "Never mind",
    },
  },

  credits: {
    title: "AI credit top-up",
    description:
      "Credits apply to full-page AI generation only. They're used automatically once your monthly allowance runs out and never expire. AI copy rewriting does not consume credits — when the monthly rewrite allowance runs out, wait for the reset or upgrade. One-time payment; your subscription is unaffected.",
    balanceTitle: "Credits available",
    balanceSuffix: "generations",
    neverExpire: ["Credits never expire,", "and are used after your free allowance."],
    packLabel: (n: number) => `${n} full-page generations`,
    packDesc: {
      50: "Good for the occasional top-up",
      200: "Lower unit price — best for heavy use",
    },
    buy: "Buy",
  },

  cancelHint: "To cancel, open the payment provider's customer portal via Manage subscription",
};
