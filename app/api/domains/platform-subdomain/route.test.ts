import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
const getPlatformSubdomainMock = vi.fn();
const getDomainByNameMock = vi.fn();
const insertDomainMock = vi.fn();

vi.mock("@/auth", () => ({ auth: () => authMock() }));
vi.mock("@/lib/domains-db", () => ({
  getPlatformSubdomain: (...a: unknown[]) => getPlatformSubdomainMock(...a),
  getDomainByName: (...a: unknown[]) => getDomainByNameMock(...a),
  insertDomain: (...a: unknown[]) => insertDomainMock(...a),
}));

const USER = { user: { id: "u1", email: "a@b.c" } };
const req = (body?: unknown) =>
  new Request("http://x/api/domains/platform-subdomain", {
    method: "POST",
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

/** 路由在模块加载时读取 PLATFORM_SUBDOMAIN_ROOT，故每个用例重新 import。 */
async function loadRoute(root: string | undefined) {
  vi.resetModules();
  if (root === undefined) delete process.env.PLATFORM_SUBDOMAIN_ROOT;
  else process.env.PLATFORM_SUBDOMAIN_ROOT = root;
  return import("./route");
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue(USER);
  getPlatformSubdomainMock.mockResolvedValue(null);
  getDomainByNameMock.mockResolvedValue(null);
  insertDomainMock.mockImplementation(async (p: { domain: string }) => ({
    id: "d1",
    domain: p.domain,
    is_platform_subdomain: true,
    verified: true,
    enabled: true,
  }));
});

describe("POST /api/domains/platform-subdomain", () => {
  it("未登录 → 401，不写库", async () => {
    const { POST } = await loadRoute("zapbridge.site");
    authMock.mockResolvedValue(null);
    expect((await POST(req())).status).toBe(401);
    expect(insertDomainMock).not.toHaveBeenCalled();
  });

  it("未配置根域 → 503，功能整体关闭", async () => {
    const { POST } = await loadRoute(undefined);
    expect((await POST(req())).status).toBe(503);
    expect(insertDomainMock).not.toHaveBeenCalled();
  });

  it("按页面标题生成 slug，且置为已验证已启用", async () => {
    const { POST } = await loadRoute("zapbridge.site");
    const res = await POST(req({ fromTitle: "Lumora Dental Studio" }));
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ domain: "lumora-dental-studio.zapbridge.site" });
    expect(insertDomainMock).toHaveBeenCalledWith(
      expect.objectContaining({ isPlatformSubdomain: true, userId: "u1" }),
    );
  });

  it("已有子域则返回它，不再分配第二个（幂等）", async () => {
    const { POST } = await loadRoute("zapbridge.site");
    getPlatformSubdomainMock.mockResolvedValue({ id: "d0", domain: "old.zapbridge.site" });
    const res = await POST(req({ fromTitle: "Whatever" }));
    expect(await res.json()).toMatchObject({ domain: "old.zapbridge.site" });
    expect(insertDomainMock).not.toHaveBeenCalled();
  });

  it("slug 冲突时换名重试，不会返回已被占用的地址", async () => {
    const { POST } = await loadRoute("zapbridge.site");
    getDomainByNameMock.mockImplementation(async (host: string) =>
      host === "acme.zapbridge.site" ? { id: "other" } : null,
    );
    const res = await POST(req({ fromTitle: "Acme" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.domain).not.toBe("acme.zapbridge.site");
    expect(body.domain).toMatch(/^acme-[a-z0-9]{4}\.zapbridge\.site$/);
  });

  it("标题转不出 slug（如纯中文）时回退随机名，而不是失败", async () => {
    const { POST } = await loadRoute("zapbridge.site");
    const res = await POST(req({ fromTitle: "牙科诊所" }));
    expect(res.status).toBe(201);
    expect((await res.json()).domain).toMatch(/^page-[a-z0-9]{6}\.zapbridge\.site$/);
  });

  it("标题恰好是保留字时不占用它，回退随机名", async () => {
    const { POST } = await loadRoute("zapbridge.site");
    const res = await POST(req({ fromTitle: "Admin" }));
    expect(res.status).toBe(201);
    const { domain } = await res.json();
    expect(domain).not.toBe("admin.zapbridge.site");
    expect(domain).toMatch(/^page-[a-z0-9]{6}\.zapbridge\.site$/);
  });

  it("空 body 不报错，走随机名", async () => {
    const { POST } = await loadRoute("zapbridge.site");
    const res = await POST(req());
    expect(res.status).toBe(201);
    expect((await res.json()).domain).toMatch(/\.zapbridge\.site$/);
  });

  it("并发下唯一索引冲突：返回本用户已有的子域而非报错", async () => {
    const { POST } = await loadRoute("zapbridge.site");
    insertDomainMock.mockRejectedValue(new Error("duplicate key"));
    getPlatformSubdomainMock
      .mockResolvedValueOnce(null) // 入口检查：此时还没有
      .mockResolvedValue({ id: "d9", domain: "raced.zapbridge.site" }); // 冲突后再查：已被并发请求写入
    const res = await POST(req({ fromTitle: "Acme" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ domain: "raced.zapbridge.site" });
  });
});
