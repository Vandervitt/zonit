import { describe, it, expect, vi } from "vitest";
import { appUrl, resolveTenantHostname, TENANT_HOST_HEADER } from "./host";

describe("appUrl", () => {
  it("base 尾部带斜杠：剥掉后拼接，不产生 //", () => {
    expect(appUrl("/api/track", "https://zapbridge.tech/")).toBe("https://zapbridge.tech/api/track");
  });

  it("base 尾部多个斜杠：全部剥掉", () => {
    expect(appUrl("/register", "https://zapbridge.tech//")).toBe("https://zapbridge.tech/register");
  });

  it("base 无尾斜杠：原样拼接", () => {
    expect(appUrl("/api/track", "https://zapbridge.tech")).toBe("https://zapbridge.tech/api/track");
  });

  it("base 为空：退化为相对路径", () => {
    expect(appUrl("/api/track", "")).toBe("/api/track");
  });
});

describe("resolveTenantHostname", () => {
  it("改写后的租户请求：优先取 x-tenant-host，而非被改写成 app 主域的 host", () => {
    const h = new Headers({ host: "zapbridge.tech", [TENANT_HOST_HEADER]: "zapbridge.xyz" });
    expect(resolveTenantHostname(h)).toBe("zapbridge.xyz");
  });

  it("无租户头时回退到 host", () => {
    const h = new Headers({ host: "zapbridge.tech" });
    expect(resolveTenantHostname(h)).toBe("zapbridge.tech");
  });

  it("去掉端口", () => {
    const h = new Headers({ [TENANT_HOST_HEADER]: "zapbridge.xyz:443" });
    expect(resolveTenantHostname(h)).toBe("zapbridge.xyz");
  });

  it("两者都缺时返回空串", () => {
    expect(resolveTenantHostname(new Headers())).toBe("");
  });
});

// isAppHost / isCustomDomain 依赖模块加载时读取的 appHostname，
// 故独立 describe 内先固定环境再动态 import。
describe("isAppHost / isCustomDomain 的 Vercel 部署域名判定", () => {
  async function load(appUrlEnv: string | undefined) {
    vi.resetModules();
    if (appUrlEnv) vi.stubEnv("NEXT_PUBLIC_APP_URL", appUrlEnv);
    else vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    return import("./host");
  }

  it.each([
    "project-36oi3-abc123-team.vercel.app",
    "my-app.vercel.app",
    "vercel.app",
  ])("%s 是平台自有 host，不是租户域名", async (hostname) => {
    const { isAppHost, isCustomDomain } = await load("https://zapbridge.tech");
    expect(isAppHost(hostname)).toBe(true);
    expect(isCustomDomain(hostname)).toBe(false);
  });

  it("品牌域名及其子域仍是 app host", async () => {
    const { isAppHost } = await load("https://zapbridge.tech");
    expect(isAppHost("zapbridge.tech")).toBe(true);
    expect(isAppHost("www.zapbridge.tech")).toBe(true);
  });

  it("真正的客户自有域名仍判为租户域名", async () => {
    const { isCustomDomain } = await load("https://zapbridge.tech");
    expect(isCustomDomain("acme.com")).toBe(true);
    expect(isCustomDomain("shop.acme.com")).toBe(true);
  });

  // 形近但不同后缀不得误放行，否则等于给任意域名开后门。
  it.each(["notvercel.app", "vercel.app.evil.com", "fakevercel.app"])(
    "%s 不得被当成平台 host",
    async (hostname) => {
      const { isCustomDomain } = await load("https://zapbridge.tech");
      expect(isCustomDomain(hostname)).toBe(true);
    },
  );

  it("未配置 NEXT_PUBLIC_APP_URL 时不识别任何租户域名（预览环境行为不变）", async () => {
    const { isCustomDomain } = await load(undefined);
    expect(isCustomDomain("acme.com")).toBe(false);
  });
});
