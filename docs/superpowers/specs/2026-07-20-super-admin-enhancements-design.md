# Super Admin 端完善与 Admin 遗留清理 — 设计文档

日期：2026-07-20
状态：已确认

## 背景与目标

Zap Bridge 是面向出海线索获取的落地页 SaaS。当前 super-admin 端只有只读的概览页和用户列表，无法支撑日常运营（调套餐、处置违规租户）；admin 端还有两处已知遗留（无「恢复为线上版本」入口、UpgradeDialog 死代码）。

本次目标：

1. super-admin 用户运营能力：搜索/筛选、用户详情、赠送套餐、角色调整、禁用账号。
2. super-admin 数据看板增强：线索总量、套餐分布、近 30 天趋势图。
3. admin 端遗留清理：「恢复为线上版本」入口、UpgradeDialog 死代码删除。

技术约束：super-admin 端 UI 一律使用 antd 成熟组件，禁止引入 shadcn；图表用 recharts（与 admin/analytics 同栈）；Tailwind/antd 现有风格，不写自定义 CSS。

## 1. 数据层（migration 021）

`users` 表新增两列，幂等迁移（node-pg-migrate，`migrations/021_add_comp_plan_disabled.js`）：

- `comp_plan TEXT NULL CHECK (comp_plan IN ('starter','pro','agency'))` — 赠送套餐；仅超管通过管理接口写入；Lemon Squeezy webhook、billing 流程永不触碰此列。
- `disabled_at TIMESTAMPTZ NULL` — 禁用时间；NULL 即正常。

down 迁移删除两列。

## 2. 生效套餐 = max(plan, comp_plan)

- `lib/plans.ts` 新增纯函数 `effectivePlan(plan: PlanId, compPlan: PlanId | null): PlanId`，按 free < starter < pro < agency 取较高者；配套单测（TDD）。
- 读取点收敛改造（不新增读取入口）：
  - `lib/plans-db.ts`：`getUserPlanOrNull` / `getUserPlan` / `getPlanByPageId` 的 SQL 改为同时 select `comp_plan`，返回前过 `effectivePlan`。
  - `auth.ts` JWT 回调：select 增加 `comp_plan`，注入 session 的 plan 使用生效套餐。
- 不改动：webhook（只写 `plan`）、billing checkout/portal。LS 订阅事件照常覆写 `plan`，赠送权益不受影响。

## 3. 禁用账号（禁登录 + 下线页面）

- 登录侧（`auth.ts`）：
  - credentials `authorize`：`disabled_at` 非空则拒绝登录。
  - OAuth `signIn` 回调：同样拦截。
  - JWT 刷新回调：查询到 `disabled_at` 非空时作废会话（沿用现有 session_stale / 用户行缺失的失效机制语义）。
- 公网侧：
  - `lib/landing-pages/store.ts` 的 `getPublishedBySlug`：JOIN users 增加 `disabled_at IS NULL` 条件，禁用租户的已发布页（含绑定域名访问）返回 404。
  - preview 链接（`app/preview/[token]`）同样拦截禁用租户。

## 4. super-admin 用户运营

### API

新增 `app/api/super-admin/users/[id]/route.ts`（PATCH）：

- 鉴权：session 角色必须为 `SUPER_ADMIN`，否则 403。
- 支持字段（单次可传其一或多个）：
  - `compPlan`: `'starter' | 'pro' | 'agency' | null`（null 即取消赠送）
  - `role`: `'USER' | 'SUPER_ADMIN'`
  - `disabled`: `boolean`（true 写 `disabled_at = NOW()`，false 置 NULL）
- 护栏：不允许操作自己（降权、禁用自己一律 400）；字段值白名单校验。
- 单测覆盖：非超管 403、操作自己 400、正常更新各字段。

### 用户列表页（`app/super-admin/users`）

- 搜索框：邮箱/名称模糊匹配（客户端过滤；当前用户量小，不做服务端分页，antd Table 自带分页保留）。
- 筛选：套餐（生效口径）、角色、状态（正常/已禁用）— antd Table filters。
- 列调整：显示「生效套餐」，有赠送时以 antd Tag/Tooltip 标注赠送来源（如 `pro（赠送）`）。
- 行操作（antd Dropdown + Popconfirm）：
  - 赠送套餐（Modal + Select：starter/pro/agency/取消赠送）
  - 设为超管 / 取消超管
  - 禁用 / 启用（禁用需 Popconfirm，文案说明「将禁止登录并下线其全部已发布页面」）
- 用户详情抽屉（antd Drawer）：注册信息、订阅信息（plan / comp_plan / LS customer id）、落地页列表（名称/状态/绑定域名）、线索总数。数据由新增 `app/api/super-admin/users/[id]/route.ts` 的 GET 返回（同一路由文件）。

## 5. super-admin 数据看板（`app/super-admin` 概览页）

- 新增统计卡：线索总量。
- 套餐分布：按生效套餐口径统计各档用户数（antd 卡片内简洁展示）。
- 近 30 天趋势：新增用户、新增线索两条曲线（recharts AreaChart，客户端组件，风格对齐 `admin/(workspace)/analytics`）。
- 查询在 server component 聚合：`date_trunc('day', ...)` 分组，缺日补零由前端或 SQL generate_series 完成（实现取简单者，SQL 聚合逻辑抽入可单测的 lib 函数）。

## 6. admin 端遗留

- 「恢复为线上版本」：
  - 编辑器工具栏新按钮，仅当存在未发布修改（`updated_at > published_at` 且已发布）时可用。
  - Popconfirm 确认后调用新 API `POST /api/landing-pages/[id]/restore-live`：将 `published_data` 覆写回 `data`（草稿），刷新 `updated_at`。
  - 前端拿到快照后走 store 的 `replaceDraft` 语义，进入 undo 栈单步可撤销。
- UpgradeDialog：核对 `app/admin/(workspace)/domains/page.tsx` 的引用是否为死代码；确认后连同 `components/billing/UpgradeDialog.tsx` 一并删除，跑 tsc/build 验证无引用残留。

## 测试与验证

- TDD：`effectivePlan`、禁用门控（登录拒绝 + 公网 404）、super-admin API 权限与护栏、趋势 SQL 聚合函数。
- 分层验证：vitest 全量 → lint → tsc → build；dev 环境 Playwright 走查 super-admin 用户操作链路与看板渲染、编辑器恢复线上版本链路。
- 迁移：仅在本地 dev 库（zapbridge）执行，遵循 `docs/dev-database-migration-workflow.md`。

## 交付拆分（3~4 个 PR）

1. PR-A：migration 021 + `effectivePlan` + 读取点改造（含单测）。
2. PR-B：禁用账号全链路（登录拦截 + 公网 404 + super-admin API + 列表页操作/详情抽屉）。
3. PR-C：数据看板增强。
4. PR-D：admin 遗留（恢复线上版本 + UpgradeDialog 清理）。

## 不做的事（YAGNI）

- 不做服务端分页/搜索（用户量小）。
- 不做操作审计日志表（后续有需要再加）。
- 不做跨租户内容风控总览（本次未选入范围）。
- 不改 billing/webhook 写入逻辑。
