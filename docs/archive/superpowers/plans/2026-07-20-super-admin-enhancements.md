# Super Admin 端完善与 Admin 遗留清理 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 super-admin 端补齐用户运营（赠送套餐、角色调整、禁用账号、详情抽屉）与数据看板（线索总量、套餐分布、30 天趋势），并清理 admin 端两处遗留（恢复为线上版本、UpgradeDialog 死代码）。

**Architecture:** 数据层加 `users.comp_plan / disabled_at / created_at` 三列（migration 021）；生效套餐 = max(plan, comp_plan)，收敛在 `lib/plans.ts#effectivePlan` + `lib/plans-db.ts` 既有三个读取函数 + `auth.ts` JWT 注入，webhook/billing 不动。禁用账号复用现有 session_stale 失效机制（`getUserPlanOrNull` 对禁用用户返回 null）+ 登录侧拦截 + 公网渲染 404。super-admin UI 全部用 antd 成熟组件（**禁止 shadcn**），图表用 recharts。

**Tech Stack:** Next.js App Router、node-pg-migrate、antd v5、recharts 2.15、vitest、NextAuth v5 (JWT)。

**对应 Spec:** `docs/superpowers/specs/2026-07-20-super-admin-enhancements-design.md`

**交付节奏:** 4 个 PR，严格按序（B 依赖 A，C/D 依赖 A/B 合入后的 main）。每个 PR 开工前按全局 Git 铁律建分支：

```bash
git checkout main && git pull --ff-only && test "$(git rev-parse main)" = "$(git rev-parse origin/main)" && git checkout -b <分支名>
```

分支名：
- PR-A：`feat_20260720_赠送套餐与生效套餐`
- PR-B：`feat_20260720_禁用账号与超管用户运营`
- PR-C：`feat_20260720_超管数据看板增强`
- PR-D：`fix_20260720_恢复线上版本与死代码清理`

每个任务完成后跑 `pnpm test`（vitest 全量，当前 302 绿为基线）；每个 PR 收尾跑 `pnpm lint && npx tsc --noEmit && pnpm build`。迁移只对本地 dev 库（zapbridge）执行 `pnpm migrate:up`，遵循 `docs/dev-database-migration-workflow.md`。

---

## PR-A：migration 021 + effectivePlan + 读取点改造

### Task A1: migration 021

**Files:**
- Create: `migrations/021_add_comp_plan_disabled.js`

- [ ] **Step 1: 写迁移文件**

```js
/** @type {import('node-pg-migrate').MigrationBuilder} */
// comp_plan：超管赠送套餐，仅超管接口写入，LS webhook / billing 永不触碰；
// 生效套餐 = max(plan, comp_plan)，读取点见 lib/plans-db.ts / auth.ts。
// disabled_at：非空即禁用（禁登录 + 已发布页公网 404）。
// created_at：users 表此前无注册时间列（invited_at 可空），补列供看板趋势；
// 存量行回填为迁移时刻，趋势图对存量用户不精确，可接受。
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS comp_plan TEXT NULL
      CHECK (comp_plan IN ('starter', 'pro', 'agency'));
    ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE users DROP COLUMN IF EXISTS comp_plan;
    ALTER TABLE users DROP COLUMN IF EXISTS disabled_at;
    ALTER TABLE users DROP COLUMN IF EXISTS created_at;
  `);
};
```

- [ ] **Step 2: 本地执行迁移并验证**

Run: `pnpm migrate:up`
Expected: 输出包含 `021_add_comp_plan_disabled`，无报错。
Run: `psql "$DATABASE_URL_UNPOOLED" -c "\d users" | grep -E 'comp_plan|disabled_at|created_at'`（或用 psql 连 dev 库确认三列存在）

- [ ] **Step 3: Commit**

```bash
git add migrations/021_add_comp_plan_disabled.js
git commit -m "feat: users表新增赠送套餐/禁用/注册时间三列(迁移021)"
```

### Task A2: effectivePlan 纯函数（TDD）

**Files:**
- Create: `lib/plans.effectivePlan.test.ts`
- Modify: `lib/plans.ts`（文件末尾追加）

- [ ] **Step 1: 写失败测试**

```ts
import { describe, it, expect } from "vitest";
import { effectivePlan } from "@/lib/plans";

describe("effectivePlan（生效套餐 = max(plan, comp_plan)）", () => {
  it("无赠送时返回付费套餐", () => {
    expect(effectivePlan("free", null)).toBe("free");
    expect(effectivePlan("pro", null)).toBe("pro");
    expect(effectivePlan("pro", undefined)).toBe("pro");
  });
  it("赠送高于付费时取赠送档", () => {
    expect(effectivePlan("free", "pro")).toBe("pro");
    expect(effectivePlan("starter", "agency")).toBe("agency");
  });
  it("付费高于或等于赠送时取付费档（LS 覆写 plan 不影响赠送语义）", () => {
    expect(effectivePlan("agency", "starter")).toBe("agency");
    expect(effectivePlan("pro", "pro")).toBe("pro");
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm test lib/plans.effectivePlan.test.ts`
Expected: FAIL — `effectivePlan` 未导出。

- [ ] **Step 3: 在 `lib/plans.ts` 末尾实现**

```ts
/** 生效套餐 = max(付费 plan, 超管赠送 comp_plan)；赠送为空时即付费档。 */
export function effectivePlan(plan: PlanId, compPlan: PlanId | null | undefined): PlanId {
  if (!compPlan) return plan;
  return PLAN_ORDER.indexOf(compPlan) > PLAN_ORDER.indexOf(plan) ? compPlan : plan;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm test lib/plans.effectivePlan.test.ts`
Expected: 3 passed。

- [ ] **Step 5: Commit**

```bash
git add lib/plans.ts lib/plans.effectivePlan.test.ts
git commit -m "feat: 新增effectivePlan生效套餐纯函数"
```

### Task A3: plans-db 读取点改造（含禁用返回 null）

**Files:**
- Modify: `lib/plans-db.ts`（整文件替换为下述内容）

- [ ] **Step 1: 改写 `lib/plans-db.ts`**

```ts
import pool from "@/lib/db";
import { effectivePlan, type PlanId } from "@/lib/plans";

/**
 * 取用户生效套餐（= max(plan, comp_plan)）；用户行不存在或已被禁用时返回 null。
 * 返回 null 会让上层 API 走 session_stale 401，从而使禁用用户的既有会话全面失效。
 */
export async function getUserPlanOrNull(userId: string): Promise<PlanId | null> {
  const result = await pool.query(
    "SELECT plan, comp_plan, disabled_at FROM users WHERE id = $1",
    [userId],
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  if (row.disabled_at) return null;
  return effectivePlan((row.plan ?? "free") as PlanId, row.comp_plan as PlanId | null);
}

export async function getUserPlan(userId: string): Promise<PlanId> {
  return (await getUserPlanOrNull(userId)) ?? "free";
}

/** 取某落地页 owner 的生效套餐（发布页/CAPI 派发按套餐门控用）。缺失回退 free。 */
export async function getPlanByPageId(pageId: string): Promise<PlanId> {
  const result = await pool.query(
    `SELECT u.plan, u.comp_plan FROM landing_pages lp JOIN users u ON u.id = lp.user_id WHERE lp.id = $1`,
    [pageId],
  );
  const row = result.rows[0];
  if (!row) return "free";
  return effectivePlan((row.plan ?? "free") as PlanId, row.comp_plan as PlanId | null);
}
```

- [ ] **Step 2: 全量回归 + 类型检查**

Run: `pnpm test && npx tsc --noEmit`
Expected: 全绿（此改动无行为破坏：comp_plan/disabled_at 均为 NULL 时与旧逻辑等价）。

- [ ] **Step 3: Commit**

```bash
git add lib/plans-db.ts
git commit -m "feat: 套餐读取点改为生效套餐并对禁用用户返回null"
```

### Task A4: auth.ts JWT 注入生效套餐

**Files:**
- Modify: `auth.ts:119-163`（jwt 回调）

- [ ] **Step 1: 修改 jwt 回调**

顶部 import 增加：

```ts
import { effectivePlan, type PlanId } from "@/lib/plans";
```

（原有 `import type { PlanId } from "@/lib/plans";` 合并进上行。）

jwt 回调中：SELECT 增加 `comp_plan`，最终注入改为生效套餐：

```ts
const r = await pool.query(
  "SELECT email, plan, comp_plan, role, trial_expires_at FROM users WHERE id = $1",
  [userId]
);
```

原 `token.plan = currentPlan as PlanId;` 改为：

```ts
token.plan = effectivePlan(currentPlan as PlanId, userData.comp_plan ?? null);
```

（trial 过期降级与 ADMIN_EMAILS 物理同步逻辑不变，均只操作 `plan` 与 `currentPlan`。）

- [ ] **Step 2: 验证**

Run: `pnpm test && npx tsc --noEmit`
Expected: 全绿。

- [ ] **Step 3: Commit**

```bash
git add auth.ts
git commit -m "feat: JWT会话注入生效套餐(含comp_plan)"
```

### Task A5: PR-A 收尾

- [ ] **Step 1: 完整门槛**

Run: `pnpm lint && npx tsc --noEmit && pnpm test && pnpm build`
Expected: 全绿。

- [ ] **Step 2: 推送 + PR + 合并（本项目已授权 AI 合并 main）**

```bash
git push -u origin feat_20260720_赠送套餐与生效套餐:feat_20260720_赠送套餐与生效套餐
gh pr create --title "feat: 赠送套餐字段与生效套餐读取改造" --body "migration 021（comp_plan/disabled_at/created_at）+ effectivePlan + plans-db/auth 读取点改造。..."
# CI 绿后合并
gh pr merge --squash
```

---

## PR-B：禁用账号全链路 + super-admin 用户运营

### Task B1: 登录侧禁用拦截

**Files:**
- Modify: `auth.ts`（credentials authorize、signIn 回调、jwt 回调）

- [ ] **Step 1: credentials `authorize`（auth.ts:34-54）禁用拦截**

`const user = result.rows[0];` 之后、密码校验之前加：

```ts
if (!user?.password_hash) return null;
if (user.disabled_at) return null; // 已禁用账号：拒绝登录
```

- [ ] **Step 2: `signIn` 回调（auth.ts:84-118）拦截已禁用的存量用户**

把存量用户查询改为：

```ts
const existingUser = await pool.query(
  "SELECT id, disabled_at FROM users WHERE email = $1",
  [user.email]
);
if (existingUser.rows.length > 0) {
  if (existingUser.rows[0].disabled_at) {
    console.warn("SignIn failed: account disabled", user.email);
    return false;
  }
  user.id = existingUser.rows[0].id;
  console.log("SignIn success: Existing user found");
  return true;
}
```

（原 SELECT 里的 `invited_at` 本就未被使用，移除。）

- [ ] **Step 3: jwt 回调对禁用用户降权**

SELECT 增加 `disabled_at`（在 Task A4 基础上）：

```ts
"SELECT email, plan, comp_plan, role, trial_expires_at, disabled_at FROM users WHERE id = $1"
```

`if (userData) {` 内首行加：

```ts
if (userData.disabled_at) {
  // 已禁用：清空会话权益与角色；API 侧由 getUserPlanOrNull → session_stale 兜底
  token.plan = "free" as PlanId;
  token.role = UserRole.USER;
  return token;
}
```

- [ ] **Step 4: 验证 + Commit**

Run: `pnpm test && npx tsc --noEmit`

```bash
git add auth.ts
git commit -m "feat: 禁用账号登录侧拦截与会话降权"
```

### Task B2: 公网渲染 404（发布页 + 预览链接）

**Files:**
- Modify: `lib/landing-pages/store.ts:163-172`（getPublishedBySlug）、`store.ts:195-199`（getPageForPreview）
- Modify: `app/preview/[token]/page.tsx:13-25`

- [ ] **Step 1: `getPublishedBySlug` 排除禁用租户**

```ts
/** 公开渲染用：按 slug 取已发布页面（owner 被禁用时视同不存在）。data 为发布时快照。 */
export async function getPublishedBySlug(slug: string): Promise<LandingPageRow | null> {
  const result = await pool.query(
    `SELECT lp.* FROM landing_pages lp
       JOIN users u ON u.id = lp.user_id
     WHERE lp.slug = $1 AND lp.status = 'published' AND u.disabled_at IS NULL`,
    [slug],
  );
  const row = result.rows[0];
  if (!row) return null;
  return { ...row, data: row.published_data ?? row.data };
}
```

- [ ] **Step 2: `getPageForPreview` 带出 owner 禁用标记**

```ts
/** 预览渲染用：按 id 取页面（草稿也可预览），附带 owner 是否被禁用。 */
export async function getPageForPreview(
  id: string,
): Promise<(LandingPageRow & { owner_disabled: boolean }) | null> {
  const result = await pool.query(
    `SELECT lp.*, (u.disabled_at IS NOT NULL) AS owner_disabled
       FROM landing_pages lp JOIN users u ON u.id = lp.user_id
     WHERE lp.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}
```

- [ ] **Step 3: 分享预览链接拦截禁用租户**

`app/preview/[token]/page.tsx` 的 `loadValidPreview` 中，取到 page 后：

```ts
const page = await getPageForPreview(pageId);
if (!page || !page.preview_secret || page.owner_disabled) return null;
```

注意：`app/admin/editor/[id]/preview` 若也用 `getPageForPreview`，无需改——禁用用户登录已被拦截，进不了编辑器。

- [ ] **Step 4: 验证 + Commit**

Run: `pnpm test && npx tsc --noEmit`（`getPageForPreview` 返回类型变化若引发 tsc 报错，按报错处逐一确认消费方无需 owner_disabled 即可）。

```bash
git add lib/landing-pages/store.ts app/preview/[token]/page.tsx
git commit -m "feat: 禁用租户已发布页与预览链接公网404"
```

### Task B3: 超管用户管理数据层

**Files:**
- Create: `lib/super-admin/users-db.ts`

- [ ] **Step 1: 实现数据层**

```ts
import pool from "@/lib/db";
import type { PlanId } from "@/lib/plans";

export interface AdminUserPatch {
  compPlan?: PlanId | null;      // null = 取消赠送
  role?: "USER" | "SUPER_ADMIN";
  disabled?: boolean;
}

/** 超管更新用户运营字段；返回是否命中行。调用方负责鉴权与自我保护校验。 */
export async function updateUserAdminFields(userId: string, patch: AdminUserPatch): Promise<boolean> {
  const set: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (patch.compPlan !== undefined) { set.push(`comp_plan = $${i++}`); values.push(patch.compPlan); }
  if (patch.role !== undefined) { set.push(`role = $${i++}`); values.push(patch.role); }
  if (patch.disabled !== undefined) {
    set.push(patch.disabled ? `disabled_at = COALESCE(disabled_at, NOW())` : `disabled_at = NULL`);
  }
  if (set.length === 0) return false;
  values.push(userId);
  const result = await pool.query(
    `UPDATE users SET ${set.join(", ")} WHERE id = $${i} RETURNING id`,
    values,
  );
  return result.rows.length > 0;
}

export interface AdminUserDetail {
  id: string;
  name: string | null;
  email: string;
  plan: PlanId;
  comp_plan: PlanId | null;
  role: string;
  disabled_at: string | null;
  invited_at: string | null;
  created_at: string;
  ls_customer_id: string | null;
  leads_count: number;
  pages: { id: string; name: string; status: string; slug: string | null; bound_domain: string | null }[];
}

/** 用户详情：基础信息 + 名下落地页（含绑定域名）+ 线索总数。不存在返回 null。 */
export async function getUserAdminDetail(userId: string): Promise<AdminUserDetail | null> {
  const userRes = await pool.query(
    `SELECT id, name, email, plan, comp_plan, role, disabled_at, invited_at, created_at, ls_customer_id
       FROM users WHERE id = $1`,
    [userId],
  );
  if (userRes.rows.length === 0) return null;
  const pagesRes = await pool.query(
    `SELECT lp.id, lp.name, lp.status, lp.slug, d.domain AS bound_domain
       FROM landing_pages lp
       LEFT JOIN LATERAL (
         SELECT domain FROM domains
          WHERE landing_page_id = lp.id AND enabled = true AND verified = true LIMIT 1
       ) d ON true
     WHERE lp.user_id = $1 ORDER BY lp.updated_at DESC`,
    [userId],
  );
  const leadsRes = await pool.query(
    `SELECT COUNT(*)::int AS count FROM leads l
       JOIN landing_pages lp ON lp.id = l.landing_page_id
     WHERE lp.user_id = $1`,
    [userId],
  );
  return {
    ...userRes.rows[0],
    leads_count: leadsRes.rows[0].count,
    pages: pagesRes.rows,
  };
}
```

注意：`leads` 表外键列名以 `migrations/014_add_leads.js` 实际为准（若为 `page_id` 则相应替换）。

- [ ] **Step 2: 验证 + Commit**

Run: `npx tsc --noEmit`

```bash
git add lib/super-admin/users-db.ts
git commit -m "feat: 超管用户运营数据层(更新字段+详情查询)"
```

### Task B4: 超管用户 API（TDD）

**Files:**
- Create: `app/api/super-admin/users/[id]/route.test.ts`
- Create: `app/api/super-admin/users/[id]/route.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: () => authMock() }));
vi.mock("@/lib/super-admin/users-db", () => ({
  updateUserAdminFields: vi.fn(async () => true),
  getUserAdminDetail: vi.fn(async () => ({ id: "u2", email: "a@b.c", pages: [], leads_count: 0 })),
}));

import { PATCH, GET } from "./route";
import { updateUserAdminFields } from "@/lib/super-admin/users-db";

const SUPER = { user: { id: "admin1", role: "SUPER_ADMIN" } };
const NORMAL = { user: { id: "u1", role: "USER" } };

function patchReq(body: unknown) {
  return new Request("http://x/api/super-admin/users/u2", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}
const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => { vi.clearAllMocks(); authMock.mockResolvedValue(SUPER); });

describe("PATCH /api/super-admin/users/[id]", () => {
  it("非超管 → 403 且不更新", async () => {
    authMock.mockResolvedValue(NORMAL);
    const res = await PATCH(patchReq({ disabled: true }), params("u2"));
    expect(res.status).toBe(403);
    expect(updateUserAdminFields).not.toHaveBeenCalled();
  });
  it("未登录 → 401", async () => {
    authMock.mockResolvedValue(null);
    const res = await PATCH(patchReq({ disabled: true }), params("u2"));
    expect(res.status).toBe(401);
  });
  it("对自己改角色/禁用 → 400 且不更新", async () => {
    const res = await PATCH(patchReq({ disabled: true }), params("admin1"));
    expect(res.status).toBe(400);
    const res2 = await PATCH(patchReq({ role: "USER" }), params("admin1"));
    expect(res2.status).toBe(400);
    expect(updateUserAdminFields).not.toHaveBeenCalled();
  });
  it("非法 compPlan / role 值 → 400", async () => {
    expect((await PATCH(patchReq({ compPlan: "vip" }), params("u2"))).status).toBe(400);
    expect((await PATCH(patchReq({ role: "ADMIN" }), params("u2"))).status).toBe(400);
    expect((await PATCH(patchReq({}), params("u2"))).status).toBe(400);
  });
  it("合法更新（赠送 pro + 禁用）→ 200 并透传数据层", async () => {
    const res = await PATCH(patchReq({ compPlan: "pro", disabled: true }), params("u2"));
    expect(res.status).toBe(200);
    expect(updateUserAdminFields).toHaveBeenCalledWith("u2", { compPlan: "pro", disabled: true });
  });
  it("取消赠送（compPlan: null）→ 200", async () => {
    const res = await PATCH(patchReq({ compPlan: null }), params("u2"));
    expect(res.status).toBe(200);
    expect(updateUserAdminFields).toHaveBeenCalledWith("u2", { compPlan: null });
  });
});

describe("GET /api/super-admin/users/[id]", () => {
  it("非超管 → 403", async () => {
    authMock.mockResolvedValue(NORMAL);
    const res = await GET(patchReq({}), params("u2"));
    expect(res.status).toBe(403);
  });
  it("超管 → 200 返回详情", async () => {
    const res = await GET(patchReq({}), params("u2"));
    expect(res.status).toBe(200);
    expect((await res.json()).user.id).toBe("u2");
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm test app/api/super-admin/users`
Expected: FAIL — route 模块不存在。

- [ ] **Step 3: 实现 route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole, ApiErrors } from "@/lib/constants";
import type { PlanId } from "@/lib/plans";
import {
  getUserAdminDetail,
  updateUserAdminFields,
  type AdminUserPatch,
} from "@/lib/super-admin/users-db";

const COMP_PLANS: ReadonlyArray<string> = ["starter", "pro", "agency"];
const ROLES: ReadonlyArray<string> = [UserRole.USER, UserRole.SUPER_ADMIN];

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 }) };
  }
  if (session.user.role !== UserRole.SUPER_ADMIN) {
    return { error: NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 403 }) };
  }
  return { session };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireSuperAdmin();
  if (guard.error) return guard.error;
  const { id } = await ctx.params;
  const user = await getUserAdminDetail(id);
  if (!user) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireSuperAdmin();
  if (guard.error) return guard.error;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }

  const patch: AdminUserPatch = {};
  if ("compPlan" in body) {
    if (body.compPlan !== null && !COMP_PLANS.includes(body.compPlan)) {
      return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
    }
    patch.compPlan = body.compPlan as PlanId | null;
  }
  if ("role" in body) {
    if (!ROLES.includes(body.role)) {
      return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
    }
    patch.role = body.role;
  }
  if ("disabled" in body) {
    if (typeof body.disabled !== "boolean") {
      return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
    }
    patch.disabled = body.disabled;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }
  // 自我保护：不允许对自己降权/禁用（赠送套餐给自己同样禁止，语义简单化）
  if (id === guard.session.user.id) {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }

  const ok = await updateUserAdminFields(id, patch);
  if (!ok) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm test app/api/super-admin/users`
Expected: 8 passed。

- [ ] **Step 5: Commit**

```bash
git add app/api/super-admin/users
git commit -m "feat: 超管用户运营API(赠送套餐/角色/禁用,TDD)"
```

### Task B5: 用户列表页升级（antd）

**Files:**
- Modify: `app/super-admin/users/page.tsx`
- Modify: `app/super-admin/users/_client.tsx`（整文件重写）
- Create: `app/super-admin/users/UserDetailDrawer.tsx`

- [ ] **Step 1: server page 补查询列**

```ts
import pool from "@/lib/db";
import { effectivePlan, type PlanId } from "@/lib/plans";
import { SuperAdminUsersClient } from "./_client";

async function getUsers() {
  const result = await pool.query(`
    SELECT id, name, email, plan, comp_plan, role, disabled_at, invited_at, created_at,
    (SELECT COUNT(*) FROM landing_pages WHERE user_id = users.id) as page_count
    FROM users
    ORDER BY created_at DESC, email
`);
  return result.rows;
}

export default async function AdminUsersPage() {
  const users = await getUsers();
  const tableRows = users.map((u) => ({
    key: u.id as string,
    id: u.id as string,
    name: (u.name ?? "") as string,
    email: u.email as string,
    plan: u.plan as PlanId,
    compPlan: (u.comp_plan ?? null) as PlanId | null,
    effective: effectivePlan(u.plan as PlanId, u.comp_plan as PlanId | null),
    role: u.role as string,
    disabled: Boolean(u.disabled_at),
    pageCount: Number(u.page_count),
    createdAt: new Date(u.created_at).toLocaleString("zh-CN"),
  }));
  return <SuperAdminUsersClient rows={tableRows} />;
}
```

- [ ] **Step 2: 重写 `_client.tsx`**

要点（完整实现按此结构，全部 antd 组件）：

```tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlanId } from "@/lib/plans";
import { PLAN_ORDER, PLANS } from "@/lib/plans";
import { UserRole } from "@/lib/constants";
import { PlanBadge } from "@/components/billing/PlanBadge";
import {
  Table, Tag, Typography, Space, Input, Dropdown, Button, Modal, Select,
  Popconfirm, message, Tooltip,
} from "antd";
import { MoreOutlined, SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { InviteUserDialog } from "@/components/admin/InviteUserDialog";
import { UserDetailDrawer } from "./UserDetailDrawer";

export interface UserRow {
  key: string; id: string; name: string; email: string;
  plan: PlanId; compPlan: PlanId | null; effective: PlanId;
  role: string; disabled: boolean; pageCount: number; createdAt: string;
}

async function patchUser(id: string, body: Record<string, unknown>): Promise<boolean> {
  const res = await fetch(`/api/super-admin/users/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.ok;
}

export function SuperAdminUsersClient({ rows }: { rows: UserRow[] }) {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [compTarget, setCompTarget] = useState<UserRow | null>(null); // 赠送套餐弹窗
  const [compValue, setCompValue] = useState<PlanId | "none">("none");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return rows;
    return rows.filter((r) => r.email.toLowerCase().includes(kw) || r.name.toLowerCase().includes(kw));
  }, [rows, keyword]);

  async function apply(id: string, body: Record<string, unknown>, okMsg: string) {
    setSaving(true);
    const ok = await patchUser(id, body);
    setSaving(false);
    if (ok) { message.success(okMsg); router.refresh(); }
    else message.error("操作失败，请重试");
  }

  const columns: ColumnsType<UserRow> = [
    { title: "邮箱", key: "email",
      render: (_, row) => (
        <div>
          <Typography.Text strong style={{ display: "block", fontSize: 13 }}>{row.name || "—"}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{row.email}</Typography.Text>
        </div>
      ),
    },
    { title: "角色", dataIndex: "role", key: "role",
      filters: [
        { text: "超管", value: UserRole.SUPER_ADMIN },
        { text: "普通用户", value: UserRole.USER },
      ],
      onFilter: (v, row) => row.role === v,
      render: (role: string) => (
        <Tag color={role === UserRole.SUPER_ADMIN ? "blue" : "default"}>
          {role === UserRole.SUPER_ADMIN ? "超管" : "用户"}
        </Tag>
      ),
    },
    { title: "生效套餐", key: "effective",
      filters: PLAN_ORDER.map((p) => ({ text: PLANS[p].label, value: p })),
      onFilter: (v, row) => row.effective === v,
      render: (_, row) => (
        <Space size={4}>
          <PlanBadge plan={row.effective} />
          {row.compPlan && row.effective === row.compPlan && (
            <Tooltip title={`付费档 ${PLANS[row.plan].label}，超管赠送 ${PLANS[row.compPlan].label}`}>
              <Tag color="gold">赠送</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    { title: "状态", dataIndex: "disabled", key: "disabled",
      filters: [
        { text: "正常", value: false },
        { text: "已禁用", value: true },
      ],
      onFilter: (v, row) => row.disabled === v,
      render: (disabled: boolean) =>
        disabled ? <Tag color="error">已禁用</Tag> : <Tag color="success">正常</Tag>,
    },
    { title: "注册时间", dataIndex: "createdAt", key: "createdAt",
      render: (v: string) => <Typography.Text type="secondary" style={{ fontSize: 12 }}>{v}</Typography.Text>,
    },
    { title: "落地页数", dataIndex: "pageCount", key: "pageCount", align: "center",
      render: (count: number) => <Tag color="default">{count}</Tag>,
    },
    { title: "操作", key: "actions", align: "right",
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => setDetailId(row.id)}>详情</Button>
          <Dropdown
            menu={{
              items: [
                { key: "comp", label: "赠送套餐" },
                row.role === UserRole.SUPER_ADMIN
                  ? { key: "demote", label: "取消超管" }
                  : { key: "promote", label: "设为超管" },
                { type: "divider" as const },
                row.disabled
                  ? { key: "enable", label: "启用账号" }
                  : { key: "disable", label: "禁用账号", danger: true },
              ],
              onClick: ({ key }) => {
                if (key === "comp") { setCompTarget(row); setCompValue(row.compPlan ?? "none"); }
                if (key === "promote" || key === "demote") {
                  Modal.confirm({
                    title: key === "promote" ? "设为超管？" : "取消超管？",
                    content: `${row.email} 的角色将变更为${key === "promote" ? "超级管理员" : "普通用户"}。`,
                    onOk: () => apply(row.id, { role: key === "promote" ? UserRole.SUPER_ADMIN : UserRole.USER }, "角色已更新"),
                  });
                }
                if (key === "disable") {
                  Modal.confirm({
                    title: "禁用该账号？",
                    content: "将禁止其登录，并下线其全部已发布落地页（公网访问 404）。可随时重新启用。",
                    okButtonProps: { danger: true },
                    onOk: () => apply(row.id, { disabled: true }, "已禁用"),
                  });
                }
                if (key === "enable") void apply(row.id, { disabled: false }, "已启用");
              },
            }}
          >
            <Button size="small" icon={<MoreOutlined />} loading={saving} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <Typography.Title level={2} style={{ margin: 0 }}>用户管理</Typography.Title>
          <Typography.Text type="secondary">管理平台用户、套餐赠送与账号状态</Typography.Text>
        </div>
        <Space>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索邮箱 / 名称"
            style={{ width: 240 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <InviteUserDialog />
        </Space>
      </div>

      <Table columns={columns} dataSource={filtered} rowKey="key"
        pagination={{ pageSize: 20, showSizeChanger: false }} size="middle" />

      <Modal
        title={compTarget ? `赠送套餐 — ${compTarget.email}` : "赠送套餐"}
        open={!!compTarget}
        confirmLoading={saving}
        onCancel={() => setCompTarget(null)}
        onOk={async () => {
          if (!compTarget) return;
          await apply(compTarget.id, { compPlan: compValue === "none" ? null : compValue }, "赠送套餐已更新");
          setCompTarget(null);
        }}
      >
        <Typography.Paragraph type="secondary">
          生效套餐取「付费套餐」与「赠送套餐」中的较高档；Lemon Squeezy 订阅事件只覆写付费套餐，不影响赠送。
        </Typography.Paragraph>
        <Select
          style={{ width: "100%" }}
          value={compValue}
          onChange={setCompValue}
          options={[
            { value: "none", label: "无赠送" },
            { value: "starter", label: "Starter" },
            { value: "pro", label: "Pro" },
            { value: "agency", label: "Agency" },
          ]}
        />
      </Modal>

      <UserDetailDrawer userId={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}
```

（注：操作自己的行也会显示菜单，API 会 400 拦截；如需更好体验可对 `row.id === 当前用户` 隐藏危险项，需从 server page 传入 `currentUserId`——实现时把 `session.user.id` 经 page.tsx 传给 client 并隐藏自我操作项。）

- [ ] **Step 3: 实现 `UserDetailDrawer.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Drawer, Descriptions, Table, Tag, Typography, Spin, Alert } from "antd";
import type { PlanId } from "@/lib/plans";
import { PlanBadge } from "@/components/billing/PlanBadge";

interface DetailPage { id: string; name: string; status: string; slug: string | null; bound_domain: string | null }
interface Detail {
  id: string; name: string | null; email: string;
  plan: PlanId; comp_plan: PlanId | null; role: string;
  disabled_at: string | null; created_at: string; ls_customer_id: string | null;
  leads_count: number; pages: DetailPage[];
}

export function UserDetailDrawer({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setDetail(null); setError(false); setLoading(true);
    fetch(`/api/super-admin/users/${userId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        setDetail((await res.json()).user);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <Drawer title="用户详情" width={560} open={!!userId} onClose={onClose}>
      {loading && <Spin />}
      {error && <Alert type="error" message="加载失败，请关闭后重试" />}
      {detail && (
        <>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="邮箱">{detail.email}</Descriptions.Item>
            <Descriptions.Item label="名称">{detail.name || "—"}</Descriptions.Item>
            <Descriptions.Item label="付费套餐"><PlanBadge plan={detail.plan} /></Descriptions.Item>
            <Descriptions.Item label="赠送套餐">
              {detail.comp_plan ? <PlanBadge plan={detail.comp_plan} /> : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="LS Customer">{detail.ls_customer_id || "—"}</Descriptions.Item>
            <Descriptions.Item label="状态">
              {detail.disabled_at ? <Tag color="error">已禁用</Tag> : <Tag color="success">正常</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="注册时间">
              {new Date(detail.created_at).toLocaleString("zh-CN")}
            </Descriptions.Item>
            <Descriptions.Item label="线索总数">{detail.leads_count}</Descriptions.Item>
          </Descriptions>

          <Typography.Title level={5} style={{ marginTop: 24 }}>落地页（{detail.pages.length}）</Typography.Title>
          <Table
            size="small" rowKey="id" pagination={false} dataSource={detail.pages}
            columns={[
              { title: "名称", dataIndex: "name" },
              { title: "状态", dataIndex: "status",
                render: (s: string) => <Tag color={s === "published" ? "success" : "default"}>{s}</Tag> },
              { title: "绑定域名", dataIndex: "bound_domain", render: (d: string | null) => d || "—" },
            ]}
          />
        </>
      )}
    </Drawer>
  );
}
```

- [ ] **Step 4: 验证 + Commit**

Run: `pnpm test && npx tsc --noEmit && pnpm lint`

```bash
git add app/super-admin/users
git commit -m "feat: 超管用户列表搜索筛选/行操作/详情抽屉"
```

### Task B6: PR-B 收尾（含 dev 走查）

- [ ] **Step 1: 完整门槛**

Run: `pnpm lint && npx tsc --noEmit && pnpm test && pnpm build`

- [ ] **Step 2: dev 环境 Playwright 走查**

启动前检查 3001 端口是否已有用户实例（有则复用，不得杀掉）。走查项：
1. 超管登录 → `/super-admin/users`：搜索、筛选、详情抽屉数据正确。
2. 对测试账号赠送 pro → 该账号登录后 billing/编辑器权益按 pro 生效。
3. 禁用测试账号 → 其登录被拒；其已发布页（dev 域名/slug 路径）返回 404；分享预览链接 404。
4. 启用恢复 → 登录与页面访问恢复。
5. 对自己禁用/降权 → 提示操作失败。
自行启动的服务测试后 kill 并确认端口释放；测试产生的数据清理。

- [ ] **Step 3: 推送 + PR + CI 绿后合并**

```bash
git push -u origin feat_20260720_禁用账号与超管用户运营:feat_20260720_禁用账号与超管用户运营
gh pr create --title "feat: 禁用账号全链路与超管用户运营" --body "..."
gh pr merge --squash
```

---

## PR-C：super-admin 数据看板增强

### Task C1: 日序列补零纯函数（TDD）

**Files:**
- Create: `lib/super-admin/trend.test.ts`
- Create: `lib/super-admin/trend.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, it, expect } from "vitest";
import { fillDailySeries } from "@/lib/super-admin/trend";

describe("fillDailySeries（近 N 天逐日补零）", () => {
  const now = new Date("2026-07-20T10:00:00Z");
  it("空数据返回 N 个零点，日期升序", () => {
    const s = fillDailySeries([], 7, now);
    expect(s).toHaveLength(7);
    expect(s[0]).toEqual({ day: "2026-07-14", count: 0 });
    expect(s[6]).toEqual({ day: "2026-07-20", count: 0 });
  });
  it("有数据的日期填充计数，缺日补零", () => {
    const s = fillDailySeries([{ day: "2026-07-19", count: 3 }], 3, now);
    expect(s).toEqual([
      { day: "2026-07-18", count: 0 },
      { day: "2026-07-19", count: 3 },
      { day: "2026-07-20", count: 0 },
    ]);
  });
  it("范围外的日期被忽略", () => {
    const s = fillDailySeries([{ day: "2026-01-01", count: 9 }], 2, now);
    expect(s).toEqual([
      { day: "2026-07-19", count: 0 },
      { day: "2026-07-20", count: 0 },
    ]);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm test lib/super-admin/trend.test.ts`
Expected: FAIL — 模块不存在。

- [ ] **Step 3: 实现**

```ts
export interface DailyPoint { day: string; count: number }

/** 把 SQL 按日聚合结果补齐为「近 days 天（含今天，UTC）」逐日序列，缺日计 0，升序。 */
export function fillDailySeries(rows: DailyPoint[], days: number, now: Date): DailyPoint[] {
  const byDay = new Map(rows.map((r) => [r.day, r.count]));
  const out: DailyPoint[] = [];
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(base.getTime() - i * 86400_000);
    const day = d.toISOString().slice(0, 10);
    out.push({ day, count: byDay.get(day) ?? 0 });
  }
  return out;
}
```

- [ ] **Step 4: 跑测试确认通过 + Commit**

Run: `pnpm test lib/super-admin/trend.test.ts`
Expected: 3 passed。

```bash
git add lib/super-admin/trend.ts lib/super-admin/trend.test.ts
git commit -m "feat: 看板趋势日序列补零纯函数(TDD)"
```

### Task C2: 概览页服务端聚合 + 趋势图组件

**Files:**
- Modify: `app/super-admin/page.tsx`
- Modify: `app/super-admin/_overview-client.tsx`
- Create: `app/super-admin/TrendCharts.tsx`

- [ ] **Step 1: `page.tsx` 扩展查询**

```ts
import pool from "@/lib/db";
import { effectivePlan, PLAN_ORDER, type PlanId } from "@/lib/plans";
import { fillDailySeries, type DailyPoint } from "@/lib/super-admin/trend";
import { SuperAdminOverview, type OverviewStats } from "./_overview-client";

async function getStats(): Promise<OverviewStats> {
  const [usersCount, pagesCount, activeSubscriptions, leadsCount, planRows, userTrend, leadTrend, latestPages] =
    await Promise.all([
      pool.query("SELECT COUNT(*) FROM users"),
      pool.query("SELECT COUNT(*) FROM landing_pages"),
      pool.query("SELECT COUNT(*) FROM users WHERE plan != 'free'"),
      pool.query("SELECT COUNT(*) FROM leads"),
      pool.query("SELECT plan, comp_plan FROM users"),
      pool.query(`
        SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
        FROM users WHERE created_at > NOW() - INTERVAL '30 days' GROUP BY 1`),
      pool.query(`
        SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
        FROM leads WHERE created_at > NOW() - INTERVAL '30 days' GROUP BY 1`),
      pool.query(`
        SELECT lp.id, lp.name, lp.status, lp.created_at, u.email as user_email
        FROM landing_pages lp JOIN users u ON lp.user_id = u.id
        ORDER BY lp.created_at DESC LIMIT 5`),
    ]);

  // 套餐分布按生效套餐口径（用户量小，JS 聚合）
  const planDist = Object.fromEntries(PLAN_ORDER.map((p) => [p, 0])) as Record<PlanId, number>;
  for (const r of planRows.rows) {
    planDist[effectivePlan((r.plan ?? "free") as PlanId, r.comp_plan as PlanId | null)]++;
  }

  const now = new Date();
  return {
    totalUsers: parseInt(usersCount.rows[0].count),
    totalPages: parseInt(pagesCount.rows[0].count),
    activeSubs: parseInt(activeSubscriptions.rows[0].count),
    totalLeads: parseInt(leadsCount.rows[0].count),
    planDist,
    userTrend: fillDailySeries(userTrend.rows as DailyPoint[], 30, now),
    leadTrend: fillDailySeries(leadTrend.rows as DailyPoint[], 30, now),
    latestPages: latestPages.rows.map((r) => ({
      id: r.id, name: r.name, status: r.status,
      created_at: new Date(r.created_at).toISOString(), user_email: r.user_email,
    })),
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();
  return <SuperAdminOverview stats={stats} />;
}
```

- [ ] **Step 2: `TrendCharts.tsx`（recharts，风格对齐 admin/analytics 的 AreaChart）**

```tsx
"use client";

import { Card, Row, Col } from "antd";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BRAND } from "@/lib/theme/brand";
import { SEMANTIC } from "@/lib/theme/antd-theme";
import type { DailyPoint } from "@/lib/super-admin/trend";

function Trend({ title, data, color }: { title: string; data: DailyPoint[]; color: string }) {
  return (
    <Card title={title} size="small">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} minTickGap={24} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Area type="monotone" dataKey="count" stroke={color} fill={color} fillOpacity={0.12} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function TrendCharts({ userTrend, leadTrend }: { userTrend: DailyPoint[]; leadTrend: DailyPoint[] }) {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} md={12}><Trend title="近 30 天新增用户" data={userTrend} color={BRAND} /></Col>
      <Col xs={24} md={12}><Trend title="近 30 天新增线索" data={leadTrend} color={SEMANTIC.success} /></Col>
    </Row>
  );
}
```

- [ ] **Step 3: `_overview-client.tsx` 扩展**

`OverviewStats` 接口增加：

```ts
export interface OverviewStats {
  totalUsers: number;
  totalPages: number;
  activeSubs: number;
  totalLeads: number;
  planDist: Record<PlanId, number>;
  userTrend: DailyPoint[];
  leadTrend: DailyPoint[];
  latestPages: LatestPage[];
}
```

（新增 import：`import type { PlanId } from "@/lib/plans"; import { PLAN_ORDER, PLANS } from "@/lib/plans"; import type { DailyPoint } from "@/lib/super-admin/trend"; import { TrendCharts } from "./TrendCharts";`）

变更点：
1. `statCards` 增加一张「线索总量」卡（`ContactsOutlined` 图标，值 `stats.totalLeads`）；五张卡 Col 改为 `xs={24} sm={12} lg={..}` 适配（lg 用 `lg={8}` 两行或 `lg={4}+flex` 均可，取 antd 栅格简单方案：五卡 `lg={
  index < 4 ? 6 : 6}` → 直接允许换行即可，不必强求一行五卡）。
2. 统计卡行下插入 `<TrendCharts userTrend={stats.userTrend} leadTrend={stats.leadTrend} />`。
3. 「需要新的平台功能？」渐变 CTA 卡替换为「套餐分布」卡：

```tsx
<Card title="套餐分布（生效口径）">
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    {PLAN_ORDER.map((p) => (
      <div key={p} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography.Text>{PLANS[p].label}</Typography.Text>
        <Typography.Text strong>{stats.planDist[p]}</Typography.Text>
      </div>
    ))}
  </div>
</Card>
```

- [ ] **Step 4: 验证 + Commit**

Run: `pnpm test && npx tsc --noEmit && pnpm lint && pnpm build`

```bash
git add app/super-admin lib/super-admin
git commit -m "feat: 超管概览页线索总量/套餐分布/30天趋势图"
```

### Task C3: PR-C 收尾

- [ ] dev 走查 `/super-admin`：五张统计卡、双趋势图渲染正常、套餐分布与用户列表一致。
- [ ] 推送 + PR + CI 绿后合并（分支 `feat_20260720_超管数据看板增强`）。

---

## PR-D：恢复为线上版本 + UpgradeDialog 清理

### Task D1: store 恢复函数 + API

**Files:**
- Modify: `lib/landing-pages/store.ts`（末尾追加）
- Create: `app/api/landing-pages/[id]/restore-live/route.ts`

- [ ] **Step 1: store 追加**

```ts
/** 把草稿恢复为线上快照（published_data）；未发布过（无快照）时不生效返回 null。 */
export async function restoreDraftFromLive(id: string, userId: string): Promise<ClientLandingPageRow | null> {
  const result = await pool.query(
    `UPDATE landing_pages SET data = published_data, updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND published_data IS NOT NULL RETURNING *`,
    [id, userId],
  );
  return result.rows[0] ? toClient(result.rows[0]) : null;
}
```

- [ ] **Step 2: route（参照既有 publish/unpublish 路由的鉴权样式）**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { restoreDraftFromLive } from "@/lib/landing-pages/store";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  const { id } = await ctx.params;
  const row = await restoreDraftFromLive(id, session.user.id);
  if (!row) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json({ page: row }); // row.data 即恢复后的草稿（=线上快照）
}
```

实现前先读 `app/api/landing-pages/[id]/publish/route.ts` 对齐鉴权/错误码惯例，若其有 session_stale 检查则同样加上。

- [ ] **Step 3: 验证 + Commit**

Run: `pnpm test && npx tsc --noEmit`

```bash
git add lib/landing-pages/store.ts app/api/landing-pages/[id]/restore-live
git commit -m "feat: 草稿恢复为线上快照的store函数与API"
```

### Task D2: 编辑器工具栏入口

**Files:**
- Modify: `landing-editor/components/EditorToolbar.tsx`

- [ ] **Step 1: 加按钮与内联确认弹层**

仅当 `status === "published" && publishedDirty` 显示。编辑器区域保持 Tailwind 风格（非 antd 区域），确认交互仿照现有 blockers 弹层：

```tsx
// 组件内新增 state：
const [restoreOpen, setRestoreOpen] = useState(false);
const [restoring, setRestoring] = useState(false);

async function handleRestoreLive() {
  setRestoring(true);
  try {
    const res = await fetch(`/api/landing-pages/${pageId}/restore-live`, { method: "POST" });
    if (!res.ok) return; // 失败保持弹层，用户可重试或关闭
    const { page } = await res.json();
    dispatch({ kind: "replaceDraft", draft: page.data }); // 入 undo 历史，可一步撤销
    setRestoreOpen(false);
  } finally {
    setRestoring(false);
  }
}
```

JSX：在「有未发布的修改」amber 徽标后插入：

```tsx
{status === "published" && publishedDirty && (
  <div className="relative">
    <button
      onClick={() => setRestoreOpen((v) => !v)}
      className="rounded-md border border-edge px-2 py-1 text-xs text-ink-soft hover:bg-canvas"
    >
      恢复为线上版本
    </button>
    {restoreOpen && (
      <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-edge bg-panel p-3 shadow-xl">
        <p className="text-sm text-ink">将当前草稿恢复为线上正在展示的版本？</p>
        <p className="mt-1 text-xs text-ink-muted">当前未发布的修改会被覆盖，可用撤销（⌘Z）找回。</p>
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={() => setRestoreOpen(false)} className="rounded-md px-2.5 py-1 text-xs text-ink-soft hover:bg-canvas">取消</button>
          <button
            onClick={() => void handleRestoreLive()}
            disabled={restoring}
            className="rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {restoring ? "恢复中…" : "确认恢复"}
          </button>
        </div>
      </div>
    )}
  </div>
)}
```

已知语义（与产品确认过的取舍）：恢复后 AutoSave 会把恢复内容再落一次草稿并保持「有未发布的修改」amber 标（因 updated_at > published_at），属诚实语义——草稿经历过编辑事件；用户可直接「更新发布」或继续编辑。

- [ ] **Step 2: 验证 + Commit**

Run: `pnpm test && npx tsc --noEmit && pnpm lint`

```bash
git add landing-editor/components/EditorToolbar.tsx
git commit -m "feat: 编辑器新增恢复为线上版本入口(可撤销)"
```

### Task D3: UpgradeDialog 死代码清理

**Files:**
- Modify: `app/admin/(workspace)/domains/page.tsx`
- Delete: `components/billing/UpgradeDialog.tsx`

- [ ] **Step 1: 确认死代码**

已核实：`domains/page.tsx` 中 `upgradeOpen` 仅有 `useState(false)` 声明（line 31）与 JSX 传参（line 187），`setUpgradeOpen` 从未被调用 → 对话框永不打开。全仓 `UpgradeDialog` 引用仅此一处 + 组件自身。

- [ ] **Step 2: 清理**

`domains/page.tsx`：删除 line 9 的 import、line 31 的 `useState`、line 186-190 的 `<UpgradeDialog ...>` JSX；若 `currentPlan` 仅供 UpgradeDialog 使用则一并删除其派生代码（删除后以 tsc/eslint unused 报错为准逐一清理）。然后：

```bash
git rm components/billing/UpgradeDialog.tsx
```

- [ ] **Step 3: 验证 + Commit**

Run: `npx tsc --noEmit && pnpm lint && pnpm test && pnpm build`
Expected: 全绿，无残留引用。

```bash
git add -A
git commit -m "refactor: 删除UpgradeDialog死代码"
```

### Task D4: PR-D 收尾（含 E2E 走查）

- [ ] **Step 1: dev Playwright 走查**

1. 已发布页编辑出「未发布修改」→ 「恢复为线上版本」按钮出现 → 确认恢复 → 画布内容回到线上版本 → ⌘Z 可一步撤回恢复。
2. 未发布过的草稿页不显示该按钮。
3. domains 页正常渲染（UpgradeDialog 删除无回归）。

- [ ] **Step 2: 完整门槛 + 推送 + PR + 合并**

Run: `pnpm lint && npx tsc --noEmit && pnpm test && pnpm build`
分支 `fix_20260720_恢复线上版本与死代码清理`，CI 绿后合并。

---

## 收尾（全部合并后）

- [ ] 生产部署后 smoke：`/super-admin` 看板与用户操作、赠送套餐生效、禁用 404、编辑器恢复按钮。
- [ ] 生产库确认迁移 021 已由 `vercel-build`（`pnpm migrate:up`）自动执行。
- [ ] 更新帮助中心/产品手册若涉及（「恢复为线上版本」补进 `app/admin/(workspace)/help/_content/chapters` 编辑器章节与 `docs/product-manual.md`）。
- [ ] 更新 memory（admin 主流程评审遗留项清零、新增超管运营能力）。
