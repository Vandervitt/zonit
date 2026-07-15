import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],
  images: {
    remotePatterns: [
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

// 仅当配置了上传凭据时才套 Sentry 构建包装（上传 source map、注入 release）。
// 未配置（如 CI / 本地无密钥）时导出原配置：构建干净、不触发被忽略的 @sentry/cli，
// 运行时错误捕获仍由 sentry.*.config.ts 按 DSN 生效，互不影响。
const sentryEnabled = Boolean(
  process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT,
);

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      disableLogger: true,
    })
  : nextConfig;
