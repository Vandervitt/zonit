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

  describe("用户自定义 slug", () => {
    it("合法且未被占用 → 原样使用，不追加随机后缀", async () => {
      const { POST } = await loadRoute("zapbridge.site");
      const res = await POST(req({ slug: "acme" }));
      expect(res.status).toBe(201);
      expect(await res.json()).toMatchObject({ domain: "acme.zapbridge.site" });
      expect(insertDomainMock).toHaveBeenCalledWith(
        expect.objectContaining({ domain: "acme.zapbridge.site", isPlatformSubdomain: true }),
      );
    });

    it("大小写不敏感，落库前统一转小写", async () => {
      const { POST } = await loadRoute("zapbridge.site");
      const res = await POST(req({ slug: "AcMe" }));
      expect(await res.json()).toMatchObject({ domain: "acme.zapbridge.site" });
    });

    it("已被别人占用 → 409 slug_taken，不静默换名", async () => {
      const { POST } = await loadRoute("zapbridge.site");
      getDomainByNameMock.mockResolvedValue({ id: "other", domain: "acme.zapbridge.site" });
      const res = await POST(req({ slug: "acme" }));
      expect(res.status).toBe(409);
      expect(await res.json()).toMatchObject({ error: "slug_taken" });
      expect(insertDomainMock).not.toHaveBeenCalled();
    });

    it("格式不合法（含大写以外的非法字符）→ 400 slug_invalid", async () => {
      const { POST } = await loadRoute("zapbridge.site");
      const res = await POST(req({ slug: "acme_dental!" }));
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ error: "slug_invalid" });
      expect(insertDomainMock).not.toHaveBeenCalled();
    });

    it("首尾是连字符 → 400 slug_invalid", async () => {
      const { POST } = await loadRoute("zapbridge.site");
      const res = await POST(req({ slug: "-acme-" }));
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ error: "slug_invalid" });
    });

    it("撞平台保留字 → 400 slug_reserved", async () => {
      const { POST } = await loadRoute("zapbridge.site");
      const res = await POST(req({ slug: "admin" }));
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ error: "slug_reserved" });
      expect(insertDomainMock).not.toHaveBeenCalled();
    });

    it("已有子域时再传 slug 也直接返回旧的——只能设置一次", async () => {
      const { POST } = await loadRoute("zapbridge.site");
      getPlatformSubdomainMock.mockResolvedValue({ id: "d0", domain: "first-pick.zapbridge.site" });
      const res = await POST(req({ slug: "second-pick" }));
      expect(await res.json()).toMatchObject({ domain: "first-pick.zapbridge.site" });
      expect(insertDomainMock).not.toHaveBeenCalled();
    });

    it("并发下唯一索引冲突且赢家不是自己 → 409 slug_taken，不误报为「已有」", async () => {
      const { POST } = await loadRoute("zapbridge.site");
      insertDomainMock.mockRejectedValue(new Error("duplicate key"));
      getPlatformSubdomainMock.mockResolvedValue(null); // 冲突后再查依然没有：这次没抢到的是自己
      const res = await POST(req({ slug: "acme" }));
      expect(res.status).toBe(409);
      expect(await res.json()).toMatchObject({ error: "slug_taken" });
    });
  });
});

describe("GET /api/domains/platform-subdomain", () => {
  it("未登录 → 401", async () => {
    const { GET } = await loadRoute("zapbridge.site");
    authMock.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
  });

  it("返回 { domain, root }，供前端拼实时预览", async () => {
    const { GET } = await loadRoute("zapbridge.site");
    getPlatformSubdomainMock.mockResolvedValue({ id: "d1", domain: "acme.zapbridge.site" });
    const res = await GET();
    expect(await res.json()).toMatchObject({
      domain: { id: "d1", domain: "acme.zapbridge.site" },
      root: "zapbridge.site",
    });
  });

  it("未分配子域时 domain 为 null，root 仍照常返回", async () => {
    const { GET } = await loadRoute("zapbridge.site");
    getPlatformSubdomainMock.mockResolvedValue(null);
    const res = await GET();
    expect(await res.json()).toMatchObject({ domain: null, root: "zapbridge.site" });
  });
});
