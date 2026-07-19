# 投放分析采集管道 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 first-party 投放分析管道：落地页匿名回传 page_view/cta_click → 入库 → owner-scoped 聚合 → `/admin/analytics` 页（antd + recharts），兑现「投放分析（即将上线）」。

**Architecture:** 补上 `sinks.ts` 预留的 `BeaconSink`（`sendBeacon` + `text/plain` 规避 CORS 预检），`TrackingProvider` 加 `pageId`、beacon 独立于同意条始终发；公开 `POST /api/track` 单条 INSERT（FK 校验）；`GET /api/analytics` 严格按 owner 的 page_id 聚合；分析页复用 recharts。

**Tech Stack:** Next.js 16 App Router · React 19 · Postgres（node-pg-migrate）· antd v5 · recharts 2.15 · vitest

**关键事实（已核实）：**
- `landing_pages.id` 是 **TEXT**（`gen_random_uuid()::TEXT`）→ `analytics_events.page_id` 用 **TEXT**。
- 迁移风格：`exports.up = (pgm) => pgm.sql(...)` / `exports.down`，文件 `migrations/013_add_analytics_events.js`，命令 `pnpm migrate:up`。
- `NEXT_PUBLIC_APP_URL`（dev=`http://localhost:3001`）= Zap Bridge 主域；beacon POST 到 `${NEXT_PUBLIC_APP_URL}/api/track`（客户端可读 NEXT_PUBLIC_）。
- CTA 链接带 `data-cta`=channel；`TrackingProvider` 的 `onClickCapture` 已读取 channel + utm。
- `event` 枚举 `'page_view'|'cta_click'`；`channel` ∈ `whatsapp/tel/mailto/sms/telegram/external`。
- db 实例：`import pool from "@/lib/db"`（默认导出 pg Pool）。`auth` 来自 `@/auth`，`ApiErrors` 来自 `@/lib/constants`。

---

## File Structure

新建：
- `migrations/013_add_analytics_events.js`
- `app/api/track/route.ts`（POST 采集 + OPTIONS；公开）
- `lib/analytics/queries.ts`（聚合查询 + 纯整形函数）
- `lib/analytics/queries.test.ts`
- `app/api/analytics/route.ts`（GET 聚合，authed）
- `app/admin/(workspace)/analytics/page.tsx`

修改：
- `landing-renderer/tracking/sinks.ts`（新增 BeaconSink）
- `landing-renderer/tracking/TrackingProvider.tsx`（pageId + 独立 beacon 生命周期）
- `app/p/[slug]/page.tsx`（传 pageId）
- `app/admin/(workspace)/_shell/nav.ts`（解禁分析项）

---

## Task 1: 数据表迁移

**Files:** Create `migrations/013_add_analytics_events.js`

- [ ] **Step 1: 写迁移**

```javascript
/** @type {import('node-pg-migrate').MigrationBuilder} */
// 投放分析事件流水：first-party 匿名采集（page_view / cta_click），无 PII。
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id           BIGSERIAL   PRIMARY KEY,
      page_id      TEXT        NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
      event        TEXT        NOT NULL CHECK (event IN ('page_view','cta_click')),
      channel      TEXT,
      utm_source   TEXT,
      utm_medium   TEXT,
      utm_campaign TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_analytics_page_time ON analytics_events(page_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_analytics_page_event ON analytics_events(page_id, event);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_analytics_page_event;
    DROP INDEX IF EXISTS idx_analytics_page_time;
    DROP TABLE IF EXISTS analytics_events;
  `);
};
```

- [ ] **Step 2: 跑迁移（需本地 Postgres 运行）**

Run: `pnpm migrate:up`
Expected: 输出迁移 `013_add_analytics_events` 成功。若 DB 未启动，先 `pnpm db:start`。

- [ ] **Step 3: 验证表存在**

Run: `pnpm migrate up 2>/dev/null; echo "ok"`（或用 psql 查 `\d analytics_events`）
Expected: 表与索引已建。

- [ ] **Step 4: Commit**

```bash
git add migrations/013_add_analytics_events.js
git commit -m "feat(analytics): 新增 analytics_events 事件流水表"
```

---

## Task 2: BeaconSink（first-party sink）

**Files:** Modify `landing-renderer/tracking/sinks.ts`

- [ ] **Step 1: 在文件尾部（替换那段注释掉的 BeaconSink 占位）新增实现**

```typescript
/** first-party 采集 sink：匿名事件回传 Zap Bridge，独立于第三方像素与同意条。 */
export class BeaconSink implements EventSink {
  private readonly url: string;
  constructor(private readonly pageId: string) {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
    this.url = `${base}/api/track`;
  }
  ready(): boolean { return true; }
  init(): void {}
  track(event: InternalEvent, params: EventParams): void {
    const payload = JSON.stringify({
      pageId: this.pageId,
      event,
      channel: params.channel,
      utm_source: params.utm_source,
      utm_medium: params.utm_medium,
      utm_campaign: params.utm_campaign,
    });
    try {
      const blob = new Blob([payload], { type: "text/plain" });
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(this.url, blob);
      } else {
        void fetch(this.url, { method: "POST", body: payload, keepalive: true, headers: { "Content-Type": "text/plain" } });
      }
    } catch {
      /* best-effort：采集失败不影响落地页 */
    }
  }
}
```

> 注：UTM 参数键名 `utm_source/medium/campaign` 与 `tracking/utm.ts` 的 `parseUtm` 输出键一致（`utm_source` 等），`TrackingProvider` 传入的 `params` 已含这些键（来自 `utmRef.current`）。

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: 通过。

- [ ] **Step 3: Commit**

```bash
git add landing-renderer/tracking/sinks.ts
git commit -m "feat(analytics): 实现 first-party BeaconSink 采集"
```

---

## Task 3: TrackingProvider 接入 pageId 与独立 beacon

**Files:** Modify `landing-renderer/tracking/TrackingProvider.tsx`

- [ ] **Step 1: 改造（保留全部现有像素/同意逻辑，新增独立 beacon）**

改动点（不要动现有 PixelSink/consent/CTA passthrough 逻辑）：

1. 顶部 import 增加 `BeaconSink`：
```typescript
import { PixelSink, BeaconSink, type EventSink } from "./sinks";
```

2. 函数签名增加 `pageId`：
```typescript
export function TrackingProvider({ tracking, pageId, children }: { tracking?: PageTracking; pageId: string; children: ReactNode }) {
```

3. 在 `sinksRef` 声明下方新增 beacon ref：
```typescript
  const beaconRef = useRef<BeaconSink | null>(null);
```

4. 在「读已存同意」effect **之后**、「同意后建 sink」effect **之前**，新增一个**独立于同意**的 beacon mount effect（声明在捕获 UTM 的 effect 之后，确保 utmRef 已填充）：
```typescript
  // first-party beacon：独立于同意条，mount 即发 page_view（始终采集，匿名无 cookie）。
  useEffect(() => {
    if (beaconRef.current) return;
    beaconRef.current = new BeaconSink(pageId);
    beaconRef.current.track("page_view", { ...utmRef.current });
    // 仅 mount 一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

5. 在 `onClickCapture` 里，CTA 点击除现有 `sinksRef.current.forEach(...)` 外，追加 beacon：
```typescript
    sinksRef.current.forEach((s) => s.track("cta_click", { channel, ...utmRef.current }));
    beaconRef.current?.track("cta_click", { channel, ...utmRef.current });
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: 通过（注意：新增必填 `pageId` prop 会让 `/p/[slug]` 处报缺参——下一个 Task 修复；若想本任务即过，可先在 Task 4 一并提交。建议 Task 3、4 连续做）。

- [ ] **Step 3: Commit（与 Task 4 一起，见下）**

---

## Task 4: /p/[slug] 传入 pageId

**Files:** Modify `app/p/[slug]/page.tsx`

- [ ] **Step 1: 给 TrackingProvider 传 pageId**

找到渲染处（约第 74 行）：
```tsx
<TrackingProvider tracking={page.data.tracking}>
```
改为：
```tsx
<TrackingProvider tracking={page.data.tracking} pageId={page.id}>
```
（`page` 来自 `getPublishedBySlug(slug)`，含 `id`。）

- [ ] **Step 2: 类型检查 + 提交 Task 3+4**

Run: `npx tsc --noEmit`
Expected: 通过。

```bash
git add landing-renderer/tracking/TrackingProvider.tsx "app/p/[slug]/page.tsx"
git commit -m "feat(analytics): 落地页接入 pageId 并始终发 first-party 事件"
```

---

## Task 5: 采集端点 POST /api/track

**Files:** Create `app/api/track/route.ts`

- [ ] **Step 1: 写端点（公开、text/plain body、FK 校验、best-effort 204）**

```typescript
import { NextResponse } from "next/server";
import pool from "@/lib/db";

const EVENTS = new Set(["page_view", "cta_click"]);
const cap = (v: unknown, n: number): string | null =>
  typeof v === "string" && v.length > 0 ? v.slice(0, n) : null;

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400, headers: CORS });
  }
  const pageId = typeof body.pageId === "string" ? body.pageId : "";
  const event = typeof body.event === "string" ? body.event : "";
  if (!pageId || !EVENTS.has(event)) {
    return NextResponse.json({ error: "bad_payload" }, { status: 400, headers: CORS });
  }
  try {
    await pool.query(
      `INSERT INTO analytics_events (page_id, event, channel, utm_source, utm_medium, utm_campaign)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [pageId, event, cap(body.channel, 32), cap(body.utm_source, 128), cap(body.utm_medium, 128), cap(body.utm_campaign, 128)],
    );
  } catch {
    // 坏 page_id 触发 FK 错误等：best-effort 忽略，不阻塞访客、不泄露内部状态。
  }
  return new NextResponse(null, { status: 204, headers: CORS });
}
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: 通过。

- [ ] **Step 3: 手测（dev + 真实 page_id）**

Run（先确保 dev 在跑、DB 在跑，用一个真实落地页 id 替换 PAGE_ID）：
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3001/api/track -H "Content-Type: text/plain" --data '{"pageId":"PAGE_ID","event":"page_view","utm_source":"test"}'
```
Expected: `204`。再查库 `SELECT count(*) FROM analytics_events;` 应 +1。坏 pageId 也返回 204 但不入行。

- [ ] **Step 4: Commit**

```bash
git add app/api/track/route.ts
git commit -m "feat(analytics): 新增公开采集端点 POST /api/track"
```

---

## Task 6: 聚合查询 + 纯函数单测（TDD）

**Files:**
- Create `lib/analytics/queries.ts`
- Test `lib/analytics/queries.test.ts`

- [ ] **Step 1: 写失败测试（纯整形函数）**

```typescript
import { describe, it, expect } from "vitest";
import { buildSeries, summarize } from "./queries";

describe("analytics 整形", () => {
  it("summarize 计算 ctr（clicks/views，无 views 时为 0）", () => {
    expect(summarize(100, 5)).toEqual({ views: 100, clicks: 5, ctr: 0.05 });
    expect(summarize(0, 0)).toEqual({ views: 0, clicks: 0, ctr: 0 });
  });

  it("buildSeries 按天补零并保序", () => {
    const rows = [{ date: "2026-06-20", views: 10, clicks: 2 }];
    const s = buildSeries(rows, ["2026-06-19", "2026-06-20"]);
    expect(s).toEqual([
      { date: "2026-06-19", views: 0, clicks: 0 },
      { date: "2026-06-20", views: 10, clicks: 2 },
    ]);
  });
});
```

- [ ] **Step 2: 跑测确认失败**

Run: `npx vitest run lib/analytics/queries.test.ts`
Expected: FAIL（未定义）。

- [ ] **Step 3: 实现 queries.ts**

```typescript
import pool from "@/lib/db";

export interface Totals { views: number; clicks: number; ctr: number; }
export interface SeriesPoint { date: string; views: number; clicks: number; }
export interface ChannelRow { channel: string; clicks: number; }
export interface SourceRow { utm_source: string; views: number; }
export interface AnalyticsResult {
  totals: Totals;
  series: SeriesPoint[];
  channels: ChannelRow[];
  sources: SourceRow[];
}

/** 纯函数：算总量与点击率。 */
export function summarize(views: number, clicks: number): Totals {
  return { views, clicks, ctr: views > 0 ? clicks / views : 0 };
}

/** 纯函数：把稀疏的按天行补零成完整日期序列（保持 dates 顺序）。 */
export function buildSeries(
  rows: { date: string; views: number; clicks: number }[],
  dates: string[],
): SeriesPoint[] {
  const map = new Map(rows.map((r) => [r.date, r]));
  return dates.map((d) => map.get(d) ?? { date: d, views: 0, clicks: 0 });
}

/** 生成最近 N 天的日期串（含今天），YYYY-MM-DD（UTC）。 */
export function lastNDates(days: number): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/** owner-scoped 聚合：pageId 为具体 id 或 'all'。绝不跨租户。 */
export async function getAnalytics(userId: string, pageId: string, days: number): Promise<AnalyticsResult> {
  // 约束到该用户的 page_id 集合；具体 pageId 时再加 id 过滤。
  const scope =
    pageId === "all"
      ? { sql: `SELECT id FROM landing_pages WHERE user_id = $1`, params: [userId] as unknown[] }
      : { sql: `SELECT id FROM landing_pages WHERE user_id = $1 AND id = $2`, params: [userId, pageId] };
  const idsRes = await pool.query(scope.sql, scope.params);
  const ids = idsRes.rows.map((r) => r.id as string);
  if (ids.length === 0) {
    return { totals: summarize(0, 0), series: buildSeries([], lastNDates(days)), channels: [], sources: [] };
  }
  const since = `now() - ($2 || ' days')::interval`;
  const base = `FROM analytics_events WHERE page_id = ANY($1) AND created_at >= ${since}`;

  const [totalsRes, seriesRes, channelsRes, sourcesRes] = await Promise.all([
    pool.query(`SELECT
        count(*) FILTER (WHERE event='page_view')::int AS views,
        count(*) FILTER (WHERE event='cta_click')::int AS clicks
       ${base}`, [ids, days]),
    pool.query(`SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date,
        count(*) FILTER (WHERE event='page_view')::int AS views,
        count(*) FILTER (WHERE event='cta_click')::int AS clicks
       ${base} GROUP BY 1 ORDER BY 1`, [ids, days]),
    pool.query(`SELECT COALESCE(channel,'external') AS channel, count(*)::int AS clicks
       ${base} AND event='cta_click' GROUP BY 1 ORDER BY clicks DESC`, [ids, days]),
    pool.query(`SELECT COALESCE(utm_source,'(直接/未知)') AS utm_source, count(*)::int AS views
       ${base} AND event='page_view' GROUP BY 1 ORDER BY views DESC LIMIT 20`, [ids, days]),
  ]);

  const v = Number(totalsRes.rows[0]?.views ?? 0);
  const c = Number(totalsRes.rows[0]?.clicks ?? 0);
  return {
    totals: summarize(v, c),
    series: buildSeries(
      seriesRes.rows.map((r) => ({ date: r.date as string, views: Number(r.views), clicks: Number(r.clicks) })),
      lastNDates(days),
    ),
    channels: channelsRes.rows.map((r) => ({ channel: r.channel as string, clicks: Number(r.clicks) })),
    sources: sourcesRes.rows.map((r) => ({ utm_source: r.utm_source as string, views: Number(r.views) })),
  };
}
```

- [ ] **Step 4: 跑测确认通过**

Run: `npx vitest run lib/analytics/queries.test.ts`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add lib/analytics/queries.ts lib/analytics/queries.test.ts
git commit -m "feat(analytics): 聚合查询与纯整形函数（含单测）"
```

---

## Task 7: 聚合 API GET /api/analytics

**Files:** Create `app/api/analytics/route.ts`

- [ ] **Step 1: 写端点（authed、owner-scoped、参数校验）**

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getAnalytics } from "@/lib/analytics/queries";

const ALLOWED_DAYS = new Set([7, 30, 90]);

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  const url = new URL(request.url);
  const pageId = url.searchParams.get("pageId") ?? "all";
  const daysRaw = Number(url.searchParams.get("days") ?? "30");
  const days = ALLOWED_DAYS.has(daysRaw) ? daysRaw : 30;
  const data = await getAnalytics(session.user.id, pageId, days);
  return NextResponse.json(data);
}
```

> 执行注意：确认 `ApiErrors.UNAUTHORIZED` 名称（参考 `app/api/ai/usage/route.ts` 的既有用法）。

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: 通过。

- [ ] **Step 3: Commit**

```bash
git add app/api/analytics/route.ts
git commit -m "feat(analytics): 新增 owner-scoped GET /api/analytics 聚合接口"
```

---

## Task 8: 分析页 + 解禁导航

**Files:**
- Modify `app/admin/(workspace)/_shell/nav.ts`
- Create `app/admin/(workspace)/analytics/page.tsx`

- [ ] **Step 1: 解禁导航分析项**

在 `nav.ts` 把 analytics 项从：
```typescript
  { key: "analytics", label: "投放分析", icon: LineChartOutlined, disabled: true, badge: "即将上线" },
```
改为：
```typescript
  { key: "analytics", label: "投放分析", icon: LineChartOutlined, href: "/admin/analytics" },
```

- [ ] **Step 2: 写分析页**

```tsx
"use client";

import { useState } from "react";
import useSWR from "swr";
import { Row, Col, Card, Statistic, Segmented, Select, Table, Typography, Space, Empty, Spin } from "antd";
import { EyeOutlined, AimOutlined, PercentageOutlined } from "@ant-design/icons";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ApiRoutes } from "@/lib/constants";
import type { AnalyticsResult } from "@/lib/analytics/queries";

interface PageRow { id: string; name: string; }

export default function AnalyticsPage() {
  const [pageId, setPageId] = useState("all");
  const [days, setDays] = useState(30);

  const pages = useSWR<PageRow[]>(ApiRoutes.LandingPages);
  const data = useSWR<AnalyticsResult>(`${ApiRoutes.Analytics}?pageId=${pageId}&days=${days}`);
  const a = data.data;

  const pageOptions = [
    { value: "all", label: "全部落地页" },
    ...(pages.data ?? []).map((p) => ({ value: p.id, label: p.name })),
  ];

  const hasData = a && (a.totals.views > 0 || a.totals.clicks > 0);

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>投放分析</Typography.Title>
        <Space>
          <Select value={pageId} onChange={setPageId} options={pageOptions} style={{ minWidth: 180 }} />
          <Segmented value={days} onChange={(v) => setDays(v as number)}
            options={[{ label: "近 7 天", value: 7 }, { label: "近 30 天", value: 30 }, { label: "近 90 天", value: 90 }]} />
        </Space>
      </div>

      <Row gutter={16}>
        <Col xs={24} sm={8}><Card><Statistic title="访问量 (PV)" value={a?.totals.views ?? 0} prefix={<EyeOutlined />} /></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title="CTA 点击" value={a?.totals.clicks ?? 0} prefix={<AimOutlined />} /></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title="点击率" value={((a?.totals.ctr ?? 0) * 100)} precision={2} suffix="%" prefix={<PercentageOutlined />} /></Card></Col>
      </Row>

      <Card title="趋势">
        {data.isLoading ? <div style={{ height: 260, display: "grid", placeItems: "center" }}><Spin /></div>
          : !hasData ? <Empty description="该区间还没有数据" />
          : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={a!.series} margin={{ left: -16, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity={0.25} /><stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.25} /><stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef3f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} minTickGap={24} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="views" name="访问量" stroke="#0d9488" fill="url(#gv)" strokeWidth={2} />
              <Area type="monotone" dataKey="clicks" name="CTA 点击" stroke="#14b8a6" fill="url(#gc)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="CTA 渠道分布">
            <Table rowKey="channel" size="small" pagination={false} dataSource={a?.channels ?? []}
              locale={{ emptyText: "暂无点击" }}
              columns={[{ title: "渠道", dataIndex: "channel" }, { title: "点击数", dataIndex: "clicks", width: 120 }]} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="UTM 来源">
            <Table rowKey="utm_source" size="small" pagination={false} dataSource={a?.sources ?? []}
              locale={{ emptyText: "暂无来源数据" }}
              columns={[{ title: "来源", dataIndex: "utm_source" }, { title: "访问量", dataIndex: "views", width: 120 }]} />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
```

- [ ] **Step 3: 补 ApiRoutes.Analytics 常量**

确认 `lib/constants/routes.ts` 的 `ApiRoutes` 是否有 `Analytics`；若无，在 `AiUsage` 之后新增：
```typescript
  Analytics = '/api/analytics',
```

- [ ] **Step 4: 类型检查**

Run: `npx tsc --noEmit`
Expected: 通过。

- [ ] **Step 5: Commit**

```bash
git add "app/admin/(workspace)/_shell/nav.ts" "app/admin/(workspace)/analytics/page.tsx" lib/constants/routes.ts
git commit -m "feat(analytics): 投放分析页（KPI/趋势/渠道/来源）并解禁导航"
```

---

## Task 9: 端到端验证

**Files:** 无（验证）

- [ ] **Step 1: 全量类型 + lint + 单测**

Run: `npx tsc --noEmit && npx eslint app/api/track app/api/analytics lib/analytics "app/admin/(workspace)/analytics" landing-renderer/tracking && npx vitest run`
Expected: 0 error；vitest 全绿（含新增 analytics 用例）。

- [ ] **Step 2: 生产构建**

Run: `npx next build`
Expected: exit 0；`/api/track`、`/api/analytics`、`/admin/analytics` 编译通过。

- [ ] **Step 3: 端到端冒烟（dev + DB）**

1. `pnpm dev`，登录后访问 `/admin/analytics` → 空态正常（无数据时「该区间还没有数据」）。
2. 取一个已发布落地页的 slug（无则发布一个），在浏览器打开 `/p/<slug>`（或对 app 域 `localhost:3001/p/<slug>`）→ 触发 page_view beacon。
3. 点击页面某个 CTA → 触发 cta_click beacon。
4. 回 `/admin/analytics` 刷新 → KPI 访问量/点击 +N、趋势图出现数据点、渠道/来源表有行。
5. 查库 `SELECT event, count(*) FROM analytics_events GROUP BY 1;` 确认入库。

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "chore(analytics): 采集管道端到端验证收尾" --allow-empty
```

---

## Self-Review 覆盖检查

- spec「采集端 BeaconSink」→ Task 2 ✓
- spec「TrackingProvider pageId + 独立 beacon」→ Task 3 ✓
- spec「/p/[slug] 传 pageId」→ Task 4 ✓
- spec「存储 analytics_events（page_id TEXT、FK CASCADE）」→ Task 1 ✓
- spec「/api/track 公开采集、text/plain、204/400、FK best-effort」→ Task 5 ✓
- spec「聚合 queries + owner-scoped /api/analytics」→ Task 6/7 ✓
- spec「分析页 antd+recharts、解禁导航」→ Task 8 ✓
- spec「测试与验证」→ Task 6 单测、Task 9 全量+端到端 ✓
- spec「非目标」→ 无 UV/PII/限流；不改像素同意逻辑（Task 3 只新增独立 beacon）✓
- 修正：page_id 用 TEXT（非 uuid）以匹配 landing_pages.id ✓
