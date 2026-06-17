# PULSAR 落地页 · 核心流程设计（admin 端）

> 工程设计文档：`官网落点(注册/登录) → 选模板 → 编辑 → 预览 → 发布(自有域名) → 管理`。

- 日期：2026-06-17
- 状态：已确认设计，待转实现计划
- **关联文档**：产品说明书 `docs/landing-page-flow-product-overview.md`（本 spec 是其落地的工程设计，两份口径需对齐）；产品/工程约束 `docs/constraints/*`。
- 范围视角：**admin 端的端到端用户旅程**（三端定位见 §0），承接官网漏斗落点（注册/登录）后的完整流程；官网建设本身不在本 spec。
- 技术取向：发布产物基于 `types/schema.draft.ts`（`LandingPageDraft`）与新渲染器 `landing-renderer`，落入全新独立持久化，与旧 `sites`/旧渲染器解耦。
- 发布约束：落地页**只能发布到用户自有域名**——复用现有 Domains/Vercel/`handleTenancy` 多租户管线并扩展到 `landing_pages`（本期范围，§3.5/§9）。

## 0. 产品三端与本流程定位

本产品分三端，本流程位于 **admin 端**：

| 端 | 面向 | 职责 | 代码现状 |
|---|---|---|---|
| **官网**（marketing）| 潜在用户 | 介绍产品、转化为注册用户（漏斗前门）| 待补：仅 `/pricing` 公开，无营销首页（`/` 是受保护的租户首页）|
| **admin**（租户后台）| 租户（`USER` 角色）| 租户自管落地页/数据/域名——**本 spec 所覆盖**（`(dashboard)` 组 + 编辑器 + 发布）| 基本就绪 |
| **super-admin**（平台后台）| 平台运营（`SUPER_ADMIN`）| 管理租户(users)、模板、平台设置 | 已有 `app/admin/**`（Users/Sites/Templates/Settings）|

**完整入口漏斗**：`访问官网 → 跳转 admin → 注册/登录 → 进入本流程`。

- **官网 → admin 的 handoff（边界）**：官网 CTA 指向 admin 端的 `/register` 或 `/login`（复用现有认证），登录后回 `Routes.Home`（`/`）进入租户后台，再走 §2 流程。**官网本身的建设是独立 surface / workstream，不在本 spec 范围**；本 spec 只承接其落点（注册/登录后的 admin 流程）。
- **super-admin 关系（边界）**：super-admin 负责治理「租户」与「模板库」。注意现状落差——本流程模板源是**代码硬编码** `landing-editor/samples/registry.ts`，而 super-admin 的 `/admin/templates` 管的是**旧 `preset_templates` 表**；让 super-admin 在线管理「新流程模板注册表」是**后续工作**，不在本 spec（本期模板仍用代码 registry 的 4 套）。
- 因此下文 §1–§14 默认语境为 **admin 端**；「应用首页/导航/登录」均指 admin 端的对应物。

## 1. 应用现状（流程所处的整体环境）

PULSAR 是一个仪表盘式 SaaS 应用，本流程嵌在它的既有外壳与导航中：

- **应用外壳**：`app/(dashboard)/layout.tsx` = 居中卡片 + `components/Sidebar.tsx`。登录后所有业务页面都在这个壳内。
- **应用首页**：`/`（`app/(dashboard)/page.tsx`，即 `Routes.Home`），登录后的落点。
- **侧边导航**（`Sidebar.tsx`）：Dashboard(`/`)、**Sites**(`/sites`)、Domains、素材库、Statistics、Task list、Report、Notifications；Other：Billing、Settings、Help；底部用户区（头像 + 套餐徽章 + 登出→`/login`）。
- **应用级认证**：`auth.ts` 的 NextAuth（`session.strategy='jwt'`；Google/Apple/Microsoft/Credentials/Dev），登录页 `app/(auth)/login`，登录后回 `Routes.Home`。门禁在 `proxy.ts`（`auth()` 包裹）+ `lib/proxy/auth-proxy.ts`。
- **现成可复用资产**：新编辑器 `landing-editor/`（路由 `/editor-next`）产出 `LandingPageDraft`；新渲染器 `landing-renderer/LandingPage({ page })`；模板注册表 `landing-editor/samples/registry.ts`（4 套：skincare/dental/solar/radiantglow）+ 选择页 `TemplateGallery`。
- **现成的域名与多租户管线（关键复用）**：`domains` 表（`user_id/site_id/domain/enabled/verified`）+ domains API（`app/api/domains/**`，绑定经 Vercel `addDomainToProject` 開通、`[id]/status` 校验）+ `lib/domains-db.ts`（`getSlugByCustomDomain` 等）+ `lib/proxy/tenant-proxy.ts` 的 `handleTenancy`（按 host 解析自定义域名 → rewrite 到 `/site/[slug]`）+ Domains 仪表盘区块。本流程的「自有域名发布」直接扩展这套管线到 `landing_pages`。
- **现状落差**：`/editor-next` 当前是 `PUBLIC_PATHS` 中的免登录例外，且只以本地样例为种子、无持久化、无发布闭环；旧 `sites` 表/`/site/[slug]`/旧渲染器服务旧数据，本期不改动、不复用。
- **重要约束（本次新增）**：落地页**只能发布到用户自有域名下**——用户须先绑定并验证自有域名，平台不提供公共子路径/共享子域名托管；故「自有域名绑定 + 验证」与「按 host 的多租户发布渲染」**纳入本期**（见 §3.5、§9）。

## 2. 端到端流程总览（贯穿应用）

以应用旅程而非文件来组织。各阶段及其在应用中的落点：

```
官网(CTA) ──▶ 注册/登录(现有认证) ──▶ 应用首页 /  ──侧栏「落地页」──▶ 落地页列表
[官网建设见 §0，不在本 spec；本 spec 承接其落点]
                                                                  │ 新建
                                                                  ▼
                                                         模板选择页 /editor-next
                                                                  │ 选模板=建库
                                                                  ▼
                                              编辑器 /editor-next/[id] ◀──自动保存──┐
                                                   │            │                   │
                                              预览 │       发布 │                   │
                                                   ▼            ▼                   │
                       全屏预览 /editor-next/[id]/preview   发布弹框→选/绑自有域名     │
                              (owner, app 域名)                   │                 │
                                                                  ▼                 │
                              对外公开：https://<用户自有域名>/                       │
                              (handleTenancy 按 host 重写到内部 /p/[slug]，           │
                               landing-renderer 渲染)             │ 取消发布/再编辑 ─┘
                                                                  ▼
                                                         回到落地页列表（管理）
```

旅程阶段：**⓪官网(前门，§0) → ①注册/登录 → ②进入落地页列表(首页/侧栏) → ③新建+选模板 → ④编辑(自动保存) → ⑤预览(实时+全屏) → ⑥发布(到自有域名) → ⑦管理(列表/再编辑/取消发布/删除)**。下文 §4 逐阶段设计，§5–§9 为横切关注点。关键约束：**发布只能落在用户自有域名**（§3.5、§9）。

## 3. 导航与信息架构集成（让流程成为应用一等公民）

- **侧边栏新增入口**：在 `Sidebar.tsx` 的 `navItems` 增加「落地页 / Landing Pages」项，指向新区块 `/(dashboard)/landing-pages`。这是本流程在应用内的稳定入口。
- **与现有「Sites」的关系**：新「落地页」区块基于全新独立持久化（§5），是落地页业务的**go-forward 入口**；侧栏旧「Sites」项（指向旧 `/sites` + 旧数据）本期**保持原样、不动**，避免破坏旧数据；后续是否下线旧 Sites 另议（不在本期）。
- **应用首页（`/`）联动（可选、轻量）**：首页可加一个「新建落地页」快捷入口指向 `/(dashboard)/landing-pages`；若改动首页成本超出 happy-path，可只做侧栏入口（首页联动列为可选）。
- **编辑器/预览的外壳**：`/editor-next/[id]` 与 `/editor-next/[id]/preview` 是**全屏**工作台，不套用 dashboard 卡片外壳（与编辑器现状一致）；但它们受同一套应用登录保护（§8），完成后经返回按钮回到 `/(dashboard)/landing-pages`。

### 3.5 自有域名绑定（复用现有 Domains 能力）

- 「绑定/验证自有域名」复用现有 **Domains 仪表盘区块 + domains API + Vercel 開通/校验**（§1），不新造一套域名管理 UI。
- 发布弹框内提供「选择已验证域名 / 去绑定新域名」入口：已有 `verified+enabled` 域名直接选；没有则引导到现有 Domains 流程（添加→Vercel 验证）后再回来发布。
- 一个域名在其**根路径**承载一张已发布落地页（域名 ↔ 页面一对一）；改绑到新页面会替换该域名上的旧页面。

## 4. 分阶段设计

### 阶段① 注册/登录（自官网跳入，复用现有应用认证，零新增）

用户由**官网 CTA** 跳入 admin 端的 `/register` 或 `/login`（官网建设见 §0，不在本 spec）。此后即**现有应用级登录**，本期**不新建任何登录逻辑**：沿用 `auth.ts`/NextAuth/`app/(auth)/login`，登录后回 `Routes.Home`。服务端识别用户与现有 API 一致：`const session = await auth(); session.user.id`（`session` 回调已注入 `user.id`、`user.plan`）。唯一相关改动是把 `/editor-next` 移出 `PUBLIC_PATHS`（§8），使本流程全程处于应用登录之后。

### 阶段② 应用首页与导航

登录落点为 `/`（既有仪表盘首页，不改其核心）。用户经**侧栏「落地页」**进入 `/(dashboard)/landing-pages`：列出当前用户的落地页（草稿/已发布、live 链接、更新时间），提供「新建」「编辑」「预览」「取消发布」「删除」入口与空态。

### 阶段③ 新建 + 选择模板

列表「新建」→ 模板选择页 `/editor-next`（复用 `TemplateGallery`）。卡片「开始编辑」动作由原 `?template=<id>` 改为：`POST /api/landing-pages { templateId }` → 用 registry 种子建库（默认 name 取模板名）→ `router.push('/editor-next/'+id)`。

### 阶段④ 编辑（自动保存）

`/editor-next/[id]`：服务端按 id 取记录（owner 校验），将 `data`（`LandingPageDraft`）+ `id` + `name` 注入 `Editor`。编辑动作经防抖（~1.5s）`PUT /api/landing-pages/[id]` 保存 `name`+`toDraft(state)`；顶栏显示保存状态。顶栏还含：页面名内联编辑、**预览**按钮（新标签开 `/editor-next/[id]/preview`）、**发布**按钮、返回列表。

### 阶段⑤ 预览（实时 + 全屏）

- **实时预览**：编辑器右栏现有 iframe 预览（手机/桌面取景框）持续生效。
- **全屏预览**：`/editor-next/[id]/preview` 以 owner 身份整页渲染当前草稿（`landing-renderer`，登录保护），所见即发布后效果。

### 阶段⑥ 发布（到用户自有域名）

编辑器「发布」打开发布弹框，发布需同时满足结构校验与**自有域名**：

1. **结构校验**：`isLandingPageStructureValid` 不通过则提示缺失项、阻止发布。
2. **选择自有域名**：列出当前用户 `verified+enabled` 的域名供选择；无可用域名时引导去绑定+验证（复用 Domains 流程，§3.5）。
3. **发布**：`POST /api/landing-pages/[id]/publish { domainId, slug? }` → 校验该域名归属本人且已验证启用 → 关联 `domains.landing_page_id = page.id`、置 `landing_pages.status='published'`、写 slug、`published_at`。
4. **成功**：展示对外 live 链接 `https://<域名>/`（页面在该域名根路径，由 `handleTenancy` 按 host 重写到内部 `/p/[slug]` 渲染，§9）。

slug 仍由 `name` 生成、可编辑查重，但仅作**内部渲染标识与重写目标**，不是对外 URL（对外即自有域名根）。

### 阶段⑦ 管理（闭环回到应用内）

已发布页可**再编辑**（回 `/editor-next/[id]` 改→自动保存→需要时重新发布，**复用同 slug 与同域名绑定**）、**取消发布**（`POST .../unpublish`，`status=draft`，**保留 slug 与域名绑定**，使域名上暂时无可访问页面 → 该 host 返回 404）、**删除**（同时解除域名绑定，`domains.landing_page_id` 因 `ON DELETE SET NULL` 置空）。这些操作都在 `/(dashboard)/landing-pages` 列表完成，形成应用内闭环。

## 5. 数据模型（全新独立持久化）

新增迁移 `migrations/010_add_landing_pages.js`（遵循 `docs/dev-database-migration-workflow.md`：`pnpm migrate:create add_landing_pages` 编辑后 `pnpm migrate:up`，迁移走 `DATABASE_URL_UNPOOLED`）。

表 `landing_pages`（与旧 `sites` 完全独立）：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | TEXT PK（沿用 `sites.id` 同款生成方式）| 主键 |
| `user_id` | TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE | 归属用户 |
| `name` | TEXT NOT NULL | 页面名（用户可改）|
| `slug` | TEXT UNIQUE（可空）| 发布时生成/校验 |
| `status` | TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')) | 状态 |
| `data` | JSONB NOT NULL | `LandingPageDraft` |
| `published_at` | TIMESTAMPTZ NULL | 发布时间 |
| `created_at` / `updated_at` | TIMESTAMPTZ DEFAULT now() | 时间戳 |

索引：`idx_landing_pages_user_id`、`UNIQUE idx_landing_pages_user_name (user_id, name)`、`slug` 唯一约束自带索引。

**扩展现有 `domains` 表**（同一迁移内 `ALTER`）：新增 `landing_page_id TEXT NULL REFERENCES landing_pages(id) ON DELETE SET NULL`。一条域名记录指向**旧 `site_id` 或新 `landing_page_id` 二者之一**（新流程只用 `landing_page_id`）。新增按域名解析新页面的查询 `getPublishedLandingPageByCustomDomain(host)`：`domains JOIN landing_pages` where `enabled AND verified AND status='published' AND landing_page_id IS NOT NULL`，返回 slug（或页面）。`site_id` 路径与旧逻辑保持不变。

## 6. 全应用路由表（流程涉及的所有 surface）

| 路由 | 鉴权 | 角色 | 说明 |
|---|---|---|---|
| `/login` | 公开 | 现有 | 应用登录（复用）|
| `/`（`Routes.Home`）| 登录 | 现有 | 应用首页/仪表盘落点（可选加快捷入口）|
| `/(dashboard)/landing-pages` | 登录 | **新增** | 落地页列表与管理（本流程在应用内的入口）|
| `/editor-next` | 登录 | 改造 | 模板选择页；选模板=建库后跳编辑器 |
| `/editor-next/[id]` | 登录 + owner | **新增** | 编辑器，按 id 载入 draft、自动保存 |
| `/editor-next/[id]/preview` | 登录 + owner | **新增** | 全屏预览当前草稿（app 域名、owner）|
| `https://<用户自有域名>/` | 公开 | **新增** | 对外发布页（由 `handleTenancy` 按 host 重写到内部 `/p/[slug]`）|
| `/p/[slug]` | 公开（仅内部）| **新增** | 内部渲染目标（`landing-renderer`）；**仅经自定义域名重写到达**，在 app 域名直接访问返回 `notFound()` |
| `/(dashboard)/domains` + `/api/domains/**` | 登录 | **复用** | 自有域名绑定/验证（现有 Domains 能力）|
| 侧栏「落地页」项 | — | 改造 | `Sidebar.tsx` 新增导航入口 |

## 7. API（沿用现有 `auth()` 鉴权方式，按 `session.user.id` 隔离；非 owner 返回 404）

| 方法 + 路径 | 作用 |
|---|---|
| `GET /api/landing-pages` | 列出当前用户的落地页 |
| `POST /api/landing-pages` | `{ templateId }` → 从 registry 取种子建库，返回 `id`（默认 name=模板名）|
| `GET /api/landing-pages/[id]` | 取单条（owner）|
| `PUT /api/landing-pages/[id]` | 保存草稿：更新 `name` + `data`（自动保存调用）|
| `DELETE /api/landing-pages/[id]` | 删除（owner）|
| `POST /api/landing-pages/[id]/publish` | 发布：body `{ domainId, slug? }`；校验域名归属+`verified+enabled` → 关联 `domains.landing_page_id`、生成/校验 slug、`status=published`、`published_at` |
| `POST /api/landing-pages/[id]/unpublish` | 取消发布：`status=draft`，**保留 slug 与域名绑定** |

- 鉴权方式与现有 sites API 一致（`auth()` → `session.user.id`，无 session 返 401）。
- slug：由 `name` slugify，冲突追加短后缀；发布弹框可手动编辑并实时查重（409 冲突）。slug 仅为内部渲染标识。
- 校验：`PUT` 不阻断（草稿可不完整）；`publish` 必须 `isLandingPageStructureValid` 通过（否则 422 + 缺失项）。
- **域名前置**：`publish` 必须带一个本人 `verified+enabled` 的 `domainId`；缺失/未验证返回 422（前端引导去绑定）。域名的绑定/验证沿用**现有 domains API**（`POST /api/domains` 扩展为可接 `landingPageId`，与 `siteId` 二选一；验证经 `[id]/status` + Vercel，复用不改）。
- **多租户解析**：扩展 `lib/proxy/tenant-proxy.ts` 的 `handleTenancy` —— 自定义 host 先用 `getPublishedLandingPageByCustomDomain` 命中新页面则 rewrite `/p/[slug]`；未命中回落旧 `getSlugByCustomDomain`→`/site/[slug]`；都不命中 404。

## 8. 认证门禁（`lib/proxy/auth-proxy.ts`）

复用现有应用级登录，不引入新认证机制。仅调整 `PUBLIC_PATHS`：

- **移除** `/editor-next`（原为免登录例外；移除后编辑器/预览随既有门禁要求登录，未登录自动重定向 `/login`）。
- **新增** `/p`（已发布页公开——作为自定义域名重写后的内部渲染目标）。
- `/preview-next`（样例 demo）、`/site`（旧）保持现状。
- 结果：`/editor-next`、`/editor-next/[id]`、`/editor-next/[id]/preview` 与 `/(dashboard)/*` 同受应用登录保护；`/p/[slug]` 公开。
- **租户先行**：`proxy.ts` 中 `handleTenancy` 在 `handleAuth` 之前执行——自定义域名请求先被 `handleTenancy` 按 host 重写到 `/p/[slug]` 并放行（公开），不进入登录门禁。`/p/[slug]` 在 **app 域名**直接访问由页面自身 `notFound()`（仅经自定义域名重写到达），以贯彻「只发布到自有域名」。

## 9. 发布渲染（多租户）与 SEO

- **请求流**：访客访问 `https://<用户自有域名>/` → `proxy.ts` 先跑 `handleTenancy`：识别为自定义 host → `getPublishedLandingPageByCustomDomain(host)` 得 slug → `NextResponse.rewrite('/p/<slug>')`（旧 sites 回落逻辑保留）。
- **`/p/[slug]` 渲染**：服务端按 `slug`+`status='published'` 查 `landing_pages`，命中 `<LandingPage page={data} />`（`landing-renderer`，默认 theme），未命中 `notFound()`；并在 **app 域名直连**时 `notFound()`（仅服务自定义域名重写，§8）。
- **域名开通/验证**：复用现有 Vercel 集成（`addDomainToProject` + `[id]/status`），本期不改其机制。
- **SEO**：`LandingPageDraft` 是纯内容 schema、无 SEO 字段，故 `generateMetadata` 仅从内容**派生**：title ← `hero.title`（去换行），description ← `hero.subtitle`。完整 SEO 编辑面板不在本期。

## 10. 本期范围（MVP）

**做**：§2 端到端 happy-path 全链路（登录 → 首页/导航 → 新建选模板 → 编辑自动保存 → 实时/全屏预览 → **绑定/验证自有域名 → 发布到该域名 → 多租户按 host 渲染** → 再编辑/取消发布/删除/列表管理）+ 侧栏入口。其中域名能力**复用现有 Domains/Vercel 管线**并扩展到 `landing_pages`（新增 `domains.landing_page_id` + 新解析查询 + `handleTenancy` 扩展），不新造域名 UI。

**依赖/前提**：域名开通与验证依赖现有 **Vercel 集成**（需配置 Vercel 项目与 token）及 `NEXT_PUBLIC_APP_URL`（`handleTenancy` 用其区分 app 域名 vs 自定义域名）；e2e 需可注入「已验证域名」fixture 或对 Vercel 校验打桩。

**不做（留后续）**：**官网营销站建设**（独立 surface，本 spec 只承接其注册/登录落点，§0）、**super-admin 在线管理「新流程模板注册表」**（本期模板仍用代码 `registry.ts` 的 4 套）、下线旧 Sites、analytics 像素、SEO 编辑面板、JSON-LD、版本/修订历史、可分享 token 预览、按套餐加水印、i18n、多人协作、应用首页深度改造（首页快捷入口为可选轻量项）。注：域名数量沿用现有套餐 `domainsLimit` 限制（既有行为，不新增计费逻辑）。

## 11. 模块边界（便于独立实现与测试）

1. **持久化层**：迁移 + `lib/landing-pages/store.ts`（DB query 封装）+ 类型。
2. **API 层**：`app/api/landing-pages/**`，仅鉴权/owner 校验/调用持久化/结构校验。
3. **应用集成**：`Sidebar.tsx` 入口 +（可选）首页快捷入口。
4. **列表/管理页**：`/(dashboard)/landing-pages` + 卡片/空态/操作组件。
5. **编辑器接线**：`/editor-next` 与 `/editor-next/[id]` 路由、`Editor` 载入与自动保存、顶栏（名称/保存态/预览/发布/返回）。
6. **预览页**：`/editor-next/[id]/preview`。
7. **发布与公开页**：发布弹框（含域名选择）+ publish/unpublish API + `/p/[slug]` 渲染。
8. **域名与多租户**：迁移 `ALTER domains ADD landing_page_id` + `getPublishedLandingPageByCustomDomain` + `handleTenancy` 扩展 + `POST /api/domains` 接 `landingPageId`（复用现有 Domains UI/验证）。
9. **门禁**：`auth-proxy.ts` 公开路径调整（`-/editor-next`、`+/p`）。

边界约定：API 是持久化层与前端的唯一边界；`Editor` 只依赖「初始 draft + 保存回调」；应用集成只新增入口、不改既有区块内部。

## 12. 错误处理

- API：未登录 401（沿用 proxy）；非 owner 资源 404；发布结构校验失败 422 + 缺失项；slug 冲突 409。
- 自动保存失败：顶栏提示「保存失败，重试」，不丢本地编辑态。
- 公开页：slug 未命中或非 published → `notFound()`（404）。

## 13. 测试与验证

- **e2e 端到端 happy-path**（`e2e/`，沿用 fixture/登录态注入约定）：登录 → 列表新建 → `/editor-next` 选模板建页 → 自动保存生效 → 全屏预览渲染 → 注入「已验证域名」fixture → 发布到该域名 → 以该 host 请求经 `handleTenancy` 重写到 `/p/[slug]`、渲染含 hero 文案 → 取消发布后该 host 返回 404。
- **多租户/域名**：`getPublishedLandingPageByCustomDomain` 命中/未命中；`/p/[slug]` 在 app 域名直连返回 404；发布缺少 `verified+enabled` 域名时被拒（422）。
- **API/契约**：建/取/存/删、发布（需域名）/取消、slug 唯一性、user 隔离（跨用户访问 404）。
- 沿用现有 `e2e/editor-next-preview.spec.ts` 实时预览用例。
- 门禁手测：未登录访问 `/editor-next/[id]` 跳 `/login`；`/p/[slug]` 免登录可达。
- 全程 `npm run lint` 零错误、`tsc` 无新增类型错误。

## 14. 已定默认（设计确认时拍板）

- 「登录」= 复用现有应用级 NextAuth，不新建登录逻辑。
- 流程作为应用一等公民：侧栏新增「落地页」入口；新区块基于全新独立持久化，旧 Sites 保持不动。
- **自动保存**（无手动保存按钮）。
- **发布只能落在用户自有域名**：复用现有 Domains/Vercel 管线，扩展 `domains.landing_page_id` + `handleTenancy`；发布须选一个 `verified+enabled` 域名；域名 ↔ 页面一对一、根路径承载。
- **slug 由 name 生成、发布弹框可编辑 + 查重**，但仅作内部渲染标识/重写目标（对外 URL = 自有域名根）；取消发布**保留 slug 与域名绑定**。
- 编辑器 **`/editor-next/[id]`**、预览 **`/editor-next/[id]/preview`**（app 域名、owner）、内部渲染 **`/p/[slug]`**（仅经自定义域名重写到达）。
