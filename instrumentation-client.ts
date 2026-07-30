import type * as SentryModule from "@sentry/nextjs";

// 客户端 Sentry 初始化（三端浏览器侧错误捕获）。仅在配置了公开 DSN 时启用。
//
// 动态 import 把 SDK 体积（约 86 KiB 传输 / 272K 原始）挪出每个页面的同步入口。
// Turbopack 不支持 Sentry 的 tree-shaking 选项（官方文档限定 webpack），故这是唯一可行的
// 瘦身路径。但动态加载只解决体积不解决 CPU：初始化开销被推到 FCP 之后，会计入 TBT。
//
// 已实测否决的方案：用 requestIdleCallback 把初始化推到空闲后。立即 import 时 SDK 的解析
// 执行与 hydration 交错、被切分成较短任务；推到空闲后主线程已安静，整个初始化凝成一个
// 1000ms 级连续长任务，TBT 反而从 474ms 恶化到 1246ms（16x 降速中位数）。
//
// 代价：SDK 就绪前的极早期错误无法捕获。营销站与落地页为静态内容，该窗口内出错概率低。
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

let routerTransitionHandler: typeof SentryModule.captureRouterTransitionStart | undefined;

if (dsn) {
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
      // 不设 tracesSampleRate：性能追踪由 @vercel/speed-insights 承担（见 app/layout.tsx），
      // Sentry 侧只保留错误捕获。开启 tracing 会激活 BrowserTracing，实测使 SDK 初始化的
      // bootup 从 379ms 涨到 481ms（16x 降速中位数）。
      integrations: (defaults) => defaults.filter((i) => i.name !== "BrowserTracing"),
      // Session Replay 默认关闭，避免占用免费额度与增大包体；需要时再开。
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
    });
    routerTransitionHandler = Sentry.captureRouterTransitionStart;
  });
}

// 让 Sentry 感知 App Router 客户端导航。Next.js 要求该导出为同步函数，
// 故此处始终导出稳定包装：SDK 未就绪（或 DSN 缺失）时为 no-op，早期导航的 trace 会丢失。
export const onRouterTransitionStart: typeof SentryModule.captureRouterTransitionStart = (
  ...args
) => {
  routerTransitionHandler?.(...args);
};
