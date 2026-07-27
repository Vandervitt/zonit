# PR 1 验证结果

- 日期：2026-07-27
- 分支：`feat_20260727_营销站国际化`
- 范围：i18n 基建 + 首页双语 + 套餐文案外提 + SEO/sitemap 双语

## 门槛执行结果

| 层级 | 命令 | 结果 |
| --- | --- | --- |
| 类型 | `pnpm exec tsc --noEmit` | ✅ 通过（无输出） |
| 单元 | `pnpm test` | ✅ **476 passed / 75 files** |
| Lint | `pnpm lint` | ✅ 0 error（5 warning 均为既有，与本次改动无关） |
| E2E（新增） | `pnpm test:e2e e2e/i18n.spec.ts` | ✅ **10 passed** |
| 构建 | `pnpm build` | ❌ **失败——环境问题，非本次改动**（见下） |
| E2E（既有回归） | `RUN_DB_E2E=1 pnpm test:e2e` | ⚠️ 18 passed / 10 failed——**已确认为既有失败**（见下） |

## 构建失败说明（未通过，如实记录）

`pnpm build` 报 4 个错误，全部是 `fonts.gstatic.com` 连接失败：

```
Error while requesting resource
There was an issue establishing a connection while requesting
https://fonts.gstatic.com/s/jetbrainsmono/v24/...woff2
```

import trace 指向 `app/terms/page.tsx` 等本次未做功能改动的页面。属本地网络封锁 Google Fonts 的既有问题（项目此前已记录「本地 build 靠 CI」）。

**结论：本地无法验证构建，需以 CI 结果为准。** 不据此声称构建通过。

## 既有 E2E 失败的归因

首轮 `RUN_DB_E2E=1 pnpm test:e2e` 全量跑出 10 个失败。为排除是本次改动导致，**切到 `main` 基线复跑同一批用例**：

```
git checkout main
RUN_DB_E2E=1 pnpm test:e2e e2e/preview-next.spec.ts e2e/gallery-and-pages.spec.ts e2e/branding.spec.ts
→ 4 failed（与分支上同样的 4 条）
```

`preview-next`、`gallery-and-pages`（2 条）、`branding` 在 main 上同样失败，症状一致（预览页 404）。判定为**本地环境既有失败，非本次回归**。其余失败用例（ai-generate / leads / media-picker / preview-share / unsplash-media / editor-next-preview）同属该批 DB fixture 相关，未逐条复验。

## 走查中发现并修复的 3 个真实缺陷

均由验证过程暴露，非事后补写：

1. **切换器可访问名遮蔽可见文本（WCAG 2.5.3）**
   `aria-label="Switch language"` 覆盖了可见文本「中文」，导致语音控制用户无法用看到的词触达该链接；E2E 首轮即因 `getByRole(name:"中文")` 找不到元素而失败。
   修复：`aria-label` 改为 `${ariaLabel}: ${label}`，包含可见文本。

2. **英文套餐表单复数错误**
   浏览器走查发现 Free 档显示 **"1 pages"**、**"1 domains"**。中文「1 张」无此问题，故只在英文面暴露。
   修复：字典量词改为 `{ one, other }` 双形态，`formatPlanLimit` 按 `n === 1` 取用；已补 3 条回归断言。

3. **未国际化页面上的切换器是死链接**
   `/guides`、`/templates` 等尚无 `/zh` 镜像，`localePath` 原样返回当前路径，点击等于原地刷新。设计文档 §3.3 写明「`LOCALIZED_ROUTES` 驱动④切换器可见性」，但初版实现漏了这一条。
   修复：`LocaleSwitcher` 在 `!isLocalizedRoute(bare)` 时返回 `null`；已补 E2E 覆盖。

## 人工走查（dev 环境，浏览器实操）

| 检查项 | 结果 |
| --- | --- |
| `/` 英文首页完整，无中文残留 | ✅ |
| `/zh` 中文首页与改造前视觉一致 | ✅ |
| 英文套餐表：`Free` / `CN¥29.99/mo`、`1 page` / `3 pages` / `Unlimited` | ✅（复数修复后） |
| 中文套餐表：`免费` / `CN¥29.99/月`、`1 张` / `无限`、`最受欢迎` | ✅ |
| nav 与 footer 切换器往返 | ✅ |
| `/zh` 子树含 `<div lang="zh-Hans">` | ✅ |
| **`/admin/billing`（登录后实测）** | ✅ 中文不变；`CN¥79.99/月` 与旧 `priceText` 逐字一致；套餐卡片 highlights 正常渲染 |
| **`/super-admin/settings`（登录后实测）** | ✅ 套餐总览表逐项与改造前一致（`CN¥0`、`1 张`、`5 个`、`无限`） |
| `/pricing` `/anti-ban` `/templates` `/guides` `/privacy` `/terms` | ✅ 均 200，维持中文现状 |
| `/zh/admin` | ✅ 404（未注册路由，符合预期） |

后台两页 E2E 未覆盖，故采用登录后浏览器实测。验证用的本地 dev 账号状态（plan / role）已在验证后恢复原值。

## 环境清理

- 本次为验证启动的 `next dev` 已终止
- 本地 Postgres 容器（`pnpm db:start` 启动）状态见交付说明
- 修改过的本地 dev 账号字段已还原

## 遗留

- `pnpm build` 需 CI 复核（本地 Google Fonts 不可达）
- 既有 10 条 DB E2E 失败属本地环境问题，与本 PR 无关，未修
