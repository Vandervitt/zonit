# 首屏性能优化 · 执行计划

分支：`perf_20260729_首屏性能优化`
方案：见 [design.md](./design.md)

## 阶段划分

按「收益 × 风险」排序，P0 先行且可独立交付。每阶段独立提交，便于单独回滚。

---

## Stage 1 · /templates 图片 LCP（P0）

**目标**：LCP 5.3s → <2.5s；传输体积 −1161 KiB

### 1.1 图片 URL 工具函数（TDD）

- [ ] 新建 `lib/images/unsplash.test.ts`，先写失败测试：
  - 标准格式 `?auto=format&fit=crop&w=1600&q=80` → 改写 w 参数
  - 异类格式 `?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920` → `fm=jpg` 规范为 `auto=format`
  - 生成 srcSet：400w / 800w / 1200w
  - 非 Unsplash URL → 原样返回（防御性）
  - 无查询参数的 URL → 正确附加
- [ ] 确认测试**先失败**（红），记录输出
- [ ] 实现 `lib/images/unsplash.ts`，转绿
- [ ] 对 `registry.ts` 全 34 条 thumbnail 跑一遍，断言均产出合法 URL

**验收**：`pnpm test` 绿；34 条快照校验通过

### 1.2 画廊渲染层改造

- [ ] `TemplateGallery.tsx:83-88`：
  - 接入 `src` / `srcSet` / `sizes`
  - 分组内前 3 张 `loading="eager"`，其余保留 `loading="lazy"`
  - 第 1 张追加 `fetchPriority="high"`
  - 保留既有 eslint-disable 注释（外链图仍走原生 `<img>`）
- [ ] `TemplateDetail.tsx:200`：接入 srcSet，**保留** lazy（折叠下方）
- [ ] `TemplateDetail.tsx:59` OG 图**不改**（需 ≥1200px）
- [ ] 确认无自定义 CSS / 内联样式（Tailwind only）

**验收**：
- [ ] `pnpm lint` + `tsc` 通过
- [ ] 视觉回归：画廊卡片、详情页推荐位在移动/桌面下无变形、无 404
- [ ] Lighthouse ×3 取中位数，LCP 显著下降且 `uses-responsive-images` 转绿

### 1.3 提交

- [ ] `perf: 优化模板画廊图片加载策略与尺寸适配`

---

## Stage 2 · Sentry 移出首屏（P1）✅ 已完成

**前置**：需用户确认是否接受「首屏最初数百毫秒错误捕获缺失」。
**若不接受则整个 Stage 2 跳过** —— Turbopack 下 tree-shaking 不可用，无替代路径（见 design.md §5.2）。

- [ ] 改造 `instrumentation-client.ts` 为动态 `import()`
- [ ] `onRouterTransitionStart` 保持同步导出 + no-op 兜底
- [ ] **关键验证**：构建产物中确认 Sentry 已拆为独立异步 chunk，未内联回主包
  - 若 Turbopack 仍内联 → 收益归零，回滚本阶段并在 design.md 记录结论
- [ ] 16x 降速复测 `/login`：确认 402ms 长任务消失、TBT 下降
- [ ] 回归：手动触发一次前端错误，确认 Sentry 仍能上报
- [ ] 提交 `perf: Sentry 客户端 SDK 改为动态加载`

---

## Stage 3 · legacy polyfill（P2）⏸️ 暂缓，需决策

**风险重估**：完全移除需 browserslist 抬到 Safari 15.4+ / Chrome 93+，iOS 15.4 以下白屏；
落地页承载付费流量，4–5 KiB（gzip）收益不足以对冲转化损失风险。
原「风险与收益均低」的评估有误，已在 test-results.md 更正。
折中路径需构建验证，而本地构建受 Google Fonts 阻断。


- [ ] 收紧 browserslist 目标
- [ ] 确认 `legacy-javascript` 审计改善
- [ ] 回归：确认目标浏览器矩阵未被破坏
- [ ] 提交 `perf: 收紧浏览器目标以移除冗余 polyfill`

---

## Stage 4 · 循环动画延迟启动（P3）✅ 已完成（改为交互触发）

**注**：仅改善 Lighthouse SI，不影响 GSC。可视排期取舍决定是否执行。

- [ ] `chrome.tsx` `Backdrop()` 两个 Infinity 动画延迟启动
- [ ] `MarketingHome.tsx` 跑马灯 + 2 个浮动徽标同上
- [ ] **保留** `useReducedMotion()` 分支
- [ ] 复测首页 SI（预期 ~5.6s）
- [ ] 视觉确认动画仍正常播放，仅起始时机推迟
- [ ] 提交 `perf: 循环动画延迟至首屏渲染后启动`

---

## 最终验收门槛

- [ ] `pnpm test`（vitest）全绿
- [ ] `pnpm lint` 无错误
- [ ] `tsc` 类型检查通过
- [ ] E2E：模板画廊与详情页相关链路（图片渲染属 UI 行为变化，需覆盖）
- [ ] Lighthouse 前后对比表落入 `test-results.md`，含 3 次中位数与噪声说明
- [ ] 所有「已完成」结论均基于本轮实际执行的命令输出

## 测量命令备忘

```bash
# 图片 / LCP 类
npx lighthouse@12 <url> --only-categories=performance \
  --output=json --output-path=./after.json \
  --chrome-flags="--headless=new --no-sandbox" --quiet

# JS / TBT 类（必须 16x，否则本机测不出）
npx lighthouse@12 <url> --only-categories=performance --preset=desktop \
  --throttling.cpuSlowdownMultiplier=16 \
  --output=json --output-path=./after.json \
  --chrome-flags="--headless=new --no-sandbox" --quiet
```

## 待决事项

| # | 事项 | 阻塞范围 | 状态 |
|---|---|---|---|
| 1 | Sentry 动态加载的可观测性损失是否接受 | Stage 2 | ✅ 已批准并实施 |
| 2 | Stage 4 是否值得投入 | Stage 4 | ✅ 已批准并实施（改交互触发） |
| 3 | Stage 3 是否接受抬高浏览器基线的兼容性风险 | Stage 3 | ⏳ 待用户决策，建议不做 |
| 4 | LCP / SI / TBT 的生产实测 | 全部 | ⏳ 待 Preview 部署后补测 |
