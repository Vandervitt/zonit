import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { OPTIMIZABLE_IMAGE_HOSTS } from "./lib/images/optimizable";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],
  images: {
    // ⚠️ 白名单的事实源是 lib/images/optimizable.ts —— 落地页渲染器据同一份名单
    // 决定「这张图能不能走 /_next/image」。写两份必然漂移：这边加了那边没加 →
    // 优化静默失效；反过来 → 图片 400 打不开，两种都不会有人立刻发现。
    remotePatterns: OPTIMIZABLE_IMAGE_HOSTS.map((hostname) => ({ hostname })),
  },
  async headers() {
    return [
      { source: "/preview/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
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
