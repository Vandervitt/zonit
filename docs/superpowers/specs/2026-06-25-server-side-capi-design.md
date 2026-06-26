# 设计：服务端转化回传 CAPI（骨架 + Meta + TikTok）（子项 E）

| | |
|---|---|
| 文档类型 | 设计 spec |
| 状态 | 待评审 |
| 日期 | 2026-06-25 |
| 分支 | `feat_20260624_服务端转化回传capi` |
| 关联 | 产品功能缺口拆分（A–G）中的子项 E；A/B/C/D 已合入 main。依赖 D 的 leads 闭环与 `/api/leads` 入口 |

## 背景与目标

客户端 pixel（meta/ga4/googleAds/tiktok）已就绪，但 iOS14+ / 广告拦截会让客户端转化事件丢失、归因失真。CAPI（Conversions API）在**服务端**把转化事件再回传一次给广告平台，与客户端 pixel 用同一 `event_id` 去重，修复丢失。

本子项搭一个**通用服务端转化转发骨架（D）**，并在其上落地 **Meta + TikTok** 两家（A 含于 B）。GA4 / Google Ads 后续照搬骨架。

**范围决策（brainstorm 已定）**：
- 凭据存**独立表**，只写不回显，永不下发客户端（draft JSON 只留非敏感开关）。
- 只回传**表单提交（lead）**这一转化（服务端有 PII 可哈希匹配，价值最高）；深链点击、page_view 不回传。
- **双发 + event_id 去重**：客户端 pixel 与服务端 CAPI 用同一 event_id。
- **落库 + 即时 flush + Vercel Cron 兜底重试**（serverless 下"表即队列、Cron 即 worker"）。

**非交易约束保持**：CAPI 只回传 `Lead` / `SubmitForm` 事件，用户只填 ID/Token，事件名代码内置，不引入购买/交易事件。

## 范围

**做**：CAPI 骨架（provider 抽象 + 事件落库状态机 + 派发器 + 重试）；Meta + TikTok 两家适配；凭据独立表 + 写/查接口；`/api/leads` 接入入队 + 即时 flush；客户端 LeadForm 双发 pixel + event_id + cookie 采集；Cron 兜底端点；编辑器 CAPI 配置 UI；测试。

**不做（Future Work）**：GA4 Measurement Protocol / Google Ads Enhanced Conversions；深链点击（cta_click）回传；page_view 回传；精细退避算法；外部队列（QStash/Vercel Queues）。

## 关键现状

- `PageTracking.pixels: PixelConfig[]`（`{provider, id, enabled}`），存于 draft JSON，随页面下发客户端（`TrackingProvider` 是 client 组件）→ **Access Token 绝不能进此处**。
- 客户端 `PixelSink` 发 pixel，`BeaconSink` 发匿名 `/api/track`。**LeadForm 提交目前不发任何客户端 pixel 事件**（pixel 只在 CTA 点击发）→ 双发需新增。
- 内部事件仅 `page_view` / `cta_click`，`EVENT_MAP` 映射各平台事件名。
- `/api/leads` POST：校验 → `insertLead` → 204（D 子项；公开端点已在 auth-proxy 放行 POST）。
- `vercel.json` 有 `"crons": []`（空，可加；无 cron 先例）。
- 已有迁移到 014（leads）。新迁移从 015 起。

## 第 1 块：架构与模块边界

```
LeadForm 提交（客户端）
  ├─ 客户端 pixel 发 Lead/SubmitForm（带 event_id）        ← 双发"客户端腿"
  └─ POST /api/leads { ...fields, event_id, fbp, fbc, ttclid, consent }
        → 校验 / insertLead（已有）
        → enqueueCapiEvents()：对每个"配了凭据"的 provider 写 capi_events(pending)
        → after()：即时 flush 一次（响应后异步，不阻塞用户）
                ↓
        CAPI 派发器（骨架）
          ├─ 读 page_capi_credentials（服务端密钥，永不下发）
          ├─ provider 适配：MetaCapiProvider / TikTokCapiProvider（统一接口）
          ├─ 构造 payload（event_id 去重 + 哈希 PII + fbp/fbc/ttclid + IP/UA）
          └─ 发送 → sent / pending|failed（+attempts、last_error）
                ↓
        GET /api/cron/capi-flush（Vercel Cron 每 10min）→ 重扫未成功的重发（attempts<5）
```

**模块（各单一职责）**：
- `lib/capi/types.ts` — `CapiProvider` 接口、`CapiEvent` / `CapiCredential` 类型、provider 常量。
- `lib/capi/hash.ts` — email/phone 标准化 + SHA-256（纯函数）。
- `lib/capi/providers/meta.ts`、`lib/capi/providers/tiktok.ts` — 两家适配（endpoint / payload 格式 / send）。
- `lib/capi/providers/index.ts` — provider 注册表（按 provider 取适配器）。
- `lib/capi/credentials.ts` — 凭据读写（upsert / 取明文供服务端发送 / 取"是否已配置"供前端）。
- `lib/capi/events-store.ts` — capi_events 读写 + 状态机（insert pending / 取待发 / 标 sent / 标 failed+attempts）。
- `lib/capi/dispatch.ts` — `enqueueCapiEvents` + `flushEvents`（编排，不含平台细节）。

## 第 2 块：数据模型与凭据隔离

### schema（`types/schema.draft.ts`）
```ts
interface PixelConfig {
  provider: PixelProvider;
  id: string;
  enabled: boolean;
  serverSide?: boolean;   // 是否对该 provider 启用服务端 CAPI（仅 meta/tiktok 生效），非敏感，可进 draft
}
```

### 迁移 015 `page_capi_credentials`
```
id BIGSERIAL PK,
page_id TEXT NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
provider TEXT NOT NULL CHECK (provider IN ('meta','tiktok')),
access_token TEXT NOT NULL,   -- 用户 CAPI 密钥；仅服务端读，永不下发客户端
external_id TEXT NOT NULL,    -- Meta dataset id / TikTok pixel code
created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE(page_id, provider)
```
- 写：`PUT /api/capi-credentials`（登录，按 page+provider upsert）。
- 查：`GET /api/capi-credentials?pageId=` 只返回 `[{provider, configured:true}]`——**永不返回 token 明文**。

### 迁移 016 `capi_events`
```
id BIGSERIAL PK,
page_id TEXT NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
provider TEXT NOT NULL,
event_name TEXT NOT NULL,            -- 'Lead'(meta) / 'SubmitForm'(tiktok)
event_id TEXT NOT NULL,              -- 与客户端 pixel 共享，去重
payload JSONB NOT NULL,              -- 已构造好的待发数据；email/phone 为 SHA-256 哈希，不存明文
status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
attempts INT NOT NULL DEFAULT 0,
last_error TEXT,
created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), sent_at TIMESTAMPTZ,
INDEX idx_capi_events_status_time (status, created_at)
```
**隐私**：`payload` 中 email/phone 存 SHA-256 哈希，**不存明文**（明文 PII 仅在 D 的 leads 表，给商户看）。

## 第 3 块：数据流 / 去重 / 重试 / consent

**客户端 LeadForm 提交**：
1. `event_id = crypto.randomUUID()`。
2. 若有启用的 meta/tiktok pixel 且 consent 通过：客户端 pixel 发带 event_id 的转化事件（Meta `fbq('track','Lead',{},{eventID})`；TikTok `ttq.track('SubmitForm',{},{event_id})`）。
3. 读 cookie：`_fbp`/`_fbc`（Meta）、`ttp`/`ttclid`（TikTok）。
4. `POST /api/leads` 带 `{ event_id, fbp, fbc, ttclid, consent }`（在现有 body 基础上扩展）。

**服务端 `/api/leads` POST（已有 insertLead 之后）**：
5. `enqueueCapiEvents(pageId, leadPayload, ctx)`：
   - provider 取自 **`page_capi_credentials` 中已配凭据者**（配了 token 才发）。
   - **consent 门控**：页面 `consent.enabled` 且 `ctx.consent !== true` → 跳过（与客户端 pixel 一致）。
   - 每 provider：`hash.ts` 哈希 email/phone → 构造 payload（event_id、fbp/fbc/ttclid、`client_ip_address`（从 `x-forwarded-for`）、`client_user_agent`、`event_time`、`event_source_url`）→ insert `capi_events`(pending)。
6. **即时 flush**：`after(() => flushEvents(ids))`（Next 16 `after`，响应后执行，不阻塞）。
7. 返回 204——**CAPI 失败绝不影响 lead 提交**（try/catch 吞掉，错误进 last_error）。

**去重**：客户端与服务端用同一 `event_id`。事件名一致：Meta=`Lead`，TikTok=`SubmitForm`。

**派发器 `flushEvents`**：取目标事件 → 读凭据 → `provider.send` → 成功标 `sent`+`sent_at`；失败 `attempts++`、`last_error`，`attempts>=5` 标 `failed` 终态，否则留 `pending`。

**Cron `GET /api/cron/capi-flush`**：
- Vercel Cron 每 10 分钟。
- 校验 `Authorization: Bearer ${CRON_SECRET}`（env，Vercel Cron 注入）；不匹配 401。
- 扫 `status IN ('pending','failed') AND attempts < 5 AND created_at > now()-interval '3 days'` → `flushEvents`。
- `vercel.json` crons 加 `{ "path": "/api/cron/capi-flush", "schedule": "*/10 * * * *" }`。

## 第 4 块：Provider 适配 + 编辑器 + 测试

**统一接口（`lib/capi/types.ts`）**：
```ts
export interface CapiCredential { provider: 'meta'|'tiktok'; accessToken: string; externalId: string; }
export interface CapiEvent {
  eventName: string; eventId: string;
  emailHash?: string; phoneHash?: string;
  fbp?: string; fbc?: string; ttp?: string; ttclid?: string;
  clientIp?: string; userAgent?: string; eventTime: number; sourceUrl?: string;
}
export interface CapiProvider {
  buildPayload(ev: CapiEvent, cred: CapiCredential): unknown;
  send(body: unknown, cred: CapiCredential): Promise<{ ok: boolean; error?: string }>;
}
```
- **Meta**：`POST https://graph.facebook.com/v21.0/{externalId}/events?access_token={token}`，body `{ data:[{ event_name:'Lead', event_time, event_id, action_source:'website', event_source_url, user_data:{ em:[emailHash], ph:[phoneHash], fbp, fbc, client_ip_address, client_user_agent } }] }`（仅放非空字段）。
- **TikTok**：`POST https://business-api.tiktok.com/open_api/v1.3/event/track/`，header `Access-Token: {token}`，body `{ event_source:'web', event_source_id:externalId, data:[{ event:'SubmitForm', event_time, event_id, user:{ email:[emailHash], phone:[phoneHash], ttp, ttclid, ip, user_agent }, page:{ url } }] }`。
- 网络失败 / 非 2xx → `{ ok:false, error }`（不抛，供状态机记录）。

**编辑器 CAPI 配置 UI**（现有 tracking 配置区，每个 meta/tiktok pixel 下；位于编辑器侧，与 pixel 配置同处）：
- 「启用服务端回传 (CAPI)」开关 → 写 `serverSide`（进 draft）。
- 启用后：Access Token 输入（已配置显示"已配置 ✓"、占位"重填以覆盖"；不回显明文）+ external_id 输入 → 保存调 `PUT /api/capi-credentials`；挂载时 `GET` 拉 `configured` 状态。

**测试**：
- **单测（vitest）**：
  - `hash.ts`：email（小写 trim）/phone（E.164 去非数字）标准化 + SHA-256 已知向量。
  - Meta/TikTok `buildPayload`：结构正确、PII 为哈希、event_id 在、空字段省略。
  - `dispatch` 状态机：enqueue 入 pending；flush 成功→sent；失败→attempts++/last_error；满 5→failed。
  - consent 门控：`consent.enabled` 且未同意 → 不入队。
- **e2e（happy path，pg + fake provider）**：lead 提交带 event_id + 已配 CAPI 凭据 → `capi_events` 落 1 行（断言 event_id、status、payload 中 email 为哈希非明文）。**通过环境变量 `CAPI_FAKE=1` 让 provider.send 走确定性 fake，不打真实 Meta/TikTok**。cron 端点鉴权（无 secret → 401）。

## 影响面 / 兼容

- `PixelConfig` 加可选 `serverSide?` → 旧 draft 无该字段，默认不启用 CAPI，兼容。
- `/api/leads` body 扩展可选字段（event_id/fbp/...）→ 旧客户端不传则 CAPI 不入队，兼容。
- 新增 env：`CRON_SECRET`（cron 鉴权）、`CAPI_FAKE`（测试）。生产需配 `CRON_SECRET`。
- LeadForm 双发 pixel 复用现有 `window.fbq`/`ttq`（TrackingProvider 注入），无新 SDK。
- 非交易约束：仅回传 Lead/SubmitForm，无交易语义。

## Future Work（非本子项）

- GA4 Measurement Protocol / Google Ads Enhanced Conversions（照搬骨架）。
- 深链点击（cta_click）服务端回传（需扩展 /api/track 采集 fbp/fbc，匿名匹配）。
- 精细退避（指数 + 抖动）、外部队列（QStash/Vercel Queues）。
- 凭据加密存储（KMS / 应用层加密），而非明文入库。
