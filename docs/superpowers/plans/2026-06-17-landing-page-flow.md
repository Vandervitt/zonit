# Zap Bridge 落地页流程 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 打通 admin 端落地页全链路——注册/登录 → 选模板建库 → 编辑(自动保存) → 预览(实时+全屏) → 发布到用户自有域名(多租户按 host 渲染) → 管理。

**Architecture:** 全新独立持久化表 `landing_pages`（存 `LandingPageDraft`），独立 REST API（`/api/landing-pages/**`），复用并扩展现有 Domains/Vercel/`handleTenancy` 多租户管线（`domains` 加 `landing_page_id`）；编辑器 `/editor-next/[id]` 按 id 载入并防抖自动保存；公开页经自定义域名 rewrite 到内部 `/p/[slug]`，用 `landing-renderer` 渲染。与旧 `sites`/旧渲染器完全解耦。

**Tech Stack:** Next.js 16 (App Router) · TypeScript · node-pg-migrate + Postgres(pg) · NextAuth(`auth()`) · SWR · Playwright(e2e) · Tailwind v4(编辑器 token)。

**测试约定（项目化 TDD 适配）：** 本仓库无单测框架；遵循 `docs/constraints/testing-and-validation.md`——每任务以 `npx tsc --noEmit`（无新增错误）+ `npx eslint <files>`（0 errors）为门禁，数据/接口任务加迁移与 curl 冒烟，整链路以 Phase 6 的 Playwright e2e 收口。基线已知错误：`templates/template/**` 的 `prefilledMessage`（与本计划无关，勿计入）。

**依赖来源：** 详细设计 `docs/superpowers/specs/2026-06-17-landing-page-flow-design.md`。

---

## 文件结构（创建/修改一览）

**新建**
- `migrations/010_add_landing_pages.js` — 建 `landing_pages` + `ALTER domains ADD landing_page_id`
- `lib/landing-pages/store.ts` — `landing_pages` 的 DB 访问与 slug 工具
- `app/api/landing-pages/route.ts` — GET 列表 / POST 建库
- `app/api/landing-pages/[id]/route.ts` — GET / PUT(自动保存) / DELETE
- `app/api/landing-pages/[id]/publish/route.ts` — 发布（绑定域名）
- `app/api/landing-pages/[id]/unpublish/route.ts` — 取消发布
- `app/p/[slug]/page.tsx` — 公开渲染（仅经自定义域名 rewrite 到达）
- `app/editor-next/[id]/page.tsx` — 编辑器（按 id 载入）
- `app/editor-next/[id]/preview/page.tsx` — 全屏预览
- `landing-editor/MetaContext.tsx` — 页面级元数据 context（pageId/name/saveState）
- `landing-editor/components/AutoSave.tsx` — 防抖自动保存
- `landing-editor/components/EditorToolbar.tsx` — 顶栏（名称/保存态/预览/发布/返回）
- `landing-editor/components/PublishDialog.tsx` — 发布弹框（选域名）
- `landing-editor/components/TemplateGalleryCard.tsx` — 选模板=建库（client）
- `app/(dashboard)/landing-pages/page.tsx` — 列表与管理页

**修改**
- `lib/constants/errors.ts` — 新增错误码
- `lib/constants/routes.ts` — 新增 Routes/path 助手
- `lib/domains-db.ts` — 新增落地页域名解析与绑定
- `app/api/domains/route.ts` — POST 兼容 `landingPageId`
- `lib/proxy/tenant-proxy.ts` — `handleTenancy` 优先解析落地页
- `lib/proxy/auth-proxy.ts` — `PUBLIC_PATHS`：移除 `/editor-next`、新增 `/p`
- `landing-editor/Editor.tsx` — 由 templateId 改为 `{pageId,initialName,initialDraft}`
- `landing-editor/components/EditorLayout.tsx` — 接入 `EditorToolbar` + `AutoSave`
- `landing-editor/components/TemplateGallery.tsx` — 卡片改用 `TemplateGalleryCard`
- `app/editor-next/page.tsx` — 仅保留 gallery（移除 `?template` 直接挂载分支）
- `components/Sidebar.tsx` — 新增「落地页」导航项

---

## Phase 1 — 持久化与 API（可独立验证 CRUD）

### Task 1: 迁移——建 landing_pages 表 + 扩展 domains

**Files:**
- Create: `migrations/010_add_landing_pages.js`

- [ ] **Step 1: 写迁移文件**

```js
/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS landing_pages (
      id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      user_id      TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name         TEXT        NOT NULL,
      slug         TEXT        UNIQUE,
      status       TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
      data         JSONB       NOT NULL,
      published_at TIMESTAMPTZ,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_landing_pages_user_id ON landing_pages(user_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_landing_pages_user_name ON landing_pages(user_id, name);

    ALTER TABLE domains
      ADD COLUMN IF NOT EXISTS landing_page_id TEXT REFERENCES landing_pages(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_domains_landing_lookup
      ON domains(domain) WHERE enabled = true AND verified = true AND landing_page_id IS NOT NULL;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_domains_landing_lookup;
    ALTER TABLE domains DROP COLUMN IF EXISTS landing_page_id;
    DROP INDEX IF EXISTS idx_landing_pages_user_name;
    DROP INDEX IF EXISTS idx_landing_pages_user_id;
    DROP TABLE IF EXISTS landing_pages;
  `);
};
```

- [ ] **Step 2: 执行迁移**

Run: `pnpm migrate:up`
Expected: 输出包含 `> Migrating files:` 与 `### MIGRATION 010_add_landing_pages (UP)`，无报错。

- [ ] **Step 3: 校验表与列存在**

Run:
```bash
pnpm exec tsx -e "import {config} from 'dotenv'; config({path:'.env.local',override:true,quiet:true}); import {Pool} from 'pg'; void (async()=>{const p=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}}); const a=await p.query(\"select column_name from information_schema.columns where table_name='landing_pages' order by 1\"); const b=await p.query(\"select 1 from information_schema.columns where table_name='domains' and column_name='landing_page_id'\"); console.log('landing_pages cols:',a.rows.map(r=>r.column_name).join(',')); console.log('domains.landing_page_id:', b.rows.length===1); await p.end();})();"
```
Expected: `landing_pages cols: created_at,data,id,name,published_at,slug,status,updated_at,user_id` 且 `domains.landing_page_id: true`。

- [ ] **Step 4: Commit**

```bash
git add migrations/010_add_landing_pages.js
git commit -m "feat(db): 新增 landing_pages 表并为 domains 加 landing_page_id"
```

---

### Task 2: 错误码 + 持久化层 store

**Files:**
- Modify: `lib/constants/errors.ts`
- Create: `lib/landing-pages/store.ts`

- [ ] **Step 1: 新增错误码**

在 `lib/constants/errors.ts` 的对象内、`VERCEL_API_ERROR` 行后追加：

```ts
  VALIDATION_FAILED: 'validation_failed',
  DOMAIN_REQUIRED: 'domain_required',
  DOMAIN_NOT_VERIFIED: 'domain_not_verified',
```

- [ ] **Step 2: 写持久化层**

Create `lib/landing-pages/store.ts`:

```ts
import pool from "@/lib/db";
import type { LandingPageDraft } from "@/types/schema.draft";

export interface LandingPageRow {
  id: string;
  user_id: string;
  name: string;
  slug: string | null;
  status: "draft" | "published";
  data: LandingPageDraft;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** 把任意页面名转为 url-safe slug。 */
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "page";
}

export async function createLandingPage(
  userId: string,
  name: string,
  data: LandingPageDraft,
): Promise<LandingPageRow> {
  const result = await pool.query(
    `INSERT INTO landing_pages (user_id, name, data) VALUES ($1, $2, $3) RETURNING *`,
    [userId, name, JSON.stringify(data)],
  );
  return result.rows[0];
}

export async function listLandingPages(userId: string): Promise<LandingPageRow[]> {
  const result = await pool.query(
    `SELECT * FROM landing_pages WHERE user_id = $1 ORDER BY updated_at DESC`,
    [userId],
  );
  return result.rows;
}

export async function getLandingPage(id: string, userId: string): Promise<LandingPageRow | null> {
  const result = await pool.query(
    `SELECT * FROM landing_pages WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return result.rows[0] ?? null;
}

export async function updateLandingPageDraft(
  id: string,
  userId: string,
  fields: { name?: string; data?: LandingPageDraft },
): Promise<LandingPageRow | null> {
  const set: string[] = ["updated_at = NOW()"];
  const values: unknown[] = [];
  let i = 1;
  if (fields.name !== undefined) { set.push(`name = $${i++}`); values.push(fields.name); }
  if (fields.data !== undefined) { set.push(`data = $${i++}`); values.push(JSON.stringify(fields.data)); }
  values.push(id, userId);
  const result = await pool.query(
    `UPDATE landing_pages SET ${set.join(", ")} WHERE id = $${i++} AND user_id = $${i} RETURNING *`,
    values,
  );
  return result.rows[0] ?? null;
}

export async function deleteLandingPage(id: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM landing_pages WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId],
  );
  return result.rows.length > 0;
}

/** slug 是否被别的页面占用。 */
export async function isSlugTaken(slug: string, exceptId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM landing_pages WHERE slug = $1 AND id != $2`,
    [slug, exceptId],
  );
  return result.rows.length > 0;
}

/** 生成不与他人冲突的唯一 slug（必要时追加短后缀）。 */
export async function ensureUniqueSlug(desired: string, exceptId: string): Promise<string> {
  const base = slugify(desired);
  let candidate = base;
  for (let n = 0; n < 50; n++) {
    if (!(await isSlugTaken(candidate, exceptId))) return candidate;
    candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function publishLandingPage(
  id: string,
  userId: string,
  slug: string,
): Promise<LandingPageRow | null> {
  const result = await pool.query(
    `UPDATE landing_pages
       SET status = 'published', slug = $1, published_at = COALESCE(published_at, NOW()), updated_at = NOW()
     WHERE id = $2 AND user_id = $3 RETURNING *`,
    [slug, id, userId],
  );
  return result.rows[0] ?? null;
}

export async function unpublishLandingPage(id: string, userId: string): Promise<LandingPageRow | null> {
  const result = await pool.query(
    `UPDATE landing_pages SET status = 'draft', updated_at = NOW()
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId],
  );
  return result.rows[0] ?? null;
}

/** 公开渲染用：按 slug 取已发布页面。 */
export async function getPublishedBySlug(slug: string): Promise<LandingPageRow | null> {
  const result = await pool.query(
    `SELECT * FROM landing_pages WHERE slug = $1 AND status = 'published'`,
    [slug],
  );
  return result.rows[0] ?? null;
}
```

- [ ] **Step 3: 类型/规范门禁**

Run: `npx tsc --noEmit 2>&1 | grep -v "templates/template" | grep "error TS" || echo OK`
Expected: `OK`

Run: `npx eslint lib/landing-pages/store.ts lib/constants/errors.ts`
Expected: 无输出（exit 0）

- [ ] **Step 4: Commit**

```bash
git add lib/landing-pages/store.ts lib/constants/errors.ts
git commit -m "feat(landing-pages): 新增持久化层 store 与错误码"
```

---

### Task 3: CRUD API（列表/建库/取/存/删）

**Files:**
- Create: `app/api/landing-pages/route.ts`
- Create: `app/api/landing-pages/[id]/route.ts`

- [ ] **Step 1: 列表 + 建库**

Create `app/api/landing-pages/route.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getTemplate } from "@/landing-editor/samples/registry";
import { createLandingPage, listLandingPages } from "@/lib/landing-pages/store";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  const rows = await listLandingPages(session.user.id);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  const { templateId } = await request.json();
  const template = getTemplate(templateId); // 未命中回退默认模板
  const row = await createLandingPage(session.user.id, template.name, template.draft);
  return NextResponse.json(row, { status: 201 });
}
```

- [ ] **Step 2: 取/存/删**

Create `app/api/landing-pages/[id]/route.ts`:

```ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getLandingPage, updateLandingPageDraft, deleteLandingPage } from "@/lib/landing-pages/store";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/landing-pages/[id]">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { id } = await ctx.params;
  const row = await getLandingPage(id, session.user.id);
  if (!row) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/landing-pages/[id]">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { id } = await ctx.params;
  const { name, data } = await request.json();
  const row = await updateLandingPageDraft(id, session.user.id, { name, data });
  if (!row) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/landing-pages/[id]">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { id } = await ctx.params;
  const ok = await deleteLandingPage(id, session.user.id);
  if (!ok) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: 门禁**

Run: `npx tsc --noEmit 2>&1 | grep -v "templates/template" | grep "error TS" || echo OK` → `OK`
Run: `npx eslint app/api/landing-pages/route.ts "app/api/landing-pages/[id]/route.ts"` → exit 0

- [ ] **Step 4: 冒烟（需登录态，开发库）**

启动 `pnpm dev`，登录后在浏览器 DevTools console 执行：
```js
const c = await (await fetch('/api/landing-pages',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({templateId:'skincare'})})).json(); console.log('created', c.id, c.status);
console.log('list', (await (await fetch('/api/landing-pages')).json()).length);
```
Expected: 打印新建 id 与 `status: 'draft'`，list 长度 ≥ 1。

- [ ] **Step 5: Commit**

```bash
git add app/api/landing-pages
git commit -m "feat(api): landing-pages CRUD（列表/建库/取/存/删）"
```

---

### Task 4: 发布/取消发布 API + 域名绑定与解析

**Files:**
- Modify: `lib/domains-db.ts`
- Modify: `app/api/domains/route.ts`
- Create: `app/api/landing-pages/[id]/publish/route.ts`
- Create: `app/api/landing-pages/[id]/unpublish/route.ts`

- [ ] **Step 1: 域名 DB——绑定落地页 + 按域名解析**

在 `lib/domains-db.ts` 末尾追加：

```ts
/** 把一个已验证启用的域名绑定到落地页（一域名一页：清掉它的旧绑定后绑新页）。 */
export async function bindDomainToLandingPage(
  domainId: string,
  userId: string,
  landingPageId: string,
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE domains SET landing_page_id = $1, site_id = NULL
     WHERE id = $2 AND user_id = $3 AND enabled = true AND verified = true RETURNING id`,
    [landingPageId, domainId, userId],
  );
  return result.rows.length > 0;
}

/** 公开渲染解析：自定义域名 → 已发布落地页 slug。 */
export async function getLandingSlugByCustomDomain(domain: string): Promise<string | null> {
  const result = await pool.query(
    `SELECT lp.slug FROM domains d
       JOIN landing_pages lp ON lp.id = d.landing_page_id
     WHERE d.domain = $1 AND d.enabled = true AND d.verified = true AND lp.status = 'published'`,
    [domain],
  );
  return result.rows[0]?.slug ?? null;
}
```

`updateDomain` 的 `fields` 类型已含 `site_id`；`bindDomainToLandingPage` 直接 SQL，无需改它。

- [ ] **Step 2: domains POST 兼容 landingPageId**

在 `app/api/domains/route.ts` 的 `POST` 中，将解构与校验从「必须 `siteId`」放宽为「`siteId` 或 `landingPageId` 二选一」。把：

```ts
  const { domain, siteId } = await request.json();

  if (!domain || !siteId || !DOMAIN_RE.test(domain)) {
    return NextResponse.json({ error: ApiErrors.INVALID_DOMAIN }, { status: 400 });
  }
```
改为：
```ts
  const { domain, siteId, landingPageId } = await request.json();

  if (!domain || (!siteId && !landingPageId) || !DOMAIN_RE.test(domain)) {
    return NextResponse.json({ error: ApiErrors.INVALID_DOMAIN }, { status: 400 });
  }
```
并把该函数内两处 `insertDomain({ ..., siteId })` / `updateDomain(..., { site_id: siteId, enabled: true })` 后追加落地页绑定（仅当带 `landingPageId`）。在每次成功拿到 domain 行（`updated` / 新建返回）之后、`return` 之前插入：
```ts
  // 若是为落地页绑定域名，写入 landing_page_id
  // （insertDomain 需要 siteId 非空：新流程仅传 landingPageId 时，用占位空字符串建行再绑定）
```
> 实现细节：`insertDomain` 当前签名要求 `siteId: string`。为支持仅 `landingPageId` 的新流程，**改 `insertDomain` 接受可空 siteId**——见 Step 3。

- [ ] **Step 3: insertDomain 支持仅落地页**

在 `lib/domains-db.ts` 的 `insertDomain` 改为：

```ts
export async function insertDomain(params: {
  id: string;
  userId: string;
  siteId?: string | null;
  landingPageId?: string | null;
  domain: string;
}): Promise<DomainRow> {
  const result = await pool.query(
    `INSERT INTO domains (id, user_id, site_id, landing_page_id, domain)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [params.id, params.userId, params.siteId ?? null, params.landingPageId ?? null, params.domain],
  );
  return result.rows[0];
}
```
并在 `DomainRow` 接口加 `landing_page_id?: string | null;`。`app/api/domains/route.ts` 中两处对域名的写入相应改为传 `landingPageId`（新流程）或 `siteId`（旧）。新增/启用域名后若带 `landingPageId`，调用 `bindDomainToLandingPage(domain.id, session.user.id, landingPageId)`。

> 注：本步只让「绑定+验证」可服务落地页；验证仍走现有 `[id]/status` + Vercel，不改。

- [ ] **Step 4: 发布 API**

Create `app/api/landing-pages/[id]/publish/route.ts`:

```ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { isLandingPageStructureValid } from "@/types/schema.draft";
import { getLandingPage, ensureUniqueSlug, publishLandingPage } from "@/lib/landing-pages/store";
import { getDomainById, bindDomainToLandingPage } from "@/lib/domains-db";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/landing-pages/[id]/publish">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });

  const { id } = await ctx.params;
  const { domainId, slug } = await request.json();

  const page = await getLandingPage(id, session.user.id);
  if (!page) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });

  if (!isLandingPageStructureValid(page.data)) {
    return NextResponse.json({ error: ApiErrors.VALIDATION_FAILED }, { status: 422 });
  }

  if (!domainId) {
    return NextResponse.json({ error: ApiErrors.DOMAIN_REQUIRED }, { status: 422 });
  }
  const domain = await getDomainById(domainId, session.user.id);
  if (!domain || !domain.enabled || !domain.verified) {
    return NextResponse.json({ error: ApiErrors.DOMAIN_NOT_VERIFIED }, { status: 422 });
  }

  const finalSlug = await ensureUniqueSlug(slug || page.slug || page.name, id);
  const bound = await bindDomainToLandingPage(domainId, session.user.id, id);
  if (!bound) return NextResponse.json({ error: ApiErrors.DOMAIN_NOT_VERIFIED }, { status: 422 });

  const published = await publishLandingPage(id, session.user.id, finalSlug);
  return NextResponse.json({ ...published, domain: domain.domain });
}
```

- [ ] **Step 5: 取消发布 API**

Create `app/api/landing-pages/[id]/unpublish/route.ts`:

```ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { unpublishLandingPage } from "@/lib/landing-pages/store";

export async function POST(_req: NextRequest, ctx: RouteContext<"/api/landing-pages/[id]/unpublish">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { id } = await ctx.params;
  const row = await unpublishLandingPage(id, session.user.id);
  if (!row) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json(row);
}
```

- [ ] **Step 6: 门禁**

Run: `npx tsc --noEmit 2>&1 | grep -v "templates/template" | grep "error TS" || echo OK` → `OK`
Run: `npx eslint lib/domains-db.ts app/api/domains/route.ts "app/api/landing-pages/[id]/publish/route.ts" "app/api/landing-pages/[id]/unpublish/route.ts"` → exit 0

- [ ] **Step 7: Commit**

```bash
git add lib/domains-db.ts app/api/domains/route.ts app/api/landing-pages/[id]/publish app/api/landing-pages/[id]/unpublish
git commit -m "feat(api): 落地页发布/取消发布 + 域名绑定与解析"
```

---

## Phase 2 — 门禁与多租户渲染

### Task 5: auth-proxy 公开路径调整

**Files:**
- Modify: `lib/proxy/auth-proxy.ts`

- [ ] **Step 1: 调整 PUBLIC_PATHS**

把 `PUBLIC_PATHS` 数组中的 `"/editor-next",` 删除，并新增 `"/p",`。结果应为：

```ts
export const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/pricing",
  "/site",
  "/preview-next",
  "/p",
  "/api/auth",
  "/api/register",
  "/api/templates",
];
```

- [ ] **Step 2: 门禁 + 手测**

Run: `npx eslint lib/proxy/auth-proxy.ts` → exit 0
启动 `pnpm dev`，未登录访问 `http://localhost:3001/editor-next` → 期望 302 跳 `/login`；访问 `http://localhost:3001/p/anything` → 不跳登录（进入 `/p/[slug]`，Task 7 后返回 404 页）。

- [ ] **Step 3: Commit**

```bash
git add lib/proxy/auth-proxy.ts
git commit -m "feat(proxy): /editor-next 纳入登录、/p 公开"
```

---

### Task 6: handleTenancy 优先解析落地页

**Files:**
- Modify: `lib/proxy/tenant-proxy.ts`

- [ ] **Step 1: 扩展解析**

把 `lib/proxy/tenant-proxy.ts` 改为（新页面优先，回落旧 sites）：

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSlugByCustomDomain } from "@/lib/domains-db";
import { getLandingSlugByCustomDomain } from "@/lib/domains-db";

const appHostname = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : null;

export async function handleTenancy(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const hostname = host.split(":")[0];

  if (appHostname && hostname !== appHostname && !hostname.endsWith(`.${appHostname}`)) {
    // 新流程：自定义域名 → 已发布落地页
    const landingSlug = await getLandingSlugByCustomDomain(hostname);
    if (landingSlug) {
      return NextResponse.rewrite(new URL(`/p/${landingSlug}`, req.url));
    }
    // 回落：旧 sites
    const slug = await getSlugByCustomDomain(hostname);
    if (slug) {
      return NextResponse.rewrite(new URL(`/site/${slug}`, req.url));
    }
    return new NextResponse("Not Found", { status: 404 });
  }

  return null;
}
```

- [ ] **Step 2: 门禁**

Run: `npx tsc --noEmit 2>&1 | grep -v "templates/template" | grep "error TS" || echo OK` → `OK`
Run: `npx eslint lib/proxy/tenant-proxy.ts` → exit 0

- [ ] **Step 3: Commit**

```bash
git add lib/proxy/tenant-proxy.ts
git commit -m "feat(proxy): 多租户优先解析已发布落地页，回落旧 sites"
```

---

### Task 7: 公开渲染路由 /p/[slug]

**Files:**
- Create: `app/p/[slug]/page.tsx`

- [ ] **Step 1: 写公开页**

Create `app/p/[slug]/page.tsx`（仅经自定义域名 rewrite 到达；app 域名直连 → 404）：

```tsx
import { headers } from "next/headers";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/landing-renderer/LandingPage";
import { getPublishedBySlug } from "@/lib/landing-pages/store";

const appHostname = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : null;

async function isAppHostDirect(): Promise<boolean> {
  const host = (await headers()).get("host") ?? "";
  const hostname = host.split(":")[0];
  return !!appHostname && (hostname === appHostname || hostname.endsWith(`.${appHostname}`));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedBySlug(slug);
  if (!page) return {};
  const title = page.data.hero.title.replace(/\n/g, " ");
  return { title, description: page.data.hero.subtitle };
}

export default async function PublicLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // 贯彻「只发布到自有域名」：app 域名直连不提供公共托管
  if (await isAppHostDirect()) notFound();

  const { slug } = await params;
  const page = await getPublishedBySlug(slug);
  if (!page) notFound();

  return <LandingPage page={page.data} />;
}
```

- [ ] **Step 2: 门禁**

Run: `npx tsc --noEmit 2>&1 | grep -v "templates/template" | grep "error TS" || echo OK` → `OK`
Run: `npx eslint "app/p/[slug]/page.tsx"` → exit 0

- [ ] **Step 3: 手测**

`pnpm dev` 后访问 `http://localhost:3001/p/whatever`（app 域名直连）→ 期望渲染 Next 404（`notFound()`）。

- [ ] **Step 4: Commit**

```bash
git add app/p/[slug]/page.tsx
git commit -m "feat(public): /p/[slug] 落地页公开渲染（app 域名直连 404）"
```

---

## Phase 3 — 编辑器持久化接线

### Task 8: 路由助手 + 选模板=建库

**Files:**
- Modify: `lib/constants/routes.ts`
- Create: `landing-editor/components/TemplateGalleryCard.tsx`
- Modify: `landing-editor/components/TemplateGallery.tsx`
- Modify: `app/editor-next/page.tsx`

- [ ] **Step 1: 路由助手**

在 `lib/constants/routes.ts`：`Routes` enum 增 `LandingPages = '/landing-pages',`；并在文件末尾追加：

```ts
export const landingEditorPath = (id: string) => `/editor-next/${id}`;
export const landingPreviewPath = (id: string) => `/editor-next/${id}/preview`;
export const apiLandingPagesPath = () => `/api/landing-pages`;
export const apiLandingPagePath = (id: string) => `/api/landing-pages/${id}`;
export const apiLandingPublishPath = (id: string) => `/api/landing-pages/${id}/publish`;
export const apiLandingUnpublishPath = (id: string) => `/api/landing-pages/${id}/unpublish`;
```

- [ ] **Step 2: 建库卡片（client）**

Create `landing-editor/components/TemplateGalleryCard.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TemplateMeta } from "../samples/registry";

export function TemplateGalleryCard({ template }: { template: TemplateMeta }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function start() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/landing-pages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ templateId: template.id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const page = await res.json();
      router.push(`/editor-next/${page.id}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={start}
      disabled={loading}
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-edge bg-panel text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-edge-strong hover:shadow-lg disabled:opacity-60"
    >
      <div className="aspect-[4/3] overflow-hidden bg-canvas">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={template.thumbnail} alt={template.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span className="inline-flex w-fit items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">{template.industry}</span>
        <h2 className="mt-3 text-lg font-semibold text-ink">{template.name}</h2>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-soft">{template.tagline}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
          {loading ? "创建中…" : "开始编辑 →"}
        </span>
      </div>
    </button>
  );
}
```

- [ ] **Step 3: Gallery 改用建库卡片**

在 `landing-editor/components/TemplateGallery.tsx`：删除 `import Link from "next/link";`，新增 `import { TemplateGalleryCard } from "./TemplateGalleryCard";`；把列表项里那段 `<Link href={...}>…</Link>` 整体替换为：

```tsx
            <li key={t.id}>
              <TemplateGalleryCard template={t} />
            </li>
```

- [ ] **Step 4: 收敛 editor-next 入口**

把 `app/editor-next/page.tsx` 改为只渲染选择页（`[id]` 路由接管编辑器）：

```tsx
// app/editor-next/page.tsx
// 模板选择页：选模板即建库并跳 /editor-next/[id]（见 TemplateGalleryCard）。
import { TemplateGallery } from "@/landing-editor/components/TemplateGallery";

export default function EditorNextPage() {
  return <TemplateGallery />;
}
```

- [ ] **Step 5: 门禁**

Run: `npx tsc --noEmit 2>&1 | grep -v "templates/template" | grep "error TS" || echo OK` → `OK`
Run: `npx eslint lib/constants/routes.ts landing-editor/components/TemplateGalleryCard.tsx landing-editor/components/TemplateGallery.tsx app/editor-next/page.tsx` → exit 0

- [ ] **Step 6: Commit**

```bash
git add lib/constants/routes.ts landing-editor/components/TemplateGalleryCard.tsx landing-editor/components/TemplateGallery.tsx app/editor-next/page.tsx
git commit -m "feat(editor): 选模板即建库并跳 /editor-next/[id]"
```

---

### Task 9: 编辑器按 id 载入 + 元数据 context + 自动保存

**Files:**
- Create: `landing-editor/MetaContext.tsx`
- Create: `landing-editor/components/AutoSave.tsx`
- Modify: `landing-editor/Editor.tsx`
- Create: `app/editor-next/[id]/page.tsx`

- [ ] **Step 1: 元数据 context**

Create `landing-editor/MetaContext.tsx`:

```tsx
"use client";
import { createContext, useContext, useState, type ReactNode } from "react";

export type SaveState = "idle" | "saving" | "saved" | "error";

interface MetaValue {
  pageId: string;
  name: string;
  setName: (n: string) => void;
  saveState: SaveState;
  setSaveState: (s: SaveState) => void;
}

const MetaCtx = createContext<MetaValue | null>(null);

export function MetaProvider({
  pageId,
  initialName,
  children,
}: {
  pageId: string;
  initialName: string;
  children: ReactNode;
}) {
  const [name, setName] = useState(initialName);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  return (
    <MetaCtx.Provider value={{ pageId, name, setName, saveState, setSaveState }}>
      {children}
    </MetaCtx.Provider>
  );
}

export function useMeta(): MetaValue {
  const ctx = useContext(MetaCtx);
  if (!ctx) throw new Error("useMeta must be used within MetaProvider");
  return ctx;
}
```

- [ ] **Step 2: 自动保存组件**

Create `landing-editor/components/AutoSave.tsx`:

```tsx
"use client";
import { useEffect, useRef } from "react";
import { useEditorState, toDraft } from "../store/editorStore";
import { useMeta } from "../MetaContext";
import { apiLandingPagePath } from "@/lib/constants";

/** 监听编辑状态与页面名，防抖 1.5s 后 PUT 保存。挂在 EditorProvider+MetaProvider 内、无渲染。 */
export function AutoSave() {
  const state = useEditorState();
  const { pageId, name, setSaveState } = useMeta();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; } // 跳过初次挂载
    if (timer.current) clearTimeout(timer.current);
    setSaveState("saving");
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(apiLandingPagePath(pageId), {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, data: toDraft(state) }),
        });
        setSaveState(res.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    }, 1500);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [state, name, pageId, setSaveState]);

  return null;
}
```

- [ ] **Step 3: Editor 改为按 draft 载入 + 包 MetaProvider**

把 `landing-editor/Editor.tsx` 改为：

```tsx
"use client";
// landing-editor/Editor.tsx
import { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { LandingPageDraft } from "@/types/schema.draft";
import { EditorProvider } from "./store/editorStore";
import { fromDraft } from "./sampleDraft";
import { MetaProvider } from "./MetaContext";
import { EditorLayout } from "./components/EditorLayout";
import { AutoSave } from "./components/AutoSave";

export function Editor({
  pageId,
  initialName,
  initialDraft,
}: {
  pageId: string;
  initialName: string;
  initialDraft: LandingPageDraft;
}) {
  const [initial] = useState(() => fromDraft(initialDraft));
  return (
    <DndProvider backend={HTML5Backend}>
      <EditorProvider initial={initial}>
        <MetaProvider pageId={pageId} initialName={initialName}>
          <AutoSave />
          <EditorLayout />
        </MetaProvider>
      </EditorProvider>
    </DndProvider>
  );
}
```

> `createInitialState`/`getTemplate` 不再被 Editor 引用，但 `app/preview-next/page.tsx` 仍用样例，保留 `sampleDraft.ts`/registry 不动。

- [ ] **Step 4: 编辑器路由（服务端载入）**

Create `app/editor-next/[id]/page.tsx`:

```tsx
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { Editor } from "@/landing-editor/Editor";
import { getLandingPage } from "@/lib/landing-pages/store";

export default async function EditorByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const page = await getLandingPage(id, session.user.id);
  if (!page) notFound();

  return <Editor pageId={page.id} initialName={page.name} initialDraft={page.data} />;
}
```

- [ ] **Step 5: 门禁**

Run: `npx tsc --noEmit 2>&1 | grep -v "templates/template" | grep "error TS" || echo OK` → `OK`
Run: `npx eslint landing-editor/MetaContext.tsx landing-editor/components/AutoSave.tsx landing-editor/Editor.tsx "app/editor-next/[id]/page.tsx"` → exit 0

- [ ] **Step 6: 手测自动保存**

`pnpm dev`、登录、用 Task 3 冒烟得到的 id 打开 `/editor-next/<id>`，改任意文案，1.5s 后刷新页面应保留改动（已落库）。

- [ ] **Step 7: Commit**

```bash
git add landing-editor/MetaContext.tsx landing-editor/components/AutoSave.tsx landing-editor/Editor.tsx app/editor-next/[id]/page.tsx
git commit -m "feat(editor): 按 id 载入 draft 并防抖自动保存"
```

---

### Task 10: 编辑器顶栏（名称/保存态/预览/发布/返回）

**Files:**
- Create: `landing-editor/components/EditorToolbar.tsx`
- Modify: `landing-editor/components/EditorLayout.tsx`

- [ ] **Step 1: 顶栏组件**

Create `landing-editor/components/EditorToolbar.tsx`:

```tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { useMeta } from "../MetaContext";
import { ValidationBar } from "./ValidationBar";
import { PublishDialog } from "./PublishDialog";
import { landingPreviewPath, Routes } from "@/lib/constants";

const SAVE_LABEL: Record<string, string> = {
  idle: "", saving: "保存中…", saved: "已保存", error: "保存失败，重试",
};

export function EditorToolbar() {
  const { pageId, name, setName, saveState } = useMeta();
  const [publishOpen, setPublishOpen] = useState(false);

  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-edge bg-panel px-5 py-3">
      <Link href={Routes.LandingPages} className="text-sm text-ink-soft hover:text-ink">← 返回</Link>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-56 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-ink hover:border-edge focus:border-brand-500 focus:outline-none"
        placeholder="页面名称"
      />
      <span className={`text-xs ${saveState === "error" ? "text-red-500" : "text-ink-muted"}`}>
        {SAVE_LABEL[saveState]}
      </span>
      <div className="flex-1" />
      <ValidationBar />
      <Link
        href={landingPreviewPath(pageId)}
        target="_blank"
        className="rounded-md border border-edge px-3 py-1.5 text-sm text-ink-soft hover:bg-canvas"
      >
        预览
      </Link>
      <button
        onClick={() => setPublishOpen(true)}
        className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        发布
      </button>
      {publishOpen && <PublishDialog onClose={() => setPublishOpen(false)} />}
    </header>
  );
}
```

- [ ] **Step 2: 接入 Layout**

把 `landing-editor/components/EditorLayout.tsx` 顶部 `import { ValidationBar }...` 改为 `import { EditorToolbar } from "./EditorToolbar";`，并把整个 `<header>…</header>` 替换为 `<EditorToolbar />`。结果：

```tsx
"use client";
import { BlockList } from "./BlockList";
import { EditorDetail } from "./EditorDetail";
import { PreviewPane } from "./PreviewPane";
import { EditorToolbar } from "./EditorToolbar";

export function EditorLayout() {
  return (
    <div className="flex h-screen flex-col bg-canvas">
      <EditorToolbar />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 shrink-0 overflow-hidden border-r border-edge bg-panel">
          <BlockList />
        </aside>
        <main className="w-[420px] shrink-0 overflow-hidden border-r border-edge bg-panel">
          <EditorDetail />
        </main>
        <aside className="min-w-0 flex-1 overflow-hidden">
          <PreviewPane />
        </aside>
      </div>
    </div>
  );
}
```

> 注：`PublishDialog` 在 Task 12 创建。本任务先建一个最小占位以保证编译——见 Step 3。

- [ ] **Step 3: PublishDialog 最小占位（Task 12 完善）**

Create `landing-editor/components/PublishDialog.tsx`（占位，Task 12 替换为完整实现）:

```tsx
"use client";
export function PublishDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="rounded-xl bg-panel p-6 text-sm text-ink" onClick={(e) => e.stopPropagation()}>
        发布弹框（待 Task 12 实现）
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 门禁**

Run: `npx tsc --noEmit 2>&1 | grep -v "templates/template" | grep "error TS" || echo OK` → `OK`
Run: `npx eslint landing-editor/components/EditorToolbar.tsx landing-editor/components/EditorLayout.tsx landing-editor/components/PublishDialog.tsx` → exit 0

- [ ] **Step 5: Commit**

```bash
git add landing-editor/components/EditorToolbar.tsx landing-editor/components/EditorLayout.tsx landing-editor/components/PublishDialog.tsx
git commit -m "feat(editor): 顶栏（名称/保存态/预览/发布/返回）"
```

---

## Phase 4 — 预览与发布 UI

### Task 11: 全屏预览路由

**Files:**
- Create: `app/editor-next/[id]/preview/page.tsx`

- [ ] **Step 1: 写预览页（owner，app 域名）**

Create `app/editor-next/[id]/preview/page.tsx`:

```tsx
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { LandingPage } from "@/landing-renderer/LandingPage";
import { getLandingPage } from "@/lib/landing-pages/store";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const page = await getLandingPage(id, session.user.id);
  if (!page) notFound();

  return <LandingPage page={page.data} />;
}
```

- [ ] **Step 2: 门禁 + 手测**

Run: `npx tsc --noEmit 2>&1 | grep -v "templates/template" | grep "error TS" || echo OK` → `OK`
Run: `npx eslint "app/editor-next/[id]/preview/page.tsx"` → exit 0
手测：登录后访问 `/editor-next/<id>/preview` 整页渲染当前草稿。

- [ ] **Step 3: Commit**

```bash
git add app/editor-next/[id]/preview/page.tsx
git commit -m "feat(editor): 全屏预览路由"
```

---

### Task 12: 发布弹框（选域名 + 发布/取消发布）

**Files:**
- Modify: `landing-editor/components/PublishDialog.tsx`

- [ ] **Step 1: 完整发布弹框**

把 `landing-editor/components/PublishDialog.tsx` 替换为：

```tsx
"use client";
import { useEffect, useState } from "react";
import { useMeta } from "../MetaContext";
import { apiLandingPublishPath } from "@/lib/constants";

interface DomainRow {
  id: string;
  domain: string;
  enabled: boolean;
  verified: boolean;
}

export function PublishDialog({ onClose }: { onClose: () => void }) {
  const { pageId } = useMeta();
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [domainId, setDomainId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [liveUrl, setLiveUrl] = useState("");

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/domains");
      if (!res.ok) return;
      const all: DomainRow[] = await res.json();
      const usable = all.filter((d) => d.enabled && d.verified);
      setDomains(usable);
      if (usable[0]) setDomainId(usable[0].id);
    })();
  }, []);

  async function publish() {
    if (!domainId || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(apiLandingPublishPath(pageId), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domainId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(
          json.error === "validation_failed" ? "页面结构不完整，无法发布"
          : json.error === "domain_required" ? "请选择一个已验证的域名"
          : json.error === "domain_not_verified" ? "所选域名未验证"
          : "发布失败",
        );
        return;
      }
      setLiveUrl(`https://${json.domain}/`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="w-[420px] rounded-xl bg-panel p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-ink">发布到自有域名</h2>

        {liveUrl ? (
          <div className="mt-4 space-y-3 text-sm">
            <p className="text-ink-soft">已发布，对外链接：</p>
            <a href={liveUrl} target="_blank" className="block break-all text-brand-600 hover:underline">{liveUrl}</a>
            <button onClick={onClose} className="mt-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm text-white">完成</button>
          </div>
        ) : domains.length === 0 ? (
          <div className="mt-4 space-y-3 text-sm text-ink-soft">
            <p>你还没有已验证的自有域名。请先到「Domains」绑定并验证一个域名，再回来发布。</p>
            <a href="/domains" className="inline-block rounded-md border border-edge px-3 py-1.5 text-ink hover:bg-canvas">去绑定域名</a>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <label className="block text-sm text-ink-soft">选择域名</label>
            <select
              value={domainId}
              onChange={(e) => setDomainId(e.target.value)}
              className="w-full rounded-md border border-edge bg-canvas px-3 py-2 text-sm text-ink"
            >
              {domains.map((d) => (
                <option key={d.id} value={d.id}>{d.domain}</option>
              ))}
            </select>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className="rounded-md border border-edge px-3 py-1.5 text-sm text-ink-soft">取消</button>
              <button onClick={publish} disabled={busy} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
                {busy ? "发布中…" : "确认发布"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 门禁**

Run: `npx tsc --noEmit 2>&1 | grep -v "templates/template" | grep "error TS" || echo OK` → `OK`
Run: `npx eslint landing-editor/components/PublishDialog.tsx` → exit 0

- [ ] **Step 3: Commit**

```bash
git add landing-editor/components/PublishDialog.tsx
git commit -m "feat(editor): 发布弹框（选域名 + 发布）"
```

---

## Phase 5 — 仪表盘列表页与导航

### Task 13: 落地页列表/管理页 + 侧栏入口

**Files:**
- Create: `app/(dashboard)/landing-pages/page.tsx`
- Modify: `components/Sidebar.tsx`

- [ ] **Step 1: 列表页**

Create `app/(dashboard)/landing-pages/page.tsx`:

```tsx
"use client";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { landingEditorPath, apiLandingUnpublishPath, apiLandingPagePath } from "@/lib/constants";

interface PageRow {
  id: string;
  name: string;
  slug: string | null;
  status: "draft" | "published";
  updated_at: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function LandingPagesPage() {
  const router = useRouter();
  const { data, mutate, isLoading } = useSWR<PageRow[]>("/api/landing-pages", fetcher);

  async function unpublish(id: string) {
    await fetch(apiLandingUnpublishPath(id), { method: "POST" });
    void mutate();
  }
  async function remove(id: string) {
    if (!confirm("确定删除该落地页？")) return;
    await fetch(apiLandingPagePath(id), { method: "DELETE" });
    void mutate();
  }

  return (
    <div className="flex-1 p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">落地页</h1>
        <Link href="/editor-next" className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700">
          + 新建
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400">加载中…</p>
      ) : !data || data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <p className="text-slate-500">还没有落地页</p>
          <Link href="/editor-next" className="mt-3 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">从模板新建</Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => (
            <li key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="truncate font-medium text-slate-800">{p.name}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs ${p.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {p.status === "published" ? "已发布" : "草稿"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">更新于 {new Date(p.updated_at).toLocaleString()}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <button onClick={() => router.push(landingEditorPath(p.id))} className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50">编辑</button>
                {p.status === "published" && (
                  <button onClick={() => unpublish(p.id)} className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50">取消发布</button>
                )}
                <button onClick={() => remove(p.id)} className="rounded-md border border-red-200 px-3 py-1.5 text-red-600 hover:bg-red-50">删除</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 侧栏导航项**

在 `components/Sidebar.tsx` 的 `navItems` 数组中，`{ icon: Globe, label: "Sites", href: "/sites" },` 之后插入一行：

```ts
  { icon: FileText, label: "落地页", href: "/landing-pages" },
```
（`FileText` 已在该文件 import 列表中，无需新增 import。）

- [ ] **Step 3: 门禁**

Run: `npx tsc --noEmit 2>&1 | grep -v "templates/template" | grep "error TS" || echo OK` → `OK`
Run: `npx eslint "app/(dashboard)/landing-pages/page.tsx" components/Sidebar.tsx` → exit 0

- [ ] **Step 4: 手测**

`pnpm dev`、登录，侧栏点「落地页」→ 列表显示；「新建」→ 选模板 → 进编辑器；返回列表见草稿。

- [ ] **Step 5: Commit**

```bash
git add app/(dashboard)/landing-pages/page.tsx components/Sidebar.tsx
git commit -m "feat(dashboard): 落地页列表/管理页 + 侧栏入口"
```

---

## Phase 6 — 端到端验证

### Task 14: Playwright e2e happy-path

**Files:**
- Create: `e2e/landing-pages-flow.spec.ts`
- Read first: `e2e/helpers/global-setup.ts`、`e2e/editor-next-preview.spec.ts`、`e2e/blocks.spec.ts`（了解登录态注入与 pg fixture 约定）

- [ ] **Step 1: 阅读现有 e2e 约定**

Run: `sed -n '1,80p' e2e/helpers/global-setup.ts; echo '---'; sed -n '1,60p' e2e/blocks.spec.ts`
目的：确认如何注入登录态/用户、如何用 pg 直插 fixture（带 `e2e-` 前缀、跑完清理），以及如何直插一个 `verified+enabled` 的域名指向落地页（绕过 Vercel）。

- [ ] **Step 2: 写 e2e**

Create `e2e/landing-pages-flow.spec.ts`，覆盖（按现有 helper 风格落地）：

```ts
import { test, expect } from "@playwright/test";
// 复用现有 helpers：登录态注入 + pg fixture（参照 blocks.spec.ts / global-setup.ts）。
// 步骤：
// 1) 注入测试用户登录态，POST /api/landing-pages {templateId:'skincare'} 建页，拿 id。
// 2) PUT 改 name/data，GET 校验已落库（自动保存路径）。
// 3) 访问 /editor-next/<id>/preview，断言渲染含 hero 文案。
// 4) 用 pg 直插一条 domains 行（domain='e2e-acme.test', enabled+verified, landing_page_id 暂空）。
// 5) POST /api/landing-pages/<id>/publish {domainId}，断言 200、status=published、返回 domain。
// 6) 以 host=e2e-acme.test 请求根路径，断言经 handleTenancy 重写、渲染含 hero 文案。
// 7) POST /api/landing-pages/<id>/unpublish，断言该 host 根路径返回 404。
// 8) teardown：删除 e2e- 前缀的 landing_pages / domains 行（或依赖 global-teardown）。

test("landing page happy path: create → edit → preview → publish(domain) → unpublish", async ({ page, request }) => {
  // 依据 Step 1 读到的 helper 具体落地；此处为结构占位，实现时填入真实 helper 调用与断言。
  expect(true).toBe(true);
});
```

> 实现要求：本任务**必须**把上述 8 步用真实 helper 调用与断言写实（不得保留占位 `expect(true)`）。host 改写可用 `request.get('http://localhost:3001/p/<slug>')` 或带 `Host` header 的请求来模拟自定义域名命中 `handleTenancy`。

- [ ] **Step 3: 跑 e2e**

Run: `pnpm test:e2e e2e/landing-pages-flow.spec.ts`
Expected: 1 passed。

- [ ] **Step 4: 全量门禁**

Run: `npx tsc --noEmit 2>&1 | grep -v "templates/template" | grep "error TS" || echo OK` → `OK`
Run: `npx eslint .` → 0 errors（既有 warning 不计）

- [ ] **Step 5: Commit**

```bash
git add e2e/landing-pages-flow.spec.ts
git commit -m "test(e2e): 落地页全链路 happy-path"
```

---

## Self-Review（写计划后自检结论）

- **Spec 覆盖**：§5 数据模型→T1；§7 API + §3.5 域名→T2/T3/T4；§8 门禁→T5；§9 多租户/渲染→T6/T7；§4③选模板→T8；§4④编辑+自动保存→T9；编辑器顶栏（§4④/⑤/⑥触点）→T10；§4⑤全屏预览→T11；§4⑥发布弹框→T12；§2/§3 列表与侧栏入口→T13；§13 测试→T14。§0 三端 / 官网建设 / super-admin 新模板治理为 Non-Goals，无需任务。
- **类型一致**：`LandingPageRow`、`LandingPageDraft`、`apiLanding*Path`、`getLandingPage`/`getPublishedBySlug`/`bindDomainToLandingPage`/`getLandingSlugByCustomDomain`、`useMeta`/`MetaProvider`、`Editor({pageId,initialName,initialDraft})` 在定义与调用处一致。
- **占位说明**：T10 的 `PublishDialog` 为**有意的最小占位**，T12 同文件完整替换（已在两处显式标注）；T14 的 e2e 骨架**要求实现时写实**（已显式禁止保留 `expect(true)`）。其余步骤均为完整代码。
- **已知基线**：`templates/template/**` 的 `prefilledMessage` 类型错误为既有、与本计划无关，门禁命令已用 `grep -v "templates/template"` 排除。
