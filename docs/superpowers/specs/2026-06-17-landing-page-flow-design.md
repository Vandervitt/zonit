# 应用核心流程设计：登录 → 选模板 → 编辑 → 预览 → 发布

- 日期：2026-06-17
- 状态：已确认设计，待转实现计划
- 视角：**整个应用（PULSAR）的端到端用户旅程**，而非孤立模块。本流程是应用的主业务路径：用户进入应用 → 在应用内创建一张落地页 → 编辑、预览 → 对外发布 → 回到应用内管理。
- 技术取向：发布产物基于 `types/schema.draft.ts`（`LandingPageDraft`）与新渲染器 `landing-renderer`，落入全新独立持久化，与旧 `sites`/旧渲染器解耦。

## 1. 应用现状（流程所处的整体环境）

PULSAR 是一个仪表盘式 SaaS 应用，本流程嵌在它的既有外壳与导航中：

- **应用外壳**：`app/(dashboard)/layout.tsx` = 居中卡片 + `components/Sidebar.tsx`。登录后所有业务页面都在这个壳内。
- **应用首页**：`/`（`app/(dashboard)/page.tsx`，即 `Routes.Home`），登录后的落点。
- **侧边导航**（`Sidebar.tsx`）：Dashboard(`/`)、**Sites**(`/sites`)、Domains、素材库、Statistics、Task list、Report、Notifications；Other：Billing、Settings、Help；底部用户区（头像 + 套餐徽章 + 登出→`/login`）。
- **应用级认证**：`auth.ts` 的 NextAuth（`session.strategy='jwt'`；Google/Apple/Microsoft/Credentials/Dev），登录页 `app/(auth)/login`，登录后回 `Routes.Home`。门禁在 `proxy.ts`（`auth()` 包裹）+ `lib/proxy/auth-proxy.ts`。
- **现成可复用资产**：新编辑器 `landing-editor/`（路由 `/editor-next`）产出 `LandingPageDraft`；新渲染器 `landing-renderer/LandingPage({ page })`；模板注册表 `landing-editor/samples/registry.ts`（4 套：skincare/dental/solar/radiantglow）+ 选择页 `TemplateGallery`。
- **现状落差**：`/editor-next` 当前是 `PUBLIC_PATHS` 中的免登录例外，且只以本地样例为种子、无持久化、无发布闭环；旧 `sites` 表/`/site/[slug]`/旧渲染器服务旧数据，本期不改动、不复用。

## 2. 端到端流程总览（贯穿应用）

以应用旅程而非文件来组织。各阶段及其在应用中的落点：

```
[未登录] ──登录(现有应用认证)──▶ 应用首页 /  ──侧栏「落地页」──▶ 落地页列表
                                                                  │ 新建
                                                                  ▼
                                                         模板选择页 /editor-next
                                                                  │ 选模板=建库
                                                                  ▼
                                              编辑器 /editor-next/[id] ◀──自动保存──┐
                                                   │            │                   │
                                              预览 │       发布 │                   │
                                                   ▼            ▼                   │
                              全屏预览 /editor-next/[id]/preview   发布弹框→slug      │
                                                                  │                 │
                                                                  ▼                 │
                                              公开发布页 /p/[slug] ◀─对外访问        │
                                                                  │ 取消发布/再编辑 ─┘
                                                                  ▼
                                                         回到落地页列表（管理）
```

旅程阶段：**①登录 → ②应用首页/导航 → ③新建+选模板 → ④编辑(自动保存) → ⑤预览(实时+全屏) → ⑥发布(公开 URL) → ⑦管理(列表/再编辑/取消发布/删除)**。下文 §4 逐阶段设计，§5–§9 为横切关注点。

## 3. 导航与信息架构集成（让流程成为应用一等公民）

- **侧边栏新增入口**：在 `Sidebar.tsx` 的 `navItems` 增加「落地页 / Landing Pages」项，指向新区块 `/(dashboard)/landing-pages`。这是本流程在应用内的稳定入口。
- **与现有「Sites」的关系**：新「落地页」区块基于全新独立持久化（§5），是落地页业务的**go-forward 入口**；侧栏旧「Sites」项（指向旧 `/sites` + 旧数据）本期**保持原样、不动**，避免破坏旧数据；后续是否下线旧 Sites 另议（不在本期）。
- **应用首页（`/`）联动（可选、轻量）**：首页可加一个「新建落地页」快捷入口指向 `/(dashboard)/landing-pages`；若改动首页成本超出 happy-path，可只做侧栏入口（首页联动列为可选）。
- **编辑器/预览的外壳**：`/editor-next/[id]` 与 `/editor-next/[id]/preview` 是**全屏**工作台，不套用 dashboard 卡片外壳（与编辑器现状一致）；但它们受同一套应用登录保护（§8），完成后经返回按钮回到 `/(dashboard)/landing-pages`。

## 4. 分阶段设计

### 阶段① 登录（复用现有应用认证，零新增）

链路第一步即**现有应用级登录**，本期**不新建任何登录逻辑**：沿用 `auth.ts`/NextAuth/`app/(auth)/login`，登录后回 `Routes.Home`。服务端识别用户与现有 API 一致：`const session = await auth(); session.user.id`（`session` 回调已注入 `user.id`、`user.plan`）。唯一相关改动是把 `/editor-next` 移出 `PUBLIC_PATHS`（§8），使本流程全程处于应用登录之后。

### 阶段② 应用首页与导航

登录落点为 `/`（既有仪表盘首页，不改其核心）。用户经**侧栏「落地页」**进入 `/(dashboard)/landing-pages`：列出当前用户的落地页（草稿/已发布、live 链接、更新时间），提供「新建」「编辑」「预览」「取消发布」「删除」入口与空态。

### 阶段③ 新建 + 选择模板

列表「新建」→ 模板选择页 `/editor-next`（复用 `TemplateGallery`）。卡片「开始编辑」动作由原 `?template=<id>` 改为：`POST /api/landing-pages { templateId }` → 用 registry 种子建库（默认 name 取模板名）→ `router.push('/editor-next/'+id)`。

### 阶段④ 编辑（自动保存）

`/editor-next/[id]`：服务端按 id 取记录（owner 校验），将 `data`（`LandingPageDraft`）+ `id` + `name` 注入 `Editor`。编辑动作经防抖（~1.5s）`PUT /api/landing-pages/[id]` 保存 `name`+`toDraft(state)`；顶栏显示保存状态。顶栏还含：页面名内联编辑、**预览**按钮（新标签开 `/editor-next/[id]/preview`）、**发布**按钮、返回列表。

### 阶段⑤ 预览（实时 + 全屏）

- **实时预览**：编辑器右栏现有 iframe 预览（手机/桌面取景框）持续生效。
- **全屏预览**：`/editor-next/[id]/preview` 以 owner 身份整页渲染当前草稿（`landing-renderer`，登录保护），所见即发布后效果。

### 阶段⑥ 发布（对外公开 URL）

编辑器「发布」打开发布弹框：由 `name` 生成 slug，可编辑 + 实时查重 → `POST /api/landing-pages/[id]/publish`（`status=published`、写 slug、`published_at`）。成功后展示 live 链接 `/p/[slug]`。发布前用 `isLandingPageStructureValid` 校验结构，不通过则提示缺失项、阻止发布。

### 阶段⑦ 管理（闭环回到应用内）

已发布页可**再编辑**（回 `/editor-next/[id]` 改→自动保存→需要时重新发布，复用同 slug）、**取消发布**（`POST .../unpublish`，`status=draft`，**保留 slug**）、**删除**。这些操作都在 `/(dashboard)/landing-pages` 列表完成，形成应用内闭环。

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

## 6. 全应用路由表（流程涉及的所有 surface）

| 路由 | 鉴权 | 角色 | 说明 |
|---|---|---|---|
| `/login` | 公开 | 现有 | 应用登录（复用）|
| `/`（`Routes.Home`）| 登录 | 现有 | 应用首页/仪表盘落点（可选加快捷入口）|
| `/(dashboard)/landing-pages` | 登录 | **新增** | 落地页列表与管理（本流程在应用内的入口）|
| `/editor-next` | 登录 | 改造 | 模板选择页；选模板=建库后跳编辑器 |
| `/editor-next/[id]` | 登录 + owner | **新增** | 编辑器，按 id 载入 draft、自动保存 |
| `/editor-next/[id]/preview` | 登录 + owner | **新增** | 全屏预览当前草稿 |
| `/p/[slug]` | 公开 | **新增** | 已发布落地页公开渲染（`landing-renderer`）|
| 侧栏「落地页」项 | — | 改造 | `Sidebar.tsx` 新增导航入口 |

## 7. API（沿用现有 `auth()` 鉴权方式，按 `session.user.id` 隔离；非 owner 返回 404）

| 方法 + 路径 | 作用 |
|---|---|
| `GET /api/landing-pages` | 列出当前用户的落地页 |
| `POST /api/landing-pages` | `{ templateId }` → 从 registry 取种子建库，返回 `id`（默认 name=模板名）|
| `GET /api/landing-pages/[id]` | 取单条（owner）|
| `PUT /api/landing-pages/[id]` | 保存草稿：更新 `name` + `data`（自动保存调用）|
| `DELETE /api/landing-pages/[id]` | 删除（owner）|
| `POST /api/landing-pages/[id]/publish` | 发布：生成/校验 slug、`status=published`、`published_at`；body 可带用户编辑后的 slug |
| `POST /api/landing-pages/[id]/unpublish` | 取消发布：`status=draft`，**保留 slug** |

- 鉴权方式与现有 sites API 一致（`auth()` → `session.user.id`，无 session 返 401）。
- slug：由 `name` slugify，冲突追加短后缀；发布弹框可手动编辑并实时查重（409 冲突）。
- 校验：`PUT` 不阻断（草稿可不完整）；`publish` 必须 `isLandingPageStructureValid` 通过（否则 422 + 缺失项）。

## 8. 认证门禁（`lib/proxy/auth-proxy.ts`）

复用现有应用级登录，不引入新认证机制。仅调整 `PUBLIC_PATHS`：

- **移除** `/editor-next`（原为免登录例外；移除后编辑器/预览随既有门禁要求登录，未登录自动重定向 `/login`）。
- **新增** `/p`（已发布页公开）。
- `/preview-next`（样例 demo）、`/site`（旧）保持现状。
- 结果：`/editor-next`、`/editor-next/[id]`、`/editor-next/[id]/preview` 与 `/(dashboard)/*` 同受应用登录保护；`/p/[slug]` 公开。

## 9. 发布渲染与 SEO

- `/p/[slug]`：服务端按 `slug`+`status='published'` 查 `landing_pages`，命中 `<LandingPage page={data} />`（`landing-renderer`，默认 theme），未命中 `notFound()`。
- SEO：`LandingPageDraft` 是纯内容 schema、无 SEO 字段，故 `generateMetadata` 仅从内容**派生**：title ← `hero.title`（去换行），description ← `hero.subtitle`。完整 SEO 编辑面板不在本期。

## 10. 本期范围（MVP）

**做**：§2 端到端 happy-path 全链路（登录 → 首页/导航 → 新建选模板 → 编辑自动保存 → 实时/全屏预览 → 发布 live URL → 再编辑/取消发布/删除/列表管理）+ 侧栏入口。

**不做（留后续）**：下线旧 Sites、自定义域名、analytics 像素、SEO 编辑面板、JSON-LD、版本/修订历史、可分享 token 预览、按套餐加水印/配额、i18n、多人协作、应用首页深度改造（首页快捷入口为可选轻量项）。

## 11. 模块边界（便于独立实现与测试）

1. **持久化层**：迁移 + `lib/landing-pages/store.ts`（DB query 封装）+ 类型。
2. **API 层**：`app/api/landing-pages/**`，仅鉴权/owner 校验/调用持久化/结构校验。
3. **应用集成**：`Sidebar.tsx` 入口 +（可选）首页快捷入口。
4. **列表/管理页**：`/(dashboard)/landing-pages` + 卡片/空态/操作组件。
5. **编辑器接线**：`/editor-next` 与 `/editor-next/[id]` 路由、`Editor` 载入与自动保存、顶栏（名称/保存态/预览/发布/返回）。
6. **预览页**：`/editor-next/[id]/preview`。
7. **发布与公开页**：发布弹框 + publish/unpublish API + `/p/[slug]`。
8. **门禁**：`auth-proxy.ts` 公开路径调整。

边界约定：API 是持久化层与前端的唯一边界；`Editor` 只依赖「初始 draft + 保存回调」；应用集成只新增入口、不改既有区块内部。

## 12. 错误处理

- API：未登录 401（沿用 proxy）；非 owner 资源 404；发布结构校验失败 422 + 缺失项；slug 冲突 409。
- 自动保存失败：顶栏提示「保存失败，重试」，不丢本地编辑态。
- 公开页：slug 未命中或非 published → `notFound()`（404）。

## 13. 测试与验证

- **e2e 端到端 happy-path**（`e2e/`，沿用 fixture/登录态注入约定）：登录 → 列表新建 → `/editor-next` 选模板建页 → 自动保存生效 → 全屏预览渲染 → 发布 → `/p/[slug]` 公开渲染含 hero 文案 → 取消发布后 `/p/[slug]` 404。
- **API/契约**：建/取/存/删、发布/取消、slug 唯一性、user 隔离（跨用户访问 404）。
- 沿用现有 `e2e/editor-next-preview.spec.ts` 实时预览用例。
- 门禁手测：未登录访问 `/editor-next/[id]` 跳 `/login`；`/p/[slug]` 免登录可达。
- 全程 `npm run lint` 零错误、`tsc` 无新增类型错误。

## 14. 已定默认（设计确认时拍板）

- 「登录」= 复用现有应用级 NextAuth，不新建登录逻辑。
- 流程作为应用一等公民：侧栏新增「落地页」入口；新区块基于全新独立持久化，旧 Sites 保持不动。
- **自动保存**（无手动保存按钮）。
- **slug 由 name 生成、发布弹框可编辑 + 查重**；取消发布**保留 slug**。
- 编辑器 **`/editor-next/[id]`**、预览 **`/editor-next/[id]/preview`**、公开页 **`/p/[slug]`**。
