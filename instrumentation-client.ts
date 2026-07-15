import * as Sentry from "@sentry/nextjs";

// 客户端 Sentry 初始化（三端浏览器侧错误 + 性能）。仅在配置了公开 DSN 时启用。
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    // Session Replay 默认关闭，避免占用免费额度与增大包体；需要时再开。
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

// 让 Sentry 感知 App Router 客户端导航（DSN 缺失时为 no-op）。
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
