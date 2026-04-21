# Lemon Squeezy Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 billing 页面的 `alert()` 占位替换为真实的 Lemon Squeezy 订阅支付流程。

**Architecture:** 安装官方 SDK，新增三条 API 路由（checkout 创建、portal 跳转、webhook 处理），在 `lib/lemonsqueezy.ts` 集中 LS 业务逻辑，billing 页面改为调用这些路由。Webhook 收到订阅事件后更新 `users.plan`，完成支付闭环。

**Tech Stack:** `@lemonsqueezy/lemonsqueezy.js` SDK、Next.js App Router API Routes、PostgreSQL (raw pg)、Node.js `crypto` 模块（webhook 验签）

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `lib/lemonsqueezy.ts` | 新建 | SDK 初始化 + `createCheckoutUrl` + `getPortalUrl` + `verifyWebhookSignature` |
| `app/api/billing/checkout/route.ts` | 新建 | POST：创建 LS Checkout，返回 `{ checkoutUrl }` |
| `app/api/billing/portal/route.ts` | 新建 | GET：获取 LS Customer Portal URL，返回 `{ portalUrl }` |
| `app/api/webhooks/lemonsqueezy/route.ts` | 新建 | POST：验签 → 识别事件 → 更新 DB |
| `lib/schema.sql` | 修改 | 追加两列 ALTER TABLE |
| `lib/migrations/003_add_ls_columns.sql` | 新建 | 独立迁移文件 |
| `app/(dashboard)/billing/page.tsx` | 修改 | 真实升级按钮 + 管理订阅按钮 + success toast |

---

## Task 1：安装 SDK + DB 迁移文件

**Files:**
- Run: `pnpm add @lemonsqueezy/lemonsqueezy.js`
- Create: `lib/migrations/003_add_ls_columns.sql`
- Modify: `lib/schema.sql`

- [ ] **Step 1: 安装 SDK**

```bash
cd /Users/lajiao/Work/zonit && pnpm add @lemonsqueezy/lemonsqueezy.js
```

预期输出：`packages/node_modules/.pnpm/...` 安装成功，无报错。

- [ ] **Step 2: 创建迁移文件**

创建 `lib/migrations/003_add_ls_columns.sql`，内容如下：

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS ls_customer_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ls_subscription_id TEXT UNIQUE;
```

- [ ] **Step 3: 更新 schema.sql**

在 `lib/schema.sql` 末尾追加：

```sql
-- v3: Lemon Squeezy billing columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS ls_customer_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ls_subscription_id TEXT UNIQUE;
```

- [ ] **Step 4: 在数据库执行迁移**

```bash
psql $DATABASE_URL -f lib/migrations/003_add_ls_columns.sql
```

预期：`ALTER TABLE` 输出两行，无报错。

- [ ] **Step 5: 类型检查**

```bash
npx tsc --noEmit
```

预期：无报错输出。

- [ ] **Step 6: Commit**

```bash
git add lib/migrations/003_add_ls_columns.sql lib/schema.sql pnpm-lock.yaml package.json
git commit -m "feat(billing): 安装 lemonsqueezy SDK，添加 ls_customer_id/ls_subscription_id 列"
```

---

## Task 2：创建 `lib/lemonsqueezy.ts`

**Files:**
- Create: `lib/lemonsqueezy.ts`

此文件是 LS 业务逻辑的唯一入口。SDK 在模块顶层初始化一次，所有 API 路由通过此文件的导出函数操作 LS。

- [ ] **Step 1: 创建文件**

创建 `lib/lemonsqueezy.ts`，内容如下：

```typescript
import {
  lemonSqueezySetup,
  createCheckout,
  getCustomer,
} from "@lemonsqueezy/lemonsqueezy.js";
import crypto from "crypto";
import type { PlanId } from "@/lib/plans";

lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY! });

const PLAN_VARIANT: Record<string, string> = {
  starter: process.env.LEMONSQUEEZY_VARIANT_STARTER!,
  pro:     process.env.LEMONSQUEEZY_VARIANT_PRO!,
  agency:  process.env.LEMONSQUEEZY_VARIANT_AGENCY!,
};

const VARIANT_PLAN: Record<string, PlanId> = Object.fromEntries(
  Object.entries(PLAN_VARIANT).map(([plan, variantId]) => [variantId, plan as PlanId]),
);

export function getPlanFromVariantId(variantId: string | number): PlanId {
  return VARIANT_PLAN[String(variantId)] ?? "free";
}

export async function createCheckoutUrl(
  planId: string,
  email: string,
  userId: string,
  baseUrl: string,
): Promise<string> {
  const variantId = PLAN_VARIANT[planId];
  if (!variantId) throw new Error(`No LS variant configured for plan: ${planId}`);

  const { data, error } = await createCheckout(
    process.env.LEMONSQUEEZY_STORE_ID!,
    variantId,
    {
      checkoutOptions: { embed: false, media: false },
      checkoutData: {
        email,
        custom: { user_id: userId },
      },
      productOptions: {
        redirectUrl: `${baseUrl}/billing?success=1`,
      },
    },
  );

  if (error) throw new Error(error.message);
  return data!.data.attributes.url;
}

export async function getPortalUrl(lsCustomerId: string): Promise<string> {
  const { data, error } = await getCustomer(lsCustomerId);
  if (error) throw new Error(error.message);
  return data!.data.attributes.urls.customer_portal;
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest, "hex"),
      Buffer.from(signature, "hex"),
    );
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: 类型检查**

```bash
npx tsc --noEmit
```

预期：无报错。

- [ ] **Step 3: Commit**

```bash
git add lib/lemonsqueezy.ts
git commit -m "feat(billing): 添加 lemonsqueezy 工具函数封装"
```

---

## Task 3：Checkout API 路由

**Files:**
- Create: `app/api/billing/checkout/route.ts`

- [ ] **Step 1: 创建目录并创建文件**

```bash
mkdir -p /Users/lajiao/Work/zonit/app/api/billing/checkout
```

创建 `app/api/billing/checkout/route.ts`，内容如下：

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { createCheckoutUrl } from "@/lib/lemonsqueezy";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const { planId } = await request.json() as { planId: string };
  if (!planId || planId === "free") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const baseUrl = new URL(request.url).origin;

  try {
    const checkoutUrl = await createCheckoutUrl(
      planId,
      session.user.email,
      session.user.id,
      baseUrl,
    );
    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: 类型检查**

```bash
npx tsc --noEmit
```

预期：无报错。

- [ ] **Step 3: Commit**

```bash
git add app/api/billing/checkout/route.ts
git commit -m "feat(billing): 添加 checkout API 路由"
```

---

## Task 4：Customer Portal API 路由

**Files:**
- Create: `app/api/billing/portal/route.ts`

- [ ] **Step 1: 创建目录并创建文件**

```bash
mkdir -p /Users/lajiao/Work/zonit/app/api/billing/portal
```

创建 `app/api/billing/portal/route.ts`，内容如下：

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { ApiErrors } from "@/lib/constants";
import { getPortalUrl } from "@/lib/lemonsqueezy";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const result = await pool.query(
    "SELECT ls_customer_id FROM users WHERE id = $1",
    [session.user.id],
  );
  const lsCustomerId = result.rows[0]?.ls_customer_id as string | null;

  if (!lsCustomerId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 });
  }

  try {
    const portalUrl = await getPortalUrl(lsCustomerId);
    return NextResponse.json({ portalUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: 类型检查**

```bash
npx tsc --noEmit
```

预期：无报错。

- [ ] **Step 3: Commit**

```bash
git add app/api/billing/portal/route.ts
git commit -m "feat(billing): 添加 customer portal API 路由"
```

---

## Task 5：Webhook 处理路由

**Files:**
- Create: `app/api/webhooks/lemonsqueezy/route.ts`

这是最关键的路由：LS 付款/取消后推送事件，此处验签后更新 `users.plan`。

**Webhook payload 结构（subscription 事件）：**
```json
{
  "meta": {
    "event_name": "subscription_created",
    "custom_data": { "user_id": "xxx" }
  },
  "data": {
    "id": "sub_abc123",
    "attributes": {
      "customer_id": 123456,
      "variant_id": 789,
      "status": "active"
    }
  }
}
```

- [ ] **Step 1: 创建目录**

```bash
mkdir -p /Users/lajiao/Work/zonit/app/api/webhooks/lemonsqueezy
```

- [ ] **Step 2: 创建 route 文件**

创建 `app/api/webhooks/lemonsqueezy/route.ts`，内容如下：

```typescript
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyWebhookSignature, getPlanFromVariantId } from "@/lib/lemonsqueezy";

const SUBSCRIPTION_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_expired",
]);

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as {
    meta: { event_name: string; custom_data?: { user_id?: string } };
    data: { id: string; attributes: { customer_id: number; variant_id: number; status: string } };
  };

  const eventName = payload.meta.event_name;
  if (!SUBSCRIPTION_EVENTS.has(eventName)) {
    return NextResponse.json({ received: true });
  }

  const userId = payload.meta.custom_data?.user_id;
  if (!userId) {
    return NextResponse.json({ error: "Missing user_id in custom_data" }, { status: 400 });
  }

  const { customer_id, variant_id } = payload.data.attributes;
  const subscriptionId = payload.data.id;
  const isCancelled = eventName === "subscription_cancelled" || eventName === "subscription_expired";

  if (isCancelled) {
    await pool.query(
      "UPDATE users SET plan = 'free', ls_subscription_id = NULL WHERE id = $1",
      [userId],
    );
  } else {
    const plan = getPlanFromVariantId(variant_id);
    await pool.query(
      `UPDATE users
       SET plan = $1, ls_customer_id = $2, ls_subscription_id = $3
       WHERE id = $4`,
      [plan, String(customer_id), subscriptionId, userId],
    );
  }

  return NextResponse.json({ received: true });
}
```

> **注意：** Next.js App Router 默认会缓冲 request body，Webhook 路由需要读取原始 body 做验签。`request.text()` 会消费 body，之后不能再调 `request.json()`，所以用 `JSON.parse(rawBody)` 代替。

- [ ] **Step 3: 类型检查**

```bash
npx tsc --noEmit
```

预期：无报错。

- [ ] **Step 4: Commit**

```bash
git add app/api/webhooks/lemonsqueezy/route.ts
git commit -m "feat(billing): 添加 Lemon Squeezy webhook 处理路由"
```

---

## Task 6：更新 Billing 页面

**Files:**
- Modify: `app/(dashboard)/billing/page.tsx`

将 `alert()` 占位替换为真实逻辑，并加入"管理订阅"按钮和 success toast。

- [ ] **Step 1: 阅读当前文件**

```bash
cat app/\(dashboard\)/billing/page.tsx
```

- [ ] **Step 2: 替换文件内容**

将 `app/(dashboard)/billing/page.tsx` 替换为以下内容：

```typescript
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Check, ArrowRight, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlanBadge } from "@/components/billing/PlanBadge";
import { PLANS, PLAN_ORDER } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import { Routes } from "@/lib/constants";

const UPGRADE_HIGHLIGHTS: Partial<Record<PlanId, string[]>> = {
  starter: ["3 个站点 + 1 个自定义域名", "5 款王牌爆款模板", "1× Meta Pixel 追踪"],
  pro: ["20 个站点 + 5 个域名", "全库 15+ 行业模板", "去除品牌水印", "全矩阵像素 + Meta CAPI", "反同质化风控引擎"],
  agency: ["无限站点 + 无限域名", "含灰色行业高转化模板", "AI 自动多语言翻译", "一切 Pro 功能"],
};

export default function BillingPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const currentPlanId = (session?.user?.plan ?? "free") as PlanId;
  const currentPlan = PLANS[currentPlanId];
  const currentIdx = PLAN_ORDER.indexOf(currentPlanId);

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast.success("订阅成功！套餐将在几秒内生效。");
      router.replace(Routes.Billing);
    }
  }, [searchParams, router]);

  async function handleUpgrade(planId: string) {
    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const { checkoutUrl, error } = await res.json() as { checkoutUrl?: string; error?: string };
      if (error || !checkoutUrl) {
        toast.error("无法创建结账链接，请稍后重试");
        return;
      }
      window.location.href = checkoutUrl;
    } catch {
      toast.error("网络错误，请稍后重试");
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal");
      const { portalUrl, error } = await res.json() as { portalUrl?: string; error?: string };
      if (error || !portalUrl) {
        toast.error("无法获取管理链接，请稍后重试");
        return;
      }
      window.location.href = portalUrl;
    } catch {
      toast.error("网络错误，请稍后重试");
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <main className="flex flex-col w-full px-6 py-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-slate-800 text-2xl">Billing</h1>
        <p className="text-sm text-muted-foreground mt-0.5">管理你的订阅套餐</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-6">
        <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">当前套餐</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PlanBadge plan={currentPlanId} className="text-sm px-3 py-1" />
            <span className="text-2xl font-bold text-slate-900">{currentPlan.price}</span>
          </div>
          <div className="flex items-center gap-2">
            {currentPlanId !== "free" && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handlePortal}
                disabled={portalLoading}
              >
                <Settings className="w-3.5 h-3.5" />
                {portalLoading ? "加载中…" : "管理订阅"}
              </Button>
            )}
            <Link
              href={Routes.Pricing}
              target="_blank"
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              查看完整对比 <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-slate-400 text-xs mb-1">站点上限</p>
            <p className="text-slate-700 font-medium">
              {currentPlan.sitesLimit === Infinity ? "无限" : `${currentPlan.sitesLimit} 个`}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs mb-1">域名上限</p>
            <p className="text-slate-700 font-medium">
              {currentPlan.domainsLimit === 0
                ? "不支持"
                : currentPlan.domainsLimit === Infinity
                ? "无限"
                : `${currentPlan.domainsLimit} 个`}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs mb-1">品牌水印</p>
            <p className="text-slate-700 font-medium">{currentPlan.hasWatermark ? "有" : "无"}</p>
          </div>
        </div>
      </div>

      {currentIdx < PLAN_ORDER.length - 1 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-600">可升级套餐</p>
          {PLAN_ORDER.slice(currentIdx + 1).map(planId => {
            const plan = PLANS[planId];
            const highlights = UPGRADE_HIGHLIGHTS[planId] ?? [];
            const isLoading = loadingPlan === planId;
            return (
              <div
                key={planId}
                className="rounded-2xl border border-slate-200 bg-white p-5 flex items-start justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <PlanBadge plan={planId} />
                    <span className="text-slate-700 font-semibold">{plan.price}</span>
                  </div>
                  <ul className="space-y-1">
                    {highlights.map(h => (
                      <li key={h} className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  size="sm"
                  variant={planId === "pro" ? "default" : "outline"}
                  className="shrink-0 gap-1"
                  onClick={() => handleUpgrade(planId)}
                  disabled={!!loadingPlan}
                >
                  {isLoading ? "跳转中…" : <><span>升级</span> <ArrowRight className="w-3.5 h-3.5" /></>}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {currentPlanId !== "free" && (
        <p className="mt-6 text-xs text-slate-400 text-center">
          如需取消订阅，请通过"管理订阅"进入 Lemon Squeezy 操作
        </p>
      )}
    </main>
  );
}
```

- [ ] **Step 3: 类型检查**

```bash
npx tsc --noEmit
```

预期：无报错。

- [ ] **Step 4: Commit**

```bash
git add app/\(dashboard\)/billing/page.tsx
git commit -m "feat(billing): 接入 Lemon Squeezy 真实结账与管理订阅"
```

---

## Task 7：手动集成验证

LS 后台尚未配置，以下为上线前的验证清单。

- [ ] **Step 1: 在 LS 后台完成配置**
  1. 创建 Store
  2. 创建 Product "PULSAR Subscription"，下建三个 Subscription Variant（Starter $29/mo、Pro $79/mo、Agency $199/mo）
  3. 记录三个 Variant ID

- [ ] **Step 2: 填写 `.env.local`**

```env
LEMONSQUEEZY_API_KEY=your_api_key
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
LEMONSQUEEZY_VARIANT_STARTER=your_starter_variant_id
LEMONSQUEEZY_VARIANT_PRO=your_pro_variant_id
LEMONSQUEEZY_VARIANT_AGENCY=your_agency_variant_id
```

- [ ] **Step 3: 启动开发服务器**

```bash
pnpm dev
```

- [ ] **Step 4: 验证 checkout 流程**
  - 登录，进入 `/billing`
  - 点击"升级 Pro"，确认跳转到 LS 结账页面
  - 用 LS 测试模式信用卡（`4242 4242 4242 4242`）完成支付
  - 确认回跳到 `/billing?success=1` 并显示 toast

- [ ] **Step 5: 验证 Webhook（用 LS CLI 或 ngrok）**

```bash
# 方式 A：LS 官方 CLI 转发
npx @lemonsqueezy/cli listen --webhook-url http://localhost:3000/api/webhooks/lemonsqueezy

# 方式 B：ngrok
ngrok http 3000
# 然后在 LS 后台 Webhook URL 填 https://<ngrok-url>/api/webhooks/lemonsqueezy
```

  - 在 LS 后台触发测试事件（Webhooks → Send Test）
  - 确认 `users.plan` 被正确更新
  - 重新登录，确认 Sidebar badge 显示正确套餐

- [ ] **Step 6: 验证 portal 流程**
  - 以已订阅用户登录，进入 `/billing`
  - 点击"管理订阅"，确认跳转到 LS Customer Portal

---

## 上线检查清单

- [ ] 所有 6 个 `LEMONSQUEEZY_*` 环境变量已在生产环境配置
- [ ] LS Webhook URL 已更新为生产域名
- [ ] LS Webhook 已勾选 `subscription_created`、`subscription_updated`、`subscription_cancelled`、`subscription_expired` 四个事件
- [ ] 数据库已执行 `lib/migrations/003_add_ls_columns.sql`
