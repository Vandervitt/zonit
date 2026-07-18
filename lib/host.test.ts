import { describe, it, expect } from "vitest";
import { resolveTenantHostname, TENANT_HOST_HEADER } from "./host";

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
