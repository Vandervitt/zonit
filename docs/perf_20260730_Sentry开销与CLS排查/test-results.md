# Sentry 初始化开销与首页 CLS · 排查与验证

分支：`perf_20260730_Sentry延迟加载与CLS排查`
基线：`main` @ d5d306b（PR #120 合并后）
日期：2026-07-30

## 1. 起因：PR #120 的一处反效果

PR #120 把 Sentry 改为动态 import，体积收益成立（同步 JS −243 KiB），但生产实测发现桌面
16x 降速下 TBT 从 240ms 升至 606ms。长任务归属稳定指向 Sentry chunk：

| 运行 | TBT | 长任务合计 | 其中 Sentry chunk |
|---|---|---|---|
| run1 | 646 ms | 1188 ms | 457 ms (38%) |
| run2 | 606 ms | 890 ms | 446 ms (50%) |
| run3 | 591 ms | 1003 ms | 458 ms (46%) |

**根因**：动态 import 只把体积移出同步入口，SDK 的执行开销被推到 FCP 之后，而 TBT 只统计
FCP→TTI 之间的阻塞 —— 这段开销从「不计入」变成「全额计入」。CPU 成本没有消失，只是换了位置。

### 一处必须记录的测量失误

PR #120 中「本地 A/B：/templates TBT 257→206ms 改善」的结论**无效**。当时本地未配置
`NEXT_PUBLIC_SENTRY_DSN`，`if (dsn)` 分支从未进入，Sentry 根本没有初始化 —— 对照组与实验组
测的都是「代码存在但不执行」。本轮以临时 DSN 构建后，本地即可复现该问题（TBT 509ms，
接近生产 606ms），本地测量环境自此可信。

## 2. 方案验证（本地，桌面 preset + 16x CPU 降速）

Sentry chunk 的 bootup 通过下载各 chunk 并匹配 `_sentryModuleMetadata` / `sentry-trace`
特征精确归属，非估算。

| 方案 | Sentry bootup 中位数 | TBT 中位数 | 结论 |
|---|---|---|---|
| 基线（tracing 0.1） | 480.6 ms | 509 ms | — |
| **关闭 tracing** | **344.8 ms** | **469 ms** | ✅ 采用 |
| 关闭 tracing + `requestIdleCallback` | 793.3 ms | 1246 ms | ❌ 否决 |

样本明细：

- 基线（3 次）bootup 478.7 / 480.6 / 735.1；TBT 509 / 498 / 812
- 最终（5 次）bootup 386.5 / 360.8 / 344.8 / 333.2 / 341.9；TBT 600 / 493 / 437 / 456 / 469
- idle（5 次）bootup 389.9 / 1004.2 / 1018.9 / 793.3 / 762.4；TBT 617 / 1483 / 1480 / 1246 / 1077

### 已否决：requestIdleCallback 延迟初始化

原假设是把初始化推到空闲后即可移出 TBT 窗口，**实测相反**：立即 import 时 SDK 的解析执行
与 hydration 交错、被切分成较短任务（单个最大 ~379ms）；推到空闲后主线程已安静，整个
初始化凝成一个 **1000ms 级连续长任务**，完整暴露在 FCP→TTI 内，并把 TTI 推后、拉长统计
窗口，TBT 从 469ms 恶化到 1246ms。相关的 `lib/monitoring/schedule.ts` 已删除，未留死代码。

### 采用：关闭 Sentry tracing

依据：项目已在 `app/layout.tsx` 使用 `@vercel/analytics` + `@vercel/speed-insights` 采集
性能数据，Sentry 的 `tracesSampleRate: 0.1` 属**重复能力**。关闭后错误捕获、stack trace、
source map 全部保留，无可观测性损失。

除不设 `tracesSampleRate` 外，显式 `integrations: (defaults) => defaults.filter(i => i.name !== "BrowserTracing")`
以确保集成不被初始化（Turbopack 无法 tree-shake 掉这部分代码，只能避免其运行时开销）。

剩余的 ~345ms 是 SDK 本体（536K 原始）解析与初始化的固有成本，在不更换监控方案的前提下
无法进一步压缩。

## 3. 回归验证

| 项目 | 结果 |
|---|---|
| `npx vitest run` | 84 文件 / **565** 测试通过 |
| `npx tsc --noEmit` | 通过 |
| `npx eslint` | 0 errors，5 条既有 warning（无新增） |
| `npx next build` | 通过 |
| Sentry 版本 | 10.65.0 正常加载 |
| 主动抛错 → envelope 上报 | **1 次**，✅ 错误捕获未被破坏 |
| `meta[name="sentry-trace"]` | 已消失，确认 BrowserTracing 被过滤 |

临时 DSN 仅通过命令行传入，未写入 `.env.local`；已核验代码与配置中无残留。
自启动的本地服务（3100）已停止并确认端口释放。

## 4. 首页 CLS 排查（未修，待决策）

生产站 8 次采样：

```
CLS 分布: [0, 0.0001, 0.0001, 0.0001, 0.0001, 0.0014, 0.1167, 0.1186]
中位数 0.0001 | 75 分位 0.0014 | 最大 0.1186
```

- **2/8（25%）出现 ~0.118**，其余接近 0
- 偏移元素恒定为 hero 段落 `main > section.relative > div.mx-auto > p.mx-auto`（占单次 CLS 的 98%）

**成因**：不是 motion 动画 —— `heroRise` 用 `y` 位移即 transform，不触发布局偏移。真凶是
`lib/fonts.ts` 中 `display: "swap"`：标题字体 Syne 与 fallback 度量差异较大，字体切换时 h1
换行数变化，把下方段落挤动。仅在字体到达时序不利时出现，故呈现约 25% 的发生率。

**当前不构成 CWV 超标**：Core Web Vitals 按 75 分位判定，当前 75 分位 0.0014，属「良好」
（阈值：良好 ≤0.1 / 需改进 0.1–0.25）。但 25% 的发生率已接近临界 —— 若真实用户网络条件
更差使发生率超过 25%，75 分位将跳至 0.118 落入「需改进」。

**候选修法（需决策，均涉及视觉取舍）**：

1. 仅将 `fontHead`（Syne）改为 `display: "optional"`，正文 Sora 保持 `swap` —— 零偏移，
   代价是慢网络下标题回退到 fallback 字体
2. 给 hero h1 按断点预留 `min-height` —— 不改字体行为，但依赖精确测量、较脆弱
3. 不修，持续观察 GSC 的 CrUX 数据

本地无法验证此问题：本地 5 次采样 CLS 全为 0，字体加载过快，FOUT 不发生。任何修法都需在
生产复测确认。

## 5. 遗留

- Stage 3（legacy polyfill）仍未实施，结论见 `docs/perf_20260729_首屏性能优化/`：建议不做
- 本次 tracing 改动的收益需在生产复测确认（本地 16x 为人为放大场景）
