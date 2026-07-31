import { describe, it, expect, vi, beforeEach } from "vitest";

const queryMock = vi.fn();
vi.mock("@/lib/db", () => ({ default: { query: (...a: unknown[]) => queryMock(...a) } }));
vi.mock("@/lib/host", () => ({ isAppHost: (h: string) => h === "zapbridge.tech" || h.endsWith(".zapbridge.tech") }));

import { checkPublicOrigin, __resetOriginCache } from "./origin-guard";

const PAGE = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
  __resetOriginCache();
  queryMock.mockResolvedValue({ rows: [{ domain: "solar-quotes.com" }] });
});

describe("checkPublicOrigin", () => {
  it("该页自己的已验证自有域名 → 放行并回显该来源", async () => {
    const r = await checkPublicOrigin(PAGE, "https://solar-quotes.com");
    expect(r).toEqual({ allowed: true, echo: "https://solar-quotes.com" });
  });

  it("平台主域及其子域（预览、编辑器）→ 放行，且不查库", async () => {
    const r = await checkPublicOrigin(PAGE, "https://zapbridge.tech");
    expect(r.allowed).toBe(true);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("别人的域名 → 拒绝（跨页灌线索的主要入口）", async () => {
    const r = await checkPublicOrigin(PAGE, "https://attacker.example");
    expect(r).toEqual({ allowed: false, echo: null });
  });

  it("无 Origin 头（curl / 服务端调用）→ 放行但不回显：浏览器跨源必带 Origin，拦它没有意义", async () => {
    const r = await checkPublicOrigin(PAGE, null);
    expect(r).toEqual({ allowed: true, echo: null });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("畸形 Origin → 拒绝", async () => {
    expect((await checkPublicOrigin(PAGE, "not-a-url")).allowed).toBe(false);
  });

  it("同一 pageId 的域名解析结果有缓存，不逐次打库（/api/track 是热路径）", async () => {
    await checkPublicOrigin(PAGE, "https://solar-quotes.com");
    await checkPublicOrigin(PAGE, "https://solar-quotes.com");
    expect(queryMock).toHaveBeenCalledOnce();
  });

  it("查库失败 → 放行：来源校验不能成为压死留资的那根稻草", async () => {
    queryMock.mockRejectedValue(new Error("db down"));
    const r = await checkPublicOrigin(PAGE, "https://solar-quotes.com");
    expect(r.allowed).toBe(true);
  });
});
