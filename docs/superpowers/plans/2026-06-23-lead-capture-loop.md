# 线索闭环（表单兜底 + 收件箱）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给落地页加「兜底留资表单」并做成平台内可见闭环：schema → 公开页渲染+提交 → leads 表 → 编辑器配置 → 后台收件箱。

**Architecture:** `leadForm?` 作为页面级可选件（类比 `floatingButton?`，不进 `sections[]`）。公开 `POST /api/leads` 写 PII 到 `leads` 表（honeypot + 频率限制 + ≥1 联系方式校验）；后台登录态 GET/PATCH/DELETE/导出。深链转化仍归 `analytics_events`，leads 只收表单提交。

**Tech Stack:** Next.js 16(App Router)、TypeScript、Tailwind(渲染/编辑器)、antd(后台)、pg、node-pg-migrate、vitest、Playwright。

设计来源:`docs/superpowers/specs/2026-06-23-lead-capture-loop-design.md`

---

## File Structure

**数据层**
- `types/schema.draft.ts` —（改）加 `LeadFormFieldConfig`/`LeadForm`，`LandingPageDraft.leadForm?`。
- `migrations/014_add_leads.js` —（新建）`leads` 表。
- `lib/leads/validate.ts` —（新建）提交校验纯函数。
- `lib/leads/csv.ts` —（新建）CSV 序列化纯函数。
- `lib/leads/rate-limit.ts` —（新建）内存频率限制。
- `lib/leads/store.ts` —（新建）leads 读写（insert/list/markRead/delete/countUnread）。

**公开渲染 + 提交**
- `landing-renderer/sections/LeadForm.tsx` —（新建）表单区块。
- `landing-renderer/LandingPage.tsx` —（改）加 `pageId`，Footer 前条件渲染 LeadForm。
- `app/p/[slug]/page.tsx` —（改）透传 `pageId={page.id}`。
- `app/api/leads/route.ts` —（新建）POST(公开提交) + GET(登录列表)。

**编辑器**
- `landing-editor/store/defaults.ts` —（改）加 `createLeadForm`。
- `landing-editor/store/editorStore.tsx` —（改）state/action/toDraft/fromDraft 接入 leadForm。
- `landing-editor/forms/LeadFormForm.tsx` —（新建）配置面板。
- `landing-editor/components/BlockList.tsx` —（改）加 leadForm 选择入口。
- `landing-editor/components/EditorDetail.tsx` —（改）渲染 LeadFormForm。

**后台收件箱**
- `app/api/leads/[id]/route.ts` —（新建）PATCH/DELETE。
- `app/api/leads/export/route.ts` —（新建）CSV 导出。
- `lib/constants/routes.ts` —（改）加 leads 路由常量。
- `app/admin/(workspace)/leads/page.tsx` —（新建）收件箱页。
- `app/admin/(workspace)/_shell/nav.ts` —（改）加「线索」导航项。

**测试**
- `lib/leads/validate.test.ts`、`lib/leads/csv.test.ts`、`e2e/leads.spec.ts`。

---

## Task 1: schema 加 LeadForm 类型

**Files:**
- Modify: `types/schema.draft.ts`

- [ ] **Step 1: 加类型**

在 `types/schema.draft.ts` 中 `LandingPageDraft` 定义之前加：
```ts
/** 留资表单单字段配置（预设字段，只能开关 + 必填）。 */
export interface LeadFormFieldConfig {
  enabled: boolean;
  required: boolean;
}

/** 兜底留资表单（页面级可选件，默认关；转化优先走深链）。 */
export interface LeadForm {
  enabled: boolean;
  title: string;
  description?: string;
  submitText: string;
  successMessage: string;
  fields: {
    name: LeadFormFieldConfig;
    email: LeadFormFieldConfig;
    phone: LeadFormFieldConfig;
    whatsapp: LeadFormFieldConfig;
    telegram: LeadFormFieldConfig;
    message: LeadFormFieldConfig;
  };
}

/** 联系方式字段键（用于「至少一个联系方式」校验）。 */
export type LeadContactField = "email" | "phone" | "whatsapp" | "telegram";
export const LEAD_CONTACT_FIELDS: LeadContactField[] = ["email", "phone", "whatsapp", "telegram"];
```
在 `LandingPageDraft` 接口里（与 `floatingButton?` 同级）加：
```ts
  leadForm?: LeadForm;
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无输出（通过）

- [ ] **Step 3: 提交**

```bash
git add types/schema.draft.ts
git commit -m "feat: schema 新增 LeadForm 页面级可选件类型"
```

---

## Task 2: leads 表迁移

**Files:**
- Create: `migrations/014_add_leads.js`

- [ ] **Step 1: 新建迁移**

`migrations/014_add_leads.js`:
```js
/** @type {import('node-pg-migrate').MigrationBuilder} */
// 线索表：表单兜底留资，存 PII（联系方式/留言），区别于无 PII 的 analytics_events。
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS leads (
      id           BIGSERIAL   PRIMARY KEY,
      page_id      TEXT        NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
      payload      JSONB       NOT NULL,
      channel      TEXT,
      utm_source   TEXT,
      utm_medium   TEXT,
      utm_campaign TEXT,
      is_read      BOOLEAN     NOT NULL DEFAULT false,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_leads_page_time   ON leads(page_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_leads_page_unread ON leads(page_id, is_read);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_leads_page_unread;
    DROP INDEX IF EXISTS idx_leads_page_time;
    DROP TABLE IF EXISTS leads;
  `);
};
```

- [ ] **Step 2: 应用迁移到本地库**

Run: `docker exec zonit-pg-dev pg_isready -U postgres -d zonit && pnpm migrate:up`
Expected: `Migrations complete!`，无错误

- [ ] **Step 3: 校验表存在**

Run: `docker exec zonit-pg-dev psql -U postgres -d zonit -c "\d leads"`
Expected: 列出 leads 表结构（含 payload jsonb、is_read 等）

- [ ] **Step 4: 提交**

```bash
git add migrations/014_add_leads.js
git commit -m "feat: 新增 leads 表迁移（表单线索，含 PII）"
```

---

## Task 3: 提交校验纯函数 `validateLeadSubmission`

**Files:**
- Create: `lib/leads/validate.ts`
- Test: `lib/leads/validate.test.ts`

- [ ] **Step 1: 写失败测试**

`lib/leads/validate.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { validateLeadSubmission } from "./validate";

describe("validateLeadSubmission", () => {
  it("有联系方式 → ok，清洗后只留非空字段并截断", () => {
    const r = validateLeadSubmission({ name: "  Tom ", email: "tom@x.com", phone: "", message: "hi" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.payload).toEqual({ name: "Tom", email: "tom@x.com", message: "hi" });
  });
  it("无任何联系方式 → 拒（name/message 不算）", () => {
    const r = validateLeadSubmission({ name: "Tom", message: "hi" });
    expect(r.ok).toBe(false);
  });
  it("email 缺 @ → 拒", () => {
    const r = validateLeadSubmission({ email: "invalid" });
    expect(r.ok).toBe(false);
  });
  it("phone 非法字符 → 拒", () => {
    const r = validateLeadSubmission({ phone: "abc123" });
    expect(r.ok).toBe(false);
  });
  it("whatsapp 作为联系方式即可通过", () => {
    const r = validateLeadSubmission({ whatsapp: "+1 555 0100" });
    expect(r.ok).toBe(true);
  });
  it("超长字段被截断", () => {
    const long = "x".repeat(300);
    const r = validateLeadSubmission({ email: "a@b.com", name: long });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.payload.name!.length).toBe(200);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run lib/leads/validate.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 写实现**

`lib/leads/validate.ts`:
```ts
// lib/leads/validate.ts
// 线索提交校验（纯函数）：截断 + 至少一个联系方式 + 联系方式基本格式。
import { LEAD_CONTACT_FIELDS } from "@/types/schema.draft";

export interface LeadPayload {
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  message?: string;
}

export type ValidateResult =
  | { ok: true; payload: LeadPayload }
  | { ok: false; error: string };

const MAX = { name: 200, email: 200, phone: 200, whatsapp: 200, telegram: 200, message: 2000 } as const;
type Field = keyof typeof MAX;
const FIELDS: Field[] = ["name", "email", "phone", "whatsapp", "telegram", "message"];

const clean = (v: unknown, n: number): string =>
  typeof v === "string" ? v.trim().slice(0, n) : "";

export function validateLeadSubmission(input: Record<string, unknown>): ValidateResult {
  const payload: LeadPayload = {};
  for (const f of FIELDS) {
    const val = clean(input[f], MAX[f]);
    if (val) payload[f] = val;
  }
  // 至少一个联系方式
  const hasContact = LEAD_CONTACT_FIELDS.some((f) => payload[f]);
  if (!hasContact) return { ok: false, error: "need_contact" };
  // 基本格式
  if (payload.email && !payload.email.includes("@")) return { ok: false, error: "bad_email" };
  if (payload.phone && !/^[+\d\s-]+$/.test(payload.phone)) return { ok: false, error: "bad_phone" };
  return { ok: true, payload };
}
```

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run lib/leads/validate.test.ts`
Expected: PASS（6 tests）

- [ ] **Step 5: 提交**

```bash
git add lib/leads/validate.ts lib/leads/validate.test.ts
git commit -m "feat: 线索提交校验纯函数 validateLeadSubmission"
```

---

## Task 4: CSV 序列化纯函数 `leadsToCsv`

**Files:**
- Create: `lib/leads/csv.ts`
- Test: `lib/leads/csv.test.ts`

- [ ] **Step 1: 写失败测试**

`lib/leads/csv.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { leadsToCsv, type LeadCsvRow } from "./csv";

const rows: LeadCsvRow[] = [
  { page_name: "页面A", name: "Tom", email: "t@x.com", phone: "", whatsapp: "", telegram: "", message: "hi, there", channel: "form", utm_source: "fb", created_at: "2026-06-23T00:00:00Z" },
];

describe("leadsToCsv", () => {
  it("含表头 + 行", () => {
    const csv = leadsToCsv(rows);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toContain("page_name");
    expect(lines).toHaveLength(2);
  });
  it("含逗号的值被引号包裹", () => {
    expect(leadsToCsv(rows)).toContain('"hi, there"');
  });
  it("含双引号的值转义为两个双引号", () => {
    const csv = leadsToCsv([{ ...rows[0], message: 'say "hi"' }]);
    expect(csv).toContain('"say ""hi"""');
  });
  it("空集只有表头", () => {
    expect(leadsToCsv([]).trim().split("\n")).toHaveLength(1);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run lib/leads/csv.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 写实现**

`lib/leads/csv.ts`:
```ts
// lib/leads/csv.ts
// 线索导出 CSV 序列化（纯函数）：RFC4180 转义（逗号/引号/换行）。
export interface LeadCsvRow {
  page_name: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  message: string;
  channel: string;
  utm_source: string;
  created_at: string;
}

const COLUMNS: (keyof LeadCsvRow)[] = [
  "page_name", "name", "email", "phone", "whatsapp", "telegram", "message", "channel", "utm_source", "created_at",
];

const esc = (v: string): string =>
  /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;

export function leadsToCsv(rows: LeadCsvRow[]): string {
  const header = COLUMNS.join(",");
  const body = rows.map((r) => COLUMNS.map((c) => esc(r[c] ?? "")).join(","));
  return [header, ...body].join("\n") + "\n";
}
```

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run lib/leads/csv.test.ts`
Expected: PASS（4 tests）

- [ ] **Step 5: 提交**

```bash
git add lib/leads/csv.ts lib/leads/csv.test.ts
git commit -m "feat: 线索 CSV 序列化纯函数 leadsToCsv"
```

---

## Task 5: 内存频率限制 `rate-limit`

**Files:**
- Create: `lib/leads/rate-limit.ts`
- Test: `lib/leads/rate-limit.test.ts`

- [ ] **Step 1: 写失败测试**

`lib/leads/rate-limit.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("窗口内超过上限即拒", () => {
    let now = 1000;
    const rl = createRateLimiter({ windowMs: 60_000, max: 3, now: () => now });
    expect(rl.allow("ip1")).toBe(true);
    expect(rl.allow("ip1")).toBe(true);
    expect(rl.allow("ip1")).toBe(true);
    expect(rl.allow("ip1")).toBe(false); // 第 4 次
  });
  it("不同 key 独立计数", () => {
    let now = 1000;
    const rl = createRateLimiter({ windowMs: 60_000, max: 1, now: () => now });
    expect(rl.allow("a")).toBe(true);
    expect(rl.allow("b")).toBe(true);
  });
  it("窗口滑过后重新允许", () => {
    let now = 1000;
    const rl = createRateLimiter({ windowMs: 60_000, max: 1, now: () => now });
    expect(rl.allow("a")).toBe(true);
    expect(rl.allow("a")).toBe(false);
    now += 61_000;
    expect(rl.allow("a")).toBe(true);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run lib/leads/rate-limit.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 写实现**

`lib/leads/rate-limit.ts`:
```ts
// lib/leads/rate-limit.ts
// 内存滑动窗口频率限制（单实例足够；多实例一致性见 Future Work）。
interface Options {
  windowMs: number;
  max: number;
  now?: () => number;
}

export function createRateLimiter({ windowMs, max, now = Date.now }: Options) {
  const hits = new Map<string, number[]>();
  return {
    allow(key: string): boolean {
      const t = now();
      const arr = (hits.get(key) ?? []).filter((ts) => t - ts < windowMs);
      if (arr.length >= max) {
        hits.set(key, arr);
        return false;
      }
      arr.push(t);
      hits.set(key, arr);
      return true;
    },
  };
}

/** 进程级单例：线索提交限流（1 分钟 5 条/IP）。 */
export const leadRateLimiter = createRateLimiter({ windowMs: 60_000, max: 5 });
```

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run lib/leads/rate-limit.test.ts`
Expected: PASS（3 tests）

- [ ] **Step 5: 提交**

```bash
git add lib/leads/rate-limit.ts lib/leads/rate-limit.test.ts
git commit -m "feat: 线索提交内存频率限制 createRateLimiter"
```

---

## Task 6: leads store（读写）

**Files:**
- Create: `lib/leads/store.ts`

- [ ] **Step 1: 新建 store**

`lib/leads/store.ts`:
```ts
// lib/leads/store.ts
// leads 读写。公开提交用 insertLead；后台查询/操作均按 user 隔离（经 landing_pages JOIN）。
import pool from "@/lib/db";
import type { LeadPayload } from "./validate";

export interface LeadRow {
  id: string;
  page_id: string;
  page_name: string;
  payload: LeadPayload;
  channel: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  is_read: boolean;
  created_at: string;
}

export interface LeadAttribution {
  channel?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
}

/** 公开提交入库；坏 page_id 触发 FK 错误由调用方 best-effort 处理。 */
export async function insertLead(pageId: string, payload: LeadPayload, attr: LeadAttribution): Promise<void> {
  await pool.query(
    `INSERT INTO leads (page_id, payload, channel, utm_source, utm_medium, utm_campaign)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [pageId, JSON.stringify(payload), attr.channel ?? null, attr.utm_source ?? null, attr.utm_medium ?? null, attr.utm_campaign ?? null],
  );
}

/** 列出本租户线索（经 page 关联隔离）。 */
export async function listLeads(
  userId: string,
  opts: { pageId?: string; unreadOnly?: boolean } = {},
): Promise<LeadRow[]> {
  const conds = ["p.user_id = $1"];
  const vals: unknown[] = [userId];
  if (opts.pageId) { vals.push(opts.pageId); conds.push(`l.page_id = $${vals.length}`); }
  if (opts.unreadOnly) conds.push(`l.is_read = false`);
  const res = await pool.query(
    `SELECT l.*, p.name AS page_name
       FROM leads l JOIN landing_pages p ON p.id = l.page_id
      WHERE ${conds.join(" AND ")}
      ORDER BY l.created_at DESC`,
    vals,
  );
  return res.rows;
}

export async function markLeadRead(id: string, userId: string, isRead: boolean): Promise<LeadRow | null> {
  const res = await pool.query(
    `UPDATE leads l SET is_read = $3
       FROM landing_pages p
      WHERE l.id = $1 AND p.id = l.page_id AND p.user_id = $2
      RETURNING l.*, p.name AS page_name`,
    [id, userId, isRead],
  );
  return res.rows[0] ?? null;
}

export async function deleteLead(id: string, userId: string): Promise<boolean> {
  const res = await pool.query(
    `DELETE FROM leads l USING landing_pages p
      WHERE l.id = $1 AND p.id = l.page_id AND p.user_id = $2
      RETURNING l.id`,
    [id, userId],
  );
  return res.rows.length > 0;
}

export async function countUnread(userId: string): Promise<number> {
  const res = await pool.query(
    `SELECT COUNT(*)::int AS n
       FROM leads l JOIN landing_pages p ON p.id = l.page_id
      WHERE p.user_id = $1 AND l.is_read = false`,
    [userId],
  );
  return res.rows[0].n;
}
```

- [ ] **Step 2: 类型检查 + lint**

Run: `npx tsc --noEmit && npx eslint lib/leads/store.ts`
Expected: 均无错误

- [ ] **Step 3: 提交**

```bash
git add lib/leads/store.ts
git commit -m "feat: leads store（insert/list/markRead/delete/countUnread，按用户隔离）"
```

---

## Task 7: 提交+列表 API `app/api/leads/route.ts`

**Files:**
- Create: `app/api/leads/route.ts`
- Modify: `lib/constants/routes.ts`

- [ ] **Step 1: 加路由常量**

在 `lib/constants/routes.ts` 的 `ApiRoutes` 枚举里（`LandingPages` 附近）加：
```ts
  Leads = '/api/leads',
```
并在文件路径助手区加：
```ts
export const apiLeadPath = (id: string) => `/api/leads/${id}`;
export const apiLeadsExportPath = () => `/api/leads/export`;
```
在 `Routes` 枚举（页面路由）加：
```ts
  Leads = '/admin/leads',
```

- [ ] **Step 2: 新建 route**

`app/api/leads/route.ts`:
```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { ApiErrors } from "@/lib/constants";
import { validateLeadSubmission } from "@/lib/leads/validate";
import { leadRateLimiter } from "@/lib/leads/rate-limit";
import { insertLead, listLeads } from "@/lib/leads/store";

const cap = (v: unknown, n: number): string | null =>
  typeof v === "string" && v.length > 0 ? v.slice(0, n) : null;

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/** 公开提交（无登录）。 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400, headers: CORS });
  }
  // honeypot：机器人填了隐藏字段 → 静默丢弃
  if (typeof body.company_url === "string" && body.company_url.trim() !== "") {
    return new NextResponse(null, { status: 204, headers: CORS });
  }
  // 频率限制（同 IP）
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (!leadRateLimiter.allow(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: CORS });
  }
  const pageId = typeof body.pageId === "string" ? body.pageId : "";
  if (!pageId) return NextResponse.json({ error: "bad_payload" }, { status: 400, headers: CORS });

  const fields = (body.fields && typeof body.fields === "object" ? body.fields : {}) as Record<string, unknown>;
  const result = validateLeadSubmission(fields);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400, headers: CORS });

  const utm = (body.utm && typeof body.utm === "object" ? body.utm : {}) as Record<string, unknown>;
  try {
    await insertLead(pageId, result.payload, {
      channel: cap(body.channel, 32) ?? "form",
      utm_source: cap(utm.utm_source, 128),
      utm_medium: cap(utm.utm_medium, 128),
      utm_campaign: cap(utm.utm_campaign, 128),
    });
  } catch {
    // 坏 page_id 等 FK 错误：best-effort 忽略
  }
  return new NextResponse(null, { status: 204, headers: CORS });
}

/** 后台列表（登录）。 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { searchParams } = request.nextUrl;
  const pageId = searchParams.get("pageId") ?? undefined;
  const unreadOnly = searchParams.get("unreadOnly") === "1";
  const rows = await listLeads(session.user.id, { pageId, unreadOnly });
  return NextResponse.json(rows);
}

void pool; // 保留 db 连接初始化引用（如未直接使用可删）
```
> 注：若 lint 报 `pool` 未使用，删除最后一行 `void pool;` 及其 import。

- [ ] **Step 3: 类型检查 + lint**

Run: `npx tsc --noEmit && npx eslint "app/api/leads/route.ts" lib/constants/routes.ts`
Expected: 均无错误（如 `pool` 未使用则按注释删除后再跑）

- [ ] **Step 4: 提交**

```bash
git add "app/api/leads/route.ts" lib/constants/routes.ts
git commit -m "feat: 线索 API POST(公开提交,honeypot+限流+校验) + GET(登录列表)"
```

---

## Task 8: 详情操作 + 导出 API

**Files:**
- Create: `app/api/leads/[id]/route.ts`
- Create: `app/api/leads/export/route.ts`

- [ ] **Step 1: PATCH/DELETE route**

`app/api/leads/[id]/route.ts`:
```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { markLeadRead, deleteLead } from "@/lib/leads/store";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/leads/[id]">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { id } = await ctx.params;
  const { isRead } = await request.json();
  const row = await markLeadRead(id, session.user.id, Boolean(isRead));
  if (!row) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/leads/[id]">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { id } = await ctx.params;
  const ok = await deleteLead(id, session.user.id);
  if (!ok) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 2: 导出 route**

`app/api/leads/export/route.ts`:
```ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { listLeads } from "@/lib/leads/store";
import { leadsToCsv, type LeadCsvRow } from "@/lib/leads/csv";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const leads = await listLeads(session.user.id);
  const rows: LeadCsvRow[] = leads.map((l) => ({
    page_name: l.page_name,
    name: l.payload.name ?? "",
    email: l.payload.email ?? "",
    phone: l.payload.phone ?? "",
    whatsapp: l.payload.whatsapp ?? "",
    telegram: l.payload.telegram ?? "",
    message: l.payload.message ?? "",
    channel: l.channel ?? "",
    utm_source: l.utm_source ?? "",
    created_at: l.created_at,
  }));
  const csv = leadsToCsv(rows);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads.csv"`,
    },
  });
}
```

- [ ] **Step 3: 类型检查 + lint**

Run: `npx tsc --noEmit && npx eslint "app/api/leads/[id]/route.ts" "app/api/leads/export/route.ts"`
Expected: 均无错误

- [ ] **Step 4: 提交**

```bash
git add "app/api/leads/[id]/route.ts" "app/api/leads/export/route.ts"
git commit -m "feat: 线索 PATCH/DELETE + CSV 导出 API"
```

---

## Task 9: 渲染器 LeadForm 区块

**Files:**
- Create: `landing-renderer/sections/LeadForm.tsx`

- [ ] **Step 1: 新建 LeadForm 组件**

`landing-renderer/sections/LeadForm.tsx`:
```tsx
"use client";
// landing-renderer/sections/LeadForm.tsx
// 兜底留资表单：按 fields 配置渲染输入，含 honeypot，提交 POST /api/leads。
import { useState } from "react";
import type { LeadForm as LeadFormData } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { parseUtm } from "../tracking/utm";

const FIELD_LABELS: Record<string, string> = {
  name: "姓名", email: "邮箱", phone: "电话", whatsapp: "WhatsApp", telegram: "Telegram", message: "留言",
};
const FIELD_ORDER = ["name", "email", "phone", "whatsapp", "telegram", "message"] as const;

export function LeadForm({ data, pageId, theme }: { data: LeadFormData; pageId: string; theme: RendererTheme }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [honey, setHoney] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const active = FIELD_ORDER.filter((k) => data.fields[k].enabled);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const utm = typeof window !== "undefined" ? parseUtm(window.location.search) : {};
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, channel: "form", fields: values, utm, company_url: honey }),
      });
      if (!res.ok && res.status !== 204) { setStatus("error"); return; }
      setStatus("done");
      setValues({});
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <section className="px-6 py-12 text-center">
        <p className="text-lg font-semibold text-slate-900">{data.successMessage}</p>
      </section>
    );
  }

  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-md">
        <h2 className="text-center text-2xl font-bold text-slate-900">{data.title}</h2>
        {data.description ? <p className="mt-2 text-center text-sm text-slate-600">{data.description}</p> : null}
        <form className="mt-6 space-y-3" onSubmit={submit}>
          {active.map((k) => (
            <div key={k}>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {FIELD_LABELS[k]}{data.fields[k].required ? " *" : ""}
              </label>
              {k === "message" ? (
                <textarea
                  required={data.fields[k].required}
                  value={values[k] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                  rows={3}
                />
              ) : (
                <input
                  type={k === "email" ? "email" : "text"}
                  required={data.fields[k].required}
                  value={values[k] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              )}
            </div>
          ))}
          {/* honeypot：正常用户不可见 */}
          <input
            type="text"
            name="company_url"
            value={honey}
            onChange={(e) => setHoney(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${theme.ctaBg}`}
          >
            {status === "sending" ? "提交中…" : data.submitText}
          </button>
          {status === "error" ? <p className="text-center text-sm text-red-600">提交失败，请检查后重试</p> : null}
        </form>
      </div>
    </section>
  );
}
```
> 注：`theme.ctaBg` 为 RendererTheme 的 CTA 背景类名。实现时确认 `landing-renderer/theme.ts` 中该字段名；若实际叫别的（如 `accentBg`/`ctaButton`），按实际改并保持与其它 section 用法一致。

- [ ] **Step 2: 类型检查 + lint**

Run: `npx tsc --noEmit && npx eslint landing-renderer/sections/LeadForm.tsx`
Expected: 均无错误（如 theme 字段名不符则按实际修正）

- [ ] **Step 3: 提交**

```bash
git add landing-renderer/sections/LeadForm.tsx
git commit -m "feat: 渲染器留资表单区块 LeadForm（honeypot + 提交）"
```

---

## Task 10: LandingPage 接入 pageId + 渲染 LeadForm

**Files:**
- Modify: `landing-renderer/LandingPage.tsx`
- Modify: `app/p/[slug]/page.tsx`
- Modify: `landing-editor/components/PreviewPane.tsx`

- [ ] **Step 1: 改 LandingPage**

把 `landing-renderer/LandingPage.tsx` 替换为：
```tsx
// landing-renderer/LandingPage.tsx
// 渲染器入口：首屏 + 可排序 sections + 页脚 + 兜底留资表单 + 悬浮按钮。
import type { LandingPageDraft } from "@/types/schema.draft";
import { defaultTheme, type RendererTheme } from "./theme";
import { Hero } from "./sections/Hero";
import { Footer } from "./sections/Footer";
import { FloatingButton } from "./sections/FloatingButton";
import { LeadForm } from "./sections/LeadForm";
import { renderSection } from "./sections";

export function LandingPage({
  page,
  theme = defaultTheme,
  pageId = "",
}: {
  page: LandingPageDraft;
  theme?: RendererTheme;
  pageId?: string;
}) {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Hero data={page.hero} theme={theme} />
      {page.sections.map((section, i) => renderSection(section, theme, i))}
      {page.leadForm?.enabled ? <LeadForm data={page.leadForm} pageId={pageId} theme={theme} /> : null}
      <Footer data={page.footer} theme={theme} />
      {page.floatingButton && <FloatingButton data={page.floatingButton} theme={theme} />}
    </div>
  );
}
```

- [ ] **Step 2: 公开页透传 pageId**

在 `app/p/[slug]/page.tsx` 把 `<LandingPage page={page.data} />` 改为：
```tsx
      <LandingPage page={page.data} pageId={page.id} />
```

- [ ] **Step 3: 预览传占位 pageId**

在 `landing-editor/components/PreviewPane.tsx` 找到 `<LandingPage page={draft} />`，改为：
```tsx
      <LandingPage page={draft} pageId="preview" />
```
（预览以展示为主，pageId="preview" 提交会因 FK 失败被 best-effort 忽略，不入库。）

- [ ] **Step 4: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无输出（通过）

- [ ] **Step 5: 提交**

```bash
git add landing-renderer/LandingPage.tsx "app/p/[slug]/page.tsx" landing-editor/components/PreviewPane.tsx
git commit -m "feat: LandingPage 接入 pageId 并在页尾渲染 LeadForm"
```

---

## Task 11: 编辑器 store + 默认值接入 leadForm

**Files:**
- Modify: `landing-editor/store/defaults.ts`
- Modify: `landing-editor/store/editorStore.tsx`

- [ ] **Step 1: 加默认值工厂**

在 `landing-editor/store/defaults.ts`：import 区把 `LeadForm` 加入类型导入，并在 `createFloatingButton` 之后加：
```ts
export const createLeadForm = (): LeadForm => ({
  enabled: true,
  title: "留下联系方式，我们尽快回复",
  description: "",
  submitText: "提交",
  successMessage: "已收到，我们会尽快联系你！",
  fields: {
    name:     { enabled: true,  required: false },
    email:    { enabled: true,  required: false },
    phone:    { enabled: false, required: false },
    whatsapp: { enabled: true,  required: false },
    telegram: { enabled: false, required: false },
    message:  { enabled: true,  required: false },
  },
});
```
（import 行加 `LeadForm`）

- [ ] **Step 2: store 接入 leadForm**

在 `landing-editor/store/editorStore.tsx`：
1. import：`import { createSection, createFloatingButton, createLeadForm } from "./defaults";`，类型 import 加 `LeadForm`。
2. 常量加：`export const LEADFORM_ID = "leadForm";`
3. `EditorState` 加：`leadForm: LeadForm | null;`
4. `EditorAction` 加：
```ts
  | { kind: "toggleLeadForm"; on: boolean }
  | { kind: "updateLeadForm"; value: LeadForm }
```
5. reducer 加 case（放在 `toggleFloating` 之后）：
```ts
    case "updateLeadForm":
      return { ...state, leadForm: action.value };

    case "toggleLeadForm":
      return {
        ...state,
        leadForm: action.on ? (state.leadForm ?? createLeadForm()) : null,
        selectedId: action.on
          ? LEADFORM_ID
          : state.selectedId === LEADFORM_ID
            ? HERO_ID
            : state.selectedId,
      };
```
6. `toDraft` 加（`floatingButton` 之后）：`if (state.leadForm) draft.leadForm = state.leadForm;`
7. `fromDraft`（在 `sampleDraft.ts` 的 `fromDraft`，但 state 初始来自该函数——实际初始 state 构造在 `landing-editor/sampleDraft.ts`）：**注意** EditorState 现多了 `leadForm` 字段，须在所有构造 EditorState 的地方补 `leadForm`。在 `landing-editor/sampleDraft.ts` 的 `fromDraft` 返回对象里加：`leadForm: draft.leadForm ?? null,`

- [ ] **Step 3: 类型检查（会暴露所有需补 leadForm 的构造点）**

Run: `npx tsc --noEmit`
Expected: 若有「缺少 leadForm」错误，按提示在对应 EditorState 构造处补 `leadForm: ... ?? null`。修到无输出为止。

- [ ] **Step 4: 提交**

```bash
git add landing-editor/store/defaults.ts landing-editor/store/editorStore.tsx landing-editor/sampleDraft.ts
git commit -m "feat: 编辑器 store 接入 leadForm（toggle/update/toDraft/fromDraft）"
```

---

## Task 12: 编辑器配置面板 + 入口

**Files:**
- Create: `landing-editor/forms/LeadFormForm.tsx`
- Modify: `landing-editor/components/EditorDetail.tsx`
- Modify: `landing-editor/components/BlockList.tsx`

- [ ] **Step 1: 新建配置面板**

`landing-editor/forms/LeadFormForm.tsx`:
```tsx
"use client";
// landing-editor/forms/LeadFormForm.tsx
// 留资表单页面级配置面板。固定字段集，各字段开关 + 必填。
import type { LeadForm, LeadFormFieldConfig } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { LEAD_CONTACT_FIELDS } from "@/types/schema.draft";

const FIELD_LABELS: Record<string, string> = {
  name: "姓名", email: "邮箱", phone: "电话", whatsapp: "WhatsApp", telegram: "Telegram", message: "留言",
};
const FIELD_ORDER = ["name", "email", "phone", "whatsapp", "telegram", "message"] as const;

export function LeadFormForm({ value, onChange }: { value: LeadForm; onChange: (v: LeadForm) => void }) {
  const patch = (p: Partial<LeadForm>) => onChange({ ...value, ...p });
  const patchField = (k: (typeof FIELD_ORDER)[number], p: Partial<LeadFormFieldConfig>) =>
    onChange({ ...value, fields: { ...value.fields, [k]: { ...value.fields[k], ...p } } });

  const hasContact = LEAD_CONTACT_FIELDS.some((f) => value.fields[f].enabled);

  return (
    <div className="space-y-3">
      <Field label="表单标题">
        <TextInput value={value.title} onChange={(e) => patch({ title: e.target.value })} placeholder="留下联系方式" />
      </Field>
      <Field label="描述（选填）">
        <TextInput value={value.description ?? ""} onChange={(e) => patch({ description: e.target.value })} />
      </Field>
      <Field label="提交按钮文案">
        <TextInput value={value.submitText} onChange={(e) => patch({ submitText: e.target.value })} placeholder="提交" />
      </Field>
      <Field label="成功提示">
        <TextInput value={value.successMessage} onChange={(e) => patch({ successMessage: e.target.value })} />
      </Field>

      <div className="rounded-lg border border-edge p-2.5">
        <div className="mb-2 text-xs font-medium text-ink-soft">字段（至少启用一个联系方式）</div>
        <div className="space-y-1.5">
          {FIELD_ORDER.map((k) => (
            <div key={k} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-ink">{FIELD_LABELS[k]}</span>
              <div className="flex items-center gap-3 text-xs text-ink-soft">
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={value.fields[k].enabled} onChange={(e) => patchField(k, { enabled: e.target.checked })} />
                  启用
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={value.fields[k].required} disabled={!value.fields[k].enabled} onChange={(e) => patchField(k, { required: e.target.checked })} />
                  必填
                </label>
              </div>
            </div>
          ))}
        </div>
        {!hasContact ? <p className="mt-2 text-xs text-red-600">建议至少启用一个联系方式（邮箱/电话/WhatsApp/Telegram）</p> : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: EditorDetail 渲染面板**

在 `landing-editor/components/EditorDetail.tsx`：
1. import 加：`import { LeadFormForm } from "../forms/LeadFormForm";` 和把 `LEADFORM_ID` 加入从 store 的 import。
2. 在 `FLOATING_ID` 分支之后加：
```tsx
  } else if (id === LEADFORM_ID && state.leadForm) {
    title = "留资表单";
    body = (
      <LeadFormForm value={state.leadForm} onChange={(v) => dispatch({ kind: "updateLeadForm", value: v })} />
    );
```

- [ ] **Step 3: BlockList 加入口**

在 `landing-editor/components/BlockList.tsx`：把 `LEADFORM_ID` 加入从 store 的 import；参照现有 `FLOATING_ID` 入口块（约 86-92 行的悬浮按钮选择项），在其后加一个并列的「留资表单」入口：
```tsx
        <button
          type="button"
          onClick={() =>
            state.leadForm
              ? dispatch({ kind: "select", id: LEADFORM_ID })
              : dispatch({ kind: "toggleLeadForm", on: true })
          }
          className={
            "w-full rounded-md px-3 py-2 text-left text-sm transition " +
            (state.selectedId === LEADFORM_ID ? "bg-brand-50 text-brand-700" : "text-ink-soft hover:bg-canvas")
          }
        >
          {state.leadForm ? "留资表单" : "+ 启用留资表单"}
        </button>
```
> 注：精确样式/容器以 BlockList 现有 FLOATING_ID 入口为准，保持视觉一致。实现时读该文件对齐 class 与结构。

- [ ] **Step 4: 类型检查 + lint**

Run: `npx tsc --noEmit && npx eslint landing-editor/forms/LeadFormForm.tsx landing-editor/components/EditorDetail.tsx landing-editor/components/BlockList.tsx`
Expected: 均无错误

- [ ] **Step 5: 提交**

```bash
git add landing-editor/forms/LeadFormForm.tsx landing-editor/components/EditorDetail.tsx landing-editor/components/BlockList.tsx
git commit -m "feat: 编辑器留资表单配置面板 + 启用入口"
```

---

## Task 13: 后台收件箱页 + 导航

**Files:**
- Create: `app/admin/(workspace)/leads/page.tsx`
- Modify: `app/admin/(workspace)/_shell/nav.ts`

- [ ] **Step 1: 加导航项**

在 `app/admin/(workspace)/_shell/nav.ts`：import 行加图标 `InboxOutlined`，在 `pages`（落地页）项之后加：
```ts
  { key: "leads", label: "线索", icon: InboxOutlined, href: Routes.Leads },
```

- [ ] **Step 2: 新建收件箱页**

`app/admin/(workspace)/leads/page.tsx`:
```tsx
"use client";

import useSWR from "swr";
import { Table, Typography, Tag, Space, Button, Popconfirm, App } from "antd";
import { ApiRoutes, apiLeadPath, apiLeadsExportPath } from "@/lib/constants";

interface LeadRow {
  id: string;
  page_name: string;
  payload: { name?: string; email?: string; phone?: string; whatsapp?: string; telegram?: string; message?: string };
  channel: string | null;
  utm_source: string | null;
  is_read: boolean;
  created_at: string;
}

const contactSummary = (p: LeadRow["payload"]) =>
  [p.email, p.phone, p.whatsapp && `wa:${p.whatsapp}`, p.telegram && `tg:${p.telegram}`].filter(Boolean).join(" · ") || "—";

export default function LeadsPage() {
  const { message } = App.useApp();
  const { data, mutate, isLoading } = useSWR<LeadRow[]>(ApiRoutes.Leads);

  async function setRead(id: string, isRead: boolean) {
    await fetch(apiLeadPath(id), { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isRead }) });
    void mutate();
  }
  async function remove(id: string) {
    await fetch(apiLeadPath(id), { method: "DELETE" });
    message.success("已删除");
    void mutate();
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography.Title level={3} style={{ margin: 0 }}>线索</Typography.Title>
        <Button href={apiLeadsExportPath()} target="_blank">导出 CSV</Button>
      </div>
      <Table<LeadRow>
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        locale={{ emptyText: "还没有线索。访客通过落地页表单留资后会显示在这里" }}
        expandable={{
          expandedRowRender: (r) => (
            <Space direction="vertical" size={4}>
              {(["name", "email", "phone", "whatsapp", "telegram", "message"] as const).map((k) =>
                r.payload[k] ? <span key={k}><b>{k}:</b> {r.payload[k]}</span> : null,
              )}
            </Space>
          ),
        }}
        columns={[
          { title: "页面", dataIndex: "page_name", ellipsis: true },
          { title: "联系方式", render: (_: unknown, r: LeadRow) => contactSummary(r.payload), ellipsis: true },
          { title: "来源", render: (_: unknown, r: LeadRow) => [r.channel, r.utm_source].filter(Boolean).join(" / ") || "—", width: 140 },
          { title: "时间", dataIndex: "created_at", width: 180, render: (t: string) => new Date(t).toLocaleString() },
          { title: "状态", dataIndex: "is_read", width: 90, render: (v: boolean) => <Tag color={v ? "default" : "blue"}>{v ? "已读" : "未读"}</Tag> },
          { title: "操作", width: 180, render: (_: unknown, r: LeadRow) => (
            <Space size="middle">
              <a onClick={() => setRead(r.id, !r.is_read)}>{r.is_read ? "标未读" : "标已读"}</a>
              <Popconfirm title="确定删除该线索？" okText="删除" okButtonProps={{ danger: true }} onConfirm={() => remove(r.id)}>
                <a style={{ color: "#ef4444" }}>删除</a>
              </Popconfirm>
            </Space>
          ) },
        ]}
      />
    </Space>
  );
}
```

- [ ] **Step 3: 类型检查 + lint**

Run: `npx tsc --noEmit && npx eslint "app/admin/(workspace)/leads/page.tsx" "app/admin/(workspace)/_shell/nav.ts"`
Expected: 均无错误

- [ ] **Step 4: 提交**

```bash
git add "app/admin/(workspace)/leads/page.tsx" "app/admin/(workspace)/_shell/nav.ts"
git commit -m "feat: 后台线索收件箱页 + 侧边栏入口"
```

---

## Task 14: e2e + 全量验证

**Files:**
- Create: `e2e/leads.spec.ts`

- [ ] **Step 1: 写 e2e**

`e2e/leads.spec.ts`:
```ts
// e2e/leads.spec.ts
// 线索闭环：公开提交入库 → 后台收件箱可见 → 标记已读；honeypot/无联系方式反例。
// Dev Login 建会话；直接 POST /api/leads（dev 同源）验证公开提交，避免依赖真实自有域名路由。
import { test, expect, request as pwRequest } from "@playwright/test";
import { Pool } from "pg";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const RUN = process.env.RUN_DB_E2E === "1";
const DEV_EMAIL = process.env.DEV_USER_EMAIL ?? "dev@localhost";
const BASE = "http://localhost:3001";

function makePool(): Pool {
  const connectionString = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
  return new Pool({ connectionString, ssl: isLocal ? false : { rejectUnauthorized: false } });
}

let pool: Pool;
let devUserId: string;
let pageId: string;

test.describe("线索闭环", () => {
  test.skip(!RUN, "Set RUN_DB_E2E=1 to run database-backed e2e tests.");

  test.beforeAll(async () => {
    pool = makePool();
    const u = await pool.query(
      `INSERT INTO users (email, name, plan) VALUES ($1, 'Dev User', 'pro')
       ON CONFLICT (email) DO UPDATE SET plan='pro' RETURNING id`, [DEV_EMAIL]);
    devUserId = u.rows[0].id;
    await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
    const p = await pool.query(
      `INSERT INTO landing_pages (user_id, name, data) VALUES ($1, 'Lead 测试页', '{}'::jsonb) RETURNING id`, [devUserId]);
    pageId = p.rows[0].id;
  });

  test.afterAll(async () => {
    if (devUserId) await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
    await pool.end();
  });

  test("公开提交入库 + 校验反例", async () => {
    const api = await pwRequest.newContext();
    // 正常提交（有 whatsapp 联系方式）
    const ok = await api.post(`${BASE}/api/leads`, {
      data: { pageId, channel: "form", fields: { name: "Tom", whatsapp: "+1 555 0100", message: "hi" }, utm: { utm_source: "fb" } },
    });
    expect(ok.status()).toBe(204);
    // honeypot 命中 → 静默 204 但不入库
    await api.post(`${BASE}/api/leads`, { data: { pageId, fields: { whatsapp: "+1 999" }, company_url: "bot" } });
    // 无联系方式 → 400
    const bad = await api.post(`${BASE}/api/leads`, { data: { pageId, fields: { name: "NoContact" } } });
    expect(bad.status()).toBe(400);

    // DB 校验：该页只有 1 条 lead（honeypot 与 400 都没入库）
    const cnt = await pool.query(`SELECT COUNT(*)::int n FROM leads WHERE page_id = $1`, [pageId]);
    expect(cnt.rows[0].n).toBe(1);
    await api.dispose();
  });

  test("后台收件箱可见 + 标记已读", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Dev Login/i }).click();
    await page.waitForURL("**/admin", { timeout: 30_000 });

    await page.goto("/admin/leads");
    await expect(page.getByText("Lead 测试页")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("未读")).toBeVisible();
    await page.getByText("标已读", { exact: true }).first().click();
    await expect(page.getByText("已读")).toBeVisible({ timeout: 15_000 });
  });
});
```

- [ ] **Step 2: 确保 DB 在跑 + 迁移已应用 + seed**

Run: `docker exec zonit-pg-dev pg_isready -U postgres -d zonit && pnpm migrate:up && pnpm db:seed-dev`
Expected: migrations complete + seed 成功

- [ ] **Step 3: 跑该 e2e**

Run: `RUN_DB_E2E=1 pnpm exec playwright test e2e/leads.spec.ts`
Expected: 2 passed（如「标已读」定位器因 antd 表格细节失败，按实际 DOM 调整后跑通，不弱化断言）

- [ ] **Step 4: 全量验证**

Run: `npx tsc --noEmit && npx eslint . && npx vitest run && RUN_DB_E2E=1 pnpm test:e2e`
Expected: tsc 通过；eslint 0 error；vitest 全绿（含 validate/csv/rate-limit）；e2e 全 passed（原 7 + 新 2）。
（`npx next build` 若因 Google 字体网络不可达失败，属环境问题，单独说明，不算回归。）

- [ ] **Step 5: 提交**

```bash
git add e2e/leads.spec.ts
git commit -m "test(e2e): 线索闭环（公开提交入库 + 收件箱 + 已读 + 反例）"
```

---

## 验收标准（对照 spec）

- schema 有 `leadForm?` 页面级可选件（默认关）；`leads` 表迁移含 PII payload + 归因 + is_read。
- 公开页页尾按配置渲染表单；`POST /api/leads` 有 honeypot + 频率限制 + 「至少一联系方式」校验；深链不入 leads。
- 编辑器有留资表单配置面板 + 启用入口；预览自动渲染。
- 后台 `/admin/leads` 收件箱：列表/详情展开/已读切换/删除/导出 CSV；侧边栏入口。
- 单测覆盖 validate/csv/rate-limit；e2e 覆盖提交入库→收件箱→已读 + honeypot/无联系方式反例。
- tsc / eslint / vitest / e2e 全绿。
