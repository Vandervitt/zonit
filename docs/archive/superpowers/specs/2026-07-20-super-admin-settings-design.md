# Super Admin 平台设置页 — 设计文档

日期：2026-07-20
状态：已确认

## 背景与目标

super-admin 左侧菜单有「平台设置」项（`SuperAdminShell.tsx` NAV），指向 `/super-admin/settings`，但该页面从未创建 → 点击 404（死链接）。本次建成该页，同时给它好的只读控制台 UI。

定位：**只读平台控制台**。平台真正的可写配置（`ADMIN_EMAILS` 白名单、密钥等）都在环境变量/Vercel，Web 端不宜编辑，故不做假开关，只呈现真实数据。

## 权限

`/super-admin/layout.tsx` 已在服务端校验 `session.user.role === SUPER_ADMIN`，否则 `redirect("/")`。设置页作为其子路由自动继承，无需重复守卫。

## 三个模块

### 1. 平台运行状态

- 实时健康：客户端 `PlatformHealth` 组件挂载即 `fetch("/api/health")`（返回 `{status:"ok"|"degraded", db, latencyMs}`），带「刷新」按钮，显示状态药丸（健康=绿脉冲点 / 异常=红 / 网络错误=灰未知）+ DB 延迟。
- 环境信息卡（server 传入，非敏感）：运行环境（`NODE_ENV`）、区域（`VERCEL_REGION`，缺省 "—"）、App 域名（`NEXT_PUBLIC_APP_URL` 主机名）、AI 供应商（`AI_PROVIDER`，缺省 "—"）。

### 2. 超管成员

- antd Table 列出 DB 中 `role='SUPER_ADMIN'` 的账号（邮箱/生效套餐/状态）。
- Alert 说明：白名单由 `ADMIN_EMAILS` 环境变量控制、登录自动同步角色；如需增删改环境变量。显示「白名单已配置 N 个邮箱」（**仅数量，不渲染邮箱明文**）。
- 「前往用户管理」链接到 `/super-admin/users`。

### 3. 套餐与限额总览（只读参考）

- antd Table：`PLAN_ORDER` 四档为列、`PLAN_FEATURE_ROWS` 为行，`Pro`（highlight）列高亮；布尔权益渲染 ✓/✗，数值/额度直接展示。
- 无任何 CTA/升级按钮（区别于营销用 `PlanComparison`）。数据源 `lib/plans.ts`（平台权益事实源）。

## 数据流与安全

- `page.tsx`（server component）：
  - 查 DB 超管成员（复用 `pool`）。
  - 读非敏感 env：`NODE_ENV` / `VERCEL_REGION` / `NEXT_PUBLIC_APP_URL`（取 hostname）/ `AI_PROVIDER` / `ADMIN_EMAILS`（split 后取 `length`）。
  - **绝不渲染任何密钥、token、连接串、邮箱明文白名单**。
  - `PLANS`/`PLAN_ORDER`/`PLAN_FEATURE_ROWS` 静态导入传给 client。
- `_client.tsx`（client）：三模块 antd 渲染，风格对齐 super-admin overview（Card/Statistic/Table）。
- `PlatformHealth.tsx`（client）：唯一「活」交互，实时健康 + 刷新。

## 文件

- `app/super-admin/settings/page.tsx` — server，聚合数据
- `app/super-admin/settings/_client.tsx` — 三模块渲染
- `app/super-admin/settings/PlatformHealth.tsx` — client，实时健康
- `lib/super-admin/health-status.ts` — 纯函数 `healthStatusView(input)`：把 health 结果映射为 `{ label, tone }`（`ok`→健康/success，`degraded`→异常/error，`error|null`→未知/default）
- `lib/super-admin/health-status.test.ts` — 该纯函数 TDD

## 测试与验证

- TDD：`healthStatusView` 三态映射。
- dev Playwright 走查：三模块渲染正确、菜单「平台设置」不再 404、健康刷新可用。
- lint / tsc / vitest / build 全绿。

## 交付

单个内聚页面，内联实现（非多 PR 子代理流水线），一个 PR：分支 `feat_20260720_超管平台设置页`。

## 不做的事（YAGNI）

- 不做可写平台开关/功能标志（无后端机制，且真实配置在 env/Vercel）。
- 不渲染任何敏感 env。
- 不复用营销版 `PlanComparison`（含升级 CTA，不适合只读控制台）。
