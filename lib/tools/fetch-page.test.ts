// lib/tools/fetch-page.test.ts
//
// 抓取策略层的测试：逐跳重定向必须**每一跳都重新过 SSRF 闸门**，否则
// 「首跳是公网、次跳跳进内网」就是一条完整的绕过链路。传输层被注入，
// 这里只测策略，不打真实网络。
import { describe, it, expect } from "vitest";
import { fetchPageSafely, type RawResponse } from "./fetch-page";
import type { GuardResult } from "./url-guard";

/** 造一个假响应。 */
function res(init: Partial<RawResponse> & { status: number }): RawResponse {
  return {
    status: init.status,
    headers: init.headers ?? { "content-type": "text/html; charset=utf-8" },
    body: init.body ?? "<html><body>ok</body></html>",
    bytes: init.bytes ?? (init.body ?? "<html><body>ok</body></html>").length,
  };
}

/** 按 URL 依次返回预设响应的假传输层。 */
function transportOf(map: Record<string, RawResponse>) {
  const seen: string[] = [];
  const t = async (url: URL) => {
    seen.push(url.toString());
    const r = map[url.toString()];
    if (!r) throw new Error("测试未预设该 URL 的响应: " + url.toString());
    return r;
  };
  return { transport: t, seen };
}

/** 默认放行一切的闸门（各用例按需覆盖）。 */
const allowAll = async (raw: string): Promise<GuardResult> => ({
  ok: true,
  url: new URL(raw),
  addresses: ["93.184.216.34"],
});

describe("fetchPageSafely · 正常路径", () => {
  it("直接 200 时返回正文与单跳链路", async () => {
    const { transport } = transportOf({
      "https://example.com/": res({ status: 200, body: "<html>hi</html>" }),
    });
    const r = await fetchPageSafely("https://example.com/", { guard: allowAll, transport });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.finalUrl).toBe("https://example.com/");
      expect(r.html).toContain("hi");
      expect(r.chain).toHaveLength(1);
      expect(r.chain[0].status).toBe(200);
    }
  });

  it("跟随重定向并记录完整链路", async () => {
    const { transport } = transportOf({
      "https://example.com/": res({ status: 301, headers: { location: "https://www.example.com/lp" } }),
      "https://www.example.com/lp": res({ status: 200, body: "<html>final</html>" }),
    });
    const r = await fetchPageSafely("https://example.com/", { guard: allowAll, transport });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.finalUrl).toBe("https://www.example.com/lp");
      expect(r.chain.map((c) => c.status)).toEqual([301, 200]);
      expect(r.html).toContain("final");
    }
  });

  it("相对 Location 按当前 URL 解析", async () => {
    const { transport } = transportOf({
      "https://example.com/a": res({ status: 302, headers: { location: "/b" } }),
      "https://example.com/b": res({ status: 200, body: "<html>b</html>" }),
    });
    const r = await fetchPageSafely("https://example.com/a", { guard: allowAll, transport });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.finalUrl).toBe("https://example.com/b");
  });
});

describe("fetchPageSafely · 重定向是主要攻击面", () => {
  it("每一跳都重新过闸门（不是只校验首个 URL）", async () => {
    const guarded: string[] = [];
    const guard = async (raw: string): Promise<GuardResult> => {
      guarded.push(raw);
      return { ok: true, url: new URL(raw), addresses: ["93.184.216.34"] };
    };
    const { transport } = transportOf({
      "https://example.com/": res({ status: 301, headers: { location: "https://hop2.example/" } }),
      "https://hop2.example/": res({ status: 200 }),
    });
    await fetchPageSafely("https://example.com/", { guard, transport });
    expect(guarded).toEqual(["https://example.com/", "https://hop2.example/"]);
  });

  it("次跳指向内网时中止", async () => {
    const guard = async (raw: string): Promise<GuardResult> =>
      raw.includes("internal")
        ? { ok: false, reason: "private_address", detail: "10.0.0.1" }
        : { ok: true, url: new URL(raw), addresses: ["93.184.216.34"] };
    const { transport } = transportOf({
      "https://example.com/": res({ status: 302, headers: { location: "https://internal.example/" } }),
    });
    const r = await fetchPageSafely("https://example.com/", { guard, transport });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("private_address");
  });

  it("重定向到非 https 时中止", async () => {
    const { transport } = transportOf({
      "https://example.com/": res({ status: 302, headers: { location: "http://example.com/plain" } }),
    });
    const r = await fetchPageSafely("https://example.com/", { guard: allowAll, transport });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("scheme_not_https");
  });

  it("超过跳数上限即中止", async () => {
    const map: Record<string, RawResponse> = {};
    for (let i = 0; i < 10; i++) {
      map[`https://h${i}.example/`] = res({ status: 302, headers: { location: `https://h${i + 1}.example/` } });
    }
    const { transport } = transportOf(map);
    const r = await fetchPageSafely("https://h0.example/", { guard: allowAll, transport, maxRedirects: 5 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("too_many_redirects");
  });

  it("重定向成环时不会无限循环", async () => {
    const { transport } = transportOf({
      "https://a.example/": res({ status: 302, headers: { location: "https://b.example/" } }),
      "https://b.example/": res({ status: 302, headers: { location: "https://a.example/" } }),
    });
    const r = await fetchPageSafely("https://a.example/", { guard: allowAll, transport, maxRedirects: 5 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("too_many_redirects");
  });

  it("3xx 但缺 Location 时报错而不是当作成功", async () => {
    const { transport } = transportOf({
      "https://example.com/": res({ status: 302, headers: {} }),
    });
    const r = await fetchPageSafely("https://example.com/", { guard: allowAll, transport });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("bad_redirect");
  });
});

describe("fetchPageSafely · 资源上限与内容类型", () => {
  it("响应体超限即拒绝", async () => {
    const { transport } = transportOf({
      "https://example.com/": res({ status: 200, body: "x".repeat(5000), bytes: 5000 }),
    });
    const r = await fetchPageSafely("https://example.com/", { guard: allowAll, transport, maxBytes: 1000 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("response_too_large");
  });

  it.each([
    "application/pdf",
    "image/png",
    "application/octet-stream",
  ])("拒绝非 HTML 内容类型：%s", async (ct) => {
    const { transport } = transportOf({
      "https://example.com/": res({ status: 200, headers: { "content-type": ct } }),
    });
    const r = await fetchPageSafely("https://example.com/", { guard: allowAll, transport });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("unsupported_content_type");
  });

  it("缺 content-type 时按 HTML 宽容处理", async () => {
    const { transport } = transportOf({
      "https://example.com/": res({ status: 200, headers: {} }),
    });
    const r = await fetchPageSafely("https://example.com/", { guard: allowAll, transport });
    expect(r.ok).toBe(true);
  });
});

describe("fetchPageSafely · 失败透传", () => {
  it("首个 URL 就被闸门拒绝时透传原因，且不发起请求", async () => {
    let called = false;
    const guard = async (): Promise<GuardResult> => ({ ok: false, reason: "ip_literal_host" });
    const r = await fetchPageSafely("https://127.0.0.1/", {
      guard,
      transport: async () => { called = true; return res({ status: 200 }); },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("ip_literal_host");
    expect(called).toBe(false);
  });

  it("传输层抛错归为 fetch_failed", async () => {
    const r = await fetchPageSafely("https://example.com/", {
      guard: allowAll,
      transport: async () => { throw new Error("ECONNRESET"); },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("fetch_failed");
  });

  it("4xx/5xx 仍返回链路信息供报告展示", async () => {
    const { transport } = transportOf({
      "https://example.com/": res({ status: 404, body: "<html>nope</html>" }),
    });
    const r = await fetchPageSafely("https://example.com/", { guard: allowAll, transport });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.status).toBe(404);
      expect(r.chain[0].status).toBe(404);
    }
  });
});
