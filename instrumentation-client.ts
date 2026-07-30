import type * as SentryModule from "@sentry/nextjs";

// 客户端 Sentry 初始化（三端浏览器侧错误 + 性能）。仅在配置了公开 DSN 时启用。
//
// 采用动态 import：静态导入会让整个 SDK 进入每个页面的同步入口，实测在 16x CPU 降速下
// 产生 402ms 长任务、562ms bootup，是首屏 TBT 的头号来源（约 86 KiB 传输 / 272K 原始）。
// Turbopack 构建不支持 Sentry 的 tree-shaking 选项（官方文档限定 webpack），故动态加载
// 是本项目唯一可行的瘦身路径。
//
// 代价：SDK 就绪前的极早期错误无法捕获。营销站与落地页为静态内容，该窗口内出错概率低。
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

let routerTransitionHandler: typeof SentryModule.captureRouterTransitionStart | undefined;

if (dsn) {
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
      tracesSampleRate: 0.1,
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
