# 留资渠道与主转化路径

生成页的转化路径有两类：**外部深链**（WhatsApp / Telegram / 电话 / 邮件）与**页内留资表单**。本文说明表单作为主转化路径的实现约定与红线。

## 为什么需要表单主转化

第一梯队（电商种草）29 套模板全部走 WhatsApp，这符合 COD 询单市场的习惯。但第二梯队的服务与 B2B 品类不同：采购方提 RFQ、SaaS 买家约 demo、移民申请人递案情，都需要一次性提交结构化信息，即时聊天反而是障碍。

2026-07-30 之前平台**结构性地只支持 WhatsApp 优先**——`validateLink` 不接受页内锚点、`LeadForm` 无锚点 id、`blankPrimaryCtaLinks` 会清空主 CTA、发布门槛又要求主 CTA 非空。这四道限制叠加，导致表单永远做不成主转化。

## 现在的约定

**锚点常量是单一真源**：`LEAD_FORM_ANCHOR_ID`（`landing-renderer/sections/LeadForm.tsx`），值为 `lead-form`。schema 保证每页至多一个 `leadForm`，故固定 id 不会重复。CTA 指向 `#lead-form` 即可直达。

| 环节 | 行为 |
|---|---|
| `validateLink` | 放行 `#片段` 形式的页内锚点；孤立的 `#` 不是落点，仍拦；锚点同样过交易语义检查 |
| `blankPrimaryCtaLinks` | 跳过锚点链接——锚点不是用户的联系方式，没有强制重填的理由；非锚点主 CTA 照常清空 |
| 发布门槛 `collectContactIssueItems` | CTA 指向 `#lead-form` 时**额外校验**表单确实已启用，否则报死链问题。这是收紧不是放行 |

## 提交失败的处理（不得假成功）

`POST /api/leads` 的落库失败必须分类，**任何情况下都不许在失败时返回 204**——访客看到成功提示、线索却蒸发，是这条链路最贵的故障（客户已经为那次广告点击付过钱）。

| 失败类型 | 判定 | 行为 |
|---|---|---|
| 坏 `pageId`（FK 违约 `23503` / 非法 uuid `22P02`） | `isBadPageIdError`（`lib/db-errors.ts`） | 静默 204。线索无归属页面，重投也永远失败 |
| 其余（连接中断、池打满、超时……） | 默认 | `insertLead` 内先重试一次 → 仍失败则上报 Sentry + 写兜底留存 + 返回 **503**，表单显示可重试 |

- **兜底留存**：`lib/leads/spool.ts` 写 Vercel Blob（`lead-spool/` 前缀，**必须 `access: "private"`**——内含访客 PII），刻意不落 Postgres，因为失败场景本身多半就是库不可用。
- **重投**：`/api/cron/daily` 每日重投一次，成功或确认无救（坏 pageId / 超 7 天）即删 blob，其余保留。Hobby 计划 cron 最快每天一次，故最坏延迟 24h——它是兜底，不是主路径。
- **旁路环节**（里程碑、CAPI、通知）失败不阻塞 204，但一律 `console.error` + `Sentry.captureException`，禁止空 catch。`/api/track` 同规则：埋点失败不阻塞响应，但非坏 pageId 一律上报。
- **埋点上报走同源相对路径**（`TRACK_PATH`，`landing-renderer/tracking/sinks.ts`）：租户自有域名下 `/api/track` 由 tenant-proxy 白名单直通。改回绝对 URL 会退化成跨源请求，历史上两次故障（308 重定向、`ERR_CONNECTION_RESET`）都由此而来。

## 联系方式格式（国码强制携带）

访客手填的号码普遍省略国码——本地人填本地号从不写国码。这类号码进库后既拼不出 `wa.me` 链接，客户也未必打得通，等于半条废线索。故**在写入时保证格式，而不是在读取时猜**：

| 环节 | 规则 |
|---|---|
| 默认国码 | `app/p/[slug]/page.tsx` 按 `x-vercel-ip-country`（与 `euVisitor` 同一来源）解析，经 `defaultDial` 透传给渲染器 |
| 表单控件 | phone / whatsapp 前置国码 `<select>`，**只能改选、不能清空**，无空选项。被选中项只渲染国码（原生 select 收起态显示的就是它，带国名会被截断成 `+1 United Sta…`），其余项显示全称便于按国名查找；`aria-label` 恒为全称，屏幕阅读器不丢国家信息 |
| 提交 | `composeE164` 拼成 E.164，顺带处理格式符、本地中继前缀 `0`、访客重复输入国码三种情况 |
| 服务端校验 | phone / whatsapp 必须 `^\+[1-9]\d{6,14}$`；telegram 归一为裸用户名（`normalizeTelegram`），跳不了 `t.me` 的输入一律拒 |

**首屏预算**：全量国码表（229 项）**禁止在落地页客户端组件里静态 import**。服务端静态 import 只进服务端 bundle；客户端由 `LeadForm` 在 `requestIdleCallback` 里 `import()`，落到独立 chunk。首屏 HTML 里每个选择器只渲染被选中的那一个 `<option>`——这条由 `LeadForm.test.ts` 断言守住，改动别把它破坏了。

校验收紧意味着 400 变多，故 `LeadForm` 把错误码映射成访客可读提示（`ERROR_MESSAGES`），不再一律回落到 "Something went wrong"。新增错误码时两边要同步。

## 后台一键联系

`/admin/leads` 的「联系方式」列把线索渲染成可点渠道按钮，链接由 `lib/leads/contact-links.ts` 拼装：

| 渠道 | 链接 | 新窗 |
|---|---|---|
| WhatsApp | `https://wa.me/<去掉 + 的 E.164>` | 是 |
| 电话 | `tel:<E.164>` | 否 |
| 邮件 | `mailto:<email>` | 否 |
| Telegram | `https://t.me/<裸用户名>` | 是 |

按跟进成功率排序（WhatsApp → 电话 → 邮件 → Telegram）。**点开任一渠道即自动标已读**——点击本身就是「已跟进」的信号，不需要客户再手动录一次状态；这也是当初否决跟进状态机的理由：平台没有信号能自动推进的状态，迟早会变成不准的看板。

拼不出可靠链接的联系方式（非 E.164 的号码、跳不了 `t.me` 的 Telegram）降级为可复制纯文本，不产出链接——宁可让客户自己复制，也不要给一个拨错的号。该模块之所以只做拼接不做解析，是因为格式已由写入侧保证（见上一节）。

## 表单文案的语言

生成页面向海外访客，故渲染器的字段缺省标签为**英文**（`Name / Email / Phone / WhatsApp / Telegram / Message`），访客可见的状态文案（提交中、失败、预览提示）同样为英文。

**注意模板详情页 `/templates/[id]` 是以 `preview` 模式公开渲染真实样稿的**，所以任何"预览态"文案也会出现在公开页上，不能写中文。

需要非英语市场时，用 `LeadFormFieldConfig.label` 逐字段覆盖（可选字段，缺省回退英文），编辑器的留资表单面板提供输入框。这是 schema 里唯一为表单文案开的口子。

## 红线

- 表单只能收集轻量资格信息。至少启用一个可联系字段（email / phone / whatsapp / telegram）；只收 name 不构成有效线索。
- 不得引入交易语义：不收付款信息，不做订单确认，`quote / estimate / assessment` 一律只是留资话术。
- registry 的 `conversion` 标签必须与样稿实际一致——标了 `form` 就必须真有启用的 `leadForm`，否则画廊按「表单」筛选会筛出没有表单的模板。该一致性由 `landing-editor/samples/templates.structure.test.ts` 全库回归守住。

## 新增模板时

1. 样稿放 `landing-editor/samples/<name>Draft.ts`
2. `registry.ts` 追加 `TemplateMeta`（含双语 `industry` / `tagline` / `seoIntro`）
3. `registry.drafts.ts` 追加同 id 的动态加载器
4. 新行业大类需在 `lib/i18n/dictionaries/{en,zh}/templates.ts` 的 `category` 补展示名
5. 缩略图与样稿内所有 Unsplash 图片 URL **必须实测可用**（写错 ID 会导致公开画廊图裂）
6. 跑 `pnpm vitest run landing-editor/samples/templates.structure.test.ts`——它会对每套模板断言区块必须性、字段格式、页脚合规字段、标签一致性
