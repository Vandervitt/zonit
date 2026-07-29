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

## 备注

- E2E 覆盖了模板画廊和模板详情页的正常渲染链路；未新增临时截图或快照。
- 本轮未执行 Lighthouse 三次中位数对比，因此不虚报 LCP、传输体积或审计分数收益。
- Stage 2（Sentry 动态加载）和 Stage 4（循环动画延迟启动）仍按执行计划保留为待决事项。
- lint 的 5 条 warning 均来自本次改动之外的既有文件：`.remember/tmp/last-ndc.ts`、`components/media/MediaGrid.tsx`、`landing-renderer/primitives/Img.tsx`、`landing-renderer/primitives/Media.tsx`、`lib/capi/providers/meta.ts`。
- `pnpm build` 的失败发生在 `components/marketing/pages/AntiBan.tsx`、`TemplateGallery.tsx` 等现有字体导入链路，未进入本次图片工具的类型或逻辑错误。
