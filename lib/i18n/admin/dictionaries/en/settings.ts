// 设置页。PR1 只落「界面语言」这一节，其余分节（经营主体、CAPI 凭据、线索通知）
// 在 PR2 随工作台一起接入。
export const settings = {
  title: "Settings",
  profile: {
    title: "Profile",
    name: "Name",
    email: "Email",
  },
  account: {
    title: "Account",
    manage: "Manage",
    currentPlan: "Current plan",
  },
  language: {
    title: "Language",
    // 说明这条偏好的作用域：它同时决定后台界面和平台发给你的邮件，
    // 但不影响你生成的落地页——那是给你的访客看的，语言由页面内容自己决定。
    description:
      "Applies to this dashboard and the emails we send you. It does not change the landing pages you publish.",
    label: "Interface language",
    options: { en: "English", zh: "简体中文" },
    saved: "Language updated",
    saveFailed: "Could not change the language. Please try again.",
  },

  companyProfiles: {
    title: "Business entity",
    add: "Add entity",
    description:
      "Company details shown in your landing page footer. TikTok requires ecommerce and finance pages to show the operating entity and licence in the footer; Meta and LinkedIn also check that the page identity is real. You can keep several (one per entity or per market) and pick one per page in the editor's footer panel — edits apply immediately to every published page referencing it.",
    empty: "No entity yet. Add one and it will appear in your footer and policy pages.",
    columns: { name: "Name", footerPreview: "Footer preview", actions: "Actions" },
    defaultTag: "Default",
    edit: "Edit",
    delete: "Delete",
    editTitle: "Edit business entity",
    newTitle: "Add business entity",
    save: "Save",
    cancel: "Cancel",
    fields: {
      label: "Internal name",
      labelExtra: "Only used in the dashboard to tell multiple entities apart; never shown on a landing page",
      labelPlaceholder: "e.g. UK entity",
      legalName: "Legal entity name",
      legalNameRequired: "Enter the legal entity name",
      address: "Business address",
      registrationNo: "Company registration number",
      license: "Industry licence / permit number",
      licenseExtra: "Shown as required by the platforms for regulated industries such as healthcare, finance and legal",
      isDefault: "Set as default",
      isDefaultExtra: "Preselected when you create a new landing page",
    },
    saved: "Saved",
    saveFailed: "Could not save. Please try again.",
    inUse: (pages: string) =>
      `${pages} landing pages still use this entity — switch them to another one first.`,
    deleteFailed: "Could not delete. Please try again.",
    deleted: "Deleted",
  },

  capi: {
    title: "Server-side conversions (CAPI)",
    subtitle: "Account-level default credentials",
    upsell:
      "Server-side conversions are a Pro-and-above benefit. They send form conversions straight from our servers to the ad platform, recovering the conversions browser blockers swallow.",
    description:
      "Configure it once and every landing page on your account uses it. If one page needs a different Dataset, override it in that page's “Tracking & conversions” panel.",
    columns: { provider: "Platform", status: "Status", actions: "Actions" },
    configured: "Configured",
    notConfigured: "Not configured",
    update: "Update",
    configure: "Configure",
    deleteConfirm: "Those pages will stop sending server-side conversions",
    delete: "Delete",
    dialogTitle: "Set account-level conversion credentials",
    save: "Save",
    idRequired: (idLabel: string) => `Enter the ${idLabel}`,
    tokenRequired: "Paste the Access Token",
    tokenExtra: "For security we never show a stored token — paste it again when updating.",
    idExample: (sample: string) => `e.g. ${sample}`,
    tokenPlaceholder: "Paste Access Token",
    saveFailed: "Could not save — check what you entered",
    saved: "Saved. Every page without its own override now uses these credentials.",
    deleted: "Deleted",
  },

  leadNotifications: {
    title: "Lead notifications",
    emailToggle: (email: string) => `Email me new leads (sent to ${email})`,
    weeklyDigest: "Weekly lead digest (Monday summary of views / CTA clicks / leads per page)",
    webhookTitle: "Push to CRM / Zapier via webhook",
    proTag: "Pro and above",
    enablePush: "Enable push",
    saveUrl: "Save URL",
    secretConfigured: ["Signing secret configured; request header ", "X-Zap-Bridge-Signature: sha256=…"],
    secretOnce: "Signing secret (shown once — copy it now): ",
    upsell: "Upgrade to Pro to push new leads to your CRM / Zapier / Make in real time.",
    saved: "Saved",
    saveFailed: "Could not save",
  },
};
