import type { HelpChapterData } from "../types";

export const account: HelpChapterData = {
  slug: "account",
  title: "账号与设置",
  summary: "登录方式、账户信息与通知设置。",
  sections: [
    {
      id: "login",
      heading: "登录方式",
      blocks: [
        {
          t: "list",
          items: [
            "支持邮箱注册登录与 Google 账号一键登录。",
            "用同一邮箱的两种方式登录，进入的是同一个账户，数据互通。",
            "忘记密码可在登录页发起重置；使用 Google 登录则无需密码。",
          ],
        },
      ],
    },
    {
      id: "settings",
      heading: "设置项一览",
      blocks: [
        {
          t: "table",
          head: ["设置", "位置", "说明"],
          rows: [
            ["线索邮件通知", "设置 → 线索通知", "新线索实时发送到注册邮箱，开关即生效"],
            ["线索 Webhook", "设置 → 线索通知", "Pro 及以上；配置详见「线索管理」章"],
            ["套餐与订阅", "账户与计费", "升级、发票、取消订阅"],
          ],
        },
        {
          t: "p",
          text: "你的页面、线索与素材数据按账户隔离，仅你本人可见、可管理。",
        },
      ],
    },
  ],
};
