# Phase 2：线索响应闭环（邮件通知 + Webhook）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新线索落库后，(a) 立即给租户注册邮箱发通知邮件（全档位），(b) 若租户配置了 Webhook 且套餐允许（Pro/Agency），把线索以签名 JSON POST 到其 CRM/Zapier。收件箱已有，本阶段补「推」的能力，让海外 leadgen 的「5 分钟响应」成为可能。

**Architecture:** 线索提交接口 `POST /api/leads` 落库后，调用 `notifyNewLead(pageId, lead)`（best-effort，失败不阻塞 204 响应）。邮件走 `after()` 即时发送（Resend）。Webhook 走**持久队列 + cron 重试**，镜像现有 CAPI 出站模式（`capi_events` + `/api/cron/capi-flush`）：入队 `webhook_deliveries` → `after()` 即时投一次 → 失败留给 `/api/cron/webhook-flush` 退避重试。出站签名镜像 `lib/lemonsqueezy.ts` 的入站 HMAC 习惯。

**Tech Stack:** Next.js App Router（魔改版，改动前读 `node_modules/next/dist/docs/`）、`after()` from `next/server`、node `crypto` HMAC、node-pg-migrate、Postgres（`lib/db` pool）、Resend（`lib/email.ts`）、antd（设置页，Client Component 内渲染）、Tailwind-only、vitest（纯逻辑 + 状态机 TDD）。

**风险定级：** 中（新增出站 HTTP 到用户提供的 URL + 新队列/cron + 触碰中间件白名单 + DB 迁移）。纯逻辑（签名、payload、状态机、门控决策）走 TDD；DB/路由/UI 走实现 + 手动/e2e。

---

## 已确认决策（2026-07-19）

| 点 | 结论 |
|---|---|
| Webhook 投递可靠性 | **队列表 + cron 重试**（镜像 CAPI），目标宕机数分钟仍补投 |
| 套餐门控 | **邮件全档** + **Webhook 仅 Pro/Agency**（与 `advancedTracking` 门控风格一致） |
| 设置粒度 | **按租户（user_id）**：一个邮件开关 + 一个 Webhook URL/密钥，覆盖该租户所有页面 |
| 出站签名 | `X-Zonit-Signature: sha256=<hmac-hex>` over raw JSON body，镜像 lemonsqueezy 入站 |
| cron 可达性 | 把 `/api/cron` 加入中间件 `PUBLIC_PATHS`（各 cron 路由自身 `CRON_SECRET` 才是门）——**同时修复现有 capi-flush 兜底被中间件挡住的既有问题** |
| 不做 | WhatsApp/Telegram 通知渠道、Zapier 官方 app（先用通用 Webhook 承接）、per-page 覆盖设置 |

---

## File Structure

**新建：**
- `migrations/019_add_lead_notifications.js` — `lead_notification_settings` + `webhook_deliveries` 两表
- `lib/leads/notify-settings.ts` — 租户通知设置读写（get/upsert + secret 生成）
- `lib/webhooks/sign.ts` + `lib/webhooks/sign.test.ts` — HMAC 签名/校验（纯逻辑 TDD）
- `lib/leads/webhook-payload.ts` + `lib/leads/webhook-payload.test.ts` — 线索 → webhook JSON（纯逻辑 TDD）
- `lib/webhooks/deliveries-store.ts` — `webhook_deliveries` 状态机读写（镜像 capi events-store）
- `lib/webhooks/dispatch.ts` + `lib/webhooks/dispatch.test.ts` — 投递 + 状态更新（可注入 deps，状态机 TDD）
- `lib/leads/notify.ts` + `lib/leads/notify.test.ts` — 编排：邮件 + webhook 入队，含套餐/开关门控（决策 TDD）
- `app/api/cron/webhook-flush/route.ts` — cron 兜底重试
- `app/api/lead-notifications/route.ts` — 设置 GET/PUT（owner 隔离）
- `app/admin/(workspace)/settings/LeadNotificationSettings.tsx` — 设置页卡片（antd client）

**修改：**
- `lib/email.ts` — 加 `sendLeadNotificationEmail`
- `lib/plans.ts` — 加 `leadWebhook` flag + `hasLeadWebhook` helper + 对比表行
- `lib/plans.test.ts` — 若断言 flag 完整性则补 `leadWebhook`
- `app/api/leads/route.ts` — 落库后调用 `notifyNewLead`（best-effort）
- `lib/proxy/auth-proxy.ts` — `PUBLIC_PATHS` 加 `/api/cron`
- `lib/proxy/auth-proxy.test.ts` — 补 cron 公开 + 非 cron /api 仍受保护用例
- `vercel.json` — crons 加 `/api/cron/webhook-flush`
- `app/admin/(workspace)/settings/page.tsx` — 挂载新卡片

---

## Task 1：迁移——通知设置表 + webhook 投递队列

**Files:** Create `migrations/019_add_lead_notifications.js`

- [ ] **Step 1: 写迁移（幂等，镜像 016 capi_events 风格）**

```js
/** @type {import('node-pg-migrate').MigrationBuilder} */
// 租户线索通知设置（按 user 一份）+ webhook 出站投递队列（状态机，镜像 capi_events）。
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS lead_notification_settings (
      user_id         TEXT        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      email_enabled   BOOLEAN     NOT NULL DEFAULT TRUE,
      webhook_enabled BOOLEAN     NOT NULL DEFAULT FALSE,
      webhook_url     TEXT,
      webhook_secret  TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id         BIGSERIAL   PRIMARY KEY,
      user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      page_id    TEXT        REFERENCES landing_pages(id) ON DELETE SET NULL,
      payload    JSONB       NOT NULL,
      status     TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
      attempts   INT         NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      sent_at    TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status_time ON webhook_deliveries(status, created_at);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_webhook_deliveries_status_time;
    DROP TABLE IF EXISTS webhook_deliveries;
    DROP TABLE IF EXISTS lead_notification_settings;
  `);
};
```

- [ ] **Step 2:** `pnpm migrate:up` → 输出含 `019_add_lead_notifications`，二次运行 no-op。若本地库不可达，报 DONE_WITH_CONCERNS（迁移也会在 Vercel 构建对 preview/prod 库跑）。
- [ ] **Step 3:** `pnpm migrate:status` 确认 019 applied。
- [ ] **Step 4: Commit** `git add migrations/019_add_lead_notifications.js && git commit -m "feat: 线索通知设置表与 webhook 投递队列"`

---

## Task 2：套餐门控 leadWebhook

**Files:** Modify `lib/plans.ts`, `lib/plans.test.ts`

- [ ] **Step 1:** 读 `lib/plans.ts`。在 `PlanConfig` interface 的 `antiBan: boolean;` 后加：
```ts
  leadWebhook: boolean;     // 线索 webhook 出站（CRM 集成，Pro/Agency）
```

- [ ] **Step 2:** 在四档 PLANS 定义里补 `leadWebhook`：free/starter 为 `false`，pro/agency 为 `true`。定位每档那行（含 `antiBan: ...`）并追加 `leadWebhook: <值>,`。例如 free 行末追加 `leadWebhook: false,`，pro 行 `leadWebhook: true,`。

- [ ] **Step 3:** 加 helper（紧邻 `hasAntiBan`）：
```ts
export function hasLeadWebhook(plan: PlanId): boolean {
  return PLANS[plan].leadWebhook;
}
```

- [ ] **Step 4:** 对比表：在 `PLAN_FEATURE_ROWS` 里 `antiBan` 行之后加一行：
```ts
  { label: "线索 Webhook 推送", desc: "新线索实时 POST 到你的 CRM / Zapier（含签名）", valueFor: (p) => p.leadWebhook },
```

- [ ] **Step 5:** 若 `lib/plans.test.ts` 有「每档 flag 齐全」类断言，补 `leadWebhook`。运行 `pnpm vitest run lib/plans.test.ts lib/plans.antiban.test.ts` → 全绿（先看是否因缺字段变红，再补齐转绿）。

- [ ] **Step 6:** `pnpm tsc --noEmit` → 0。**Commit** `git commit -am "feat: 套餐加 leadWebhook 门控（Pro/Agency）"`（仅 plans 文件）。

---

## Task 3：通知设置 store

**Files:** Create `lib/leads/notify-settings.ts`

> store 直连 pool，本仓靠 e2e/手动覆盖，函数保持薄。

- [ ] **Step 1: 实现**
```ts
import { randomBytes } from "node:crypto";
import pool from "@/lib/db";

export interface LeadNotifySettings {
  user_id: string;
  email_enabled: boolean;
  webhook_enabled: boolean;
  webhook_url: string | null;
  webhook_secret: string | null;
}

/** 该租户设置（不存在返回默认：邮件开、webhook 关）。webhook_secret 不在此处对客户端隐藏——调用方决定。 */
export async function getLeadNotifySettings(userId: string): Promise<LeadNotifySettings> {
  const res = await pool.query(`SELECT * FROM lead_notification_settings WHERE user_id = $1`, [userId]);
  return res.rows[0] ?? { user_id: userId, email_enabled: true, webhook_enabled: false, webhook_url: null, webhook_secret: null };
}

/** upsert 设置。首次配置 webhook 且无密钥时自动生成一枚。返回最终设置。 */
export async function upsertLeadNotifySettings(
  userId: string,
  fields: { email_enabled: boolean; webhook_enabled: boolean; webhook_url: string | null },
): Promise<LeadNotifySettings> {
  const res = await pool.query(
    `INSERT INTO lead_notification_settings (user_id, email_enabled, webhook_enabled, webhook_url, webhook_secret, updated_at)
       VALUES ($1, $2, $3, $4, CASE WHEN $4 IS NOT NULL THEN $5 ELSE NULL END, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       email_enabled = EXCLUDED.email_enabled,
       webhook_enabled = EXCLUDED.webhook_enabled,
       webhook_url = EXCLUDED.webhook_url,
       -- 有 URL 时保留已有密钥、无则生成；清空 URL 时清密钥
       webhook_secret = CASE
         WHEN EXCLUDED.webhook_url IS NULL THEN NULL
         ELSE COALESCE(lead_notification_settings.webhook_secret, EXCLUDED.webhook_secret)
       END,
       updated_at = NOW()
     RETURNING *`,
    [userId, fields.email_enabled, fields.webhook_enabled, fields.webhook_url, randomBytes(24).toString("hex")],
  );
  return res.rows[0];
}

/** 轮换 webhook 密钥（旧密钥立即失效）。返回新密钥或 null（无 URL 时不生成）。 */
export async function rotateWebhookSecret(userId: string): Promise<string | null> {
  const res = await pool.query(
    `UPDATE lead_notification_settings
        SET webhook_secret = CASE WHEN webhook_url IS NOT NULL THEN $2 ELSE webhook_secret END, updated_at = NOW()
      WHERE user_id = $1 RETURNING webhook_secret`,
    [userId, randomBytes(24).toString("hex")],
  );
  return res.rows[0]?.webhook_secret ?? null;
}
```

- [ ] **Step 2:** `pnpm tsc --noEmit` → 0。**Commit** `git commit -am "feat: 线索通知设置 store（读写 + 密钥生成/轮换）"`

---

## Task 4：Webhook HMAC 签名（纯逻辑，TDD）

**Files:** Create `lib/webhooks/sign.ts`, `lib/webhooks/sign.test.ts`

- [ ] **Step 1: 失败测试** `lib/webhooks/sign.test.ts`
```ts
import { describe, it, expect } from "vitest";
import { signWebhookBody, verifyWebhookSignature } from "./sign";

const secret = "whsec_test";
const body = JSON.stringify({ event: "lead.created", id: "1" });

describe("webhook 签名", () => {
  it("签名格式为 sha256=<hex64>", () => {
    const sig = signWebhookBody(body, secret);
    expect(sig).toMatch(/^sha256=[0-9a-f]{64}$/);
  });
  it("同输入稳定、同密钥可校验", () => {
    const sig = signWebhookBody(body, secret);
    expect(verifyWebhookSignature(body, sig, secret)).toBe(true);
  });
  it("改 body 校验失败", () => {
    const sig = signWebhookBody(body, secret);
    expect(verifyWebhookSignature(body + " ", sig, secret)).toBe(false);
  });
  it("换密钥校验失败", () => {
    const sig = signWebhookBody(body, secret);
    expect(verifyWebhookSignature(body, sig, "other")).toBe(false);
  });
  it("畸形签名不抛错，返回 false", () => {
    expect(verifyWebhookSignature(body, "garbage", secret)).toBe(false);
    expect(verifyWebhookSignature(body, "sha256=zz", secret)).toBe(false);
  });
});
```

- [ ] **Step 2:** `pnpm vitest run lib/webhooks/sign.test.ts` → FAIL（模块不存在）。

- [ ] **Step 3: 实现** `lib/webhooks/sign.ts`（镜像 `lib/lemonsqueezy.ts` 的 HMAC + timingSafeEqual）
```ts
// 出站 webhook 签名：X-Zonit-Signature: sha256=<hmac-hex>。镜像 lemonsqueezy 入站校验习惯。
import { createHmac, timingSafeEqual } from "node:crypto";

export function signWebhookBody(rawBody: string, secret: string): string {
  const hex = createHmac("sha256", secret).update(rawBody).digest("hex");
  return `sha256=${hex}`;
}

export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  if (!signature.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signature.slice("sha256=".length), "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}
```

- [ ] **Step 4:** `pnpm vitest run lib/webhooks/sign.test.ts` → 5 passed；`pnpm eslint lib/webhooks/sign.ts lib/webhooks/sign.test.ts` → 0。**Commit** `git commit -am "feat: 出站 webhook HMAC 签名（TDD）"`

---

## Task 5：线索 → webhook payload（纯逻辑，TDD）

**Files:** Create `lib/leads/webhook-payload.ts`, `lib/leads/webhook-payload.test.ts`

- [ ] **Step 1: 失败测试**
```ts
import { describe, it, expect } from "vitest";
import { buildLeadWebhookPayload } from "./webhook-payload";

describe("buildLeadWebhookPayload", () => {
  const input = {
    pageId: "p1", pageName: "牙科落地页",
    fields: { name: "Sara", email: "s@x.com", phone: "+66" },
    channel: "form",
    utm: { utm_source: "meta", utm_medium: "cpc", utm_campaign: "jul" },
    createdAt: "2026-07-19T00:00:00.000Z",
  };
  it("产出稳定契约字段", () => {
    expect(buildLeadWebhookPayload(input)).toEqual({
      event: "lead.created",
      created_at: "2026-07-19T00:00:00.000Z",
      page: { id: "p1", name: "牙科落地页" },
      channel: "form",
      fields: { name: "Sara", email: "s@x.com", phone: "+66" },
      utm: { source: "meta", medium: "cpc", campaign: "jul" },
    });
  });
  it("缺失 utm/channel 用 null 占位，不抛错", () => {
    const out = buildLeadWebhookPayload({ ...input, channel: null, utm: {} });
    expect(out.channel).toBeNull();
    expect(out.utm).toEqual({ source: null, medium: null, campaign: null });
  });
});
```

- [ ] **Step 2:** run → FAIL。

- [ ] **Step 3: 实现** `lib/leads/webhook-payload.ts`
```ts
// 线索 webhook 出站 JSON 契约（对外稳定，勿随意改字段名）。
export interface LeadWebhookInput {
  pageId: string;
  pageName: string;
  fields: Record<string, unknown>;
  channel: string | null;
  utm: { utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null };
  createdAt: string;
}

export interface LeadWebhookPayload {
  event: "lead.created";
  created_at: string;
  page: { id: string; name: string };
  channel: string | null;
  fields: Record<string, unknown>;
  utm: { source: string | null; medium: string | null; campaign: string | null };
}

export function buildLeadWebhookPayload(input: LeadWebhookInput): LeadWebhookPayload {
  return {
    event: "lead.created",
    created_at: input.createdAt,
    page: { id: input.pageId, name: input.pageName },
    channel: input.channel ?? null,
    fields: input.fields,
    utm: {
      source: input.utm.utm_source ?? null,
      medium: input.utm.utm_medium ?? null,
      campaign: input.utm.utm_campaign ?? null,
    },
  };
}
```

- [ ] **Step 4:** run → 2 passed；eslint 0。**Commit** `git commit -am "feat: 线索 webhook payload 契约（TDD）"`

---

## Task 6：webhook_deliveries store + dispatch（状态机 TDD）

**Files:** Create `lib/webhooks/deliveries-store.ts`, `lib/webhooks/dispatch.ts`, `lib/webhooks/dispatch.test.ts`

- [ ] **Step 1: deliveries-store.ts**（镜像 `lib/capi/events-store.ts`）
```ts
import pool from "@/lib/db";

export const MAX_ATTEMPTS = 5;

export interface WebhookDeliveryRow {
  id: string;
  user_id: string;
  page_id: string | null;
  payload: Record<string, unknown>;
  status: "pending" | "sent" | "failed";
  attempts: number;
}

export async function insertDelivery(row: {
  userId: string; pageId: string | null; payload: Record<string, unknown>;
}): Promise<string | null> {
  try {
    const res = await pool.query(
      `INSERT INTO webhook_deliveries (user_id, page_id, payload) VALUES ($1, $2, $3) RETURNING id`,
      [row.userId, row.pageId, JSON.stringify(row.payload)],
    );
    return res.rows[0].id;
  } catch {
    return null;
  }
}

export async function getDeliveriesByIds(ids: string[]): Promise<WebhookDeliveryRow[]> {
  if (ids.length === 0) return [];
  const res = await pool.query(`SELECT * FROM webhook_deliveries WHERE id = ANY($1)`, [ids]);
  return res.rows;
}

export async function getRetryableDeliveries(limit = 100): Promise<WebhookDeliveryRow[]> {
  const res = await pool.query(
    `SELECT * FROM webhook_deliveries
      WHERE status IN ('pending','failed') AND attempts < $1 AND created_at > NOW() - INTERVAL '3 days'
      ORDER BY created_at ASC LIMIT $2`,
    [MAX_ATTEMPTS, limit],
  );
  return res.rows;
}

export async function markSent(id: string): Promise<void> {
  await pool.query(`UPDATE webhook_deliveries SET status='sent', sent_at=NOW(), updated_at=NOW() WHERE id=$1`, [id]);
}

export async function markFailure(id: string, attempts: number, error: string): Promise<void> {
  const next = attempts + 1;
  const status = next >= MAX_ATTEMPTS ? "failed" : "pending";
  await pool.query(
    `UPDATE webhook_deliveries SET attempts=$2, status=$3, last_error=$4, updated_at=NOW() WHERE id=$1`,
    [id, next, status, error.slice(0, 500)],
  );
}
```

- [ ] **Step 2: 失败测试** `lib/webhooks/dispatch.test.ts`（状态机 + 签名头，注入 deps，不碰 DB/网络）
```ts
import { describe, it, expect, vi } from "vitest";
import { deliverOne, type DeliveryDeps } from "./dispatch";
import { verifyWebhookSignature } from "./sign";
import type { WebhookDeliveryRow } from "./deliveries-store";

const row: WebhookDeliveryRow = {
  id: "d1", user_id: "u1", page_id: "p1",
  payload: { event: "lead.created" }, status: "pending", attempts: 0,
};

function deps(over: Partial<DeliveryDeps> = {}): DeliveryDeps {
  return {
    getTarget: async () => ({ url: "https://hook.example.com", secret: "whsec", enabled: true }),
    post: async () => ({ ok: true }),
    markSent: vi.fn(async () => {}),
    markFailure: vi.fn(async () => {}),
    ...over,
  };
}

describe("deliverOne", () => {
  it("成功投递 → markSent，带正确签名头", async () => {
    let seen: { url: string; body: string; signature: string } | null = null;
    const d = deps({ post: async (url, body, signature) => { seen = { url, body, signature }; return { ok: true }; } });
    await deliverOne(row, d);
    expect(d.markSent).toHaveBeenCalledWith("d1");
    expect(d.markFailure).not.toHaveBeenCalled();
    expect(seen!.url).toBe("https://hook.example.com");
    expect(verifyWebhookSignature(seen!.body, seen!.signature, "whsec")).toBe(true);
  });

  it("目标未配置/关闭 → markFailure(no_target)，不 POST", async () => {
    const post = vi.fn(async () => ({ ok: true }));
    const d = deps({ getTarget: async () => null, post });
    await deliverOne(row, d);
    expect(post).not.toHaveBeenCalled();
    expect(d.markFailure).toHaveBeenCalledWith("d1", 0, "no_target");
  });

  it("POST 失败 → markFailure 记录 attempts 与错误", async () => {
    const d = deps({ post: async () => ({ ok: false, error: "http_500" }) });
    await deliverOne(row, d);
    expect(d.markFailure).toHaveBeenCalledWith("d1", 0, "http_500");
    expect(d.markSent).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3:** run → FAIL。

- [ ] **Step 4: 实现** `lib/webhooks/dispatch.ts`（镜像 `lib/capi/dispatch.ts` 的可注入 deps + `after()` 即时 flush）
```ts
import { after } from "next/server";
import { signWebhookBody } from "./sign";
import * as store from "./deliveries-store";
import type { WebhookDeliveryRow } from "./deliveries-store";
import { getLeadNotifySettings } from "@/lib/leads/notify-settings";

export interface DeliveryTarget { url: string; secret: string; enabled: boolean }

export interface DeliveryDeps {
  getTarget: (userId: string) => Promise<DeliveryTarget | null>;
  post: (url: string, body: string, signature: string) => Promise<{ ok: boolean; error?: string }>;
  markSent: (id: string) => Promise<void>;
  markFailure: (id: string, attempts: number, error: string) => Promise<void>;
}

/** 出站 POST：15s 超时，2xx 视为成功。 */
async function httpPost(url: string, body: string, signature: string): Promise<{ ok: boolean; error?: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Zonit-Signature": signature, "User-Agent": "Zonit-Webhook/1" },
      body,
      signal: ctrl.signal,
    });
    return res.ok ? { ok: true } : { ok: false, error: `http_${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.name : "fetch_error" };
  } finally {
    clearTimeout(timer);
  }
}

const defaultDeps: DeliveryDeps = {
  getTarget: async (userId) => {
    const s = await getLeadNotifySettings(userId);
    if (!s.webhook_enabled || !s.webhook_url || !s.webhook_secret) return null;
    return { url: s.webhook_url, secret: s.webhook_secret, enabled: true };
  },
  post: httpPost,
  markSent: store.markSent,
  markFailure: store.markFailure,
};

export async function deliverOne(row: WebhookDeliveryRow, deps: DeliveryDeps = defaultDeps): Promise<void> {
  const target = await deps.getTarget(row.user_id);
  if (!target) { await deps.markFailure(row.id, row.attempts, "no_target"); return; }
  const body = JSON.stringify(row.payload);
  const signature = signWebhookBody(body, target.secret);
  const res = await deps.post(target.url, body, signature);
  if (res.ok) await deps.markSent(row.id);
  else await deps.markFailure(row.id, row.attempts, res.error ?? "send_failed");
}

export async function deliverMany(rows: WebhookDeliveryRow[]): Promise<void> {
  for (const row of rows) await deliverOne(row);
}

/** 入队并在响应后即时投一次。 */
export function enqueueAndFlush(id: string): void {
  after(async () => {
    const rows = await store.getDeliveriesByIds([id]);
    await deliverMany(rows);
  });
}
```

- [ ] **Step 5:** `pnpm vitest run lib/webhooks/dispatch.test.ts` → 3 passed；eslint 0。**Commit** `git commit -m "feat: webhook 投递队列 store 与 dispatch（状态机 TDD）"`

---

## Task 7：邮件通知模板

**Files:** Modify `lib/email.ts`

- [ ] **Step 1:** 在 `lib/email.ts` 末尾加（复用现有 `resend`/`FROM_EMAIL`）：
```ts
export async function sendLeadNotificationEmail({
  to, pageName, fields, dashboardUrl,
}: {
  to: string;
  pageName: string;
  fields: Record<string, unknown>;
  dashboardUrl: string;
}) {
  if (!resend) { console.error("RESEND_API_KEY is not configured"); return { error: "not_configured" }; }
  const rows = Object.entries(fields)
    .filter(([, v]) => typeof v === "string" && v)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666;">${k}</td><td style="padding:4px 0;color:#111;">${String(v)}</td></tr>`)
    .join("");
  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `🎯 新线索 · ${pageName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #eee;border-radius:10px;">
          <h2 style="color:#111;margin:0 0 4px;">收到一条新线索</h2>
          <p style="color:#666;margin:0 0 16px;">来自落地页：<strong>${pageName}</strong></p>
          <table style="border-collapse:collapse;font-size:14px;">${rows || '<tr><td style="color:#999;">（无字段）</td></tr>'}</table>
          <p style="margin-top:24px;"><a href="${dashboardUrl}" style="display:inline-block;background:#0070f3;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">在后台查看</a></p>
          <p style="font-size:12px;color:#999;margin-top:24px;">你可在「设置 → 线索通知」关闭此邮件。</p>
        </div>`,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send lead notification email:", error);
    return { error };
  }
}
```

- [ ] **Step 2:** `pnpm tsc --noEmit` → 0；eslint 0。**Commit** `git commit -am "feat: 新线索邮件通知模板"`

---

## Task 8：编排 notifyNewLead（门控决策 TDD）

**Files:** Create `lib/leads/notify.ts`, `lib/leads/notify.test.ts`

`notifyNewLead` 由线索接口调用：查 owner（email + 设置 + 套餐）→ 邮件开则 `after()` 发信；套餐允许 webhook 且开启且有 URL → 入队 + `after()` flush。纯决策逻辑（要不要发/入队）可注入 deps 做 TDD；真实 `after()`/DB 在集成/手动覆盖。

- [ ] **Step 1: owner 查询**（加到 `lib/leads/notify-settings.ts` 或本文件）：一个按 pageId 取 owner 上下文的查询
```ts
// lib/leads/notify.ts 内部：按 pageId 取 owner 通知上下文（email + 设置 + 页名）。
import pool from "@/lib/db";
import { after } from "next/server";
import { getUserPlan } from "@/lib/plans-db";
import { hasLeadWebhook } from "@/lib/plans";
import { sendLeadNotificationEmail } from "@/lib/email";
import { buildLeadWebhookPayload, type LeadWebhookInput } from "./webhook-payload";
import { insertDelivery } from "@/lib/webhooks/deliveries-store";
import { enqueueAndFlush } from "@/lib/webhooks/dispatch";

interface OwnerCtx {
  userId: string; email: string | null; pageName: string;
  email_enabled: boolean; webhook_enabled: boolean; webhook_url: string | null;
}

async function getOwnerCtx(pageId: string): Promise<OwnerCtx | null> {
  const res = await pool.query(
    `SELECT p.user_id, p.name AS page_name, u.email,
            COALESCE(s.email_enabled, TRUE) AS email_enabled,
            COALESCE(s.webhook_enabled, FALSE) AS webhook_enabled,
            s.webhook_url
       FROM landing_pages p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN lead_notification_settings s ON s.user_id = p.user_id
      WHERE p.id = $1`,
    [pageId],
  );
  const r = res.rows[0];
  if (!r) return null;
  return {
    userId: r.user_id, email: r.email, pageName: r.page_name,
    email_enabled: r.email_enabled, webhook_enabled: r.webhook_enabled, webhook_url: r.webhook_url,
  };
}
```

- [ ] **Step 2:** 决策纯函数（便于 TDD）：给定 ctx + 套餐 → 该发邮件吗 / 该入队 webhook 吗
```ts
export interface NotifyDecision { email: boolean; webhook: boolean }

/** 纯决策：邮件全档（开关 + 有邮箱）；webhook 需套餐允许 + 开关 + 有 URL。 */
export function decideNotify(ctx: {
  email: string | null; email_enabled: boolean;
  webhook_enabled: boolean; webhook_url: string | null; planAllowsWebhook: boolean;
}): NotifyDecision {
  return {
    email: ctx.email_enabled && !!ctx.email,
    webhook: ctx.planAllowsWebhook && ctx.webhook_enabled && !!ctx.webhook_url,
  };
}
```

- [ ] **Step 3:** 编排入口
```ts
export interface NewLeadInput {
  pageId: string;
  fields: Record<string, unknown>;
  channel: string | null;
  utm: LeadWebhookInput["utm"];
  createdAt: string;
  dashboardUrl: string;
}

/** best-effort：任何失败只记录，不抛给调用方（不阻塞线索 204）。 */
export async function notifyNewLead(input: NewLeadInput): Promise<void> {
  const ctx = await getOwnerCtx(input.pageId);
  if (!ctx) return;
  const decision = decideNotify({
    email: ctx.email, email_enabled: ctx.email_enabled,
    webhook_enabled: ctx.webhook_enabled, webhook_url: ctx.webhook_url,
    planAllowsWebhook: hasLeadWebhook(await getUserPlan(ctx.userId)),
  });

  if (decision.email && ctx.email) {
    const to = ctx.email;
    after(() => sendLeadNotificationEmail({
      to, pageName: ctx.pageName, fields: input.fields, dashboardUrl: input.dashboardUrl,
    }));
  }

  if (decision.webhook) {
    const payload = buildLeadWebhookPayload({
      pageId: input.pageId, pageName: ctx.pageName, fields: input.fields,
      channel: input.channel, utm: input.utm, createdAt: input.createdAt,
    });
    const id = await insertDelivery({ userId: ctx.userId, pageId: input.pageId, payload: payload as unknown as Record<string, unknown> });
    if (id) enqueueAndFlush(id);
  }
}
```

- [ ] **Step 4: 失败测试** `lib/leads/notify.test.ts`（只测纯决策 `decideNotify`，覆盖门控矩阵）
```ts
import { describe, it, expect } from "vitest";
import { decideNotify } from "./notify";

const base = { email: "a@b.com", email_enabled: true, webhook_enabled: true, webhook_url: "https://h", planAllowsWebhook: true };

describe("decideNotify 门控", () => {
  it("全开 → 邮件+webhook", () => expect(decideNotify(base)).toEqual({ email: true, webhook: true }));
  it("套餐不允许 webhook → 仅邮件", () => expect(decideNotify({ ...base, planAllowsWebhook: false })).toEqual({ email: true, webhook: false }));
  it("webhook 开关关 → 仅邮件", () => expect(decideNotify({ ...base, webhook_enabled: false })).toEqual({ email: true, webhook: false }));
  it("无 webhook URL → 仅邮件", () => expect(decideNotify({ ...base, webhook_url: null })).toEqual({ email: true, webhook: false }));
  it("邮件开关关 → 无邮件", () => expect(decideNotify({ ...base, email_enabled: false }).email).toBe(false));
  it("无邮箱 → 无邮件", () => expect(decideNotify({ ...base, email: null }).email).toBe(false));
});
```

- [ ] **Step 5:** run（先红后绿）→ 6 passed；`pnpm tsc --noEmit` 0；eslint 0。**Commit** `git commit -m "feat: 线索通知编排 notifyNewLead + 门控决策（TDD）"`

---

## Task 9：接入线索接口

**Files:** Modify `app/api/leads/route.ts`

- [ ] **Step 1:** 顶部 import：
```ts
import { notifyNewLead } from "@/lib/leads/notify";
```

- [ ] **Step 2:** 在 CAPI `enqueueCapiEvents` 的 try/catch 之后、`return new NextResponse(null, { status: 204, ... })` 之前插入 best-effort 通知：
```ts
  // 线索通知（邮件 + webhook）：best-effort，失败不影响线索提交
  try {
    const origin = new URL(request.url).origin;
    await notifyNewLead({
      pageId,
      fields: result.payload as unknown as Record<string, unknown>,
      channel: cap(body.channel, 32) ?? "form",
      utm: { utm_source: cap(utm.utm_source, 128), utm_medium: cap(utm.utm_medium, 128), utm_campaign: cap(utm.utm_campaign, 128) },
      createdAt: new Date().toISOString(),
      dashboardUrl: `${origin}/admin/leads`,
    });
  } catch {
    // 通知失败：忽略，不阻塞 204
  }
```
（`cap`、`utm`、`result.payload`、`pageId` 均为该函数上文已有变量；确认命名一致后落笔。）

- [ ] **Step 3:** `pnpm tsc --noEmit` 0；eslint 0。**Commit** `git commit -am "feat: 线索落库后触发通知（邮件+webhook）"`

---

## Task 10：cron 兜底 + 中间件放行 + vercel.json

**Files:** Create `app/api/cron/webhook-flush/route.ts`; Modify `lib/proxy/auth-proxy.ts`, `lib/proxy/auth-proxy.test.ts`, `vercel.json`

- [ ] **Step 1: cron 路由**（镜像 capi-flush）`app/api/cron/webhook-flush/route.ts`
```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRetryableDeliveries } from "@/lib/webhooks/deliveries-store";
import { deliverMany } from "@/lib/webhooks/dispatch";

/** Vercel Cron 兜底：重投未成功的 webhook。鉴权用 CRON_SECRET。 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const rows = await getRetryableDeliveries();
  await deliverMany(rows);
  return NextResponse.json({ flushed: rows.length });
}
```

- [ ] **Step 2: 中间件放行 `/api/cron`** — `lib/proxy/auth-proxy.ts` `PUBLIC_PATHS` 加（各 cron 路由自身 `CRON_SECRET` 才是门；同时修复 capi-flush 兜底被中间件挡住）：
```ts
  "/api/cron", // Vercel Cron 端点：由各路由的 CRON_SECRET Bearer 自行鉴权
```

- [ ] **Step 3: 补中间件测试** `lib/proxy/auth-proxy.test.ts` 加：
```ts
  it("/api/cron 子路径放行（各路由自身 CRON_SECRET 鉴权）：/api/cron/webhook-flush", () => {
    expect(handleAuth(makeReq("/api/cron/webhook-flush"))).toBeNull();
  });
  it("非 cron 的受保护 /api 未登录仍 401：/api/domains", () => {
    const res = handleAuth(makeReq("/api/domains"));
    expect((res as Response | null)?.status).toBe(401);
  });
```
（放到「公开路径按段边界匹配」describe 内。）

- [ ] **Step 4: vercel.json** — crons 数组加一条（每 10 分钟兜底一次；capi 保持每日）：
```json
    { "path": "/api/cron/webhook-flush", "schedule": "*/10 * * * *" }
```
最终 crons：
```json
  "crons": [
    { "path": "/api/cron/capi-flush", "schedule": "0 0 * * *" },
    { "path": "/api/cron/webhook-flush", "schedule": "*/10 * * * *" }
  ]
```

- [ ] **Step 5:** `pnpm vitest run lib/proxy/auth-proxy.test.ts` 全绿；`pnpm tsc --noEmit` 0；eslint 0。**Commit** `git commit -m "feat: webhook-flush cron + 中间件放行 /api/cron（顺带修复 capi-flush 兜底可达性）"`

---

## Task 11：设置页 UI + 设置 API

**Files:** Create `app/api/lead-notifications/route.ts`, `app/admin/(workspace)/settings/LeadNotificationSettings.tsx`; Modify `app/admin/(workspace)/settings/page.tsx`

- [ ] **Step 1: 设置 API**（owner 隔离；GET 返回时**不下发 webhook_secret 明文**，只回 `hasSecret` 布尔 + URL/开关）
```ts
// app/api/lead-notifications/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getLeadNotifySettings, upsertLeadNotifySettings } from "@/lib/leads/notify-settings";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const s = await getLeadNotifySettings(session.user.id);
  return NextResponse.json({
    email_enabled: s.email_enabled,
    webhook_enabled: s.webhook_enabled,
    webhook_url: s.webhook_url,
    hasSecret: !!s.webhook_secret,
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const url = typeof body.webhook_url === "string" && body.webhook_url.trim() ? body.webhook_url.trim() : null;
  // 基础校验：webhook_url 必须是 http(s) 绝对 URL
  if (url && !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }
  const s = await upsertLeadNotifySettings(session.user.id, {
    email_enabled: body.email_enabled !== false,
    webhook_enabled: body.webhook_enabled === true,
    webhook_url: url,
  });
  return NextResponse.json({
    email_enabled: s.email_enabled, webhook_enabled: s.webhook_enabled,
    webhook_url: s.webhook_url, hasSecret: !!s.webhook_secret, secret: s.webhook_secret,
  });
}
```
> 注：PUT 返回 `secret` 明文一次（首次生成后让用户复制到 CRM 校验用），GET 之后只回 `hasSecret`。若嫌一次性返回也算下发，可改为仅在「刚生成」时返回——阶段实现时按 code review 意见定。

- [ ] **Step 2: 设置卡片**（antd client；Pro/Agency 才显示 webhook 配置，否则升级引导）`app/admin/(workspace)/settings/LeadNotificationSettings.tsx`
```tsx
"use client";
import { useEffect, useState } from "react";
import { Card, Switch, Input, Button, Space, Typography, message, Tag } from "antd";
import { useSession } from "next-auth/react";
import { hasLeadWebhook } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

interface Settings { email_enabled: boolean; webhook_enabled: boolean; webhook_url: string | null; hasSecret: boolean }

export function LeadNotificationSettings() {
  const { data: session } = useSession();
  const plan = (session?.user?.plan ?? "free") as PlanId;
  const webhookAllowed = hasLeadWebhook(plan);
  const [s, setS] = useState<Settings | null>(null);
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [secretOnce, setSecretOnce] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/lead-notifications").then((r) => r.json()).then((d) => { setS(d); setUrl(d.webhook_url ?? ""); }).catch(() => {});
  }, []);

  async function save(next: Partial<Settings>) {
    if (!s) return;
    setSaving(true);
    try {
      const res = await fetch("/api/lead-notifications", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_enabled: next.email_enabled ?? s.email_enabled,
          webhook_enabled: next.webhook_enabled ?? s.webhook_enabled,
          webhook_url: next.webhook_url !== undefined ? next.webhook_url : url,
        }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setS(d); setUrl(d.webhook_url ?? "");
      if (d.secret) setSecretOnce(d.secret);
      message.success("已保存");
    } catch { message.error("保存失败"); } finally { setSaving(false); }
  }

  if (!s) return null;

  return (
    <Card title="线索通知">
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Space>
          <Switch checked={s.email_enabled} loading={saving} onChange={(v) => save({ email_enabled: v })} />
          <span>新线索邮件通知（发送到 {session?.user?.email}）</span>
        </Space>

        <div>
          <Space><span>Webhook 推送到 CRM / Zapier</span>{!webhookAllowed && <Tag color="gold">Pro 及以上</Tag>}</Space>
          {webhookAllowed ? (
            <Space direction="vertical" size={8} style={{ width: "100%", marginTop: 8 }}>
              <Input placeholder="https://your-crm.com/webhook" value={url} onChange={(e) => setUrl(e.target.value)} disabled={saving} />
              <Space>
                <Switch checked={s.webhook_enabled} loading={saving} onChange={(v) => save({ webhook_enabled: v })} />
                <span>启用推送</span>
                <Button type="primary" size="small" loading={saving} onClick={() => save({ webhook_url: url })}>保存 URL</Button>
              </Space>
              {s.hasSecret && <Typography.Text type="secondary">签名密钥已配置，请求头 <code>X-Zonit-Signature: sha256=…</code></Typography.Text>}
              {secretOnce && <Typography.Text type="warning">签名密钥（仅显示一次，请复制）：<code>{secretOnce}</code></Typography.Text>}
            </Space>
          ) : (
            <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
              升级到 Pro 后可把新线索实时推送到你的 CRM / Zapier / Make。
            </Typography.Paragraph>
          )}
        </div>
      </Space>
    </Card>
  );
}
```

- [ ] **Step 3: 挂载** — `app/admin/(workspace)/settings/page.tsx` import 并在账户 Card 后加 `<LeadNotificationSettings />`。

- [ ] **Step 4:** `pnpm tsc --noEmit` 0；`pnpm eslint app/api/lead-notifications/route.ts "app/admin/(workspace)/settings/LeadNotificationSettings.tsx" "app/admin/(workspace)/settings/page.tsx"` 0；`pnpm build` 成功。**Commit** `git commit -m "feat: 设置页线索通知卡片 + 设置 API"`

---

## Task 12：全量验证 + 手动冒烟 + PR

- [ ] **Step 1: 分层验证** `pnpm vitest run && pnpm tsc --noEmit && pnpm eslint . && pnpm build 2>&1 | tail -15` → 全绿；build 路由含 `/api/cron/webhook-flush`、`/api/lead-notifications`。

- [ ] **Step 2: 本地手动冒烟**（dev + 本地库）：Dev Login → 设置页开邮件（验证需要 `RESEND_API_KEY`，无则看日志 `not_configured`）；Pro 账号填 `https://webhook.site/<id>` 开启 webhook 保存 → 提交一条测试线索（`curl POST /api/leads`）→ webhook.site 收到带 `X-Zonit-Signature` 的 POST，且用返回的 secret `verifyWebhookSignature` 通过；关开关后再提交不再收到。

- [ ] **Step 3: 更新路线图** 标记 Phase 2 完成（`docs/superpowers/plans/2026-07-18-产品优先级执行路线.md`）。

- [ ] **Step 4: PR** 按护栏推送 + `gh pr create --base main`。CI 全绿后交用户合并。

---

## Self-Review

**1. Spec coverage（对照 roadmap Phase 2）：** 邮件通知全档（Task 7/8/9）✓；Webhook 队列+cron+签名头（Task 4/6/10）✓；设置页 URL+密钥（Task 11）✓；套餐门控 邮件全档/webhook Pro+（Task 2/8）✓；失败重试退避（Task 6 状态机 + Task 10 cron `*/10`）✓；不做 WhatsApp/Zapier-app（未含）✓。

**2. Placeholder scan：** 各步含完整代码与命令。Task 9 标注「确认上文变量命名一致后落笔」属集成核对，非占位。

**3. Type consistency：** `signWebhookBody`/`verifyWebhookSignature`（Task 4）→ Task 6 dispatch 使用一致；`buildLeadWebhookPayload`/`LeadWebhookInput`（Task 5）→ Task 8 使用一致；`insertDelivery`/`getRetryableDeliveries`/`markSent`/`markFailure`/`WebhookDeliveryRow`（Task 6）→ Task 10 使用一致；`getLeadNotifySettings`/`upsertLeadNotifySettings`（Task 3）→ Task 8/11/dispatch 使用一致；`hasLeadWebhook`（Task 2）→ Task 8/11 使用一致；`sendLeadNotificationEmail`（Task 7）→ Task 8 使用一致。

**4. 风险复核：**
- 出站到用户 URL：15s 超时 + AbortController，避免 fetch 挂起拖住 `after()`/函数实例；错误分类记 `http_<code>`/`fetch_error`。
- SSRF 提示：webhook URL 由**已登录租户**为自己配置，POST 的是自己的线索数据到自己的端点——非匿名攻击面；仍在 PUT 校验 http(s)。若后续要防内网回环可加私网 IP 拦截（记为可选加固，不阻塞）。
- best-effort：`notifyNewLead` 在 leads 路由 try/catch 内，且内部 email/webhook 各自 `after()`/入队，任一失败不影响 204。
- 门控：webhook 双重门（套餐 `hasLeadWebhook` + 用户开关 + URL 存在），`decideNotify` 纯函数覆盖矩阵。
- cron 可达性：`/api/cron` 入白名单后 `CRON_SECRET` 为真门；顺带修好 capi-flush 兜底（此前被中间件 401）。

**5. 依赖顺序：** Task 2（plans flag）需在 Task 8（用 hasLeadWebhook）前；Task 3/4/5/6/7 相互独立可并行；Task 8 依赖 3/5/6/7 + 2；Task 9 依赖 8；Task 10 依赖 6；Task 11 依赖 2/3。按编号顺序执行即满足。
