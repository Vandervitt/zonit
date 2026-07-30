# 首屏性能优化 · 方案

分支：`perf_20260729_首屏性能优化`
基线：`main` @ 4b4423e
日期：2026-07-29

## 1. 背景

用户提供两张 Lighthouse Scoring Calculator 截图（桌面 66 分 / TBT 1088ms，移动 78 分 / LCP 3826ms），来源为 Google Search Console 关联的 PageSpeed Insights。需定位并优化。

## 2. 实测基线

### 2.1 常规环境（Apple Silicon 本机，Lighthouse 12 移动端默认降速）

| 页面 | 分数 | FCP | SI | LCP | TBT | CLS |
|---|---|---|---|---|---|---|
| 首页 | 82 | 1.1s | 15.2s | 3.2s | 90ms | 0 |
| /templates | 70 | 1.3s | 15.8s | **5.3s** | 40ms | 0 |
| /pricing | 88 | 1.3s | 11.3s | 2.5s | 20ms | 0.014 |
| /guides | 95 | 1.2s | 5.7s | 1.8s | 30ms | 0 |
| /templates/audio | 98 | 1.2s | 3.6s | 1.6s | 80ms | 0 |
| /templates/skincare | 89 | 1.3s | 4.1s | 3.4s | 50ms | 0 |

### 2.2 弱 CPU 环境（桌面 preset + `--throttling.cpuSlowdownMultiplier=16`）

| 页面 | 分数 | TBT | bootup | 主线程 | JS 传输 |
|---|---|---|---|---|---|
| /login | **74** | **600ms** | 1.9s | 3.2s | 360 KiB |
| /templates | **41** | 410ms | 2.2s | 5.1s | 416 KiB |
| /register | 82 | 350ms | 1.4s | 2.6s | 360 KiB |
| /anti-ban | 84 | 290ms | 2.0s | 5.8s | 411 KiB |
| /pricing | 86 | 300ms | 1.1s | 2.2s | 291 KiB |
| 首页 | 90 | 240ms | — | — | 360 KiB |

**测量方法论修正**：TBT / bootup 是纯 CPU 指标。在高性能本机上测得 20–90ms，会严重低估真实用户与 PSI 云机器上的表现（首页 4x→80ms、8x→160ms、16x→240ms，随降速线性放大）。**CPU 类指标必须在降速环境下评估**，本方案所有 TBT 结论均以 16x 降速为准。

## 3. 根因分析

### 3.1 Sentry SDK 占据首屏最大长任务（TBT 头号）

`/login` 16x 降速下的主线程分解：

| 脚本 | bootup 总计 | eval | 最长任务 | 识别结果 |
|---|---|---|---|---|
| `0~bglw98ip7ce.js` | **562ms** | 457ms | **402ms** | **Sentry**（243 处匹配 + BrowserTracing） |
| `0bh-u3tjfp0rm.js` | 438ms | 346ms | 53ms | React / scheduler |
| `0pw-vl972iiwq.js` | 331ms | 280ms | — | react-dom |
| `08t.bijs.v.6f.js` | 324ms | 315ms | 321ms | Next.js App Router 运行时（框架自带，不可动） |

主线程合计：scriptEvaluation 1700ms、scriptParseCompile 394ms。

根因在 `instrumentation-client.ts:1` 的静态导入 `import * as Sentry from "@sentry/nextjs"` —— Next.js 会将该文件注入**每一个**页面的客户端同步入口，营销站、模板页、`/p/*` 租户落地页全部承担。

体积占比：`0~bglw98ip7ce`(66 KiB) + `0hk.fn4cx6m0y`(20 KiB) ≈ **86 KiB 传输 / 272 K 原始，占首页 script 总量 360 KiB 的 24%**，其中 38 KiB 未被使用。

现状配置（`instrumentation-client.ts`）：`replaysSessionSampleRate: 0` 已生效（Replay 仅剩 2 处匹配，确认被 tree-shake），但 `tracesSampleRate: 0.1` 使 BrowserTracing 整体保留。

### 3.2 /templates 首屏图片被 `loading="lazy"` 延迟（LCP 主因）

`TemplateGallery.tsx:83-88` 对**所有**卡片图无差别使用 `loading="lazy"`，包括首屏内的 LCP 元素。网络时序：

```
141 KiB  start 7437ms   ← LCP 元素
353 KiB  start 7438ms
104 KiB  start 7438ms
```

首屏图片到 **7.4 秒**才发出请求。`loading="lazy"` 迫使浏览器等布局完成后才决策是否加载，对首屏图为纯负收益，这是 LCP 5.3s 的首要成因（优先于体积因素）。

次要成因是尺寸失配：容器实测渲染 362–380px，`registry.ts` 中 thumbnail 为 `w=1600`（32 条）/ `w=1920`（1 条，且强制 `fm=jpg`）。Lighthouse `uses-responsive-images` 可省 **1161 KiB**、`modern-image-formats` 可省 **213 KiB**。

**已排除的方向**：`offscreen-images` 审计满分（1.0），33 套模板实际只加载 10 张，原生懒加载对离屏图已完全生效，无剩余可省字节。引入 IntersectionObserver 手写懒加载对本例为负收益——增加 JS 会加重已确认的 TBT 瓶颈，且 JS 层观察必须等 hydration 后才启动，晚于浏览器预加载扫描器。

### 3.3 无限循环动画拖垮 Speed Index

`chrome.tsx:66-77` 的 `Backdrop()` 含两个 `repeat: Infinity` 光斑动画，且挂载于全站营销布局，导致所有营销页 SI 偏高。首页另有 `MarketingHome.tsx:227` 跑马灯（28s 循环）与 `:189-205` 两个浮动徽标（4s / 5s）。像素持续变化使 SI 判定视觉永不稳定。

A/B 验证（`--force-prefers-reduced-motion`，代码已有 `useReducedMotion()` 分支）：

- 首页 SI **15.2s → 5.6s**
- /templates SI **15.8s → 9.9s**

## 4. 优先级判据

GSC 的网页体验报告仅采用 CrUX 真实用户数据的 **LCP / INP / CLS**，不含 SI，TBT 亦非 CWV 指标（但与 INP 强相关，且占 Lighthouse 权重 30%）。

sitemap 共 90 个 URL：68 个模板详情页（34 套 × 中英）、营销页若干，含 `/login`、`/zh/login`；不含 `/p/*` 租户页。模板详情页实测 89–98 分，为全站最优，非短板。

据此排序：

| 优先级 | 项目 | 收益指标 | 影响 GSC |
|---|---|---|---|
| P0 | /templates 首屏图片 | LCP 5.3s → 目标 <2.5s | ✅ 直接 |
| P1 | Sentry 移出首屏 | TBT −402ms 长任务；−86 KiB | ✅ 间接（INP） |
| P2 | legacy polyfill | −14 KiB | ➖ |
| P3 | 循环动画延迟启动 | SI 15.2s → ~5.6s | ❌ 仅 Lighthouse |

## 5. 方案

### 5.1 P0 · /templates 图片（`TemplateGallery.tsx`、`TemplateDetail.tsx`）

三项组合，均不需要新增 JS：

1. **首屏图去 lazy**：分组内前 3 张（`sm:grid-cols-2 lg:grid-cols-3`，首屏最多可见 3 张）改为 `loading="eager"`，第 1 张追加 `fetchPriority="high"`。
2. **尺寸适配**：新增纯函数工具统一改写 Unsplash 查询参数，输出 `src`（w=800，覆盖 2x DPR）与 `srcSet`（400w / 800w / 1200w），配合 `sizes`。
3. **强制现代格式**：将 `fm=jpg` 规范为 `auto=format`，由 Unsplash 按 Accept 头返回 webp/avif。

**实现方式选择**：不逐条手改 `registry.ts` 的 34 个字面量 URL，而是在渲染层引入 `lib/images/unsplash.ts` 纯函数做参数规范化。理由：
- 34 条数据存在两种参数格式（32 条 `auto=format&fit=crop&w=1600&q=80`，1 条 `crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920`），手改易错且不可回归；
- 纯函数可单测，符合项目「可单测纯逻辑优先 TDD」约定；
- thumbnail 有 4 个使用点，工具函数可按需复用。

**使用点影响面**：

| 位置 | 用途 | 处理 |
|---|---|---|
| `TemplateGallery.tsx:84` | 画廊卡片 | ✅ 本次优化 |
| `TemplateDetail.tsx:200` | 相关模板推荐卡片 | ✅ 本次优化（同样在折叠下方，保留 lazy，仅改尺寸） |
| `TemplateDetail.tsx:59` | OG 分享图 | ❌ **不得缩小**，OG 需 ≥1200px |
| `TemplatePickerDialog.tsx:222` | 编辑器模板选择器（后台） | ➖ 本次不改，非公开页 |

### 5.2 P1 · Sentry 移出首屏关键路径

**⚠️ 原定的 tree-shaking 方案已被否决。** Sentry 官方文档明确：tree shaking「is relevant only for applications using webpack for builds; it does not apply to Turbopack builds」。本项目为 Next 16 默认 Turbopack 构建（产物含 `turbopack-*.js` 佐证），故 `withSentryConfig` 的 `bundleSizeOptimizations.excludeTracing` / `webpack.treeshake` 系列选项均不可用。

剩余可行路径为**动态导入**，将 Sentry 从同步入口移出为异步 chunk：

```ts
// instrumentation-client.ts 结构示意
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
let capture: ((...a: unknown[]) => void) | undefined;

if (dsn) {
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({ dsn, /* ... */ });
    capture = Sentry.captureRouterTransitionStart;
  });
}

// 必须保持同步导出，未就绪时 no-op 兜底
export const onRouterTransitionStart = (...a: unknown[]) => capture?.(...a);
```

**代价与取舍**：
- 首屏最初数百毫秒内发生的错误将捕获不到（SDK 尚未初始化）。营销站/落地页为静态内容，该窗口内出错概率低；但 `/login`、`/register` 有表单交互，需评估。
- `onRouterTransitionStart` 必须保持同步导出签名，用 no-op 兜底，早期导航的 trace 会丢失。
- 需实测确认 Turbopack 确实将其拆为独立异步 chunk 而非内联回主包。

**决策点（待用户确认）**：是否接受上述可观测性损失。若不接受，P1 只能维持现状——因为 Turbopack 下无第三条路。

### 5.3 P2 · legacy polyfill

`legacy-javascript` 报 14 KiB，`08t` chunk 内含 Node `process.nextTick` shim。收紧 browserslist 目标。属附带优化，风险与收益均低。

### 5.4 P3 · 循环动画延迟启动

将 `Backdrop()`、`LogoMarquee`、浮动徽标的 `repeat: Infinity` 动画改为首屏渲染完成后（如 `requestIdleCallback` 或延迟 2–3s）再启动，而非直接删除。观感基本不变，SI 可回到 ~5.6s。现有 `useReducedMotion()` 分支须保留。

**明确不做**：不移除动画本身（视觉降级由用户决定，非性能必要）。

## 6. 验证方法

每项改动后以**相同命令**复测，对比改前基线：

```bash
# LCP / 图片类（移动端默认降速）
npx lighthouse@12 <url> --only-categories=performance \
  --output=json --output-path=./after.json \
  --chrome-flags="--headless=new --no-sandbox" --quiet

# TBT / JS 类（必须 16x 降速，否则本机测不出差异）
npx lighthouse@12 <url> --only-categories=performance --preset=desktop \
  --throttling.cpuSlowdownMultiplier=16 \
  --output=json --output-path=./after.json \
  --chrome-flags="--headless=new --no-sandbox" --quiet
```

单次 Lighthouse 存在噪声（观察到 FCP 1.1s/2.0s、LCP 5.3s/6.4s 波动），**每项验收跑 3 次取中位数**，仅当变化量显著超出噪声区间才认定收益。

纯函数部分（`lib/images/unsplash.ts`）以 vitest 单测覆盖，先写失败测试再实现。

## 7. 风险登记

| 风险 | 影响 | 应对 |
|---|---|---|
| Turbopack 未将 Sentry 拆为异步 chunk | P1 收益归零 | 实施后核对产物 chunk 归属，无效则回滚该项 |
| 动态 import 丢失早期错误捕获 | 可观测性下降 | 待用户决策；可仅对营销站路由生效 |
| 前 3 张去 lazy 在极窄视口反成浪费 | 移动端多加载 2 张图 | 单列布局下首屏仅 1 张，可退化为仅第 1 张 eager |
| Unsplash 参数改写破坏个别 URL | 缩略图 404 | 纯函数单测覆盖两种参数格式 + 全 34 条快照校验 |
| 本地 build 受 Google Fonts 网络限制 | 无法完整验证 | 依赖 CI；本地以生产站远程测量为准 |

## 8. 不在本次范围

- `/admin` 等后台页（不在 sitemap，不影响 GSC）
- `/p/*` 租户落地页（同上，但 P1 的 Sentry 收益会自然惠及）
- 图片托管迁移 / next-image 域名白名单改造
- CLS 相关（营销页实测 0–0.014，无问题）
