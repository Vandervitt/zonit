# 服务端转化回传 CAPI（骨架 + Meta + TikTok）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 表单提交转化经服务端 Meta Conversions API / TikTok Events API 回传，与客户端 pixel 用同一 event_id 去重，修复 iOS/拦截导致的归因丢失。

**Architecture:** `lib/capi/` 通用骨架（provider 抽象 + 哈希 + 凭据/事件 store + 派发器）+ Meta/TikTok 适配。LeadForm 双发客户端 pixel（带 event_id）；`/api/leads` 入队 `capi_events`(pending) 并 `after()` 即时 flush；Vercel Cron 兜底重试。凭据存独立表 `page_capi_credentials`，只写不回显。

**Tech Stack:** Next.js 16(App Router)、TypeScript、pg、node-pg-migrate、vitest、Playwright、Vercel Cron。

设计来源:`docs/superpowers/specs/2026-06-25-server-side-capi-design.md`

---

## 两个关键设计裁决（消解 spec 歧义，全程遵守）

1. **consent 信号来源**：LeadForm 以 `typeof window.fbq === "function" || typeof window.ttq === "function"` 作为"追踪当前是否被允许"的代理（`TrackingProvider` 仅在 consent 满足后注入这些 pixel 全局），把布尔 `consent` 随提交发给服务端。`/api/leads` 不加载 draft 判断 consent。服务端：`consent === false` → 跳过入队。
2. **CAPI 启用的服务端真源** = `page_capi_credentials` 是否有该 provider 的凭据行。`PixelConfig.serverSide`（draft 内）仅驱动编辑器 UI 的 token 输入显隐；UI 关闭开关时删除对应凭据行，使二者同步。`enqueueCapiEvents` 只查凭据表，不读 draft。

---

## File Structure

- `types/schema.draft.ts` —（改）`PixelConfig.serverSide?`。
- `lib/capi/types.ts` —（新）`CapiProvider` 接口、`CapiEvent`/`CapiCredential`/`CapiProviderId` 类型。
- `lib/capi/hash.ts` —（新）email/phone 标准化 + SHA-256。
- `lib/capi/providers/meta.ts`、`tiktok.ts`、`index.ts` —（新）两家适配 + 注册表。
- `lib/capi/credentials.ts` —（新）凭据 upsert / 删除 / 取明文 / 取已配置 provider 列表。
- `lib/capi/events-store.ts` —（新）capi_events 读写 + 状态机。
- `lib/capi/dispatch.ts` —（新）`enqueueCapiEvents` + `flushEvents`。
- `migrations/015_add_capi_credentials.js`、`016_add_capi_events.js` —（新）。
- `app/api/capi-credentials/route.ts` —（新）PUT/GET/DELETE（登录）。
- `app/api/leads/route.ts` —（改）POST 接入 enqueue + after flush。
- `app/api/cron/capi-flush/route.ts` —（新）Cron 兜底。
- `vercel.json` —（改）crons。
- `lib/constants/routes.ts` —（改）`apiCapiCredentialsPath`。
- `landing-renderer/sections/LeadForm.tsx` —（改）双发 pixel + event_id + cookie 采集。
- `landing-editor/components/TrackingPanel.tsx` —（改）CAPI 配置区。
- 测试:`lib/capi/*.test.ts`、`e2e/capi.spec.ts`。

---

## Task 1: schema serverSide + capi 类型

**Files:**
- Modify: `types/schema.draft.ts`
- Create: `lib/capi/types.ts`

- [ ] **Step 1: schema 加 serverSide**

在 `types/schema.draft.ts` 的 `PixelConfig` 接口加字段：
```ts
  serverSide?: boolean;  // 是否对该 provider 启用服务端 CAPI（仅 meta/tiktok），非敏感，可进 draft
```

- [ ] **Step 2: 新建 capi 类型**

`lib/capi/types.ts`:
```ts
// lib/capi/types.ts
// CAPI 骨架公共类型与 provider 接口。
export type CapiProviderId = "meta" | "tiktok";

export interface CapiCredential {
  provider: CapiProviderId;
  accessToken: string;
  externalId: string; // Meta dataset id / TikTok pixel code
}

/** 待回传事件（PII 已哈希；不含明文）。 */
export interface CapiEvent {
  eventName: string; // 'Lead'(meta) / 'SubmitForm'(tiktok)
  eventId: string;   // 与客户端 pixel 共享，去重
  emailHash?: string;
  phoneHash?: string;
  fbp?: string;
  fbc?: string;
  ttp?: string;
  ttclid?: string;
  clientIp?: string;
  userAgent?: string;
  eventTime: number; // 秒级 unix 时间
  sourceUrl?: string;
}

export interface CapiSendResult {
  ok: boolean;
  error?: string;
}

export interface CapiProvider {
  readonly id: CapiProviderId;
  /** 该 provider 的转化事件名（Meta=Lead / TikTok=SubmitForm）。 */
  readonly eventName: string;
  buildPayload(ev: CapiEvent, cred: CapiCredential): unknown;
  send(body: unknown, cred: CapiCredential): Promise<CapiSendResult>;
}
```

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无输出

- [ ] **Step 4: 提交**

```bash
git add types/schema.draft.ts lib/capi/types.ts
git commit -m "feat: CAPI 骨架类型 + PixelConfig.serverSide"
```

---

## Task 2: 迁移（凭据表 + 事件表）

**Files:**
- Create: `migrations/015_add_capi_credentials.js`
- Create: `migrations/016_add_capi_events.js`

- [ ] **Step 1: 凭据表迁移**

`migrations/015_add_capi_credentials.js`:
```js
/** @type {import('node-pg-migrate').MigrationBuilder} */
// CAPI 凭据：用户的服务端 Access Token，仅服务端读、永不下发客户端。
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS page_capi_credentials (
      id           BIGSERIAL   PRIMARY KEY,
      page_id      TEXT        NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
      provider     TEXT        NOT NULL CHECK (provider IN ('meta','tiktok')),
      access_token TEXT        NOT NULL,
      external_id  TEXT        NOT NULL,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (page_id, provider)
    );
  `);
};
exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS page_capi_credentials;`);
};
```

- [ ] **Step 2: 事件表迁移**

`migrations/016_add_capi_events.js`:
```js
/** @type {import('node-pg-migrate').MigrationBuilder} */
// CAPI 待回传事件队列（状态机）。payload 中 email/phone 为 SHA-256 哈希，不存明文。
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS capi_events (
      id          BIGSERIAL   PRIMARY KEY,
      page_id     TEXT        NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
      provider    TEXT        NOT NULL,
      event_name  TEXT        NOT NULL,
      event_id    TEXT        NOT NULL,
      payload     JSONB       NOT NULL,
      status      TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
      attempts    INT         NOT NULL DEFAULT 0,
      last_error  TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      sent_at     TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_capi_events_status_time ON capi_events(status, created_at);
  `);
};
exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_capi_events_status_time;
    DROP TABLE IF EXISTS capi_events;
  `);
};
```

- [ ] **Step 3: 应用迁移并校验**

Run: `docker exec zapbridge-pg-dev pg_isready -U postgres -d zapbridge && pnpm migrate:up`
Expected: `Migrations complete!`

Run: `docker exec zapbridge-pg-dev psql -U postgres -d zapbridge -c "\dt page_capi_credentials capi_events"`
Expected: 两表都在

- [ ] **Step 4: 提交**

```bash
git add migrations/015_add_capi_credentials.js migrations/016_add_capi_events.js
git commit -m "feat: CAPI 凭据表 + 事件队列表迁移"
```

---

## Task 3: 哈希工具（TDD）

**Files:**
- Create: `lib/capi/hash.ts`
- Test: `lib/capi/hash.test.ts`

- [ ] **Step 1: 写失败测试**

`lib/capi/hash.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { normalizeEmail, normalizePhone, sha256, hashEmail, hashPhone } from "./hash";

describe("normalize", () => {
  it("email 小写去空格", () => {
    expect(normalizeEmail("  Tom@Example.COM ")).toBe("tom@example.com");
  });
  it("phone 去非数字（保留数字）", () => {
    expect(normalizePhone("+1 (555) 010-0199")).toBe("15550100199");
  });
});

describe("sha256", () => {
  it("已知向量", () => {
    // echo -n "abc" | sha256sum
    expect(sha256("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("hashEmail/hashPhone", () => {
  it("先标准化再哈希；空值返回 undefined", () => {
    expect(hashEmail("Tom@Example.com")).toBe(sha256("tom@example.com"));
    expect(hashEmail("")).toBeUndefined();
    expect(hashPhone("+1 555 010 0199")).toBe(sha256("15550100199"));
    expect(hashPhone(undefined)).toBeUndefined();
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run lib/capi/hash.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 写实现**

`lib/capi/hash.ts`:
```ts
// lib/capi/hash.ts
// CAPI 用户数据标准化 + SHA-256（平台要求小写/去格式后哈希）。
import { createHash } from "node:crypto";

export function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** 仅保留数字（去 +、空格、括号、横线）。 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function hashEmail(email?: string): string | undefined {
  if (!email || !email.trim()) return undefined;
  return sha256(normalizeEmail(email));
}

export function hashPhone(phone?: string): string | undefined {
  if (!phone || !phone.trim()) return undefined;
  const n = normalizePhone(phone);
  return n ? sha256(n) : undefined;
}
```

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run lib/capi/hash.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add lib/capi/hash.ts lib/capi/hash.test.ts
git commit -m "feat: CAPI 哈希工具 normalizeEmail/Phone + sha256"
```

---

## Task 4: Meta/TikTok provider 适配（TDD buildPayload）

**Files:**
- Create: `lib/capi/providers/meta.ts`
- Create: `lib/capi/providers/tiktok.ts`
- Create: `lib/capi/providers/index.ts`
- Test: `lib/capi/providers/providers.test.ts`

- [ ] **Step 1: 写失败测试**

`lib/capi/providers/providers.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { metaProvider } from "./meta";
import { tiktokProvider } from "./tiktok";
import { getProvider } from "./index";
import type { CapiEvent, CapiCredential } from "../types";

const ev: CapiEvent = {
  eventName: "Lead", eventId: "evt-1",
  emailHash: "e_hash", phoneHash: "p_hash",
  fbp: "fb.1.1.1", fbc: "fbc.1", clientIp: "1.2.3.4", userAgent: "UA",
  eventTime: 1700000000, sourceUrl: "https://x.com/p",
};
const cred: CapiCredential = { provider: "meta", accessToken: "tok", externalId: "ds1" };

describe("metaProvider.buildPayload", () => {
  it("结构含 data[0] + 哈希 user_data + event_id，省略空字段", () => {
    const b = metaProvider.buildPayload(ev, cred) as any;
    expect(b.data[0].event_name).toBe("Lead");
    expect(b.data[0].event_id).toBe("evt-1");
    expect(b.data[0].action_source).toBe("website");
    expect(b.data[0].user_data.em).toEqual(["e_hash"]);
    expect(b.data[0].user_data.ph).toEqual(["p_hash"]);
    expect(b.data[0].user_data.fbp).toBe("fb.1.1.1");
    expect(b.data[0].user_data.client_ip_address).toBe("1.2.3.4");
  });
  it("无 emailHash 时不含 em", () => {
    const b = metaProvider.buildPayload({ ...ev, emailHash: undefined }, cred) as any;
    expect(b.data[0].user_data.em).toBeUndefined();
  });
});

describe("tiktokProvider.buildPayload", () => {
  it("结构含 event_source/data + 哈希 user + event_id", () => {
    const c: CapiCredential = { provider: "tiktok", accessToken: "t", externalId: "pix1" };
    const e: CapiEvent = { ...ev, eventName: "SubmitForm", ttp: "ttp1", ttclid: "ttc1" };
    const b = tiktokProvider.buildPayload(e, c) as any;
    expect(b.event_source).toBe("web");
    expect(b.event_source_id).toBe("pix1");
    expect(b.data[0].event).toBe("SubmitForm");
    expect(b.data[0].event_id).toBe("evt-1");
    expect(b.data[0].user.email).toEqual(["e_hash"]);
    expect(b.data[0].user.ttp).toBe("ttp1");
  });
});

describe("getProvider", () => {
  it("按 id 取适配器", () => {
    expect(getProvider("meta").id).toBe("meta");
    expect(getProvider("tiktok").id).toBe("tiktok");
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run lib/capi/providers/providers.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 写 Meta 适配**

`lib/capi/providers/meta.ts`:
```ts
// lib/capi/providers/meta.ts
// Meta Conversions API 适配。
import type { CapiProvider, CapiEvent, CapiCredential, CapiSendResult } from "../types";

const GRAPH_VERSION = "v21.0";

function dropEmpty<T extends Record<string, unknown>>(obj: T): T {
  for (const k of Object.keys(obj)) if (obj[k] === undefined) delete obj[k];
  return obj;
}

export const metaProvider: CapiProvider = {
  id: "meta",
  eventName: "Lead",

  buildPayload(ev: CapiEvent, _cred: CapiCredential) {
    const user_data = dropEmpty({
      em: ev.emailHash ? [ev.emailHash] : undefined,
      ph: ev.phoneHash ? [ev.phoneHash] : undefined,
      fbp: ev.fbp,
      fbc: ev.fbc,
      client_ip_address: ev.clientIp,
      client_user_agent: ev.userAgent,
    });
    return {
      data: [
        dropEmpty({
          event_name: ev.eventName,
          event_time: ev.eventTime,
          event_id: ev.eventId,
          action_source: "website",
          event_source_url: ev.sourceUrl,
          user_data,
        }),
      ],
    };
  },

  async send(body: unknown, cred: CapiCredential): Promise<CapiSendResult> {
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${cred.externalId}/events?access_token=${encodeURIComponent(cred.accessToken)}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return { ok: false, error: `meta ${res.status}: ${text.slice(0, 300)}` };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "meta network error" };
    }
  },
};
```

- [ ] **Step 4: 写 TikTok 适配**

`lib/capi/providers/tiktok.ts`:
```ts
// lib/capi/providers/tiktok.ts
// TikTok Events API 适配。
import type { CapiProvider, CapiEvent, CapiCredential, CapiSendResult } from "../types";

const ENDPOINT = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

function dropEmpty<T extends Record<string, unknown>>(obj: T): T {
  for (const k of Object.keys(obj)) if (obj[k] === undefined) delete obj[k];
  return obj;
}

export const tiktokProvider: CapiProvider = {
  id: "tiktok",
  eventName: "SubmitForm",

  buildPayload(ev: CapiEvent, cred: CapiCredential) {
    const user = dropEmpty({
      email: ev.emailHash ? [ev.emailHash] : undefined,
      phone: ev.phoneHash ? [ev.phoneHash] : undefined,
      ttp: ev.ttp,
      ttclid: ev.ttclid,
      ip: ev.clientIp,
      user_agent: ev.userAgent,
    });
    return {
      event_source: "web",
      event_source_id: cred.externalId,
      data: [
        dropEmpty({
          event: ev.eventName,
          event_time: ev.eventTime,
          event_id: ev.eventId,
          user,
          page: ev.sourceUrl ? { url: ev.sourceUrl } : undefined,
        }),
      ],
    };
  },

  async send(body: unknown, cred: CapiCredential): Promise<CapiSendResult> {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Access-Token": cred.accessToken },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return { ok: false, error: `tiktok ${res.status}: ${text.slice(0, 300)}` };
      }
      // TikTok 200 也可能 code!=0；读 code 判定
      const json = (await res.json().catch(() => null)) as { code?: number; message?: string } | null;
      if (json && typeof json.code === "number" && json.code !== 0) {
        return { ok: false, error: `tiktok code ${json.code}: ${json.message ?? ""}` };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "tiktok network error" };
    }
  },
};
```

- [ ] **Step 5: 写注册表**

`lib/capi/providers/index.ts`:
```ts
// lib/capi/providers/index.ts
import type { CapiProvider, CapiProviderId } from "../types";
import { metaProvider } from "./meta";
import { tiktokProvider } from "./tiktok";

const REGISTRY: Record<CapiProviderId, CapiProvider> = {
  meta: metaProvider,
  tiktok: tiktokProvider,
};

export function getProvider(id: CapiProviderId): CapiProvider {
  return REGISTRY[id];
}
```

- [ ] **Step 6: 运行确认通过 + tsc**

Run: `npx vitest run lib/capi/providers/providers.test.ts && npx tsc --noEmit`
Expected: PASS + 无 tsc 输出

- [ ] **Step 7: 提交**

```bash
git add lib/capi/providers
git commit -m "feat: CAPI Meta/TikTok provider 适配 + 注册表"
```

---

## Task 5: 凭据 store + 事件 store

**Files:**
- Create: `lib/capi/credentials.ts`
- Create: `lib/capi/events-store.ts`

- [ ] **Step 1: 凭据 store**

`lib/capi/credentials.ts`:
```ts
// lib/capi/credentials.ts
// CAPI 凭据读写：upsert / 删除 / 取明文（服务端发送用）/ 取已配置 provider（前端用，不含 token）。
import pool from "@/lib/db";
import type { CapiCredential, CapiProviderId } from "./types";

/** upsert 凭据（按 page+provider 覆盖）。需先校验 page 属于该 user（调用方负责）。 */
export async function upsertCredential(pageId: string, provider: CapiProviderId, accessToken: string, externalId: string): Promise<void> {
  await pool.query(
    `INSERT INTO page_capi_credentials (page_id, provider, access_token, external_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (page_id, provider)
     DO UPDATE SET access_token = EXCLUDED.access_token, external_id = EXCLUDED.external_id, updated_at = NOW()`,
    [pageId, provider, accessToken, externalId],
  );
}

export async function deleteCredential(pageId: string, provider: CapiProviderId): Promise<void> {
  await pool.query(`DELETE FROM page_capi_credentials WHERE page_id = $1 AND provider = $2`, [pageId, provider]);
}

/** 取该 page 的全部凭据明文（服务端发送用）。 */
export async function getCredentials(pageId: string): Promise<CapiCredential[]> {
  const res = await pool.query(
    `SELECT provider, access_token, external_id FROM page_capi_credentials WHERE page_id = $1`,
    [pageId],
  );
  return res.rows.map((r) => ({ provider: r.provider, accessToken: r.access_token, externalId: r.external_id }));
}

/** 取已配置的 provider 列表（前端用，不含 token）。 */
export async function listConfiguredProviders(pageId: string): Promise<{ provider: CapiProviderId; configured: true }[]> {
  const res = await pool.query(`SELECT provider FROM page_capi_credentials WHERE page_id = $1`, [pageId]);
  return res.rows.map((r) => ({ provider: r.provider, configured: true as const }));
}

/** 校验 page 归属（凭据写接口鉴权用）。 */
export async function pageOwnedBy(pageId: string, userId: string): Promise<boolean> {
  const res = await pool.query(`SELECT 1 FROM landing_pages WHERE id = $1 AND user_id = $2`, [pageId, userId]);
  return res.rows.length > 0;
}
```

- [ ] **Step 2: 事件 store**

`lib/capi/events-store.ts`:
```ts
// lib/capi/events-store.ts
// capi_events 读写 + 状态机。
import pool from "@/lib/db";
import type { CapiProviderId } from "./types";

export const MAX_ATTEMPTS = 5;

export interface CapiEventRow {
  id: string;
  page_id: string;
  provider: CapiProviderId;
  event_name: string;
  event_id: string;
  payload: Record<string, unknown>;
  status: "pending" | "sent" | "failed";
  attempts: number;
}

/** 入队一条 pending 事件，返回新行 id。 */
export async function insertEvent(row: {
  pageId: string; provider: CapiProviderId; eventName: string; eventId: string; payload: Record<string, unknown>;
}): Promise<string | null> {
  try {
    const res = await pool.query(
      `INSERT INTO capi_events (page_id, provider, event_name, event_id, payload)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [row.pageId, row.provider, row.eventName, row.eventId, JSON.stringify(row.payload)],
    );
    return res.rows[0].id;
  } catch {
    // 坏 page_id 等 FK 错误：best-effort 忽略
    return null;
  }
}

export async function getEventsByIds(ids: string[]): Promise<CapiEventRow[]> {
  if (ids.length === 0) return [];
  const res = await pool.query(`SELECT * FROM capi_events WHERE id = ANY($1)`, [ids]);
  return res.rows;
}

/** 取待重试事件（cron 用）。 */
export async function getRetryableEvents(limit = 100): Promise<CapiEventRow[]> {
  const res = await pool.query(
    `SELECT * FROM capi_events
      WHERE status IN ('pending','failed') AND attempts < $1 AND created_at > NOW() - INTERVAL '3 days'
      ORDER BY created_at ASC LIMIT $2`,
    [MAX_ATTEMPTS, limit],
  );
  return res.rows;
}

export async function markSent(id: string): Promise<void> {
  await pool.query(`UPDATE capi_events SET status='sent', sent_at=NOW(), updated_at=NOW() WHERE id=$1`, [id]);
}

/** 记录一次失败：attempts+1，达上限置 failed 终态，否则保持 pending。 */
export async function markFailure(id: string, attempts: number, error: string): Promise<void> {
  const next = attempts + 1;
  const status = next >= MAX_ATTEMPTS ? "failed" : "pending";
  await pool.query(
    `UPDATE capi_events SET attempts=$2, status=$3, last_error=$4, updated_at=NOW() WHERE id=$1`,
    [id, next, status, error.slice(0, 500)],
  );
}
```

- [ ] **Step 3: 类型检查 + lint**

Run: `npx tsc --noEmit && npx eslint lib/capi/credentials.ts lib/capi/events-store.ts`
Expected: 均无错误

- [ ] **Step 4: 提交**

```bash
git add lib/capi/credentials.ts lib/capi/events-store.ts
git commit -m "feat: CAPI 凭据 store + 事件队列 store（状态机）"
```

---

## Task 6: 派发器 enqueue + flush（TDD）

**Files:**
- Create: `lib/capi/dispatch.ts`
- Test: `lib/capi/dispatch.test.ts`

- [ ] **Step 1: 写失败测试**（用依赖注入避免打 DB / 真网络）

`lib/capi/dispatch.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";
import { flushOne, type FlushDeps } from "./dispatch";
import type { CapiEventRow } from "./events-store";

const row: CapiEventRow = {
  id: "1", page_id: "p1", provider: "meta", event_name: "Lead", event_id: "e1",
  payload: { eventName: "Lead", eventId: "e1", emailHash: "h", eventTime: 1700000000 },
  status: "pending", attempts: 0,
};

function deps(over: Partial<FlushDeps>): FlushDeps {
  return {
    getCredentials: async () => [{ provider: "meta", accessToken: "t", externalId: "d" }],
    send: async () => ({ ok: true }),
    markSent: async () => {},
    markFailure: async () => {},
    ...over,
  };
}

describe("flushOne", () => {
  it("发送成功 → markSent", async () => {
    const markSent = vi.fn(async () => {});
    await flushOne(row, deps({ markSent }));
    expect(markSent).toHaveBeenCalledWith("1");
  });
  it("无凭据 → markFailure", async () => {
    const markFailure = vi.fn(async () => {});
    await flushOne(row, deps({ getCredentials: async () => [], markFailure }));
    expect(markFailure).toHaveBeenCalled();
  });
  it("发送失败 → markFailure 带 attempts", async () => {
    const markFailure = vi.fn(async () => {});
    await flushOne(row, deps({ send: async () => ({ ok: false, error: "boom" }), markFailure }));
    expect(markFailure).toHaveBeenCalledWith("1", 0, expect.stringContaining("boom"));
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run lib/capi/dispatch.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 写实现**

`lib/capi/dispatch.ts`:
```ts
// lib/capi/dispatch.ts
// 派发器：把 lead 转化入队为 capi_events，并发送（即时 / cron）。
import { after } from "next/server";
import type { CapiCredential, CapiEvent, CapiProviderId } from "./types";
import { getProvider } from "./providers";
import { hashEmail, hashPhone } from "./hash";
import * as store from "./events-store";
import type { CapiEventRow } from "./events-store";
import { getCredentials } from "./credentials";

/** flushOne 的可注入依赖（便于单测）。 */
export interface FlushDeps {
  getCredentials: (pageId: string) => Promise<CapiCredential[]>;
  send: (body: unknown, cred: CapiCredential) => Promise<{ ok: boolean; error?: string }>;
  markSent: (id: string) => Promise<void>;
  markFailure: (id: string, attempts: number, error: string) => Promise<void>;
}

const defaultDeps: FlushDeps = {
  getCredentials,
  send: (body, cred) => getProvider(cred.provider).send(body, cred),
  markSent: store.markSent,
  markFailure: store.markFailure,
};

/** 发送单条事件并更新状态。 */
export async function flushOne(row: CapiEventRow, deps: FlushDeps = defaultDeps): Promise<void> {
  const creds = await deps.getCredentials(row.page_id);
  const cred = creds.find((c) => c.provider === row.provider);
  if (!cred) {
    await deps.markFailure(row.id, row.attempts, "missing_credential");
    return;
  }
  const provider = getProvider(row.provider);
  const body = provider.buildPayload(row.payload as unknown as CapiEvent, cred);
  const res = await deps.send(body, cred);
  if (res.ok) await deps.markSent(row.id);
  else await deps.markFailure(row.id, row.attempts, res.error ?? "send_failed");
}

/** 批量发送（cron / 即时）。 */
export async function flushEvents(rows: CapiEventRow[]): Promise<void> {
  for (const row of rows) await flushOne(row);
}

export interface LeadContext {
  email?: string;
  phone?: string;
  eventId: string;
  fbp?: string; fbc?: string; ttp?: string; ttclid?: string;
  clientIp?: string; userAgent?: string; sourceUrl?: string;
  consent: boolean;
}

/**
 * 为该 page 已配凭据的 provider 入队 CAPI 事件，并在响应后即时 flush 一次。
 * consent=false 直接跳过（与客户端 pixel 行为一致）。
 */
export async function enqueueCapiEvents(pageId: string, ctx: LeadContext): Promise<void> {
  if (!ctx.consent) return;
  const creds = await getCredentials(pageId);
  if (creds.length === 0) return;

  const emailHash = hashEmail(ctx.email);
  const phoneHash = hashPhone(ctx.phone);
  const eventTime = Math.floor(Date.now() / 1000);
  const ids: string[] = [];

  for (const cred of creds) {
    const provider = getProvider(cred.provider);
    const payload: CapiEvent = {
      eventName: provider.eventName,
      eventId: ctx.eventId,
      emailHash, phoneHash,
      fbp: cred.provider === "meta" ? ctx.fbp : undefined,
      fbc: cred.provider === "meta" ? ctx.fbc : undefined,
      ttp: cred.provider === "tiktok" ? ctx.ttp : undefined,
      ttclid: cred.provider === "tiktok" ? ctx.ttclid : undefined,
      clientIp: ctx.clientIp,
      userAgent: ctx.userAgent,
      eventTime,
      sourceUrl: ctx.sourceUrl,
    };
    const id = await store.insertEvent({
      pageId, provider: cred.provider as CapiProviderId, eventName: provider.eventName,
      eventId: ctx.eventId, payload: payload as unknown as Record<string, unknown>,
    });
    if (id) ids.push(id);
  }

  // 即时 flush（响应后异步，不阻塞用户）。
  if (ids.length > 0) {
    after(async () => {
      const rows = await store.getEventsByIds(ids);
      await flushEvents(rows);
    });
  }
}
```
> 注：`after` 的导入路径需按 Next 16 实际为准（`import { after } from "next/server"`）。动手前查 `node_modules/next/dist/docs` 确认；若该 API 名称/路径不同，按文档调整；最坏退化为 fire-and-forget（`void (async()=>{...})()`）+ try/catch，不阻塞响应。

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run lib/capi/dispatch.test.ts`
Expected: PASS（3 tests）

- [ ] **Step 5: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无输出（如 `after` 导入报错，按上方注释依 Next 16 文档修正后再跑）

- [ ] **Step 6: 提交**

```bash
git add lib/capi/dispatch.ts lib/capi/dispatch.test.ts
git commit -m "feat: CAPI 派发器 enqueueCapiEvents + flush（依赖注入可测）"
```

---

## Task 7: 凭据 API（PUT/GET/DELETE）+ 路由常量

**Files:**
- Create: `app/api/capi-credentials/route.ts`
- Modify: `lib/constants/routes.ts`

- [ ] **Step 1: 路由常量**

在 `lib/constants/routes.ts` 路径助手区加：
```ts
export const apiCapiCredentialsPath = (pageId: string) => `/api/capi-credentials?pageId=${encodeURIComponent(pageId)}`;
```

- [ ] **Step 2: 新建路由**

`app/api/capi-credentials/route.ts`:
```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { upsertCredential, deleteCredential, listConfiguredProviders, pageOwnedBy } from "@/lib/capi/credentials";
import type { CapiProviderId } from "@/lib/capi/types";

const PROVIDERS: CapiProviderId[] = ["meta", "tiktok"];
const isProvider = (v: unknown): v is CapiProviderId => typeof v === "string" && PROVIDERS.includes(v as CapiProviderId);

/** 列出该 page 已配置的 provider（不含 token）。 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const pageId = request.nextUrl.searchParams.get("pageId") ?? "";
  if (!pageId || !(await pageOwnedBy(pageId, session.user.id)))
    return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json(await listConfiguredProviders(pageId));
}

/** upsert 凭据。 */
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const { pageId, provider, accessToken, externalId } = body as Record<string, unknown>;
  if (typeof pageId !== "string" || !isProvider(provider) || typeof accessToken !== "string" || typeof externalId !== "string"
      || !accessToken.trim() || !externalId.trim())
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  if (!(await pageOwnedBy(pageId, session.user.id)))
    return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  await upsertCredential(pageId, provider, accessToken.trim(), externalId.trim());
  return NextResponse.json({ ok: true });
}

/** 删除凭据（UI 关闭 serverSide 时）。 */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const pageId = request.nextUrl.searchParams.get("pageId") ?? "";
  const provider = request.nextUrl.searchParams.get("provider") ?? "";
  if (!pageId || !isProvider(provider)) return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  if (!(await pageOwnedBy(pageId, session.user.id)))
    return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  await deleteCredential(pageId, provider);
  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 3: 类型检查 + lint**

Run: `npx tsc --noEmit && npx eslint "app/api/capi-credentials/route.ts" lib/constants/routes.ts`
Expected: 均无错误（Next 16 新路由若 RouteContext 报错先 `npx next typegen`）

- [ ] **Step 4: 提交**

```bash
git add "app/api/capi-credentials/route.ts" lib/constants/routes.ts
git commit -m "feat: CAPI 凭据 API（PUT/GET/DELETE，只写不回显，按 page 归属鉴权）"
```

---

## Task 8: /api/leads 接入 CAPI 入队

**Files:**
- Modify: `app/api/leads/route.ts`

- [ ] **Step 1: 接入 enqueue**

在 `app/api/leads/route.ts` import 区加：
```ts
import { enqueueCapiEvents } from "@/lib/capi/dispatch";
```
在 POST 函数中、`insertLead(...)` 的 `try {...} catch {...}` 之后、`return new NextResponse(null, { status: 204, headers: CORS })` 之前插入：
```ts
  // CAPI：表单转化服务端回传（失败不影响 lead 提交）
  try {
    await enqueueCapiEvents(pageId, {
      email: typeof result.payload.email === "string" ? result.payload.email : undefined,
      phone: typeof result.payload.phone === "string" ? result.payload.phone : undefined,
      eventId: cap(body.event_id, 64) ?? "",
      fbp: cap(body.fbp, 256) ?? undefined,
      fbc: cap(body.fbc, 256) ?? undefined,
      ttp: cap(body.ttp, 256) ?? undefined,
      ttclid: cap(body.ttclid, 256) ?? undefined,
      clientIp: ip !== "unknown" ? ip : undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
      sourceUrl: cap(body.source_url, 512) ?? undefined,
      consent: body.consent !== false, // 默认允许；客户端显式 false 才跳过
    });
  } catch {
    // CAPI 入队失败：best-effort 忽略，不影响线索提交
  }
```
> 说明：`result.payload` 来自 `validateLeadSubmission`（含 email/phone 明文，仅此处临时用于哈希，不写入 capi_events 明文）。`eventId` 为空时仍入队（无去重但不报错）；正常客户端总会带。

- [ ] **Step 2: 类型检查 + lint**

Run: `npx tsc --noEmit && npx eslint "app/api/leads/route.ts"`
Expected: 均无错误

- [ ] **Step 3: 提交**

```bash
git add "app/api/leads/route.ts"
git commit -m "feat: /api/leads 接入 CAPI 入队 + 即时 flush"
```

---

## Task 9: Cron 兜底端点 + vercel.json

**Files:**
- Create: `app/api/cron/capi-flush/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Cron 端点**

`app/api/cron/capi-flush/route.ts`:
```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRetryableEvents } from "@/lib/capi/events-store";
import { flushEvents } from "@/lib/capi/dispatch";

/** Vercel Cron 兜底：重发未成功的 CAPI 事件。鉴权用 CRON_SECRET。 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const rows = await getRetryableEvents();
  await flushEvents(rows);
  return NextResponse.json({ flushed: rows.length });
}
```

- [ ] **Step 2: vercel.json 加 cron**

把 `vercel.json` 的 `"crons": []` 改为：
```json
  "crons": [
    { "path": "/api/cron/capi-flush", "schedule": "*/10 * * * *" }
  ]
```

- [ ] **Step 3: 类型检查 + lint**

Run: `npx tsc --noEmit && npx eslint "app/api/cron/capi-flush/route.ts"`
Expected: 均无错误

- [ ] **Step 4: 提交**

```bash
git add "app/api/cron/capi-flush/route.ts" vercel.json
git commit -m "feat: CAPI Cron 兜底重发端点 + vercel crons（CRON_SECRET 鉴权）"
```

---

## Task 10: 客户端 LeadForm 双发 pixel + event_id

**Files:**
- Modify: `landing-renderer/sections/LeadForm.tsx`

- [ ] **Step 1: 加 cookie/pixel 辅助 + 改 submit**

在 `landing-renderer/sections/LeadForm.tsx` 顶部（组件外）加辅助函数：
```tsx
function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : undefined;
}

interface FbqWin { fbq?: (...a: unknown[]) => void; ttq?: { track?: (n: string, p?: unknown, o?: unknown) => void } }

/** 表单转化双发客户端 pixel（与服务端 CAPI 同 event_id 去重）；返回 tracking 是否被允许。 */
function fireClientPixels(eventId: string): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as FbqWin;
  let fired = false;
  if (typeof w.fbq === "function") { w.fbq("track", "Lead", {}, { eventID: eventId }); fired = true; }
  if (w.ttq?.track) { w.ttq.track("SubmitForm", {}, { event_id: eventId }); fired = true; }
  return fired;
}
```
把 `submit` 改为（在 fetch 前生成 event_id、双发、采集 cookie；扩展 body）：
```tsx
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const utm = typeof window !== "undefined" ? parseUtm(window.location.search) : {};
      const eventId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      const consent = fireClientPixels(eventId); // 同时作为"追踪是否允许"信号
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId, channel: "form", fields: values, utm, company_url: honey,
          event_id: eventId,
          fbp: readCookie("_fbp"),
          fbc: readCookie("_fbc"),
          ttp: readCookie("_ttp"),
          ttclid: readCookie("ttclid"),
          source_url: typeof window !== "undefined" ? window.location.href : undefined,
          consent,
        }),
      });
      if (!res.ok && res.status !== 204) { setStatus("error"); return; }
      setStatus("done");
      setValues({});
    } catch {
      setStatus("error");
    }
  };
```

- [ ] **Step 2: 类型检查 + lint**

Run: `npx tsc --noEmit && npx eslint landing-renderer/sections/LeadForm.tsx`
Expected: 均无错误

- [ ] **Step 3: 提交**

```bash
git add landing-renderer/sections/LeadForm.tsx
git commit -m "feat: LeadForm 双发客户端 pixel + event_id + cookie 采集"
```

---

## Task 11: 编辑器 TrackingPanel CAPI 配置区

**Files:**
- Modify: `landing-editor/components/TrackingPanel.tsx`

- [ ] **Step 1: 读取 pageId 来源**

确认 pageId 来源：`landing-editor/MetaContext.tsx` 暴露 `useMeta()`（含 `pageId`）。在 TrackingPanel 引入：
```tsx
import { useMeta } from "../MetaContext";
```
> 若实际 hook 名/字段不同，读 `MetaContext.tsx` 对齐（取页面 id 的方式）。

- [ ] **Step 2: 加 CAPI 配置区**

在 `TrackingPanel` 组件内，对 meta / tiktok 两个 provider 增加 CAPI 子区。新增组件（同文件内）：
```tsx
function CapiRow({ pageId, provider, label }: { pageId: string; provider: "meta" | "tiktok"; label: string }) {
  const [configured, setConfigured] = useState(false);
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [externalId, setExternalId] = useState("");

  useEffect(() => {
    let active = true;
    fetch(apiCapiCredentialsPath(pageId))
      .then((r) => (r.ok ? r.json() : []))
      .then((list: { provider: string }[]) => { if (active) { const c = list.some((x) => x.provider === provider); setConfigured(c); setOpen(c); } })
      .catch(() => {});
    return () => { active = false; };
  }, [pageId, provider]);

  const save = async () => {
    if (!token.trim() || !externalId.trim()) return;
    const r = await fetch("/api/capi-credentials", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId, provider, accessToken: token.trim(), externalId: externalId.trim() }),
    });
    if (r.ok) { setConfigured(true); setToken(""); }
  };
  const disable = async () => {
    await fetch(`/api/capi-credentials?pageId=${encodeURIComponent(pageId)}&provider=${provider}`, { method: "DELETE" });
    setConfigured(false); setOpen(false); setToken(""); setExternalId("");
  };

  return (
    <div className="rounded-md border border-edge p-2.5">
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" checked={open} onChange={(e) => (e.target.checked ? setOpen(true) : disable())}
          className="h-3.5 w-3.5 rounded border-edge-strong text-brand-600 focus:ring-brand-500/30" />
        启用服务端回传（CAPI · {label}）{configured ? " · 已配置 ✓" : ""}
      </label>
      {open && (
        <div className="mt-2 space-y-2">
          <Field label={provider === "meta" ? "Dataset ID" : "Pixel Code"}>
            <TextInput value={externalId} onChange={(e) => setExternalId(e.target.value)} placeholder={provider === "meta" ? "如 1234567890" : "如 CXXXXXXXX"} />
          </Field>
          <Field label="Access Token">
            <TextInput value={token} onChange={(e) => setToken(e.target.value)} placeholder={configured ? "重填以覆盖（不回显已存）" : "粘贴 Access Token"} />
          </Field>
          <button type="button" onClick={save} className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">保存凭据</button>
        </div>
      )}
    </div>
  );
}
```
在文件顶部 import 加：
```tsx
import { useState, useEffect } from "react";
import { apiCapiCredentialsPath } from "@/lib/constants";
```
在 `TrackingPanel` 的 pixel 列表渲染之后（UTM/consent 之前）插入：
```tsx
          {pageId ? (
            <div className="space-y-2">
              <CapiRow pageId={pageId} provider="meta" label="Meta" />
              <CapiRow pageId={pageId} provider="tiktok" label="TikTok" />
            </div>
          ) : null}
```
并在 `TrackingPanel` 顶部取 pageId：
```tsx
  const { pageId } = useMeta();
```

- [ ] **Step 3: 类型检查 + lint**

Run: `npx tsc --noEmit && npx eslint landing-editor/components/TrackingPanel.tsx`
Expected: 均无错误（若 `useMeta`/`pageId` 字段名不符，按 MetaContext 实际修正）

- [ ] **Step 4: 提交**

```bash
git add landing-editor/components/TrackingPanel.tsx
git commit -m "feat: 编辑器追踪面板 CAPI 配置区（启用开关 + 凭据写入，不回显）"
```

---

## Task 12: e2e + 全量验证

**Files:**
- Create: `e2e/capi.spec.ts`
- Modify: `playwright.config.ts`（webServer env 加 `CAPI_FAKE: "1"`）
- Modify: `lib/capi/providers/index.ts`（支持 CAPI_FAKE 短路 send）

- [ ] **Step 1: provider 支持 CAPI_FAKE 短路**

在 `lib/capi/providers/index.ts` 的 `getProvider` 改为：发送在 fake 模式下不打真实网络。最小改法——包一层：
```ts
// lib/capi/providers/index.ts
import type { CapiProvider, CapiProviderId } from "../types";
import { metaProvider } from "./meta";
import { tiktokProvider } from "./tiktok";

const REGISTRY: Record<CapiProviderId, CapiProvider> = { meta: metaProvider, tiktok: tiktokProvider };

export function getProvider(id: CapiProviderId): CapiProvider {
  const base = REGISTRY[id];
  if (process.env.CAPI_FAKE === "1") {
    return { ...base, send: async () => ({ ok: true }) };
  }
  return base;
}
```

- [ ] **Step 2: playwright webServer 注入 CAPI_FAKE**

在 `playwright.config.ts` 的 `webServer.env` 里（已有 `AI_FAKE: '1'`）加：
```ts
      CAPI_FAKE: '1',
```

- [ ] **Step 3: 写 e2e**

`e2e/capi.spec.ts`:
```ts
// e2e/capi.spec.ts
// CAPI：配了凭据 + lead 提交（带 event_id, consent=true）→ capi_events 落库并(经 fake)标记 sent；payload 中 email 为哈希非明文。
// 直接 POST /api/leads（dev 同源）；凭据用 pg 直插（绕过登录态的凭据写接口）。
import { test, expect, request as pwRequest } from "@playwright/test";
import { Pool } from "pg";
import { createHash } from "node:crypto";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const RUN = process.env.RUN_DB_E2E === "1";
const DEV_EMAIL = process.env.DEV_USER_EMAIL ?? "dev@localhost";
const BASE = "http://localhost:3001";

function makePool(): Pool {
  const cs = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
  const isLocal = cs.includes("localhost") || cs.includes("127.0.0.1");
  return new Pool({ connectionString: cs, ssl: isLocal ? false : { rejectUnauthorized: false } });
}

let pool: Pool;
let devUserId: string;
let pageId: string;

test.describe("CAPI 服务端回传", () => {
  test.skip(!RUN, "Set RUN_DB_E2E=1 to run database-backed e2e tests.");

  test.beforeAll(async () => {
    pool = makePool();
    const u = await pool.query(
      `INSERT INTO users (email, name, plan) VALUES ($1, 'Dev User', 'pro')
       ON CONFLICT (email) DO UPDATE SET plan='pro' RETURNING id`, [DEV_EMAIL]);
    devUserId = u.rows[0].id;
    await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
    const p = await pool.query(
      `INSERT INTO landing_pages (user_id, name, data) VALUES ($1, 'CAPI 测试页', '{}'::jsonb) RETURNING id`, [devUserId]);
    pageId = p.rows[0].id;
    await pool.query(
      `INSERT INTO page_capi_credentials (page_id, provider, access_token, external_id)
       VALUES ($1,'meta','tok','ds1') ON CONFLICT (page_id, provider) DO NOTHING`, [pageId]);
  });

  test.afterAll(async () => {
    if (devUserId) await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
    await pool.end();
  });

  test("lead 提交带 event_id → capi_events 落库（哈希 PII）", async () => {
    const api = await pwRequest.newContext();
    const res = await api.post(`${BASE}/api/leads`, {
      data: { pageId, channel: "form", fields: { email: "Tom@Example.com", whatsapp: "+1 555 0100" },
              event_id: "evt-capi-1", consent: true },
    });
    expect(res.status()).toBe(204);

    // 轮询等 after()/fake flush 落库（最多 ~5s）
    let row: { status: string; event_id: string; payload: { emailHash?: string } } | undefined;
    for (let i = 0; i < 25 && !row; i++) {
      const r = await pool.query(`SELECT status, event_id, payload FROM capi_events WHERE page_id=$1 AND provider='meta'`, [pageId]);
      row = r.rows[0];
      if (!row) await new Promise((res2) => setTimeout(res2, 200));
    }
    expect(row).toBeTruthy();
    expect(row!.event_id).toBe("evt-capi-1");
    // email 为 SHA-256 哈希，不存明文
    const expectHash = createHash("sha256").update("tom@example.com").digest("hex");
    expect(row!.payload.emailHash).toBe(expectHash);
    await api.dispose();
  });

  test("cron 端点无 secret → 401", async () => {
    const api = await pwRequest.newContext();
    const r = await api.get(`${BASE}/api/cron/capi-flush`);
    expect(r.status()).toBe(401);
    await api.dispose();
  });
});
```

- [ ] **Step 4: 确保 DB + 迁移 + seed**

Run: `docker exec zapbridge-pg-dev pg_isready -U postgres -d zapbridge && pnpm migrate:up && pnpm db:seed-dev`
Expected: migrations complete + seed 成功

- [ ] **Step 5: 跑该 e2e**

Run: `lsof -ti:3001 | xargs kill 2>/dev/null; RUN_DB_E2E=1 pnpm exec playwright test e2e/capi.spec.ts`
Expected: 2 passed（落库轮询断言 + cron 401）

- [ ] **Step 6: 全量验证**

Run: `npx tsc --noEmit && npx eslint . && npx vitest run && RUN_DB_E2E=1 pnpm test:e2e`
Expected: tsc 通过；eslint 0 error；vitest 全绿（含 hash/providers/dispatch）；e2e 全 passed（原 10 + 新 2）。
（`npx next build` 若因 Google 字体网络不可达失败，属环境问题，单独说明。）

- [ ] **Step 7: 提交**

```bash
git add e2e/capi.spec.ts playwright.config.ts lib/capi/providers/index.ts
git commit -m "test(e2e): CAPI lead 入队落库（CAPI_FAKE）+ cron 鉴权"
```

---

## 验收标准（对照 spec）

- 凭据存独立表 `page_capi_credentials`，PUT 只写、GET 只返回 configured（不回显 token），按 page 归属鉴权。
- `capi_events` 状态机：pending → sent / 失败 attempts++ → 满 5 次 failed；payload 中 PII 为 SHA-256 哈希。
- LeadForm 双发客户端 pixel（Meta `Lead` / TikTok `SubmitForm`，带 event_id）；`/api/leads` 入队 + `after()` 即时 flush。
- consent=false 跳过入队；CAPI 失败不影响 lead 提交。
- Meta/TikTok provider 适配（payload 结构正确、PII 哈希、event_id 去重）。
- Cron 端点 CRON_SECRET 鉴权 + 重扫重发。
- 编辑器可启用 CAPI 并写入凭据（不回显）。
- 单测 hash/providers/dispatch；e2e 落库 + cron 鉴权（CAPI_FAKE 不打真实平台）。
- tsc / eslint / vitest / e2e 全绿。
