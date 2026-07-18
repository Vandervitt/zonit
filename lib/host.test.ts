import { describe, it, expect } from "vitest";
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
