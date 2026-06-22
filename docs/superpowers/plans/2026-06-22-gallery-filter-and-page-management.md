# 模板画廊筛选 + 落地页复制与行内改名 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给模板画廊加「行业/范式/转化 三维 + 名称搜索」筛选,给落地页列表加「复制为草稿」与「行内改名」。

**Architecture:** 画廊筛选纯前端,在已打包的静态 `TEMPLATES` 上用纯函数 `filterTemplates` 过滤,零请求;复制/改名走新 store 函数 + API（`POST /[id]/duplicate`、`PATCH /[id]`),列表页 antd Table 接上。纯逻辑用 vitest,DB/集成用 playwright e2e（沿用 `RUN_DB_E2E` 门控),不另造 vitest DB 桩。

**Tech Stack:** Next.js 16(App Router)、TypeScript、Tailwind（画廊）、antd（后台列表）、SWR、pg、vitest、Playwright。

设计来源:`docs/superpowers/specs/2026-06-22-gallery-filter-and-page-management-design.md`

---

## File Structure

- `landing-editor/samples/templateFilter.ts` —（新建）标签中文映射 + 选项去重 + `filterTemplates` 纯函数。
- `landing-editor/samples/templateFilter.test.ts` —（新建）`filterTemplates` 单测。
- `landing-editor/components/TemplateGallery.tsx` —（改）加筛选栏 + 空态。
- `lib/landing-pages/store.ts` —（改）加 `duplicateLandingPage`、`renameLandingPage`。
- `app/api/landing-pages/[id]/duplicate/route.ts` —（新建）POST 复制。
- `app/api/landing-pages/[id]/route.ts` —（改）加 PATCH 改名。
- `lib/constants/routes.ts` —（改）加 `apiLandingDuplicatePath`。
- `app/admin/(workspace)/landing-pages/page.tsx` —（改）加「复制」操作 + 名称行内编辑。
- `e2e/gallery-and-pages.spec.ts` —（新建）画廊筛选 + 复制 + 改名 happy-path。

---

## Task 1: `filterTemplates` 纯函数 + 标签映射

**Files:**
- Create: `landing-editor/samples/templateFilter.ts`
- Test: `landing-editor/samples/templateFilter.test.ts`

- [ ] **Step 1: 写失败测试**

`landing-editor/samples/templateFilter.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { filterTemplates, facetOptions } from "./templateFilter";
import type { TemplateMeta } from "./registry";

const M = (over: Partial<TemplateMeta> & Pick<TemplateMeta, "id">): TemplateMeta => ({
  id: over.id,
  name: over.name ?? "Name",
  industry: over.industry ?? "行业",
  tagline: over.tagline ?? "简介",
  thumbnail: "",
  tier: over.tier ?? "t1",
  tags: {
    category: over.tags?.category ?? "beauty",
    subcategory: over.tags?.subcategory ?? "skincare",
    archetype: over.tags?.archetype ?? "种草留资",
    conversion: over.tags?.conversion ?? ["whatsapp"],
    risk: over.tags?.risk ?? "low",
    tone: over.tags?.tone ?? "emotional",
  },
});

const metas: TemplateMeta[] = [
  M({ id: "a", name: "Aurae Skincare", tags: { category: "beauty", archetype: "种草留资", conversion: ["whatsapp"] } as TemplateMeta["tags"] }),
  M({ id: "b", name: "Solterra Solar", tagline: "太阳能", tags: { category: "home-improvement", archetype: "预约咨询", conversion: ["whatsapp", "form"] } as TemplateMeta["tags"] }),
  M({ id: "c", name: "Atlas Footwear", tags: { category: "apparel", archetype: "种草留资", conversion: ["whatsapp"] } as TemplateMeta["tags"] }),
];

describe("filterTemplates", () => {
  it("空筛选返回全部", () => {
    expect(filterTemplates(metas, {})).toHaveLength(3);
  });
  it("按行业 category 过滤", () => {
    expect(filterTemplates(metas, { category: "apparel" }).map((m) => m.id)).toEqual(["c"]);
  });
  it("按范式 archetype 过滤", () => {
    expect(filterTemplates(metas, { archetype: "预约咨询" }).map((m) => m.id)).toEqual(["b"]);
  });
  it("按转化方式命中数组任一", () => {
    expect(filterTemplates(metas, { conversion: "form" }).map((m) => m.id)).toEqual(["b"]);
  });
  it("三维 AND", () => {
    expect(filterTemplates(metas, { category: "beauty", archetype: "预约咨询" })).toHaveLength(0);
  });
  it("query 对 name/tagline/industry 不区分大小写子串匹配", () => {
    expect(filterTemplates(metas, { query: "solar" }).map((m) => m.id)).toEqual(["b"]);
    expect(filterTemplates(metas, { query: "太阳能" }).map((m) => m.id)).toEqual(["b"]);
  });
  it("facetOptions 仅列实际出现的值并附中文标签", () => {
    const opts = facetOptions(metas);
    expect(opts.category).toContainEqual({ value: "apparel", label: "服饰配饰" });
    expect(opts.conversion).toContainEqual({ value: "form", label: "表单" });
    // 去重：beauty 只出现一次
    expect(opts.category.filter((o) => o.value === "beauty")).toHaveLength(1);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run landing-editor/samples/templateFilter.test.ts`
Expected: FAIL（`templateFilter` 模块不存在）

- [ ] **Step 3: 写实现**

`landing-editor/samples/templateFilter.ts`:
```ts
// landing-editor/samples/templateFilter.ts
// 画廊筛选：标签中文映射 + 选项去重 + 纯过滤函数。数据源为静态 TEMPLATES，纯前端。
import type { TemplateMeta } from "./registry";

/** 行业 category(slug) → 中文标签。缺键回退原 slug。 */
export const CATEGORY_LABELS: Record<string, string> = {
  beauty: "美妆个护",
  apparel: "服饰配饰",
  gadget: "3C 数码",
  home: "家居家纺",
  supplement: "健康保健",
  "toys-baby": "玩具母婴",
  medical: "医疗",
  "home-improvement": "家装",
};

/** 转化方式 slug → 展示名。缺键回退原 slug。 */
export const CONVERSION_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  form: "表单",
  telegram: "Telegram",
  phone: "电话",
  email: "邮件",
};

const labelOf = (map: Record<string, string>, v: string) => map[v] ?? v;

export interface TemplateFilters {
  category?: string;
  archetype?: string;
  conversion?: string;
  query?: string;
}

export interface FacetOption {
  value: string;
  label: string;
}

export interface FacetOptions {
  category: FacetOption[];
  archetype: FacetOption[];
  conversion: FacetOption[];
}

/** 从实际数据去重生成各维度可选项（保证只列存在的值）。 */
export function facetOptions(metas: TemplateMeta[]): FacetOptions {
  const cat = new Set<string>();
  const arc = new Set<string>();
  const conv = new Set<string>();
  for (const m of metas) {
    cat.add(m.tags.category);
    arc.add(m.tags.archetype);
    for (const c of m.tags.conversion) conv.add(c);
  }
  return {
    category: [...cat].map((v) => ({ value: v, label: labelOf(CATEGORY_LABELS, v) })),
    archetype: [...arc].map((v) => ({ value: v, label: v })),
    conversion: [...conv].map((v) => ({ value: v, label: labelOf(CONVERSION_LABELS, v) })),
  };
}

/** 三维 AND + query 子串匹配（name/tagline/industry）。空/未选维度不约束。 */
export function filterTemplates(metas: TemplateMeta[], f: TemplateFilters): TemplateMeta[] {
  const q = f.query?.trim().toLowerCase() ?? "";
  return metas.filter((m) => {
    if (f.category && m.tags.category !== f.category) return false;
    if (f.archetype && m.tags.archetype !== f.archetype) return false;
    if (f.conversion && !m.tags.conversion.includes(f.conversion as TemplateMeta["tags"]["conversion"][number])) return false;
    if (q) {
      const hay = `${m.name} ${m.tagline} ${m.industry}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run landing-editor/samples/templateFilter.test.ts`
Expected: PASS（7 tests）

- [ ] **Step 5: 提交**

```bash
git add landing-editor/samples/templateFilter.ts landing-editor/samples/templateFilter.test.ts
git commit -m "feat: 模板画廊筛选纯函数 filterTemplates + 标签映射"
```

---

## Task 2: 画廊筛选栏 UI

**Files:**
- Modify: `landing-editor/components/TemplateGallery.tsx`

- [ ] **Step 1: 改写 TemplateGallery 接入筛选**

把 `landing-editor/components/TemplateGallery.tsx` 整体替换为：
```tsx
"use client";
// landing-editor/components/TemplateGallery.tsx
// 模板选择页：行业/范式/转化 三维筛选 + 名称搜索（纯前端，过滤静态 TEMPLATES）。
import { useMemo, useState } from "react";
import { TEMPLATES } from "../samples/registry";
import { facetOptions, filterTemplates, type TemplateFilters } from "../samples/templateFilter";
import { TemplateGalleryCard } from "./TemplateGalleryCard";

const selectCls =
  "rounded-lg border border-edge bg-panel px-3 py-2 text-sm text-ink focus:border-edge-strong focus:outline-none";

export function TemplateGallery() {
  const [filters, setFilters] = useState<TemplateFilters>({});
  const opts = useMemo(() => facetOptions(TEMPLATES), []);
  const list = useMemo(() => filterTemplates(TEMPLATES, filters), [filters]);
  const set = (patch: Partial<TemplateFilters>) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <header className="mb-8 text-center">
          <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            落地页编辑器
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">选择一个模板开始</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ink-soft sm:text-base">
            挑选最贴近你业务的行业模板，进入编辑器后可自由调整、增删与排序每个模块。
          </p>
        </header>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
          <select className={selectCls} value={filters.category ?? ""} onChange={(e) => set({ category: e.target.value || undefined })}>
            <option value="">全部行业</option>
            {opts.category.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className={selectCls} value={filters.archetype ?? ""} onChange={(e) => set({ archetype: e.target.value || undefined })}>
            <option value="">全部范式</option>
            {opts.archetype.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className={selectCls} value={filters.conversion ?? ""} onChange={(e) => set({ conversion: e.target.value || undefined })}>
            <option value="">全部转化方式</option>
            {opts.conversion.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input
            type="search"
            className={selectCls + " w-56"}
            placeholder="搜索模板名称…"
            value={filters.query ?? ""}
            onChange={(e) => set({ query: e.target.value || undefined })}
          />
        </div>

        {list.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-ink-soft">没有匹配的模板</p>
            <button
              type="button"
              onClick={() => setFilters({})}
              className="mt-3 rounded-lg border border-edge px-4 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-edge-strong"
            >
              清空筛选
            </button>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((t) => (
              <li key={t.id}>
                <TemplateGalleryCard template={t} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 类型检查 + 构建该路由**

Run: `npx tsc --noEmit`
Expected: 无输出（通过）

- [ ] **Step 3: 提交**

```bash
git add landing-editor/components/TemplateGallery.tsx
git commit -m "feat: 模板画廊筛选栏（行业/范式/转化 + 名称搜索）"
```

---

## Task 3: store 复制 + 改名函数

**Files:**
- Modify: `lib/landing-pages/store.ts`

- [ ] **Step 1: 在 store.ts 末尾追加两个函数**

在 `lib/landing-pages/store.ts` 文件末尾追加：
```ts
/** 复制为新草稿：name 加「副本」，status/slug 走默认（draft / null），data 整体拷贝。 */
export async function duplicateLandingPage(id: string, userId: string): Promise<LandingPageRow | null> {
  const src = await getLandingPage(id, userId);
  if (!src) return null;
  const result = await pool.query(
    `INSERT INTO landing_pages (user_id, name, data) VALUES ($1, $2, $3) RETURNING *`,
    [userId, `${src.name} 副本`, JSON.stringify(src.data)],
  );
  return result.rows[0];
}

/** 仅改名（不触碰 data）。 */
export async function renameLandingPage(id: string, userId: string, name: string): Promise<LandingPageRow | null> {
  const result = await pool.query(
    `UPDATE landing_pages SET name = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *`,
    [name, id, userId],
  );
  return result.rows[0] ?? null;
}
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无输出（通过）

- [ ] **Step 3: 提交**

```bash
git add lib/landing-pages/store.ts
git commit -m "feat: store 新增 duplicateLandingPage / renameLandingPage"
```

---

## Task 4: 复制 API 路由 + 路径常量

**Files:**
- Create: `app/api/landing-pages/[id]/duplicate/route.ts`
- Modify: `lib/constants/routes.ts`

- [ ] **Step 1: 加路径常量**

在 `lib/constants/routes.ts` 中 `apiLandingUnpublishPath` 那一行下方追加：
```ts
export const apiLandingDuplicatePath = (id: string) => `/api/landing-pages/${id}/duplicate`;
```

- [ ] **Step 2: 新建复制路由**

`app/api/landing-pages/[id]/duplicate/route.ts`:
```ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { duplicateLandingPage, listLandingPages } from "@/lib/landing-pages/store";
import { getUserPlan } from "@/lib/plans-db";
import { PLANS } from "@/lib/plans";

export async function POST(_req: NextRequest, ctx: RouteContext<"/api/landing-pages/[id]/duplicate">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });

  // 套餐落地页数量上限：与新建一致，达上限拦截
  const plan = await getUserPlan(session.user.id);
  const limit = PLANS[plan].landingPagesLimit;
  if (limit !== Infinity) {
    const existing = await listLandingPages(session.user.id);
    if (existing.length >= limit) {
      return NextResponse.json({ error: ApiErrors.LIMIT_EXCEEDED }, { status: 403 });
    }
  }

  const { id } = await ctx.params;
  const row = await duplicateLandingPage(id, session.user.id);
  if (!row) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json(row, { status: 201 });
}
```

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无输出（通过）

- [ ] **Step 4: 提交**

```bash
git add "app/api/landing-pages/[id]/duplicate/route.ts" lib/constants/routes.ts
git commit -m "feat: 落地页复制 API POST /[id]/duplicate（含套餐上限）"
```

---

## Task 5: 改名 API（PATCH）

**Files:**
- Modify: `app/api/landing-pages/[id]/route.ts`

- [ ] **Step 1: 在 [id]/route.ts 加 PATCH**

把 import 行改为（加入 `renameLandingPage`）：
```ts
import { getLandingPage, updateLandingPageDraft, deleteLandingPage, renameLandingPage } from "@/lib/landing-pages/store";
```
在 `PUT` 函数之后、`DELETE` 之前插入：
```ts
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/landing-pages/[id]">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { id } = await ctx.params;
  const { name } = await request.json();
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!trimmed || trimmed.length > 100) {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }
  const row = await renameLandingPage(id, session.user.id, trimmed);
  if (!row) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json(row);
}
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无输出（通过）

- [ ] **Step 3: 提交**

```bash
git add "app/api/landing-pages/[id]/route.ts"
git commit -m "feat: 落地页改名 API PATCH /[id]（仅 name，1–100 字符）"
```

---

## Task 6: 列表页复制 + 行内改名

**Files:**
- Modify: `app/admin/(workspace)/landing-pages/page.tsx`

- [ ] **Step 1: 改写列表页**

把 `app/admin/(workspace)/landing-pages/page.tsx` 整体替换为：
```tsx
"use client";

import useSWR from "swr";
import Link from "next/link";
import { Table, Button, Tag, Space, Popconfirm, Typography, App } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  landingEditorPath,
  apiLandingUnpublishPath,
  apiLandingPagePath,
  apiLandingDuplicatePath,
  ApiRoutes,
  Routes,
} from "@/lib/constants";

interface PageRow { id: string; name: string; slug: string | null; status: "draft" | "published"; updated_at: string; }

export default function LandingPagesPage() {
  const { message } = App.useApp();
  const { data, mutate, isLoading } = useSWR<PageRow[]>(ApiRoutes.LandingPages);

  async function unpublish(id: string) {
    await fetch(apiLandingUnpublishPath(id), { method: "POST" });
    message.success("已取消发布");
    void mutate();
  }
  async function remove(id: string) {
    await fetch(apiLandingPagePath(id), { method: "DELETE" });
    message.success("已删除");
    void mutate();
  }
  async function duplicate(id: string) {
    const res = await fetch(apiLandingDuplicatePath(id), { method: "POST" });
    if (res.status === 403) {
      message.error("已达当前套餐的落地页上限，请升级后再创建");
      window.location.href = Routes.Billing;
      return;
    }
    if (!res.ok) { message.error("复制失败"); return; }
    message.success("已复制为草稿");
    void mutate();
  }
  async function rename(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) { message.error("名称不能为空"); void mutate(); return; }
    const res = await fetch(apiLandingPagePath(id), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    if (!res.ok) { message.error("重命名失败"); void mutate(); return; }
    message.success("已重命名");
    void mutate();
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography.Title level={3} style={{ margin: 0 }}>落地页</Typography.Title>
        <Link href="/admin/editor"><Button type="primary" icon={<PlusOutlined />}>新建</Button></Link>
      </div>
      <Table<PageRow> rowKey="id" loading={isLoading} dataSource={data ?? []}
        locale={{ emptyText: "还没有落地页，点「新建」从模板开始" }}
        columns={[
          { title: "名称", dataIndex: "name", ellipsis: true,
            render: (name: string, r: PageRow) => (
              <Typography.Text editable={{ onChange: (v) => rename(r.id, v), tooltip: "点击重命名" }} style={{ marginBottom: 0 }}>
                {name}
              </Typography.Text>
            ) },
          { title: "状态", dataIndex: "status", width: 110,
            render: (s: PageRow["status"]) => <Tag color={s === "published" ? "green" : "default"}>{s === "published" ? "已发布" : "草稿"}</Tag> },
          { title: "更新时间", dataIndex: "updated_at", width: 200, render: (t: string) => new Date(t).toLocaleString() },
          { title: "操作", width: 300, render: (_: unknown, r: PageRow) => (
            <Space size="middle">
              <Link href={landingEditorPath(r.id)}>编辑</Link>
              <a onClick={() => duplicate(r.id)}>复制</a>
              {r.status === "published" && r.slug && <a href={`/p/${r.slug}`} target="_blank" rel="noreferrer">预览</a>}
              {r.status === "published" && <a onClick={() => unpublish(r.id)}>取消发布</a>}
              <Popconfirm title="确定删除该落地页？" okText="删除" okButtonProps={{ danger: true }} onConfirm={() => remove(r.id)}>
                <a style={{ color: "#ef4444" }}>删除</a>
              </Popconfirm>
            </Space>
          ) },
        ]} />
    </Space>
  );
}
```

- [ ] **Step 2: 类型检查 + lint**

Run: `npx tsc --noEmit && npx eslint "app/admin/(workspace)/landing-pages/page.tsx"`
Expected: 均无错误

- [ ] **Step 3: 提交**

```bash
git add "app/admin/(workspace)/landing-pages/page.tsx"
git commit -m "feat: 落地页列表支持复制与行内改名"
```

---

## Task 7: e2e（画廊筛选 + 复制 + 改名）

**Files:**
- Create: `e2e/gallery-and-pages.spec.ts`

- [ ] **Step 1: 写 e2e**

`e2e/gallery-and-pages.spec.ts`:
```ts
// e2e/gallery-and-pages.spec.ts
// 画廊三维筛选 + 落地页复制 / 行内改名 happy-path。
// Dev Login 建会话；beforeAll/afterAll 用 pg 备好/清理 dev 用户落地页（pro 套餐留足额度）。
import { test, expect } from "@playwright/test";
import { Pool } from "pg";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const RUN = process.env.RUN_DB_E2E === "1";
const DEV_EMAIL = process.env.DEV_USER_EMAIL ?? "dev@localhost";

function makePool(): Pool {
  const connectionString = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
  return new Pool({ connectionString, ssl: isLocal ? false : { rejectUnauthorized: false } });
}

let pool: Pool;
let devUserId: string;

test.describe("画廊筛选 + 落地页复制/改名", () => {
  test.skip(!RUN, "Set RUN_DB_E2E=1 to run database-backed e2e tests.");

  test.beforeAll(async () => {
    pool = makePool();
    const res = await pool.query(
      `INSERT INTO users (email, name, plan) VALUES ($1, 'Dev User', 'pro')
       ON CONFLICT (email) DO UPDATE SET plan = 'pro' RETURNING id`,
      [DEV_EMAIL],
    );
    devUserId = res.rows[0].id;
    await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
  });

  test.afterAll(async () => {
    if (devUserId) await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
    await pool.end();
  });

  test("画廊三维筛选 + 搜索", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Dev Login/i }).click();
    await page.waitForURL("**/admin", { timeout: 30_000 });

    await page.goto("/admin/editor");
    // 初始全量：至少能看到 Aurae Skincare
    await expect(page.getByText("Aurae Skincare")).toBeVisible();
    // 搜索 footwear → 命中 Atlas Footwear，Aurae 消失
    await page.getByPlaceholder("搜索模板名称…").fill("footwear");
    await expect(page.getByText("Atlas Footwear")).toBeVisible();
    await expect(page.getByText("Aurae Skincare")).toHaveCount(0);
    // 清空搜索框后恢复
    await page.getByPlaceholder("搜索模板名称…").fill("");
    await expect(page.getByText("Aurae Skincare")).toBeVisible();
  });

  test("复制为草稿 + 行内改名", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Dev Login/i }).click();
    await page.waitForURL("**/admin", { timeout: 30_000 });

    // 先建一页（画廊首张「空白开始」）
    await page.goto("/admin/editor");
    await page.getByRole("button", { name: "空白开始" }).first().click();
    await page.waitForURL(/\/admin\/editor\/[^/]+$/, { timeout: 30_000 });

    // 列表：复制 → 出现「副本」草稿
    await page.goto("/admin/landing-pages");
    await page.getByText("复制", { exact: true }).first().click();
    await expect(page.getByText(/副本/)).toBeVisible({ timeout: 15_000 });

    // 行内改名：把第一行名称改为唯一串
    const unique = `重命名页_${Date.now()}`;
    const firstName = page.locator("tbody tr").first().locator(".ant-typography");
    await firstName.locator("[role='button'], .anticon-edit").first().click();
    await page.locator("tbody tr").first().locator("textarea, input").first().fill(unique);
    await page.keyboard.press("Enter");
    await expect(page.getByText(unique)).toBeVisible({ timeout: 15_000 });
  });
});
```

- [ ] **Step 2: 确保本地 DB 在跑并已 seed**

Run: `docker exec zonit-pg-dev pg_isready -U postgres -d zonit && pnpm db:seed-dev`
Expected: `accepting connections` + seed 成功

- [ ] **Step 3: 跑该 e2e**

Run: `RUN_DB_E2E=1 pnpm exec playwright test e2e/gallery-and-pages.spec.ts`
Expected: 2 passed（若行内改名定位器因 antd 版本细节失败，按实际 DOM 调整 locator，再跑通）

- [ ] **Step 4: 提交**

```bash
git add e2e/gallery-and-pages.spec.ts
git commit -m "test(e2e): 画廊筛选 + 落地页复制/行内改名"
```

---

## Task 8: 全量验证

**Files:** 无（仅运行)

- [ ] **Step 1: 类型 + lint + 单测 + 构建**

Run: `npx tsc --noEmit && npx eslint . && npx vitest run && npx next build`
Expected: 全部通过（vitest 含新 templateFilter 用例）

- [ ] **Step 2: 全量 e2e**

Run: `RUN_DB_E2E=1 pnpm test:e2e`
Expected: 全部 passed（原有 4 + 新增 2）

- [ ] **Step 3: 收尾提交（如有 lint 自动修复等）**

```bash
git add -A && git commit -m "chore: 子项A 全量验证通过" --allow-empty
```

---

## 验收标准（对照 spec）

- 画廊可按 行业/范式/转化 三维 + 名称搜索过滤；无匹配显示空态 + 清空筛选。
- `filterTemplates` 纯函数有单测覆盖各维度与组合。
- 落地页可一键「复制」为草稿（命名「{原名} 副本」、不继承发布/域名/slug），受套餐上限约束。
- 落地页可在列表行内改名（`PATCH`，1–100 字符）。
- tsc / eslint / vitest / build / e2e 全绿。
