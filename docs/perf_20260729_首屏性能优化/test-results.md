# 首屏性能优化 · 测试结果

日期：2026-07-29
范围：Stage 1 · `/templates` 图片 LCP 优化

## TDD

- 红灯：`pnpm vitest run lib/images/unsplash.test.ts` 因 `@/lib/images/unsplash` 尚不存在而失败。
- 绿灯：实现工具后同命令通过，6 个测试通过。

## 本轮验证

| 命令 | 结果 |
|---|---|
| `pnpm test` | 通过：83 个测试文件、554 个测试 |
| `pnpm lint` | 通过：0 errors，5 条既有 warning |
| `pnpm exec tsc --noEmit` | 通过 |
| `pnpm exec playwright test e2e/i18n.spec.ts -g '模板画廊首屏\|模板画廊：\|模板详情'` | 通过：4/4 |
| `pnpm build` | 失败：Google Fonts 网络请求失败，并触发既有 `@vercel/turbopack-next/internal/font/google/font` 模块缺失 |
| 端口清理检查 | 通过：测试后 3001 端口已释放 |

## 第二轮 · Review 缺陷修复

Review 发现三处缺陷，均已修复并补充回归测试。

### 缺陷 1（P0）· `eager` 作用域错误

`TemplateGallery.tsx` 的 `index` 是**组内**序号，画廊按行业分 8 组，导致抢占式加载在每组各触发一次。

- 复现：新增 E2E 断言 `main img[loading='eager']` 应为 3，实测 **20**（8 组中 6 组有 ≥3 张，2 组各 1 张：3+1+1+3+3+3+3+3）；`fetchpriority=high` 实测 8 张。
- 影响：折叠下方 17 张图被强制立即加载并发抢带宽，8 个 high priority 互相稀释，较改动前的全量 `lazy` 为净负收益。
- 修复：引入 `isAboveFold = groupIndex === 0 && index < 3`。
- 原测试盲区：仅断言 `main section` 的 `.first()`，跨分组未覆盖。已补 3 条跨分组断言。

### 缺陷 2（P1）· `new URL()` 未兜底

`lib/images/unsplash.ts` 直接 `new URL(imageUrl)`，`thumbnail` 类型仅为 `string`，非绝对 URL 会抛 `TypeError`。该函数在 Server Component 内同步执行，异常将导致整页 500。

- 复现：新增 4 个用例（`""`、`"/local/thumb.png"`、`"thumb.png"`、`"not a url"`），红灯均为 `TypeError: Invalid URL`。
- 修复：`try/catch` 降级返回 `{ src: imageUrl }`。
- 原测试盲区：防御性用例使用的是合法绝对 URL（`https://cdn.example.com/...`），恰好绕过该分支。

### 缺陷 3（P2）· `sizes` 断点与布局不符

`TemplateDetail.tsx` 推荐位布局为 `grid-cols-1 sm:grid-cols-3`（sm = 640px），`sizes` 却声明 `(max-width: 1024px) 100vw`，导致 640–1024px 区间选取偏大档位。已修正为 `(max-width: 640px) 100vw, 33vw`。画廊侧 `sizes` 与 `sm:grid-cols-2 lg:grid-cols-3` 一致，无需改动。

### 第二轮验证

| 命令 | 结果 |
|---|---|
| `npx vitest run lib/images/unsplash.test.ts` | 红→绿：4 failed → 10 passed |
| `npx vitest run` | 通过：83 文件 / **558** 测试 |
| `npx tsc --noEmit` | 通过（exit 0） |
| `npx eslint` | 通过：0 errors，5 条既有 warning |
| `npx playwright test e2e/i18n.spec.ts -g "模板画廊\|模板详情"` | 红→绿：1 failed → **4 passed** |
| 端口清理检查 | 通过：3001 已释放 |

### 图片体积实测（HTTP HEAD，非估算）

对前 10 张缩略图对比原 URL 与改写后 `src`（w=800）：

| 模板 | 改前 | 改后 |
|---|---|---|
| skincare | 267 KiB | 84 KiB |
| dental | 242 KiB | 68 KiB |
| solar | 307 KiB | 82 KiB |
| radiantglow | 353 KiB | 58 KiB |
| plus-size | 444 KiB | 106 KiB |
| **前 10 张合计** | **2632 KiB** | **665 KiB（−75%）** |

移动端经 `srcSet` 实际会选取 400w 档位，节省幅度高于此表。

## Stage 2 · Sentry 动态加载

本地 A/B 实测：同机、同命令、各 3 次取中位数，`/templates`，桌面 preset + 16x CPU 降速。
（`/login` 在本地生产模式下因缺 `AUTH_SECRET` 会 307→500，无法测量，故改用 `/templates`。）

| 指标 | 对照组（静态 import） | 实验组（动态 import） | 变化 |
|---|---|---|---|
| 同步 JS 合计 | 1090 KiB | 847 KiB | **−243 KiB（−22%）** |
| 同步路径含 Sentry 的 chunk | 212K（`0fjzgl55fv57x.js`） | **无** | 完全移出 |
| TBT 三次取样 | 254 / 257 / 336 ms | 206 / 206 / 267 ms | — |
| TBT 中位数 | 257 ms | 206 ms | **−51 ms（−20%）** |

同步路径残留的 28K chunk 仅含 1 处 `captureRouterTransitionStart`，即本文件的包装代码，非 SDK 主体。

**上报链路回归**：以临时 DSN（仅通过命令行传入，未写入 `.env.local`）构建后，用 Playwright 主动抛错，确认 `window.__SENTRY__` 为 10.65.0 且产生一次发往 `ingest.sentry.io/api/.../envelope/` 的请求。动态加载后错误捕获仍然工作。

**已接受的代价**：SDK 就绪前的极早期错误无法捕获，早期导航 trace 丢失。

## Stage 4 · 循环动画改交互触发

### 首个方案（定时延迟）已废弃

`requestIdleCallback` + 3s 兜底的方案**无效**，原因是延迟量级不足：生产站 SI 采样持续到 13.4s，秒级延迟仍完整落在采样窗口内。本地 A/B 也测不出差异（对照 1060 ms vs 实验 1061 ms），因为本地 1 s 即视觉稳定，根本未进入问题场景 —— 该组数据不能用来证明方案有效，只能说明本地环境无法复现此问题。

### 改用交互信号触发

`scroll` / `pointerdown` / `keydown` 任一首次触发才启用动画。Lighthouse 测量期间不产生交互，装饰动画被完全移出首屏采样窗口；真实用户开始滚动即可看到动画。

| 命令 | 结果 |
|---|---|
| `npx vitest run lib/hooks`（红→绿） | 导出缺失报错 → **7 passed** |
| `npx vitest run` | 84 文件 / **565** 测试通过 |
| `npx tsc --noEmit` | 通过 |
| `npx eslint` | 0 errors，5 条既有 warning（无新增） |
| `npx playwright test e2e/i18n.spec.ts` | **27 passed** |

**行为探针**（Playwright，dev 模式一次性验证，未落为常驻测试）：

```
无交互 opacity 采样: 0.4, 0.4, 0.4, 0.4, 0.4          ✅ 首屏静止
滚动后 opacity 采样: 0.4, 0.402976, 0.41249, 0.430001, 0.466047  ✅ 交互后启动
```

`Backdrop` 首个光斑补 `initial={{ opacity: 0.4, scale: 1 }}` 与循环首帧对齐，探针确认无亮度跳变。`useReducedMotion` 分支保留，无障碍偏好优先级不变。

**SI 收益仍无实测支撑**，须 Preview 部署后复测。

### 一处实现缺陷（已修）

脚本批量替换一度产出 `const animated = !reduce && useDeferredMotion();` —— 短路会使 hook 条件调用，违反 Rules of Hooks。已改为先无条件调用再组合。

## Stage 3 · legacy polyfill（未实施，需决策）

`legacy-javascript` 的 13 KiB 涉及 7 个 API：`Array.prototype.at` / `flat` / `flatMap`、`Object.fromEntries` / `hasOwn`、`String.prototype.trimStart` / `trimEnd`。占页面 script 总量 289 KiB 的 4.5%，gzip 后约 4–5 KiB。

Stage 2 未能顺带消除它：该 polyfill 原在 Sentry chunk 内，Stage 2 后转移到同步路径的 28K chunk，仍在首屏。

**风险不对称**，详见 design.md 决策记录：约束项是 `Object.hasOwn`（Chrome 93 / Safari 15.4）与 `Array.prototype.at`（Chrome 92 / Safari 15.4）。要完全移除 polyfill 需把 browserslist 抬到 **Safari 15.4+ / Chrome 93+**，即 iOS 15.4（2022-03）以下设备将因缺失 API 报错白屏。生成的落地页承载付费广告流量，白屏等于留资直接归零 —— 用 4–5 KiB 压缩收益换取转化损失风险不成比例。

折中路径（browserslist 设为 Safari 14 / Chrome 87 一档，仅移除 `flat` / `flatMap` / `fromEntries` / `trim*` 等 Safari 12 时代 polyfill，保留 `at` / `hasOwn`）可省其中一部分，风险显著更低，但**需要构建验证实际省下多少**，而本地构建当前被 Google Fonts 网络限制阻断（连续 3 次重试均失败）。

**结论：暂缓，待决策。** 我此前在 plan.md 中将本项标为「风险与收益均低」，该评估低估了兼容性风险，此处更正。

## 备注

- E2E 覆盖了模板画廊和模板详情页的正常渲染链路；未新增临时截图或快照。
- 自启动的本地服务（3100 生产模式 / 3102 dev / 3001 Playwright 自管）均已在测量后停止并确认端口释放。
- **Lighthouse 三次中位数对比仍未执行**：生产站尚未部署本分支，本地 `pnpm build` 受 Google Fonts 网络限制阻断，dev 模式性能不代表生产。LCP 收益（方案预期 5.3s → <2.5s）**目前无实测支撑**，须在 Preview 部署后按 plan.md 的命令补测才能确认。已确认的只有上表的图片体积降幅。
- Stage 2 与 Stage 4 已于本轮实施，结果见下文各节；Stage 3 待决策。
- lint 的 5 条 warning 均来自本次改动之外的既有文件：`.remember/tmp/last-ndc.ts`、`components/media/MediaGrid.tsx`、`landing-renderer/primitives/Img.tsx`、`landing-renderer/primitives/Media.tsx`、`lib/capi/providers/meta.ts`。
- `pnpm build` 的失败发生在 `components/marketing/pages/AntiBan.tsx`、`TemplateGallery.tsx` 等现有字体导入链路，未进入本次图片工具的类型或逻辑错误。
