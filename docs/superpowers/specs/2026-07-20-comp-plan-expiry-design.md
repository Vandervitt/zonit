# 赠送套餐有效期 — 设计文档

日期：2026-07-20
状态：已确认

## 背景与目标

超管赠送套餐（`comp_plan`）当前是永久生效。本次为其加**有效期**：快捷预设（7/15/30/90 天）+ 自定义日期选择器；到期后赠送自动失效、生效套餐回落付费档。

## 决策

- 预设：7 天 / 15 天 / 30 天 / 90 天 + 自定义日期选择器。**不含「无限期」选项**——经 UI 新建的赠送一律带到期时间。
- 过期处理：**读取时忽略 + 后台标「已过期」**。不物理清除、不依赖 cron（Vercel Hobby 仅日频）。
- 向后兼容：存量赠送（有 `comp_plan`、无 `comp_plan_expires_at`）视为**永久有效**，不追溯过期。

## 数据模型（migration 022）

`users` 加列：`comp_plan_expires_at TIMESTAMPTZ NULL`。
- `NULL` = 永久（存量赠送 & 语义上的无限期）。
- 有值 = 到该时刻失效。
- down 删列。

## 生效判定

`lib/plans.ts` 新增纯函数：

```ts
/** 赠送套餐是否仍有效：存在且（无到期 或 到期在将来）→ 返回该档，否则 null。 */
export function activeCompPlan(
  compPlan: PlanId | null | undefined,
  expiresAt: Date | string | null | undefined,
  now: Date,
): PlanId | null
```

规则：`compPlan` 为空 → null；`expiresAt` 为空 → 返回 `compPlan`（永久）；`expiresAt > now` → 返回 `compPlan`；否则（已过期）→ null。

所有「生效套餐」读取点改为 `effectivePlan(plan, activeCompPlan(comp_plan, comp_plan_expires_at, now))`，SELECT 增加 `comp_plan_expires_at`：

- `lib/plans-db.ts`：`getUserPlanOrNull`、`getPlanByPageId`
- `auth.ts`：JWT 回调
- `app/super-admin/users/page.tsx`：列表 effective（并把 expiresAt 传给 client 展示）
- `app/super-admin/settings/page.tsx`：超管成员 effective
- `lib/super-admin/users-db.ts`：`getUserAdminDetail`（SELECT + 返回 `comp_plan_expires_at`）

过期赠送在所有权益门控（发布页水印/追踪/antiBan、AI 额度、域名限额等，均经上述读取点）自动失效回落付费档。

## API（`/api/super-admin/users/[id]` PATCH）

- `AdminUserPatch` 增加 `compPlanExpiresAt?: string | null`。
- `updateUserAdminFields`：`compPlanExpiresAt` 存在时写 `comp_plan_expires_at`（值或 NULL）。
- 路由校验：
  - `compPlan` 为具体档位时，若带 `compPlanExpiresAt` 必须是可解析且**未来**的 ISO（过去/非法 → 400）；允许为 null（永久，供理论调用，但 UI 不产出）。
  - `compPlan` 为 `null`（无赠送）时，服务端强制 `comp_plan_expires_at = NULL`（无论请求是否带 expires）。
- 现有鉴权/自我保护/白名单校验不变。

## UI — 赠送弹窗（`app/super-admin/users/_client.tsx`）

- 套餐 Select（无赠送 / Starter / Pro / Agency）保留。
- 新增「有效期」行：antd `Segmented`（7天/15天/30天/90天/自定义），默认 30天；选「自定义」显示 antd `DatePicker`（`disabledDate` 限今天之后）。
- 实时预览到期日文本。
- 选「无赠送」隐藏有效期行。
- 编辑已有赠送时：套餐回显现值；有效期默认落在「自定义」并回显现到期日（若为永久存量则显示「永久」只读提示，改档需选新预设）。
- 客户端据预设/自定义算出 `compPlanExpiresAt`（ISO，预设=今天 + N 天；自定义=所选日期当天 23:59:59），随 `compPlan` PATCH。

## 列表 / 详情展示

- 列表「生效套餐」列：
  - 赠送有效 → `PlanBadge(生效档)` + 金色「赠送」Tag（Tooltip：`赠送 <档>，<到期日> 到期`）。
  - 赠送已过期（`comp_plan` 有值但已过期）→ 显示付费档 `PlanBadge` + 灰色「已过期」Tag。
- 详情抽屉「赠送套餐」行：显示赠送档 + 到期日；已过期加「已过期」标；永久显示「永久」。

## 测试与验证

- TDD：`activeCompPlan`（有效 / 已过期 / 永久 null / 无赠送 / 边界 now==expires）。
- API：扩 `route.test.ts`——未来日期通过、过去日期 400、无赠送强制清 expires。
- dev Playwright：预设赠送 + 自定义赠送生效与到期日展示；播种过去 `comp_plan_expires_at` 验证生效回落付费档 + 列表「已过期」标。
- 门槛：lint / tsc / vitest / build 全绿。

## 文件清单

- `migrations/022_add_comp_plan_expires_at.js`（新增）
- `lib/plans.ts`（+`activeCompPlan`）、`lib/plans.activeCompPlan.test.ts`（新增）
- `lib/plans-db.ts`、`auth.ts`（读取点）
- `app/super-admin/users/page.tsx`、`app/super-admin/settings/page.tsx`（读取点 + 传参）
- `lib/super-admin/users-db.ts`（patch + detail）
- `app/api/super-admin/users/[id]/route.ts` + `route.test.ts`（API + 校验）
- `app/super-admin/users/_client.tsx`、`app/super-admin/users/UserDetailDrawer.tsx`（UI）

## 不做的事（YAGNI）

- 不做「无限期」新建选项（UI 层）；存量永久赠送仍兼容。
- 不做物理清除 / cron 定时失效。
- 不改 billing/webhook（仍只写 `plan`，不碰赠送两列）。
- 不做到期前邮件提醒 / 续期工作流。
