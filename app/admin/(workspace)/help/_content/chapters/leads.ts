import type { HelpChapterData } from "../types";

export const leads: HelpChapterData = {
  slug: "leads",
  title: "线索管理",
  summary: "线索收件箱、邮件通知、Webhook 推送到 CRM 与收不到线索的排查。",
  sections: [
    {
      id: "inbox",
      heading: "线索收件箱",
      blocks: [
        {
          t: "p",
          text: "访客通过留资表单提交的联系方式统一进入「线索」收件箱，包含联系字段、附加的资格筛选信息，以及来源归因（来自哪张页面、哪个表单 / CTA）。",
        },
        {
          t: "list",
          items: [
            "线索按时间倒序排列，可按页面筛选。",
            "海外线索时效性极强：建议 1 小时内跟进，转化率会显著高于隔天回复。",
            "WhatsApp / 电话直连类转化不经过表单，不会出现在收件箱——这类访客直接进了你的 WhatsApp / 来电，收件箱只收表单线索。",
          ],
        },
      ],
    },
    {
      id: "email-notify",
      heading: "新线索邮件通知",
      blocks: [
        {
          t: "p",
          text: "在「设置」→「线索通知」开启邮件通知后，每条新线索会实时发送到你的注册邮箱，不用守着后台刷新。",
        },
      ],
    },
    {
      id: "webhook",
      heading: "Webhook 推送到 CRM（Pro 及以上）",
      blocks: [
        {
          t: "p",
          text: "把新线索实时 POST 到你自己的系统：CRM、Zapier、Make 或任何能接收 HTTP 请求的地址，实现「线索进来 → 自动进你的工作流」。",
        },
        {
          t: "steps",
          items: [
            { title: "配置地址", desc: "「设置」→「线索通知」→ 填入你的 Webhook URL（如 Zapier 的 Catch Hook 地址）并开启。" },
            { title: "保存签名密钥", desc: "首次开启会生成签名密钥（secret），只显示一次，请立即保存。用于在你的接收端校验请求确实来自 Zap Bridge。" },
            { title: "接收与验证", desc: "新线索产生时系统实时 POST JSON 数据到你的地址，请求带签名头；投递失败会自动重试。" },
          ],
        },
        {
          t: "list",
          items: [
            "Zapier 接法：创建 Zap → 触发器选 Webhooks by Zapier（Catch Hook）→ 把生成的 URL 填到线索通知设置 → 后续动作接你的 CRM / 表格 / Slack。",
            "Make（原 Integromat）同理，用 Custom Webhook 模块拿 URL。",
            "接收端返回 2xx 即视为成功；失败会按退避策略自动重试，无需手动补发。",
          ],
        },
      ],
    },
    {
      id: "no-leads",
      heading: "收不到线索？排查清单",
      blocks: [
        {
          t: "steps",
          items: [
            { title: "确认页面已发布且可访问", desc: "用手机流量（非公司 WiFi）打开你的域名，确认页面正常打开。" },
            { title: "自测提交一条线索", desc: "自己填一遍表单提交，看收件箱是否出现。出现则链路正常，是流量或转化率问题。" },
            { title: "检查联系方式", desc: "确认 WhatsApp 号码是真实可达的国际格式号码——模板占位号收不到任何消息。" },
            { title: "检查通知渠道", desc: "邮件通知看垃圾箱；Webhook 看你的接收端日志与返回码。" },
            { title: "看漏斗定位问题", desc: "「投放分析」的漏斗能告诉你卡在哪：有曝光没点击是页面吸引力问题，有点击没线索是表单 / 联系路径问题。" },
          ],
        },
      ],
    },
  ],
};
