# Lemon Squeezy 支付集成设计

**日期**：2026-04-21  
**状态**：已批准，待实现

---

## 背景

订阅功能框架已就绪（`users.plan` 字段、`lib/plans.ts`、billing 页面），但升级按钮目前是 `alert()` 占位。本文档描述如何接入 Lemon Squeezy 实现真实支付。

---

## 决策

| 问题 | 决策 |
|------|------|
| SDK vs raw fetch | 官方 SDK `@lemonsqueezy/lemonsqueezy.js` |
| 结账体验 | 跳转到 LS 托管结账页（redirect） |
| 订阅管理 | 跳转到 LS Customer Portal |
| LS 后台配置 | 上线前手动配置，代码留环境变量占位 |

---

## 数据层

在 `users` 表追加两列：

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS ls_customer_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ls_subscription_id TEXT UNIQUE;
```

`plan` 列已有，Webhook 收到事件后直接 UPDATE。

---

## 环境变量

```env
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_WEBHOOK_SECRET=
LEMONSQUEEZY_VARIANT_STARTER=
LEMONSQUEEZY_VARIANT_PRO=
LEMONSQUEEZY_VARIANT_AGENCY=
```

---

## LS 后台配置步骤（上线前）

1. 创建 Store
2. 创建 Product "PULSAR Subscription"，建三个 Subscription Variant：
   - Starter · $29/月
   - Pro · $79/月
   - Agency · $199/月
3. Settings → Webhooks → 新建，URL：`https://<域名>/api/webhooks/lemonsqueezy`
4. 勾选事件：`subscription_created`、`subscription_updated`、`subscription_cancelled`、`subscription_expired`
5. 填写与 `LEMONSQUEEZY_WEBHOOK_SECRET` 相同的签名密钥

---

## 文件变更

### 新增

| 文件 | 职责 |
|------|------|
| `lib/lemonsqueezy.ts` | SDK 初始化 + `createCheckoutUrl` + `getPortalUrl` + `verifyWebhookSignature` |
| `app/api/billing/checkout/route.ts` | POST：创建 Checkout，返回 `{ checkoutUrl }` |
| `app/api/billing/portal/route.ts` | GET：获取 Customer Portal URL，返回 `{ portalUrl }` |
| `app/api/webhooks/lemonsqueezy/route.ts` | POST：验签 → 处理事件 → 更新 DB |

### 修改

| 文件 | 变更 |
|------|------|
| `lib/schema.sql` | 追加两列 ALTER TABLE |
| `app/(dashboard)/billing/page.tsx` | 升级按钮调用真实 API；加"管理订阅"按钮 |

---

## 核心流程

### 升级流程

```
用户点击"升级 Pro"
  → POST /api/billing/checkout { planId: 'pro' }
     └─ 验证 session
     └─ 查 LEMONSQUEEZY_VARIANT_PRO
     └─ createCheckout(variantId, email, userId, redirectUrl)
     └─ 返回 { checkoutUrl }
  → window.location.href = checkoutUrl
  → 用户在 LS 页面完成支付
  → LS 发送 subscription_created Webhook
  → /api/webhooks/lemonsqueezy 处理：
     └─ 验签
     └─ 从 meta.custom_data.user_id 找到用户
     └─ UPDATE users SET plan=?, ls_customer_id=?, ls_subscription_id=?
  → 用户回跳到 /billing?success=1，显示 toast
```

### 管理订阅流程

```
用户点击"管理订阅"（仅 plan !== 'free' 时显示）
  → GET /api/billing/portal
     └─ 验证 session
     └─ 查 users.ls_customer_id
     └─ getPortalUrl(lsCustomerId)
     └─ 返回 { portalUrl }
  → window.location.href = portalUrl
```

### Webhook 事件映射

| 事件 | DB 操作 |
|------|---------|
| `subscription_created` | SET plan=新套餐, ls_customer_id=?, ls_subscription_id=? |
| `subscription_updated` | SET plan=新套餐（处理升降级） |
| `subscription_cancelled` | SET plan='free', ls_subscription_id=NULL |
| `subscription_expired` | SET plan='free', ls_subscription_id=NULL |

### LS Variant → Plan 映射

Webhook payload 中的 `variant_id` 与环境变量对比，确定对应 plan：

```typescript
const VARIANT_PLAN_MAP: Record<string, PlanId> = {
  [process.env.LEMONSQUEEZY_VARIANT_STARTER!]: 'starter',
  [process.env.LEMONSQUEEZY_VARIANT_PRO!]:     'pro',
  [process.env.LEMONSQUEEZY_VARIANT_AGENCY!]:  'agency',
};
```

---

## 用户关联机制

创建 Checkout 时通过 `custom_data` 传入 `user_id`：

```typescript
checkout_data: {
  custom: { user_id: session.user.id },
  email: session.user.email,
}
```

Webhook 收到后从 `meta.custom_data.user_id` 取出，做 DB 查询。

---

## 回跳与 Toast

- `redirect_url` 设为 `/billing?success=1`
- billing 页面检测 `?success=1` query param，展示 sonner toast："订阅成功！套餐将在几秒内生效。"
- plan 实际更新由 Webhook 触发，延迟 1-5 秒属正常，session 刷新后显示新套餐

---

## 不在范围内

- 降级/取消 UI（通过 LS Customer Portal 完成）
- 订阅到期提醒邮件
- 发票管理（LS 自动处理）
- 促销码 / 折扣
