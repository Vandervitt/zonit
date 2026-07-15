import * as Sentry from "@sentry/nextjs";

// Edge 运行时（proxy.ts 中间件等）Sentry 初始化，与服务端同样 env-gated。
const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.VERCEL_ENV === "production" ? 0.1 : 1,
  });
}
