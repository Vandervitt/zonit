# 落地页功能链路设计：登录 → 选模板 → 编辑 → 预览 → 发布

- 日期：2026-06-17
- 状态：已确认设计，待转实现计划
- 范围：为基于 `types/schema.draft.ts`（`LandingPageDraft`）的新编辑器打通完整 happy-path 链路，全新独立持久化，与旧 `sites`/旧渲染器解耦。

## 1. 背景与现状

- 新编辑器 `landing-editor/`（路由 `/editor-next`）产出 `LandingPageDraft`，新渲染器 `landing-renderer/LandingPage({ page })` 消费它。
- `/editor-next` 目前在 `lib/proxy/auth-proxy.ts` 的 `PUBLIC_PATHS` 内（免登录），且只以本地 registry 样例为种子，无持久化。
- 旧 `sites` 表 + sites API + `/site/[slug]`（旧渲染器 `LandingPageTemplateRenderer`）继续服务旧数据，本期**不改动、不复用**。
- 模板选择页 `landing-editor/components/TemplateGallery.tsx` 与 registry（4 套模板：skincare/dental/solar/radiantglow）已就绪。

## 2. 目标

登录用户能够：在仪表盘新建落地页 → 选模板 → 在编辑器中编辑并自动保存 → 预览（实时 + 全屏）→ 发布到公开 URL `/p/[slug]` → 可取消发布。全程数据落入新表 `landing_pages`，按用户隔离。

**关于「登录」**：链路第一步的「登录」就是**现有的应用级登录**，本期**不新建任何登录逻辑**，完全复用：

- 认证栈：`auth.ts` 的 NextAuth（`session.strategy = 'jwt'`，提供方 Google/Apple/Microsoft/Credentials/Dev），登录页 `app/(auth)/login`，登录后回 `Routes.Home`（`/`）。
- 门禁：`proxy.ts` 的 `auth()` 包裹 + `lib/proxy/auth-proxy.ts`；未登录访问受保护页重定向 `/login`，受保护 API 返回 401。
- 服务端取用户：与现有 sites API 一致 —— `const session = await auth(); session.user.id`（`session` 回调已注入 `user.id`、`user.plan`）。

本期对认证的改动**仅有一处**：把历史例外 `/editor-next` 从 `PUBLIC_PATHS` 移除，使编辑器/预览与 `/(dashboard)/*` 一样受同一套应用登录保护（详见 §5）。

## 3. 数据模型（全新独立）

新增迁移 `migrations/010_add_landing_pages.js`（遵循 `docs/dev-database-migration-workflow.md`：`pnpm migrate:create add_landing_pages` 编辑后 `pnpm migrate:up`，迁移走 `DATABASE_URL_UNPOOLED`）。

表 `landing_pages`：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | TEXT PK（与现有表一致的 id 生成方式）| 主键 |
| `user_id` | TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE | 归属用户 |
| `name` | TEXT NOT NULL | 页面名（用户可改）|
| `slug` | TEXT UNIQUE（可空）| 发布时生成/校验 |
| `status` | TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')) | 状态 |
| `data` | JSONB NOT NULL | `LandingPageDraft` |
| `published_at` | TIMESTAMPTZ NULL | 发布时间 |
| `created_at` / `updated_at` | TIMESTAMPTZ DEFAULT now() | 时间戳 |

索引：`idx_landing_pages_user_id`，`UNIQUE idx_landing_pages_user_name (user_id, name)`，`slug` 唯一约束自带索引。

与旧 `sites` 表完全独立，互不引用。

## 4. 路由与 API

### 4.1 页面路由

| 路由 | 鉴权 | 说明 |
|---|---|---|
| `/(dashboard)/landing-pages` | 登录 | 当前用户落地页列表（草稿/已发布、live 链接、新建/编辑/删除/取消发布入口）|
| `/editor-next` | 登录 | 模板选择页（`TemplateGallery`）；选模板 = 建库后跳编辑器 |
| `/editor-next/[id]` | 登录 + owner | 编辑器，按 id 载入 draft，自动保存 |
| `/editor-next/[id]/preview` | 登录 + owner | 全屏预览当前草稿（`landing-renderer`，整页 owner 视图）|
| `/p/[slug]` | 公开 | 已发布落地页公开渲染（`landing-renderer/LandingPage`）|

### 4.2 API（沿用现有 `auth()` 鉴权方式，按 `session.user.id` 隔离；非 owner 返回 404/403）

| 方法 + 路径 | 作用 |
|---|---|
| `GET /api/landing-pages` | 列出当前用户的落地页 |
| `POST /api/landing-pages` | 用 `{ templateId }` 从 registry 取种子 draft 建库，返回新 `id`，默认 name 取模板名（用户后续可改）|
| `GET /api/landing-pages/[id]` | 取单条（owner）|
| `PUT /api/landing-pages/[id]` | 保存草稿：更新 `name` 与 `data`（自动保存调用）|
| `DELETE /api/landing-pages/[id]` | 删除（owner）|
| `POST /api/landing-pages/[id]/publish` | 发布：生成/校验 slug、`status=published`、`published_at=now()`；body 可带用户编辑后的 slug |
| `POST /api/landing-pages/[id]/unpublish` | 取消发布：`status=draft`，**保留 slug**（见 §6/§12）|

- slug 生成：由 `name` slugify（小写、连字符），冲突时追加短后缀；发布弹框可手动编辑并实时查重。
- 校验：`PUT` 落库前用 `validateSections`/`isLandingPageStructureValid`（来自 `types/schema.draft.ts`）做结构校验，违反必须性约束时提示但不阻断保存（草稿可不完整）；`publish` 时必须通过结构校验才允许发布。

## 5. 认证门禁（`lib/proxy/auth-proxy.ts`）

**复用现有应用级登录**，不引入新的认证机制。仅调整 `PUBLIC_PATHS`：

- 从 `PUBLIC_PATHS` **移除** `/editor-next`（它原是免登录例外；移除后编辑器/预览随现有门禁要求登录，未登录自动重定向 `/login`）。
- 向 `PUBLIC_PATHS` **新增** `/p`（已发布页公开）。
- `/preview-next`（纯样例 demo）保持现状；`/site` 保持现状。
- 结果：`/editor-next`、`/editor-next/[id]`、`/editor-next/[id]/preview` 与 `/(dashboard)/*` 一样受应用登录保护；`/p/[slug]` 公开。

## 6. 编辑器改造（`landing-editor/`）

- `Editor` 由「样例种子」改为「按 id 载入持久化 draft」：服务端在 `/editor-next/[id]` 取记录，将 `data`（`LandingPageDraft`）+ `id` + `name` 传入 `Editor`。
- **自动保存**：编辑动作经防抖（沿用旧编辑器 ~1.5s 思路）`PUT /api/landing-pages/[id]`，保存 `name` + `toDraft(state)`；顶栏显示保存状态（保存中/已保存）。
- 顶栏新增：
  - 页面名内联编辑（写入 name，参与自动保存）。
  - **预览**按钮：新标签打开 `/editor-next/[id]/preview`。
  - **发布**按钮：打开发布弹框（确认/编辑 slug → 查重 → `publish`），成功后展示 live 链接 `/p/[slug]`；已发布状态下提供**取消发布**。
- 模板选择页 `TemplateGallery`：卡片「开始编辑」由 `?template=<id>` 改为 `POST /api/landing-pages { templateId }` 成功后 `router.push('/editor-next/'+id)`。
- 取消发布：`status=draft`，**保留 slug**（再次发布复用同 slug，避免链接漂移）。

## 7. 发布页渲染与 SEO

- `/p/[slug]`：服务端按 `slug` + `status=published` 查 `landing_pages`，命中则 `<LandingPage page={data} />` 渲染（`landing-renderer`，默认 theme），未命中 `notFound()`。
- SEO：`LandingPageDraft` 是**纯内容 schema、无 pageMeta/SEO 字段**。发布页 `generateMetadata` 仅从内容**派生**：title ← `hero.title`（首行/去换行），description ← `hero.subtitle`。完整 SEO 编辑面板**不在本期**。
- 不接 JSON-LD、analytics、按套餐水印（均见 §8 非目标）。

## 8. 本期范围（MVP）

**做**：§3–§7 的 happy-path 全链路（建 → 编辑 + 自动保存 → 实时/全屏预览 → 发布 → live URL → 取消发布 → 删除 → 列表）。

**不做（留后续）**：自定义域名、analytics 像素、SEO 编辑面板、JSON-LD、版本/修订历史、可分享 token 的草稿预览、按套餐加水印、i18n、多人协作。

## 9. 模块边界（便于独立实现与测试）

1. **持久化层**：迁移 + `lib/landing-pages/store.ts`（DB 访问，纯函数式 query 封装）+ 类型。
2. **API 层**：`app/api/landing-pages/**`，仅做鉴权/owner 校验/调用持久化层/结构校验。
3. **列表页**：`/(dashboard)/landing-pages` + 其卡片/空态组件。
4. **编辑器接线**：`/editor-next` 与 `/editor-next/[id]` 路由、`Editor` 载入与自动保存、顶栏（名称/保存态/预览/发布）。
5. **预览页**：`/editor-next/[id]/preview`（owner 整页渲染）。
6. **发布与公开页**：发布弹框 + publish/unpublish API + `/p/[slug]`。
7. **门禁**：`auth-proxy.ts` 公开路径调整。

每块通过明确接口通信：API 是持久化层与前端的唯一边界；`Editor` 只依赖「初始 draft + 保存回调」。

## 10. 错误处理

- API：未登录 401（沿用 proxy）；非 owner 资源 404；结构校验失败（发布时）422 + 缺失项；slug 冲突 409。
- 自动保存失败：顶栏提示「保存失败，重试」，不丢本地编辑态。
- 发布页：slug 未命中或非 published → `notFound()`（404）。

## 11. 测试与验证

- **e2e happy-path**（`e2e/`，沿用 fixture/登录态注入约定）：登录 → `/editor-next` 选模板建页 → 自动保存生效 → 全屏预览渲染 → 发布 → `/p/[slug]` 公开渲染含 hero 文案 → 取消发布后 `/p/[slug]` 404。
- **API/契约**：建/取/存/删、发布/取消、slug 唯一性、user 隔离（跨用户访问 404）。
- 沿用现有 `e2e/editor-next-preview.spec.ts` 实时预览用例。
- 门禁单测/手测：未登录访问 `/editor-next/[id]` 跳 `/login`；`/p/[slug]` 免登录可达。
- 全程 `npm run lint` 零错误、`tsc` 无新增类型错误。

## 12. 已定默认（设计确认时拍板）

- **自动保存**（无手动保存按钮）。
- **slug 由 name 生成、发布弹框可编辑 + 查重**。
- 编辑器路由 **`/editor-next/[id]`**，预览路由 **`/editor-next/[id]/preview`**，公开页 **`/p/[slug]`**。
- 取消发布**保留 slug**。
