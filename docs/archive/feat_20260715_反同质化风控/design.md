# antiBan 反同质化风控引擎 · 设计方案

- 分支：`feat_20260715_反同质化风控`
- 日期：2026-07-15
- 关联审计：`docs/套餐权益代码一致性审计.md`（本功能为其中「排期 TODO · 高优先」项）
- 权益位：`lib/plans.ts` 已声明 `antiBan`（Pro/Agency = true，Free/Starter = false），首页与套餐页已宣传「反同质化风控引擎」，但渲染链路**零实现**。本方案补齐真实功能。

## 1. 目标与伦理边界

- **仅 Pro/Agency 生效**；Free/Starter 输出与当前逐字节一致（零回归）。
- **对所有访客与爬虫展示完全相同的合法非交易线索页内容**，只打散不同广告主之间的 markup / 版式指纹。
  - 这**不是** cloaking：不对审核爬虫与真实用户做内容差异化，不隐藏、替换或伪装任何内容。
  - 场景合法性：多个独立广告主套用同一模板 → 生成页 HTML 高度雷同 → 投放平台查重判低质 → 拒审 / 限流 / 封号。本引擎让每个已发布页的指纹独立，避免正当广告主被误判为彼此的克隆。
- **按种子确定性生成**：同一页每次 SSR 输出一致 → 可缓存、无 hydration mismatch、可复现。

## 2. 硬约束（塑造方案）

- Tailwind only：禁自定义 CSS、禁 inline style。
- Tailwind JIT：运行期不可拼接 / 随机生成类名（扫不到）。所有候选类名必须**字面量写死在源码**，运行期只按种子在字面量集合中**挑选**。
- `proxy.ts` 作中间件；公开页在 `app/p/[slug]/page.tsx` 走 SSR（RSC）。
- `page.id` 稳定 → 可作确定性种子默认源。

## 3. 核心机制：种子化 variant

- schema 顶层 `LandingPageDraft` 新增 `variantSeed?: string`。
- 纯函数 `deriveVariant(seed: string): PageVariant`：哈希种子（FNV-1a 等轻量哈希）→ PRNG（mulberry32 等）→ 从**允许集合**中确定性挑选一组离散变体选项。
- 门控：`hasAntiBan(plan)` 为真才 `deriveVariant`，否则用 `IDENTITY_VARIANT`（= 当前输出，逐字节等价）。
- **触发方式：自动 + 可重洗**
  - 发布时 Pro/Agency 若 `variantSeed` 为空则落一个种子（默认 = `page.id`）。
  - 编辑器提供「重新打散指纹」按钮换新种子（随机串），页面被判重 / 限流时的逃生门。
  - Free/Starter：种子忽略，恒为 `IDENTITY_VARIANT`。

## 4. Phase 1 — 隐形指纹（先上线，低改动面，集中式）

只动约 5 个文件、**不逐个改 section**，视觉零回归。杠杆：

1. **section 外层包裹抖动**：`renderSection` 边界给区块套 0–1 层语义中性 wrapper（`className="contents"`，`display:contents` 视觉无副作用），改变 DOM 树形状与序列化哈希。
2. **属性 / id 加盐**：区块根节点注入 `data-*` 盐值、生成类 id 加盐，打散属性指纹。
3. **head / meta 变化**：`generateMetadata` 中非必要 meta 的顺序 / 存在性、generator 令牌按种子变化。

价值：击穿朴素字节 / DOM 哈希查重，风险极低。

## 5. Phase 2 — 可见变体（随后，逐组件，需视觉回归）

同一种子驱动、离散且经测试的版式变体：

1. **Hero 布局变体**：背景图（现状）/ 图右分栏 / 居中 / 图左，3–4 套，`Hero.tsx` 按 `variant.heroLayout` 选择。
2. **等价 Tailwind class 互换**：`px-5`↔`pl-5 pr-5`、`py-20`↔`pt-20 pb-20`、utility 顺序打乱等；候选串全部字面量写死在互换表（JIT 可扫到）。
3. **间距节奏 / 圆角 / 阴影强度**：`py-16/20/24`、`rounded-xl/2xl/3xl` 等按种子整页一致挑选。

价值：击穿人工审核 + 感知哈希；代价：需给每个 section 补视觉 / 渲染回归。

## 6. 改动清单

| 文件 | Phase | 改动 |
|---|---|---|
| `types/schema.draft.ts` | 1 | `LandingPageDraft` 加 `variantSeed?: string` |
| `lib/plans.ts` | 1 | 加 `hasAntiBan(plan)` 辅助 |
| `landing-renderer/variant.ts`（新） | 1 | `PageVariant` / `IDENTITY_VARIANT` / `deriveVariant` + 互换表 + 哈希/PRNG |
| `landing-renderer/LandingPage.tsx` + `sections/index.tsx` | 1 | 透传 variant、wrapper / 属性注入 |
| `app/p/[slug]/page.tsx` + `generateMetadata` | 1 | 按 plan 门控派生 variant（复用 Watermark 门控范式）+ meta 变化 |
| 编辑器 AntiBan 面板 + 预览路由 | 1 | 「重新打散指纹」按钮；Pro/Agency 可用，否则升级引导；预览应用同 variant |
| `Hero.tsx` + 各 section | 2 | 布局变体 + 等价 class 互换 + 节奏 |

## 7. 确定性与正确性

- variant 纯由种子字符串派生 → SSR 每次一致 → 无 hydration mismatch、缓存安全。
- `IDENTITY_VARIANT` 保证 Free/Starter 与既有页面输出不变（回归安全）；测试断言 identity 渲染 === 改动前基线。

## 8. 测试策略

- **单元**：`deriveVariant` 确定性（同种子同结果、异种子异结果）、分布合理、所有挑选落在允许集内；门控（free/starter→IDENTITY，pro/agency→派生）。
- **回归护栏**：IDENTITY_VARIANT 渲染与改动前基线逐字节一致（代表性 draft 快照）。
- **指纹有效性**：同一 draft 两个不同种子 → 序列化 HTML 哈希不同。
- **Phase 2**：每个 hero 布局变体渲染冒烟；各 section 变体不破版。
- **E2E**：Pro 发布页指纹 ≠ Free 基线；重洗后指纹变化；可见文案不变。

## 9. 分期

- **Phase 1（先发）**：schema 种子 + variant 基建 + 门控 + Phase 1 隐形杠杆 + 重洗按钮 + 测试。直接交付「指纹打散」，低风险。
- **Phase 2（随后）**：Hero 布局 + 等价 class 互换 + 节奏变体 + 视觉回归。

## 10. 待办决策（实现前如需可再确认）

- 种子默认源：`page.id`（推荐，稳定）vs 独立随机 uuid。
- Phase 2 是否要给用户一个可见「强度」开关，还是纯自动。
- `variantSeed` 落库时机：仅发布时 vs 编辑保存时。
