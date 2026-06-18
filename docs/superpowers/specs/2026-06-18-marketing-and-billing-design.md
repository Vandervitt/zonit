# 官网 + 路由分层 + 订阅计划 设计 spec

> 状态：设计已确认，待写实现计划。
> 关联：`docs/landing-page-flow-product-overview.md`（产品定位）、`docs/superpowers/specs/2026-04-21-lemonsqueezy-integration-design.md`（计费集成）、上线就绪审计（已完成 P0 sites 清理与 P1 边界/SEO，见分支 `fix_20260618_清理sites残留`）。

## 背景与目标

上线就绪审计暴露两个产品层缺口：

1. **官网（marketing）基本不存在**：对外只有公开的 `/pricing`，根 `/` 是后台 Analytical board 且被 auth-proxy 挡到 `/login`，没有「官网 → 注册」的漏斗前门。产品文档把官网列为本期 Non-Goal，但上线需要一个最小营销前门。
2. **订阅计划数据不一致、限额是空头承诺**：套餐数据散在三处且口径不一（`lib/plans.ts` 的 `PLANS`、`app/pricing` 的 `FEATURE_VALUES`、`app/(dashboard)/billing` 的 `UPGRADE_HIGHLIGHTS`）；核心卖点 `sitesLimit` 在 sites 系统被删后（commit b177f26）已无任何后端强制；计费骨架（LemonSqueezy）代码就绪但环境变量完全未配。

目标：让 `/` 成为公开营销首页、把租户后台与平台后台分层到独立前缀、把订阅计划收敛成单一数据源并真正强制限额、在官网与 admin 两端一致展示套餐、补齐 LemonSqueezy 接通清单。

## 范围与非目标

**做（In Scope）**
- 路由分层：`/`=官网、租户后台→`/admin/*`（含编辑器 `/admin/editor/*`）、平台后台→`/super-admin/*`。
- 订阅计划单一数据源（`lib/plans.ts`），三端（官网 `/`、租户 `/admin/billing`、公开 `/pricing`）复用。
- 计费数据修复：`sitesLimit`→`landingPagesLimit` 改名 + 在创建落地页时真正强制 + 文案对齐。
- 最小营销首页 + 套餐展示。
- LemonSqueezy 接通清单文档。

**不做（Non-Goals）**
- 不改定价策略：免费版「可编辑、不可发布」按现状保留（`free.domainsLimit=0` + 发布强制要已验证域名），仅文案更清楚。
- 不动 `/api/*` 路由（含 `/api/admin/*` super-admin 接口）：迁移只动用户可见页面路由，API 端点与契约不变。
- 不迁移 `/preview-next`（公开样例 demo，固定 `skincareConsultDraft`、无租户数据）：原地保留。
- 不写任何真实密钥进仓库；LemonSqueezy 仅产出配置清单。
- 不做完整官网（多页营销站）、A/B、版本历史等 roadmap 项。

## 三阶段执行结构

分 3 阶段顺序推进，每阶段一个 commit、独立可验证。理由：路由重构是「高风险但行为可保持不变」的搬家，单独成阶段可用现有 e2e 兜底「没搬坏」；计划数据与首页是新增，叠在干净结构上更稳。

---

## 阶段 1：路由分层与布局隔离（行为不变的搬家）

### 目标 app/ 结构

```
app/
  page.tsx                          # 阶段 3 新建：营销首页（公开）
  (auth)/{login,register}           # 不动
  pricing/page.tsx                  # 路径不动（公开）；阶段 2 重构数据源
  p/[slug]/                         # 不动（公开落地页渲染）
  preview-next/page.tsx             # 原地保留（公开样例 demo，无租户数据）
  robots.ts  sitemap.ts             # 已存在；阶段 3 调整 robots 平台域规则

  admin/                            # 租户后台（需登录）
    (workspace)/
      layout.tsx                    # ← 由 (dashboard)/layout.tsx 迁来（Sidebar 壳）
      page.tsx                      # /admin            ← 后台首页（Analytical board）
      billing/  domains/  landing-pages/  media/
      settings/ statistics/ tasks/ reports/ notifications/ help/
    editor/                         # 全屏，无 Sidebar 壳（admin 段下不放 layout.tsx）
      page.tsx                      # /admin/editor           ← 由 editor-next/page.tsx 迁来（模板库）
      [id]/page.tsx                 # /admin/editor/[id]
      [id]/preview/page.tsx         # /admin/editor/[id]/preview

  super-admin/                      # 平台后台（需 SUPER_ADMIN）
    layout.tsx                      # ← 由 app/admin/layout.tsx 迁来
    page.tsx                        # /super-admin
    users/page.tsx                  # /super-admin/users
```

### 布局隔离方案
`admin` 段下**不放** `layout.tsx`，用路由组 `(workspace)` 承载 Sidebar 壳：`(workspace)` 内页面（首页/billing/domains…）有侧边栏；`editor/*` 在组外、仅继承 root layout，天然全屏。`(workspace)` 为路由组不产生路径段，故后台首页仍是 `/admin`。

### auth-proxy 改造（`lib/proxy/auth-proxy.ts`）
- `PUBLIC_PATHS`：`/`（阶段1 先放行，阶段3 填内容）、`/pricing`、`/preview-next`、`/p`、`/robots.txt`、`/sitemap.xml`、`/login`、`/register`、`/api/auth`、`/api/register`、`/api/templates`。
- 角色门禁：`startsWith("/super-admin")` → 需 `SUPER_ADMIN`（原 `/admin` 段逻辑改前缀）；`startsWith("/admin")` → 需登录（任意租户），未登录跳 `/login`。
- 登录重定向落点：`Routes.Home`（`/`）→ 改为 `/admin`（`auth.ts` 与 `app/(auth)/login/page.tsx` 共 3 处 `Routes.Home`）。
- 已登录访问 `/` → 重定向 `/admin`（阶段 3 营销首页落地时启用；见阶段 3）。

### 常量与链接
- `lib/constants/routes.ts`：`Routes` 各后台项加 `/admin` 前缀（`Domains='/admin/domains'`、`Billing='/admin/billing'`、`Media='/admin/media'`、`LandingPages='/admin/landing-pages'`…）；新增 `Dashboard='/admin'`、`SuperAdmin='/super-admin'`；`landingEditorPath`/`landingPreviewPath` 改 `/admin/editor/...`；`Home` 保留 `'/'`（=营销首页）；`Pricing` 保留 `'/pricing'`。
- 逐文件核对硬编码路径残留并改走 `Routes.*`：`components/Sidebar.tsx`（11 链接，首页指向 `Routes.Dashboard`）、迁移后的 super-admin layout 内部链接、`billing`/`domains`/`media`/编辑器/登录注册页。
- e2e：`editor-next-preview.spec.ts`、`preview-next.spec.ts` 等路径更新（`/editor-next`→`/admin/editor`）。

### 验证
搬家后跑现有 e2e（`landing-pages-flow`、更新后的 `editor-next-preview`）+ 手点关键路径，确认「只搬家、零行为变化」。

---

## 阶段 2：订阅计划单一数据源 + 计费数据修复 + LS 清单

### 1. 单一数据源：重构 `lib/plans.ts`
新结构同时承载后端强制限额与营销展示特性：

```ts
interface PlanConfig {
  id: PlanId;
  label: string;
  priceText: string;            // 仅展示："$0" / "$29/mo"
  color: string;
  highlight?: boolean;          // "最受欢迎"
  // —— 后端强制限额 ——
  landingPagesLimit: number;    // ← 由 sitesLimit 改名，且真正强制
  domainsLimit: number;
  // —— 特性标记（营销 + 部分门禁）——
  hasWatermark: boolean;
  allTemplates: boolean;
  advancedTracking: boolean;    // 全矩阵像素 / CAPI
  antiBan: boolean;             // 反同质化风控
  aiTranslation: boolean;       // AI 多语言
  highlights: string[];         // 升级卡片要点文案（billing 用）
}
```
同文件另导出 `PLAN_FEATURE_ROWS`（对比表行定义：`{ label, valueFor(plan): string | boolean }`），供 `/pricing` 与营销首页共用。删除 `pricing` 的 `FEATURE_VALUES` 与 `billing` 的 `UPGRADE_HIGHLIGHTS`（后者改读 `PLANS[plan].highlights`）。

限额取值沿用现状：free `landingPagesLimit=1`、starter=3、pro=20、agency=∞；`domainsLimit` 不变（free=0/starter=1/pro=5/agency=∞）。

### 2. 共享展示组件
抽 `components/billing/PlanComparison.tsx`（套餐卡片 + 对比表，纯展示，数据来自 `lib/plans.ts`），`/pricing` 与阶段 3 营销首页共用，杜绝第二份硬编码。

### 3. 强制 `landingPagesLimit`
在 `POST /api/landing-pages` 创建前校验：`listLandingPages(userId).length >= PLANS[plan].landingPagesLimit` → 返回 `403 + LIMIT_EXCEEDED`。前端 `landing-editor/components/TemplateGalleryCard.tsx` 捕获后引导升级（复用 `UpgradeDialog` 模式）。这是套餐核心卖点（落地页数量）第一次真正生效。

### 4. 计费文案/字段对齐
- `app/admin/billing/page.tsx`（迁移后路径）：「站点上限」→「落地页上限」读 `landingPagesLimit`；升级卡片要点改读 `highlights`。
- `components/billing/UpgradeDialog.tsx`：`sitesLimit`→`landingPagesLimit`，文案「站点」→「落地页」。
- `app/pricing/page.tsx`：对比表「活跃站点数」→「落地页数量」，数据改读 `PLAN_FEATURE_ROWS`。

### 5. 免费版发布门禁（显式保留）
`free.domainsLimit=0` + 发布强制要已验证域名 ⇒ 免费版可编辑、不可发布。本期按现状保留，仅在 `pricing`/`billing` 文案上让此门禁更清楚，不调整定价策略。

### 6. LemonSqueezy 接通清单
产出 `docs/billing-lemonsqueezy-setup.md`：列全 `LEMONSQUEEZY_API_KEY / STORE_ID / WEBHOOK_SECRET / VARIANT_STARTER|PRO|AGENCY` 的用途、LS 后台取值步骤（建 Store→建 3 个 variant→配 webhook 指向 `/api/webhooks/lemonsqueezy`→订阅 subscription_created/updated/cancelled/expired）、在 Vercel 配置 env 的位置。代码侧 `lib/lemonsqueezy.ts` 已就绪，只差配置。

### 验证
- tsc/eslint；`/pricing` 与 `/admin/billing` 同源数据一致。
- 起 dev + seed：免费用户建第 2 张落地页被 403 拦截；升级文案显示「落地页」。

---

## 阶段 3：营销首页（`/`，公开）

### 定位与语言
复用产品文档定位话术，面向 Zonit 的 SaaS 客户（做海外获客的个人创业者/小团队）。平台对自己客户收费是允许的，首页展示套餐与「生成落地页不得含交易语义」不冲突（对象不同）。语言：简体中文（与 `/pricing`、后台一致）。

### 页面结构（`app/page.tsx`，Server Component，纯 Tailwind）
5 个区块：
1. **顶部导航**（sticky）：品牌「Zap Bridge」+ `[套餐定价→/pricing]` + `[登录→/login]` + 主 CTA `[免费开始→/register]`。
2. **Hero**：H1=定位一句话（无需开发、几分钟做出并发布投放级落地页到自己的域名）；副文案=JTBD；主 CTA `[免费开始→/register]` + 次 CTA `[查看套餐→/pricing]`。
3. **三步流程**：选模板 → 改内容 → 发布到自有域名，每步一句话 + 图标。
4. **套餐区**：复用 `PlanComparison`（阶段 2）渲染 4 档卡片（同一数据源，与 `/pricing`、`/admin/billing` 口径一致），底部「查看完整功能对比 →/pricing」。满足「订阅计划在官网展示」。
5. **页脚**：品牌 + 版权 + 链接（套餐定价 / 登录 / 注册）。

特性卡片（可视化编辑器 / 多平台像素 / 自有域名+SEO）按需折进 Hero 下方或三步流程，保持最小，不强求独立区块。

### 登录态处理
未登录看到完整首页；已登录访问 `/` 由 auth-proxy 重定向 `/admin`（`pathname==='/' && isLoggedIn → redirect('/admin')`）。

### SEO / metadata 与 robots 修正
- 首页给完整 `metadata`：title/description/openGraph（平台品牌，非租户页）。
- **修正 `app/robots.ts`**：阶段 P1 将平台主域设为全站 `Disallow`；现有营销首页后，平台主域改为允许 `/` 与 `/pricing`、仅 `Disallow` 后台路径（`/admin`、`/super-admin`、`/api`）。租户自有域名规则不变（allow + sitemap）。

### 复用与边界
- 套餐全部来自 `lib/plans.ts`（阶段 2），不引入新数据源。
- 纯展示 Server Component，无客户端状态（CTA 为普通链接）。
- 遵循 `docs/constraints/frontend-style.md`（Tailwind only、无自定义 CSS/内联样式）。实现期可用 frontend-design 技能产出高质量视觉。

### 验证
- 起 dev：未登录 `/` 渲染五区块、CTA 跳转正确；已登录 `/` 跳 `/admin`。
- 平台域 `/robots.txt` 允许 `/`+`/pricing`、禁 `/admin`+`/super-admin`；租户域 robots 不变。
- 套餐区与 `/pricing`、`/admin/billing` 数据一致。

---

## 风险与回归

- **阶段 1 路由搬家面广**：`Routes` 常量集中改 + 逐文件核对硬编码残留是主要工作量；用现有 e2e（更新路径后）兜底「行为不变」。
- **`/admin` 前缀与既有 super-admin 冲突**：故 super-admin 同步迁到 `/super-admin`，auth-proxy 角色门禁前缀一并改，避免租户被 SUPER_ADMIN 门禁误挡。
- **强制 `landingPagesLimit` 影响存量用户**：免费用户若已有多张草稿，强制仅作用于「新建」，不回溯删除；只挡超额新建。
- **robots 跨阶段依赖**：阶段 3 必须修正平台域 robots，否则营销首页不可被收录（阶段 P1 设的是全站 Disallow）。
