# Custom Domain 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 允许用户为站点绑定自定义域名，proxy.ts 根据 Host header 路由到对应站点。

**Architecture:** 新建 `domains` 表存储绑定关系（支持多域名、独立启用状态）；`lib/vercel.ts` 封装 Vercel Domain API；`proxy.ts` 在鉴权前检测自定义域名并 rewrite；`/domains` 页面统一管理，SiteCard 提供快捷入口。

**Tech Stack:** Next.js App Router (proxy.ts / nodejs runtime), PostgreSQL (pg), Vercel Domain API (fetch), React (shadcn/ui), TypeScript

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `lib/migrations/004_add_domains_table.sql` | 新建 | domains 表 DDL |
| `lib/vercel.ts` | 新建 | Vercel Domain API 封装 |
| `lib/domains-db.ts` | 新建 | domains 表 DB 查询 |
| `lib/constants/errors.ts` | 修改 | 新增 INVALID_DOMAIN / DOMAIN_TAKEN / VERCEL_API_ERROR |
| `lib/constants/routes.ts` | 修改 | 新增 Domains 路由常量 |
| `app/api/domains/route.ts` | 新建 | GET 列表 / POST 添加 |
| `app/api/domains/[id]/route.ts` | 新建 | PATCH 启用停用 / DELETE 删除 |
| `app/api/domains/[id]/status/route.ts` | 新建 | GET 验证状态 |
| `proxy.ts` | 修改 | 自定义域名路由（nodejs runtime） |
| `components/domains/AddDomainDialog.tsx` | 新建 | 添加域名 Dialog（含 DNS 指引） |
| `app/(dashboard)/domains/page.tsx` | 新建 | /domains 管理页 |
| `components/Sidebar.tsx` | 修改 | 新增「域名」菜单项 |
| `components/sites/SiteCard.tsx` | 修改 | 新增「绑定域名」快捷入口 |

---

## Task 1：DB Migration

**Files:**
- Create: `lib/migrations/004_add_domains_table.sql`

- [ ] **Step 1: 创建迁移文件**

```sql
-- lib/migrations/004_add_domains_table.sql
CREATE TABLE IF NOT EXISTS domains (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_id    TEXT REFERENCES sites(id) ON DELETE SET NULL,
  domain     TEXT NOT NULL UNIQUE,
  enabled    BOOLEAN NOT NULL DEFAULT false,
  verified   BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_lookup ON domains(domain) WHERE enabled = true AND verified = true;
```

- [ ] **Step 2: 在数据库执行迁移**

```bash
psql $DATABASE_URL -f lib/migrations/004_add_domains_table.sql
```

Expected: `CREATE TABLE`, `CREATE INDEX`, `CREATE INDEX`

- [ ] **Step 3: Commit**

```bash
git add lib/migrations/004_add_domains_table.sql
git commit -m "feat(domains): 添加 domains 表迁移"
```

---

## Task 2：常量更新

**Files:**
- Modify: `lib/constants/errors.ts`
- Modify: `lib/constants/routes.ts`

- [ ] **Step 1: 更新 errors.ts**

将文件内容替换为：

```typescript
export const ApiErrors = {
  UNAUTHORIZED: 'Unauthorized',
  NOT_FOUND: 'Not found',
  SLUG_TAKEN: 'slug_taken',
  SITE_NAME_EXISTS: 'Site name already exists.',
  EMAIL_IN_USE: 'Email already in use.',
  FIELDS_REQUIRED: 'All fields are required.',
  QUOTA_EXCEEDED: 'quota_exceeded',
  INVALID_DOMAIN: 'invalid_domain',
  DOMAIN_TAKEN: 'domain_taken',
  VERCEL_API_ERROR: 'vercel_api_error',
} as const;
```

- [ ] **Step 2: 更新 routes.ts**

```typescript
export enum Routes {
  Home = '/',
  Login = '/login',
  Register = '/register',
  Sites = '/sites',
  Domains = '/domains',
  Billing = '/billing',
  Pricing = '/pricing',
}

export enum ApiRoutes {
  Sites = '/api/sites',
  Domains = '/api/domains',
  Register = '/api/register',
}

export const siteEditorPath = (id: string) => `/editor/${id}`;
export const sitePath = (slug: string) => `/site/${slug}`;
export const apiSitePath = (id: string) => `/api/sites/${id}`;
export const apiDomainPath = (id: string) => `/api/domains/${id}`;
export const apiDomainStatusPath = (id: string) => `/api/domains/${id}/status`;
```

- [ ] **Step 3: Commit**

```bash
git add lib/constants/errors.ts lib/constants/routes.ts
git commit -m "feat(domains): 新增域名相关常量"
```

---

## Task 3：Vercel API 封装

**Files:**
- Create: `lib/vercel.ts`

- [ ] **Step 1: 创建 lib/vercel.ts**

```typescript
// lib/vercel.ts
const BASE = "https://api.vercel.com";

function teamQuery() {
  const teamId = process.env.VERCEL_TEAM_ID;
  return teamId ? `?teamId=${teamId}` : "";
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

const projectId = () => process.env.VERCEL_PROJECT_ID!;

export interface DomainConfig {
  cname: string;
  verified: boolean;
}

export async function addDomainToProject(domain: string): Promise<DomainConfig> {
  const res = await fetch(
    `${BASE}/v10/projects/${projectId()}/domains${teamQuery()}`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ name: domain }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? "Vercel API error");
  }
  const data = await res.json();
  return {
    cname: "cname.vercel-dns.com",
    verified: data.verified ?? false,
  };
}

export async function getDomainVerification(domain: string): Promise<"pending" | "verified" | "error"> {
  const res = await fetch(
    `${BASE}/v10/projects/${projectId()}/domains/${domain}${teamQuery()}`,
    { headers: headers() }
  );
  if (!res.ok) return "error";
  const data = await res.json();
  if (data.verified) return "verified";
  return "pending";
}

export async function removeDomainFromProject(domain: string): Promise<void> {
  await fetch(
    `${BASE}/v9/projects/${projectId()}/domains/${domain}${teamQuery()}`,
    { method: "DELETE", headers: headers() }
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/vercel.ts
git commit -m "feat(domains): 封装 Vercel Domain API"
```

---

## Task 4：domains-db.ts

**Files:**
- Create: `lib/domains-db.ts`

- [ ] **Step 1: 创建 lib/domains-db.ts**

```typescript
// lib/domains-db.ts
import pool from "@/lib/db";
import type { PlanId } from "@/lib/plans";

export interface DomainRow {
  id: string;
  user_id: string;
  site_id: string | null;
  domain: string;
  enabled: boolean;
  verified: boolean;
  created_at: string;
  site_name?: string;
}

export async function getUserDomains(userId: string): Promise<DomainRow[]> {
  const result = await pool.query(
    `SELECT d.*, s.name AS site_name
     FROM domains d
     LEFT JOIN sites s ON s.id = d.site_id
     WHERE d.user_id = $1
     ORDER BY d.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function getEnabledDomainCount(userId: string): Promise<number> {
  const result = await pool.query(
    "SELECT COUNT(*) FROM domains WHERE user_id = $1 AND enabled = true",
    [userId]
  );
  return Number(result.rows[0].count);
}

export async function getDomainById(id: string, userId: string): Promise<DomainRow | null> {
  const result = await pool.query(
    "SELECT * FROM domains WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
  return result.rows[0] ?? null;
}

export async function getDomainByName(domain: string): Promise<DomainRow | null> {
  const result = await pool.query(
    "SELECT * FROM domains WHERE domain = $1",
    [domain]
  );
  return result.rows[0] ?? null;
}

export async function insertDomain(params: {
  id: string;
  userId: string;
  siteId: string;
  domain: string;
}): Promise<DomainRow> {
  const result = await pool.query(
    `INSERT INTO domains (id, user_id, site_id, domain)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [params.id, params.userId, params.siteId, params.domain]
  );
  return result.rows[0];
}

export async function updateDomain(
  id: string,
  userId: string,
  fields: Partial<{ enabled: boolean; verified: boolean; site_id: string }>
): Promise<DomainRow | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (fields.enabled !== undefined) {
    setClauses.push(`enabled = $${idx++}`);
    values.push(fields.enabled);
  }
  if (fields.verified !== undefined) {
    setClauses.push(`verified = $${idx++}`);
    values.push(fields.verified);
  }
  if (fields.site_id !== undefined) {
    setClauses.push(`site_id = $${idx++}`);
    values.push(fields.site_id);
  }

  if (setClauses.length === 0) return null;

  values.push(id, userId);
  const result = await pool.query(
    `UPDATE domains SET ${setClauses.join(", ")} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}

export async function deleteDomainById(id: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    "DELETE FROM domains WHERE id = $1 AND user_id = $2 RETURNING id",
    [id, userId]
  );
  return result.rows.length > 0;
}

export async function getSlugByCustomDomain(domain: string): Promise<string | null> {
  const result = await pool.query(
    `SELECT s.slug FROM domains d
     JOIN sites s ON s.id = d.site_id
     WHERE d.domain = $1 AND d.enabled = true AND d.verified = true
       AND s.status = 'published'`,
    [domain]
  );
  return result.rows[0]?.slug ?? null;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/domains-db.ts
git commit -m "feat(domains): 添加 domains 表 DB 查询层"
```

---

## Task 5：API GET / POST /api/domains

**Files:**
- Create: `app/api/domains/route.ts`

- [ ] **Step 1: 创建 app/api/domains/route.ts**

```typescript
// app/api/domains/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { nanoid } from "nanoid";
import { ApiErrors } from "@/lib/constants";
import { getUserPlan } from "@/lib/plans-db";
import { PLANS } from "@/lib/plans";
import {
  getUserDomains,
  getDomainByName,
  insertDomain,
} from "@/lib/domains-db";
import { addDomainToProject } from "@/lib/vercel";

const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  const domains = await getUserDomains(session.user.id);
  return NextResponse.json(domains);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const { domain, siteId } = await request.json();

  if (!domain || !siteId || !DOMAIN_RE.test(domain)) {
    return NextResponse.json({ error: ApiErrors.INVALID_DOMAIN }, { status: 400 });
  }

  const existing = await getDomainByName(domain);
  if (existing) {
    return NextResponse.json({ error: ApiErrors.DOMAIN_TAKEN }, { status: 409 });
  }

  let vercelConfig;
  try {
    vercelConfig = await addDomainToProject(domain);
  } catch {
    return NextResponse.json({ error: ApiErrors.VERCEL_API_ERROR }, { status: 502 });
  }

  const row = await insertDomain({
    id: nanoid(),
    userId: session.user.id,
    siteId,
    domain,
  });

  // If Vercel already considers it verified (e.g. re-adding), update immediately
  if (vercelConfig.verified) {
    const { updateDomain } = await import("@/lib/domains-db");
    await updateDomain(row.id, session.user.id, { verified: true });
    row.verified = true;
  }

  return NextResponse.json({ ...row, cname: vercelConfig.cname }, { status: 201 });
}
```

- [ ] **Step 2: 安装 nanoid（如未安装）**

```bash
npm list nanoid || npm install nanoid
```

- [ ] **Step 3: Commit**

```bash
git add app/api/domains/route.ts
git commit -m "feat(domains): 添加 GET/POST /api/domains 路由"
```

---

## Task 6：API PATCH / DELETE /api/domains/[id]

**Files:**
- Create: `app/api/domains/[id]/route.ts`

- [ ] **Step 1: 创建 app/api/domains/[id]/route.ts**

```typescript
// app/api/domains/[id]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getUserPlan } from "@/lib/plans-db";
import { PLANS } from "@/lib/plans";
import {
  getDomainById,
  updateDomain,
  deleteDomainById,
  getEnabledDomainCount,
} from "@/lib/domains-db";
import { removeDomainFromProject } from "@/lib/vercel";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/domains/[id]">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json();
  const { enabled, site_id } = body as { enabled?: boolean; site_id?: string };

  const existing = await getDomainById(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  }

  if (enabled === true && !existing.enabled) {
    const [plan, count] = await Promise.all([
      getUserPlan(session.user.id),
      getEnabledDomainCount(session.user.id),
    ]);
    const limit = PLANS[plan].domainsLimit;
    if (limit !== Infinity && count >= limit) {
      return NextResponse.json({ error: ApiErrors.QUOTA_EXCEEDED }, { status: 403 });
    }
  }

  const updated = await updateDomain(id, session.user.id, {
    ...(enabled !== undefined && { enabled }),
    ...(site_id !== undefined && { site_id }),
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/domains/[id]">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const { id } = await ctx.params;
  const existing = await getDomainById(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  }

  await removeDomainFromProject(existing.domain).catch(() => {/* best-effort */});
  await deleteDomainById(id, session.user.id);

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/domains/[id]/route.ts
git commit -m "feat(domains): 添加 PATCH/DELETE /api/domains/[id] 路由"
```

---

## Task 7：API GET /api/domains/[id]/status

**Files:**
- Create: `app/api/domains/[id]/status/route.ts`

- [ ] **Step 1: 创建 app/api/domains/[id]/status/route.ts**

```typescript
// app/api/domains/[id]/status/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getDomainById, updateDomain } from "@/lib/domains-db";
import { getDomainVerification } from "@/lib/vercel";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/domains/[id]/status">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const { id } = await ctx.params;
  const row = await getDomainById(id, session.user.id);
  if (!row) {
    return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  }

  // Already verified — no need to call Vercel again
  if (row.verified) {
    return NextResponse.json({ status: "verified" });
  }

  const vercelStatus = await getDomainVerification(row.domain);

  if (vercelStatus === "verified") {
    await updateDomain(id, session.user.id, { verified: true });
  }

  return NextResponse.json({ status: vercelStatus });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/domains/[id]/status/route.ts
git commit -m "feat(domains): 添加 GET /api/domains/[id]/status 路由"
```

---

## Task 8：proxy.ts 改造

**Files:**
- Modify: `proxy.ts`

- [ ] **Step 1: 更新 proxy.ts**

将整个文件替换为：

```typescript
// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSlugByCustomDomain } from "@/lib/domains-db";

export const runtime = "nodejs";

const PUBLIC_PATHS = ["/login", "/register", "/api/auth", "/api/register"];

const appHostname = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : null;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0];

  // Custom domain: not our own app domain
  if (appHostname && hostname !== appHostname && !hostname.endsWith(`.${appHostname}`)) {
    const slug = await getSlugByCustomDomain(hostname);
    if (slug) {
      return NextResponse.rewrite(new URL(`/site/${slug}`, request.url));
    }
    return new NextResponse("Not Found", { status: 404 });
  }

  // Normal app: existing auth logic
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const token =
    request.cookies.get("authjs.session-token") ??
    request.cookies.get("__Secure-authjs.session-token");

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 2: 确认 NEXT_PUBLIC_APP_URL 已在 .env 中设置**

```bash
grep NEXT_PUBLIC_APP_URL .env .env.local 2>/dev/null || echo "需要添加 NEXT_PUBLIC_APP_URL=https://yourdomain.com"
```

- [ ] **Step 3: Commit**

```bash
git add proxy.ts
git commit -m "feat(domains): proxy.ts 支持自定义域名路由"
```

---

## Task 9：AddDomainDialog 组件

**Files:**
- Create: `components/domains/AddDomainDialog.tsx`

- [ ] **Step 1: 创建 components/domains/AddDomainDialog.tsx**

```tsx
// components/domains/AddDomainDialog.tsx
"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiRoutes } from "@/lib/constants";

interface Site {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sites: Site[];
  onAdded: () => void;
}

export function AddDomainDialog({ open, onOpenChange, sites, onAdded }: Props) {
  const [domain, setDomain] = useState("");
  const [siteId, setSiteId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cname, setCname] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setDomain("");
    setSiteId("");
    setError("");
    setCname(null);
    setCopied(false);
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(ApiRoutes.Domains, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, siteId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(
          json.error === "invalid_domain" ? "域名格式不正确" :
          json.error === "domain_taken" ? "该域名已被其他账号绑定" :
          json.error === "vercel_api_error" ? "Vercel API 调用失败，请稍后重试" :
          "添加失败，请重试"
        );
        return;
      }
      setCname(json.cname);
      onAdded();
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!cname) return;
    navigator.clipboard.writeText(cname);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>添加自定义域名</DialogTitle>
          <DialogDescription>
            绑定你自己的域名，用户访问时地址栏显示你的品牌域名。
          </DialogDescription>
        </DialogHeader>

        {!cname ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>域名</Label>
              <Input
                placeholder="example.com 或 www.example.com"
                value={domain}
                onChange={e => setDomain(e.target.value.trim().toLowerCase())}
              />
            </div>
            <div className="space-y-1.5">
              <Label>绑定到站点</Label>
              <Select value={siteId} onValueChange={setSiteId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择站点…" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              className="w-full"
              disabled={!domain || !siteId || loading}
              onClick={handleSubmit}
            >
              {loading ? "添加中…" : "添加域名"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              域名已添加。请前往你的 DNS 服务商（Cloudflare）添加以下 CNAME 记录，Vercel 将在 DNS 生效后自动签发 SSL 证书。
            </p>
            <div className="rounded-lg border bg-slate-50 p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">类型</p>
                <p className="text-sm font-mono">CNAME</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">名称</p>
                <p className="text-sm font-mono">{domain.startsWith("www.") ? "www" : domain}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">值</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono flex-1">{cname}</p>
                  <button onClick={handleCopy} className="text-slate-400 hover:text-slate-600">
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              ⚠️ 如使用 Cloudflare，顶级域名（如 example.com）请将代理状态设为「仅 DNS」（灰色云朵），子域名（如 www.example.com）则无此限制。
            </p>
            <Button className="w-full" onClick={() => { reset(); onOpenChange(false); }}>
              完成
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/domains/AddDomainDialog.tsx
git commit -m "feat(domains): 添加 AddDomainDialog 组件"
```

---

## Task 10：/domains 管理页

**Files:**
- Create: `app/(dashboard)/domains/page.tsx`

- [ ] **Step 1: 创建 app/(dashboard)/domains/page.tsx**

```tsx
// app/(dashboard)/domains/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Plus, Globe, Trash2, ToggleLeft, ToggleRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddDomainDialog } from "@/components/domains/AddDomainDialog";
import { UpgradeDialog } from "@/components/billing/UpgradeDialog";
import { ApiRoutes, apiDomainPath, apiDomainStatusPath } from "@/lib/constants";
import { PLANS } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

interface Domain {
  id: string;
  domain: string;
  site_id: string | null;
  site_name?: string;
  enabled: boolean;
  verified: boolean;
  created_at: string;
}

interface Site {
  id: string;
  name: string;
}

export default function DomainsPage() {
  const { data: session } = useSession();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [polling, setPolling] = useState<Set<string>>(new Set());

  const currentPlan = (session?.user?.plan ?? "free") as PlanId;
  const domainsLimit = PLANS[currentPlan].domainsLimit;
  const enabledCount = domains.filter(d => d.enabled).length;

  const loadDomains = useCallback(async () => {
    const res = await fetch(ApiRoutes.Domains);
    if (res.ok) setDomains(await res.json());
  }, []);

  const loadSites = useCallback(async () => {
    const res = await fetch(ApiRoutes.Sites);
    if (res.ok) setSites(await res.json());
  }, []);

  useEffect(() => {
    void loadDomains();
    void loadSites();
  }, [loadDomains, loadSites]);

  // Poll verification for unverified domains
  useEffect(() => {
    const unverified = domains.filter(d => !d.verified);
    if (unverified.length === 0) return;

    const timers = unverified.map(d => {
      return setInterval(async () => {
        const res = await fetch(apiDomainStatusPath(d.id));
        if (!res.ok) return;
        const { status } = await res.json();
        if (status === "verified") {
          setDomains(prev => prev.map(x => x.id === d.id ? { ...x, verified: true } : x));
        }
      }, 5000);
    });

    return () => timers.forEach(clearInterval);
  }, [domains]);

  async function handleToggleEnabled(domain: Domain) {
    if (!domain.enabled) {
      if (domainsLimit !== Infinity && enabledCount >= domainsLimit) {
        setUpgradeOpen(true);
        return;
      }
    }
    const res = await fetch(apiDomainPath(domain.id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !domain.enabled }),
    });
    if (res.ok) {
      setDomains(prev => prev.map(d => d.id === domain.id ? { ...d, enabled: !d.enabled } : d));
    }
  }

  async function handleDelete(domain: Domain) {
    const res = await fetch(apiDomainPath(domain.id), { method: "DELETE" });
    if (res.ok) setDomains(prev => prev.filter(d => d.id !== domain.id));
  }

  async function handleCheckStatus(domain: Domain) {
    setPolling(prev => new Set(prev).add(domain.id));
    const res = await fetch(apiDomainStatusPath(domain.id));
    if (res.ok) {
      const { status } = await res.json();
      if (status === "verified") {
        setDomains(prev => prev.map(d => d.id === domain.id ? { ...d, verified: true } : d));
      }
    }
    setPolling(prev => { const s = new Set(prev); s.delete(domain.id); return s; });
  }

  return (
    <main className="flex flex-col w-full">
      <header className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-slate-800 text-2xl">域名</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            已启用 {enabledCount}{domainsLimit === Infinity ? "" : `/${domainsLimit}`} 个域名
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} className="rounded-full gap-1.5">
          <Plus className="w-4 h-4" />
          添加域名
        </Button>
      </header>

      <div className="px-6 pb-6">
        {domains.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Globe className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-slate-500">还没有绑定任何域名</p>
            <p className="text-sm text-muted-foreground mt-1">点击「添加域名」开始绑定你的品牌域名</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-white/80 divide-y">
            {domains.map(domain => (
              <div key={domain.id} className="flex items-center gap-4 px-4 py-3">
                <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 truncate">{domain.domain}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {domain.site_name ?? "未绑定站点"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {domain.verified ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">已验证</Badge>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs">待验证</Badge>
                      <button
                        onClick={() => handleCheckStatus(domain)}
                        className="text-slate-400 hover:text-slate-600"
                        title="刷新验证状态"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${polling.has(domain.id) ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => handleToggleEnabled(domain)}
                    className="text-slate-400 hover:text-slate-600"
                    title={domain.enabled ? "停用" : "启用"}
                  >
                    {domain.enabled
                      ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                      : <ToggleLeft className="w-5 h-5" />
                    }
                  </button>
                  <button
                    onClick={() => handleDelete(domain)}
                    className="text-slate-400 hover:text-destructive"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddDomainDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        sites={sites}
        onAdded={loadDomains}
      />
      <UpgradeDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        currentPlan={currentPlan}
      />
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(dashboard)/domains/page.tsx
git commit -m "feat(domains): 添加 /domains 管理页"
```

---

## Task 11：Sidebar + SiteCard 更新

**Files:**
- Modify: `components/Sidebar.tsx`
- Modify: `components/sites/SiteCard.tsx`

- [ ] **Step 1: 更新 Sidebar.tsx — 在 navItems 中 Sites 之后插入 Domains**

找到：
```typescript
const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Globe, label: "Sites", href: "/sites" },
```

替换为：
```typescript
import { LinkIcon } from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Globe, label: "Sites", href: "/sites" },
  { icon: LinkIcon, label: "Domains", href: "/domains" },
```

- [ ] **Step 2: 更新 SiteCard.tsx — 在底部日期行后新增域名快捷入口**

找到：
```typescript
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>更新于 {formatDate(site.updatedAt)}</span>
        </div>
```

替换为：
```typescript
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>更新于 {formatDate(site.updatedAt)}</span>
          <button
            onClick={e => { e.stopPropagation(); router.push(`/domains?siteId=${site.id}`); }}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Globe className="w-3 h-3" />
            <span>绑定域名</span>
          </button>
        </div>
```

- [ ] **Step 3: Commit**

```bash
git add components/Sidebar.tsx components/sites/SiteCard.tsx
git commit -m "feat(domains): Sidebar 新增域名入口，SiteCard 新增快捷绑定按钮"
```

---

## 自检

**Spec 覆盖：**
- ✅ domains 表（Task 1）
- ✅ Vercel API 封装（Task 3）
- ✅ 添加/启用/停用/删除/验证状态 API（Task 5-7）
- ✅ proxy.ts 自定义域名路由（Task 8）
- ✅ AddDomainDialog 含 DNS 指引（Task 9）
- ✅ /domains 管理页（Task 10）
- ✅ Sidebar 入口 + SiteCard 快捷入口（Task 11）
- ✅ 配额：启用时校验 enabled count（Task 6）
- ✅ 添加无配额限制（Task 5）
- ✅ Cloudflare 使用说明（Task 9）

**类型一致性：**
- `DomainRow` 定义于 domains-db.ts，API 路由和页面均使用相同字段名
- `apiDomainPath` / `apiDomainStatusPath` 在 routes.ts 定义，页面引用正确

**遗漏：**
- `NEXT_PUBLIC_APP_URL` 环境变量需在部署前确认设置
- `VERCEL_API_TOKEN` / `VERCEL_PROJECT_ID` 需在 Vercel 项目环境变量中配置
