import * as Sentry from "@sentry/nextjs";

export async function register() {
  // 开发环境：若配置了代理，把全局 fetch 走代理（原有逻辑，勿删）。
  if (process.env.NODE_ENV === "development") {
    const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    if (proxy) {
      const { setGlobalDispatcher, ProxyAgent } = await import("undici");
      setGlobalDispatcher(new ProxyAgent(proxy));
    }
  }

  // 按运行时加载对应的 Sentry 初始化（DSN 缺失时内部 no-op）。
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// 捕获服务端（RSC / Route Handler / Server Action / 中间件）未处理错误。
export const onRequestError = Sentry.captureRequestError;
