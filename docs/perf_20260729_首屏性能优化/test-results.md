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

## 备注

- E2E 覆盖了模板画廊和模板详情页的正常渲染链路；未新增临时截图或快照。
- **Lighthouse 三次中位数对比仍未执行**：生产站尚未部署本分支，本地 `pnpm build` 受 Google Fonts 网络限制阻断，dev 模式性能不代表生产。LCP 收益（方案预期 5.3s → <2.5s）**目前无实测支撑**，须在 Preview 部署后按 plan.md 的命令补测才能确认。已确认的只有上表的图片体积降幅。
- Stage 2（Sentry 动态加载）和 Stage 4（循环动画延迟启动）仍按执行计划保留为待决事项。
- lint 的 5 条 warning 均来自本次改动之外的既有文件：`.remember/tmp/last-ndc.ts`、`components/media/MediaGrid.tsx`、`landing-renderer/primitives/Img.tsx`、`landing-renderer/primitives/Media.tsx`、`lib/capi/providers/meta.ts`。
- `pnpm build` 的失败发生在 `components/marketing/pages/AntiBan.tsx`、`TemplateGallery.tsx` 等现有字体导入链路，未进入本次图片工具的类型或逻辑错误。
