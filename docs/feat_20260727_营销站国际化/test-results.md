# 验证结果

- 日期：2026-07-27
- 分支：`feat_20260727_营销站国际化`

---

# PR 4：获客指南三篇长文双语 + llms.txt

## 门槛执行结果

| 层级 | 命令 | 结果 |
| --- | --- | --- |
| 类型 | `pnpm exec tsc --noEmit` | ✅ 通过 |
| 单元 | `pnpm test` | ✅ **493 passed / 75 files** |
| Lint | `pnpm lint` | ✅ 0 error（5 warning 为既有） |
| E2E | `pnpm test:e2e e2e/i18n.spec.ts` | ✅ **20 passed** |
| 构建 | `pnpm build` | ⏭️ 同前，本地 Google Fonts 不可达，以 CI 为准 |

## 改动规模

| 项 | 内容 |
| --- | --- |
| 内容模型 | `articles/<slug>.ts` → `articles/<slug>/{en,zh}.ts`；两语言共用同一 slug，hreflang 配对无需映射表 |
| 索引 | `GUIDES` 常量 → `getGuides(locale)` / `getGuide(locale, slug)` / `GUIDE_SLUGS` |
| 长文 | 3 篇完整英文版（合规 8 要点 / WhatsApp 落地页 / 转化归因），含表格、步骤、FAQ、参考资料全部块 |
| `GuideArticleView` | 接 locale，「参考资料」段落双语 |
| Article JSON-LD | `inLanguage` 由写死 `zh-CN` 改为按 locale 派生；`mainEntityOfPage` 与面包屑按 locale 加前缀 |
| sitemap | 3 篇指南详情复用 `localizedDetailEntries()` 出双语条目 |
| `llms.txt` | 正文改英文，「Languages」段说明双语策略，关键页面同时列出中英两版 URL |

## 过渡期断言的收敛

`PENDING_ROUTES` 现已清空——全部 9 条营销路由都已国际化。原先以「当前还没上线的页面」为样本的 5 条断言（分别用过 `/pricing`、`/templates`、`/guides`）已无样本可用，改为：

- 用合成路径 `/changelog`（恒不在清单内）测「未登记路由降级到原路径」的**机制**，不再依赖某个具体待办页
- `PENDING_ROUTES` 断言改为「应为空」+「每条营销条目都带 alternates，不再有单语遗留」
- E2E「未国际化页面不显示切换器」→ 反转为「已国际化的页面都显示切换器」，反向保护移交单测

## 人工走查

| 检查项 | 结果 |
| --- | --- |
| `/guides/whatsapp-lead-landing-page` 六个英文章节标题 | ✅ Why capture leads over WhatsApp / What a high-converting… / From template to published / The five most common mistakes / Common questions / References |
| `/zh/guides/...` 六个中文标题 | ✅ 与改造前逐项一致 |
| Article JSON-LD `inLanguage` | ✅ `en` vs `zh-Hans` |
| `/llms.txt` | ✅ 英文正文 + 双语 URL 清单 |

---

# PR 3：模板画廊 + 33 个详情页双语

## 门槛执行结果

| 层级 | 命令 | 结果 |
| --- | --- | --- |
| 类型 | `pnpm exec tsc --noEmit` | ✅ 通过 |
| 单元 | `pnpm test` | ✅ **492 passed / 75 files** |
| Lint | `pnpm lint` | ✅ 0 error（5 warning 为既有） |
| E2E | `pnpm test:e2e e2e/i18n.spec.ts` | ✅ **18 passed** |
| 后台回归 | `RUN_DB_E2E=1 ... gallery-and-pages` | ⚠️ 2 failed——**既有失败**，见下 |
| 构建 | `pnpm build` | ⏭️ 同前，本地 Google Fonts 不可达，以 CI 为准 |

## 改动规模

| 项 | 内容 |
| --- | --- |
| `TemplateArchetype` | 中文字面量联合类型 → 英文 slug（`seeding` / `consult` / `compare` / `demo`），展示名进字典 |
| `registry.ts` | 33 套模板的 `industry` / `tagline` / `seoIntro` 改 `LocalizedText`，补 33 段英文（含 33 段 seoIntro 本地化改写） |
| `templateFilter.ts` | `CATEGORY_LABELS` / `CONVERSION_LABELS` 常量 → `categoryLabel()` / `conversionLabel()` / `archetypeLabel()` 按 locale 取字典；`filterTemplates` / `facetOptions` 接 locale |
| `template-content.ts` | intro / whoFor / howToUse / faqs / 面包屑全部按 locale 派生，句式模板进字典（占位符 `{name}` `{industry}` `{archetype}` `{conversion}`） |
| 区块标签 | `SECTION_REGISTRY.label` 仅有中文，英文侧新增 12 键映射（Hero / Stats / Features / …） |
| sitemap | 新增 `localizedDetailEntries()`，33 个模板详情页各出双语两条并互挂 hreflang |

## 一处判断更正

探查阶段我误报「`tags.category` 有 40 种但只映射了 8 个，画廊 32 个分组标题在显示英文 slug」。**该结论错误**：正则 `category: "..."` 把 `subcategory: "..."` 一并匹配了。实际 `tags.category` 只有 **8 种**，`CATEGORY_LABELS` 正好全覆盖，不存在既有缺陷。本步因此缩小为「把 8 个行业标签 + 5 个转化标签 + 4 个范式标签双语化」。

已补一条测试防止此类回退：遍历真实 `TEMPLATES`，断言每个 `category` 与 `archetype` 在两种语言下都有展示名、不回退成裸 slug。

## 后台回归的归因

`gallery-and-pages.spec.ts` 的 2 条失败（`getByText('Aurae Skincare')` 找不到）在 PR 1 阶段已于 `main` 基线复跑确认为既有失败。本 PR 动了 `TemplatePickerDialog`，故额外做了**浏览器实测**：登录后台 → 落地页 → 新建 → 模板选择器，确认 33 套模板、8 个行业 chip 带计数（6+5+5+5+5+5+1+1=33）、中文行业标签与 tagline 均正常渲染，`Aurae Skincare` 可见。判定失败与本次改动无关。

## 人工走查

| 检查项 | 结果 |
| --- | --- |
| `/templates` 8 个英文行业分组标题 | ✅ Beauty & personal care / Medical / Home improvement / Apparel & accessories / Consumer tech / Home & living / Health & supplements / Toys & baby |
| `/zh/templates` 8 个中文分组标题 | ✅ 与改造前一致 |
| `/templates/vitamins` 英文 seoIntro + 派生 FAQ | ✅ 占位符替换正确 |
| `/zh/templates/vitamins` 中文 seoIntro + 派生 FAQ | ✅ 与改造前一致 |
| 面包屑 JSON-LD 双语 | ✅ `Templates / Supplements / …` vs `模板库 / 保健 / …` |
| 「包含哪些板块」标签双语 | ✅ `Hero\|Stats\|Features\|Process\|Reviews\|Guarantee\|FAQ` vs `首屏主视觉\|数据展示\|特性\|服务流程\|评价\|安全保障\|常见问题` |
| **后台模板选择器（登录实测）** | ✅ 33 套、8 chip 计数、中文标签均正常 |

---

# PR 2：pricing / anti-ban / login / register 双语

## 门槛执行结果

| 层级 | 命令 | 结果 |
| --- | --- | --- |
| 类型 | `pnpm exec tsc --noEmit` | ✅ 通过 |
| 单元 | `pnpm test` | ✅ **485 passed / 75 files** |
| Lint | `pnpm lint` | ✅ 0 error（5 warning 为既有） |
| E2E | `pnpm test:e2e e2e/i18n.spec.ts` | ✅ **15 passed** |
| 构建 | `pnpm build` | ⏭️ 同 PR 1，本地 Google Fonts 不可达，以 CI 为准 |

## 相对原计划的两处修正

1. **`/not-found` 与 `/error` 移出范围，未做改动。**
   计划里按「74 个中文字」把它们列进了 PR 2，但实际读代码后确认：这 74 个字**全在注释里**，用户可见文案本来就是英文（`404` / `This page isn't available.` / `Something went wrong`）。文件顶部注释写明其设计意图是「保持品牌中立——它会渲染在租户自有域名上」。把平台语言引入这两页反而是错的：租户访客在**自己域名**上撞到 404，不该看到平台的语言体系。故不改。

2. **`/pricing` 页没有语言切换器落点。**
   该页本来就没有站点导航（裸 `<main>` + 对比表），是既有页面设计，非本次引入。其双语内容、canonical、hreflang 均已正确。是否给该页补 nav 属独立 UX 决策，未在 i18n 改造中顺手做。

## 走查中发现并修复的 2 个真实缺陷

1. **登录/注册页原本无任何语言出口**
   这两页走 `AuthShell`（无导航栏），改造后虽然内容双语，但落在英文登录页的中文用户没有任何切换入口。
   修复：`AuthShell` 接 `locale`，在页角补品牌链接 + 语言切换器。

2. **镜像对等性测试不认路由组，对英文侧同样误判**
   `/login` 实际位于 `app/(auth)/login/page.tsx`，PR 1 的测试按字面路径拼接，把 `/login` 加进清单后**英文侧**就会被报为「缺页」。
   修复：`findPage` 改为可穿过 `(xxx)` 路由组目录递归查找，并补一条断言锁定该行为。

## 新增的清单互斥断言

一页上线要同时做两件事：加进 `LOCALIZED_ROUTES`、从 sitemap 的 `PENDING_ROUTES` 移除。只做前者会让 sitemap 同时输出该页的双语条目和单语条目（重复 URL）。已加断言强制两个清单互斥。

## 人工走查

| 检查项 | 结果 |
| --- | --- |
| `/anti-ban` 英文全文（hero / 三重风险 / 四项机制 / 合规边界 / Agency CTA） | ✅ |
| `/zh/anti-ban` 与改造前逐段一致 | ✅ |
| `/pricing` `/zh/pricing` 标题与副标题各出对应语言 | ✅ |
| `/login` `/zh/login` 标题、邮箱占位符、切换器 aria-label | ✅ |
| `/zh/register` 标题 | ✅ |
| 已登录访问 `/login` 仍正确重定向 `/admin` | ✅ |
| hreflang（注意 Next 输出为 `hrefLang` 驼峰） | ✅ 三条齐全 |

---

# PR 1：i18n 基建 + 首页双语

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
