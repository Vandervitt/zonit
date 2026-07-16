import * as Sentry from "@sentry/nextjs";

// 服务端（Node.js 运行时）Sentry 初始化。
// 仅在配置了 DSN 时启用：本地开发/未配置密钥时整体 no-op，不产生噪声、不发请求。
const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // 环境标签取 Vercel 环境（production/preview/development），便于分区查看。
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    // 采样率保守，契合 Sentry 免费额度；生产 10%，其余全量。
    tracesSampleRate: process.env.VERCEL_ENV === "production" ? 0.1 : 1,
  });
}
