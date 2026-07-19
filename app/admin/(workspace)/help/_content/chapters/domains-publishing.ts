import type { HelpChapterData } from "../types";

export const domainsPublishing: HelpChapterData = {
  slug: "domains-publishing",
  title: "域名与发布",
  summary: "为什么必须自有域名、DNS 配置步骤、验证排查与发布状态流转。",
  sections: [
    {
      id: "why-own-domain",
      heading: "为什么必须用自有域名",
      blocks: [
        {
          t: "p",
          text: "落地页只能发布到你自己绑定并验证过的域名，平台不提供公共子域名托管。这不是限制，而是投放的最佳实践：",
        },
        {
          t: "list",
          items: [
            "投放可信度：广告平台对独立品牌域名的信任度远高于共享托管域名，影响审核通过率与跑量。",
            "品牌资产：访客看到的是你的域名，复访、口碑与信任都沉淀在你自己的品牌上。",
            "SEO：自然流量与搜索收录积累在你的域名下，换工具也带得走。",
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "还没有域名？在 Namecheap、Cloudflare、GoDaddy 等注册商购买即可，一般每年 $10 左右。建议选 .com 或目标市场常见后缀。",
        },
      ],
    },
    {
      id: "bind-dns",
      heading: "绑定域名与 DNS 配置",
      blocks: [
        {
          t: "steps",
          items: [
            { title: "添加域名", desc: "进入「域名」→ 输入你的域名（如 example.com 或 www.example.com）并添加。暂不支持中国大陆管辖域名（.cn / .com.cn / .中国 等），其解析受备案与注册局政策影响，请使用 .com / .net 等国际域名。" },
            { title: "到注册商配置 DNS 记录", desc: "登录你买域名的平台（Namecheap / GoDaddy / Cloudflare 等），进入 DNS 管理，按下表添加记录。" },
            { title: "等待验证", desc: "系统每 5 秒自动检测验证状态，通过后域名显示「已验证」，即可用于发布。" },
          ],
        },
        {
          t: "table",
          head: ["你绑定的域名类型", "添加的 DNS 记录", "主机名 / 名称", "记录值"],
          rows: [
            ["裸域（example.com）", "A 记录", "@", "76.76.21.21"],
            ["子域（www.example.com 等）", "CNAME 记录", "www（即子域部分）", "cname.vercel-dns.com"],
          ],
        },
        {
          t: "callout",
          tone: "warning",
          text: "裸域不能用 CNAME，必须用 A 记录；上表配置对 Cloudflare、Route53、Namecheap、GoDaddy 全部通用。使用 Cloudflare 时建议先把代理（橙色云朵）关为「仅 DNS」，验证通过后再按需开启。",
        },
      ],
    },
    {
      id: "verify-troubleshoot",
      heading: "验证不通过怎么办",
      blocks: [
        {
          t: "list",
          items: [
            "DNS 生效需要时间：一般几分钟，最长可达 24~48 小时（取决于注册商与 TTL）。配置无误就耐心等待，列表中的「刷新验证状态」可手动重查。",
            "检查记录值有无多余内容：记录值就是 76.76.21.21 或 cname.vercel-dns.com，不要带 http://、末尾点或空格。",
            "检查主机名：裸域填 @（或留空，视注册商而定）；子域只填子域部分（www），不要填完整域名。",
            "确认没有冲突记录：同一主机名下残留的旧 A / CNAME / 转发（Forwarding）记录会覆盖新配置，请删除。",
            "HTTPS 证书在验证通过后自动签发，无需自行配置 SSL。",
          ],
        },
      ],
    },
    {
      id: "publish-lifecycle",
      heading: "发布与状态流转",
      blocks: [
        {
          t: "table",
          head: ["操作", "在哪", "效果"],
          rows: [
            ["发布", "编辑器顶栏「发布」→ 选择已验证域名", "页面上线到该域名根路径，对外公开可访问"],
            ["再编辑", "落地页列表 / 编辑器", "修改草稿不影响线上版本，再次发布后生效"],
            ["取消发布", "落地页列表", "对外下线，域名绑定保留，随时可重新发布"],
            ["删除", "落地页列表", "页面与草稿彻底删除且不可恢复；已发布页会同时下线"],
          ],
        },
      ],
    },
    {
      id: "pre-publish-check",
      heading: "发布前校验会检查什么",
      blocks: [
        {
          t: "p",
          text: "点「发布」时系统自动校验页面，存在阻断项时无法发布，顶栏会列出未通过的项目：",
        },
        {
          t: "list",
          items: [
            "首屏主 CTA 不能为空——没有转化入口的页面没有投放意义。",
            "全页扫描模板占位号码（如 wa.me/1555…）：占位号残留在任何位置（主 CTA、悬浮按钮、区块内）都会被拦截，必须替换为真实号码。",
            "页面结构完整性：必要固定件与字段齐全。",
          ],
        },
        {
          t: "callout",
          tone: "success",
          text: "按提示逐项修复后重新点「发布」即可。校验是为了保证你上线的每一张页面都真的能收到线索。",
        },
      ],
    },
  ],
};
