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
};
