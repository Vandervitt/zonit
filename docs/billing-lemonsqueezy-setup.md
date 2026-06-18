# LemonSqueezy 计费接通清单

代码侧已就绪（`lib/lemonsqueezy.ts`、`app/api/billing/checkout`、`/portal`、`app/api/webhooks/lemonsqueezy`），上线仅差以下**配置**。本文件不含任何真实密钥。

## 1. 所需环境变量

| 变量 | 用途 | 取值来源 |
|---|---|---|
| `LEMONSQUEEZY_API_KEY` | 调用 LS API 建 checkout、取客户门户 | LS 后台 → Settings → API → 新建 API Key |
| `LEMONSQUEEZY_STORE_ID` | 指定结账归属的 Store | LS 后台 → Settings → Stores，Store 详情里的数字 ID |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | 校验 webhook 签名（`verifyWebhookSignature`） | 建 webhook 时填写的 signing secret（自定义强随机串，两边一致） |
| `LEMONSQUEEZY_VARIANT_STARTER` | Starter 套餐对应的 variant，用于映射 plan | 对应 Product 的 variant 详情页 ID |
| `LEMONSQUEEZY_VARIANT_PRO` | Pro 套餐 variant | 同上 |
| `LEMONSQUEEZY_VARIANT_AGENCY` | Agency 套餐 variant | 同上 |

> 说明：`free` 无 variant（不结账）；`lib/lemonsqueezy.ts` 的 `PLAN_VARIANT`/`VARIANT_PLAN` 用上述 3 个 variant 做「套餐 ↔ variant」双向映射。

## 2. LemonSqueezy 后台步骤

1. **建 Store**：记下 Store ID → `LEMONSQUEEZY_STORE_ID`。
2. **建 3 个订阅 Product/Variant**：Starter / Pro / Agency，定价与 `lib/plans.ts` 的 `priceText` 对齐（$29 / $79 / $199，按月订阅）。各 variant 详情页拿到 variant ID → 对应 `LEMONSQUEEZY_VARIANT_*`。
3. **建 API Key**：Settings → API → Create API Key → `LEMONSQUEEZY_API_KEY`。
4. **配 Webhook**：Settings → Webhooks → Add endpoint：
   - URL：`https://<你的平台主域>/api/webhooks/lemonsqueezy`
   - Signing secret：自定义强随机串 → 同时填入 `LEMONSQUEEZY_WEBHOOK_SECRET`
   - 勾选事件：`subscription_created`、`subscription_updated`、`subscription_cancelled`、`subscription_expired`（与 `app/api/webhooks/lemonsqueezy/route.ts` 的 `SUBSCRIPTION_EVENTS` 一致）

## 3. 配置位置

- **生产（Vercel）**：Project → Settings → Environment Variables，逐项加入上表 6 个变量（Production 环境）。
- **本地**：`.env.local` 加入同样 6 个键（本地联调可用 LS 测试模式 Store/Key）。

## 4. 验证

- 登录后 `/admin/billing` 点升级 → 应跳转到 LS checkout（不再 500）。
- 完成测试支付后，LS 回调 `/api/webhooks/lemonsqueezy` → `users.plan` 更新为对应套餐 → `/admin/billing` 显示新套餐与「管理订阅」入口。
- checkout 的 `custom_data.user_id` 由后端注入（见 `createCheckoutUrl`），webhook 据此定位用户，无需手动映射。

## 5. 关联

- 套餐定义单一数据源：`lib/plans.ts`（`PLANS` 限额/特性、`PLAN_FEATURE_ROWS` 对比表）。
- variant→plan 映射：`lib/lemonsqueezy.ts` `getPlanFromVariantId`。
- 退订：用户经客户门户（`getPortalUrl`）操作，回调置 `plan='free'`。
