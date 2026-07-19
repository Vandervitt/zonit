# 设计：投放分析采集管道（spec ②）

- 日期：2026-06-21
- 范围：本 spec 为「② 投放分析采集管道」，兑现 admin 导航中预留的「投放分析（即将上线）」入口。
- 前置：spec ①（admin UI 重构）已完成；admin 用 antd v5 深青·明亮主题。

## 背景与动机

落地页是非交易、引导联系的（CTA 为 WhatsApp / tel / mailto / sms / telegram 深链，无平台托管表单）。现有追踪是客户端 Pixel（page_view / cta_click 广播给 Meta/GA4/TikTok），数据进广告平台、不进 Zap Bridge。`landing-renderer/tracking/sinks.ts` 文件尾已明确注释预留 first-party 采集 sink（`navigator.sendBeacon("/api/track", ...)`），但尚未实现。

本 spec 实现这个预留管道：落地页把匿名事件回传 Zap Bridge → 存库 → 后台聚合展示，让「投放分析」页有真实数据：访问量、CTA 点击、点击率、渠道分布、UTM 来源、按天趋势、按落地页维度。

## 关键决策（已确认）

- **同意门控**：first-party 采集**始终进行**（不受 ConsentBar 门控）。理由：匿名、无 cookie、无 PII，属正当利益，且能得到准确流量（门控会因用户无视同意条而严重低估）。第三方 Pixel 仍受同意门控不变。
- **指标口径**：纯 PV，**无独立访客 UV**（不引入访客 id / cookie / localStorage）。MVP 指标：访问量(PV)、CTA 点击、点击率、渠道分布、UTM 来源、按天趋势、分落地页。

## 关键事实（探查结论）

- `EventSink` 接口与 `TrackingProvider` 已就绪：Provider 在同意后构建 PixelSink，广播 `page_view`（mount）与 `cta_click`（含 `channel` + UTM 参数）。
- `sinks.ts` 尾部注释预留 `BeaconSink`：`navigator.sendBeacon("/api/track", JSON.stringify({ event, ...params }))`。
- `TrackingProvider({ tracking, children })` 当前**不接收 pageId**，需新增 `pageId` prop。
- `/p/[slug]/page.tsx` 用 `getPublishedBySlug(slug)` 得到 `page`（含 `page.id`），可传给 Provider。
- `recharts@2.15.2` 仍在依赖中（旧 demo 删除后保留），分析图表直接复用，无需新依赖。
- 迁移命名 `0XX_name.js`，下一个为 `013_add_analytics_events.js`。
- `event` 枚举来自 `landing-renderer/tracking/events.ts`：`"page_view" | "cta_click"`；`channel` 由 `inferChannel` 推断：`whatsapp/tel/mailto/sms/telegram/external`。

## 架构（4 段数据流）

访客浏览器（落地页，租户域名）→ BeaconSink → `POST /api/track`（公开采集）→ `analytics_events` 表 → `GET /api/analytics`（authed 聚合）→ `/admin/analytics` 页（antd + recharts）。

## 1. 采集端（landing-renderer）

- **`BeaconSink`**（新增于 `sinks.ts`，实现 `EventSink`）：
  - `ready()` 恒 `true`；`init()` 空操作。
  - `track(event, params)`：构造 payload `{ pageId, event, channel?, utm_source?, utm_medium?, utm_campaign? }`，用 `navigator.sendBeacon(TRACK_URL, new Blob([JSON.stringify(payload)], { type: "text/plain" }))` 发送；`sendBeacon` 不可用时 `fetch(TRACK_URL, { method: "POST", body, keepalive: true })` 兜底。
  - 用 `text/plain` body 规避 CORS 预检（simple request）。
  - `TRACK_URL`：落地页在租户域名，采集端在 Zap Bridge 应用域名——URL 须指向 Zap Bridge 主域（绝对 URL，来自构建期环境变量或注入的配置）。具体取值在实现时确认（参考项目既有的 app host 配置 `lib/host`）。
- **`TrackingProvider`** 改造：
  - 新增 `pageId: string` prop。
  - BeaconSink 生命周期**独立于同意条**：mount 时即创建 BeaconSink 并发 `page_view`（不等 consent）；CTA 点击时 BeaconSink 与（已同意的）PixelSink 各自 `track("cta_click", ...)`。
  - PixelSink 维持原有「同意后才构建/init/发 page_view」逻辑不变。
  - utm 参数沿用现有 `utmRef`。
- **`/p/[slug]/page.tsx`**：`<TrackingProvider tracking={page.data.tracking} pageId={page.id}>`。

## 2. 存储（migration `013_add_analytics_events.js`）

```
analytics_events
  id          bigserial PRIMARY KEY
  page_id     uuid NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE
  event       text NOT NULL CHECK (event IN ('page_view','cta_click'))
  channel     text NULL
  utm_source  text NULL
  utm_medium  text NULL
  utm_campaign text NULL
  created_at  timestamptz NOT NULL DEFAULT now()
索引：(page_id, created_at)、(page_id, event)
```

- FK 保证 page_id 有效（坏值被拒）；`ON DELETE CASCADE` 删除落地页时自动清理事件。
- 采集端为单条 INSERT，无需查库（有效性由 FK 保证）。
- 不存 IP / user-agent / 任何 PII。

## 3. 聚合（`lib/analytics/queries.ts` + `GET /api/analytics`）

- `GET /api/analytics?pageId=<id|all>&days=<7|30|90>`，authed，owner-scoped。
- owner 校验：`pageId` 须属于当前用户；`all` = 该用户全部落地页。先查用户的 page_id 集合，再以此约束事件查询（绝不跨租户）。
- 返回 JSON：
  ```
  {
    totals: { views: number, clicks: number, ctr: number },   // ctr = clicks/views
    series: { date: string, views: number, clicks: number }[],// 按天
    channels: { channel: string, clicks: number }[],          // cta_click 按 channel
    sources: { utm_source: string, views: number }[]          // page_view 按 utm_source（null 归「直接/未知」）
  }
  ```
- `lib/analytics/queries.ts`：聚合 SQL 函数；纯数据整形部分（如把行映射为 series/补零日期、算 ctr）抽为可单测的纯函数。

## 4. 分析页（`/admin/analytics`，antd + recharts）

- 解禁导航：`app/admin/(workspace)/_shell/nav.ts` 的 analytics 项去掉 `disabled`/`badge`，`href: '/admin/analytics'`。
- 新建 `app/admin/(workspace)/analytics/page.tsx`（client，antd）：
  - 顶部：落地页 `Select`（全部 + 各落地页）、区间 `Segmented`（近 7 / 30 / 90 天）。
  - KPI 卡（`Statistic`）：访问量(PV)、CTA 点击、点击率。
  - 趋势图：recharts AreaChart/LineChart（views/clicks 双线），深青配色。
  - 渠道分布表（antd `Table`：渠道 / 点击数）。
  - UTM 来源表（antd `Table`：来源 / 访问量）。
  - 空态：`Empty`「该区间还没有数据」。
  - 数据经 SWR 取 `/api/analytics`。

## 组件边界与文件

新建：
- `migrations/013_add_analytics_events.js`
- `app/api/track/route.ts`（POST 采集 + OPTIONS 预检放行；公开、无 auth）
- `lib/analytics/queries.ts`（聚合查询 + 纯整形函数）
- `lib/analytics/queries.test.ts`（纯整形函数单测）
- `app/api/analytics/route.ts`（GET 聚合，authed）
- `app/admin/(workspace)/analytics/page.tsx`（分析页 UI）

修改：
- `landing-renderer/tracking/sinks.ts`（新增 BeaconSink）
- `landing-renderer/tracking/TrackingProvider.tsx`（pageId prop + 独立 BeaconSink 生命周期）
- `app/p/[slug]/page.tsx`（传 pageId）
- `app/admin/(workspace)/_shell/nav.ts`（解禁分析项）

## 数据流细节

- 采集：BeaconSink → `text/plain` JSON → `/api/track` 读原始 body `JSON.parse` → 校验（event 枚举、字段长度上限、channel/utm 长度上限）→ `INSERT analytics_events` → 返回 **204**。载荷非法（JSON 解析失败 / event 不在枚举 / 缺 pageId）返回 **400**。坏 page_id 触发 FK 错误时按 best-effort 返回 **204**（不泄露内部状态、不阻塞访客）。OPTIONS 返回 `Access-Control-Allow-Origin: *`（虽 text/plain 不触发预检，仍放行以防）。
- 聚合：分析页 SWR → `/api/analytics` → `queries.ts` 以 owner 的 page_id 约束聚合 → JSON。

## 测试与验证

- `lib/analytics/queries.test.ts`：纯整形函数单测（series 补零、ctr 计算、空数据）。
- `/api/track` 手测：dev 起服务，模拟 sendBeacon/POST → 查库确认入行；坏 page_id 被 FK 拒。
- 分析页浏览器抽查（造少量事件后看 KPI/图/表）。
- `tsc --noEmit` / `eslint` / `next build` / `vitest` 全绿。

## 非目标（明确排除，YAGNI）

- 不做独立访客 UV / 会话 / 漏斗 / 留存。
- 不存 IP / 地理 / user-agent / 任何 PII。
- 不做采集端防刷限流（公开端点可被灌数）——列为**未来加固**（可用 Vercel 防火墙 / 速率限制），MVP 仅做事件枚举 + 长度上限 + FK 校验。
- 不改第三方 Pixel 的同意门控逻辑。
- 不引入新图表依赖（复用 recharts）。

## 风险与缓解

- **跨域采集**：用 `text/plain` body 规避 CORS 预检；端点放行 OPTIONS。
- **采集端高并发**：单条 INSERT、无查库、FK 校验；事件表加索引。后续可加每日 rollup（YAGNI）。
- **公开端点滥用**：MVP 接受 best-effort，加字段校验；未来加固限流。
- **跨租户数据隔离**：聚合 API 严格以 owner 的 page_id 约束查询。
