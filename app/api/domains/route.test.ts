import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
const insertDomainMock = vi.fn();
const lookupNameserversMock = vi.fn();
const getDomainByNameMock = vi.fn();

vi.mock("@/auth", () => ({ auth: () => authMock() }));
vi.mock("@/lib/domains-db", () => ({
  getUserDomains: vi.fn(async () => []),
  getDomainByName: (...a: unknown[]) => getDomainByNameMock(...a),
  insertDomain: (...a: unknown[]) => insertDomainMock(...a),
  updateDomain: vi.fn(),
  getEnabledDomainCount: vi.fn(async () => 0),
  bindDomainToLandingPage: vi.fn(),
}));
vi.mock("@/lib/vercel", () => ({ addDomainToProject: vi.fn(async () => ({ records: [] })) }));
vi.mock("@/lib/domain-ns", () => ({
  lookupNameservers: (...a: unknown[]) => lookupNameserversMock(...a),
}));
vi.mock("@/lib/platform-milestones", () => ({ recordMilestone: vi.fn() }));

const USER = { user: { id: "u1", email: "a@b.c", plan: "pro" } };
const req = (domain: string) =>
  new Request("http://x/api/domains", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ domain }),
  });

async function loadRoute(root: string | undefined) {
  vi.resetModules();
  if (root === undefined) delete process.env.PLATFORM_SUBDOMAIN_ROOT;
  else process.env.PLATFORM_SUBDOMAIN_ROOT = root;
  return import("./route");
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue(USER);
  getDomainByNameMock.mockResolvedValue(null);
  lookupNameserversMock.mockResolvedValue([]);
});

describe("POST /api/domains —— 平台自有域名不可手动添加", () => {
  // 不拦的话任何人都能占住 competitor.zapbridge.site：DNS 验证永远不会通过，
  // 但 domains.domain 的唯一约束会让真正的分配请求再也拿不到这个名字。
  it("拒绝平台子域后缀，返回 domain_reserved_suffix", async () => {
    const { POST } = await loadRoute("zapbridge.site");
    const res = await POST(req("competitor.zapbridge.site"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("domain_reserved_suffix");
    expect(insertDomainMock).not.toHaveBeenCalled();
  });

  it("拒绝 apex 本身 —— 它是平台演示位，不属于任何用户", async () => {
    const { POST } = await loadRoute("zapbridge.site");
    const res = await POST(req("zapbridge.site"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("domain_reserved_suffix");
    expect(insertDomainMock).not.toHaveBeenCalled();
  });

  it("拦截发生在 DNS 查询之前，不做无谓的外部请求", async () => {
    const { POST } = await loadRoute("zapbridge.site");
    await POST(req("x.zapbridge.site"));
    expect(lookupNameserversMock).not.toHaveBeenCalled();
  });

  it("仿冒后缀不受影响，仍按普通客户域名处理", async () => {
    // evilzapbridge.site 不是我们的域名，用户有权绑定
    const { POST } = await loadRoute("zapbridge.site");
    const res = await POST(req("evilzapbridge.site"));
    expect((await res.json()).error).not.toBe("domain_reserved_suffix");
  });

  it("未配置根域时不误伤任何域名", async () => {
    const { POST } = await loadRoute(undefined);
    const res = await POST(req("acme.zapbridge.site"));
    expect((await res.json()).error).not.toBe("domain_reserved_suffix");
  });

  it("正常客户域名不受影响", async () => {
    const { POST } = await loadRoute("zapbridge.site");
    const res = await POST(req("brand.com"));
    expect((await res.json()).error).not.toBe("domain_reserved_suffix");
  });
});
