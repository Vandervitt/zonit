// lib/tools/report.test.ts
//
// 报告层的契约：不给评分、不给总评；「静态看不到」必须表述为 unknown 而不是
// 「没有」；所有 finding 只带可核实事实，不带判断文案。
import { describe, it, expect } from "vitest";
import { assembleReport, buildRobotsBlockedReport, buildFetchFailedReport } from "./report";
import type { FetchResult } from "./fetch-page";

type Ok = Extract<FetchResult, { ok: true }>;
const fetched = (html: string, over: Partial<Ok> = {}): Ok => ({
  ok: true,
  finalUrl: "https://example.com/lp",
  status: 200,
  html,
  bytes: html.length,
  headers: {},
  chain: [{ url: "https://example.com/lp", status: 200 }],
  ...over,
});

const ids = (r: { findings: { id: string }[] }) => r.findings.map((f) => f.id);

describe("assembleReport · 红线", () => {
  it("报告对象上不存在评分 / 通过与否字段", () => {
    const r = assembleReport({ fetched: fetched("<html></html>") });
    expect(r).not.toHaveProperty("score");
    expect(r).not.toHaveProperty("passed");
    expect(r).not.toHaveProperty("grade");
  });

  it("finding 只带 id / level / data，不含面向用户的句子", () => {
    const r = assembleReport({ fetched: fetched("<html></html>") });
    for (const f of r.findings) {
      expect(Object.keys(f).sort()).toEqual(
        f.data ? ["data", "id", "level"] : ["id", "level"],
      );
    }
  });
});

describe("assembleReport · 政策链接", () => {
  it("缺失时标 attention", () => {
    const r = assembleReport({ fetched: fetched("<html><a href='/about'>About</a></html>") });
    expect(ids(r)).toContain("privacy_missing");
    expect(ids(r)).toContain("terms_missing");
  });

  it("存在且可达时标 info", () => {
    const html = "<a href='/privacy'>Privacy</a><a href='/terms'>Terms</a>";
    const r = assembleReport({ fetched: fetched(html), linkStatus: { privacy: 200, terms: 200 } });
    expect(ids(r)).toContain("privacy_ok");
    expect(ids(r)).toContain("terms_ok");
  });

  it("链接 404 时标 attention 并带状态码", () => {
    const html = "<a href='/privacy'>Privacy</a>";
    const r = assembleReport({ fetched: fetched(html), linkStatus: { privacy: 404 } });
    const f = r.findings.find((x) => x.id === "privacy_broken");
    expect(f?.level).toBe("attention");
    expect(f?.data?.status).toBe(404);
  });
});

describe("assembleReport · 静态检查的能力边界", () => {
  it("HTML 里没有像素时必须是 unknown，不能说「没装」", () => {
    const r = assembleReport({ fetched: fetched("<html><p>x</p></html>") });
    const f = r.findings.find((x) => x.id === "pixel_not_found_in_html");
    expect(f?.level).toBe("unknown");
  });

  it("有像素且无同意门控 → 疑似同意前触发（attention）", () => {
    const r = assembleReport({ fetched: fetched("<script>fbq('init','1')</script>") });
    const f = r.findings.find((x) => x.id === "pixel_before_consent_suspected");
    expect(f?.level).toBe("attention");
    expect(f?.data?.pixels).toBe("meta");
  });

  it("有像素也有 CMP → 静态判不了，标 unknown 留给实测", () => {
    const html = `<script src="https://consent.cookiebot.com/uc.js"></script><script>fbq('init')</script>`;
    const r = assembleReport({ fetched: fetched(html) });
    const f = r.findings.find((x) => x.id === "pixel_with_cmp");
    expect(f?.level).toBe("unknown");
  });
});

describe("assembleReport · 其余检查", () => {
  it("多跳时记录跳转链", () => {
    const r = assembleReport({
      fetched: fetched("<html></html>", {
        chain: [
          { url: "https://example.com/", status: 301 },
          { url: "https://example.com/lp", status: 200 },
        ],
      }),
    });
    const f = r.findings.find((x) => x.id === "redirect_chain");
    expect(f?.data?.hops).toBe(2);
  });

  it("最终状态 4xx 时标 attention", () => {
    const r = assembleReport({ fetched: fetched("<html></html>", { status: 404 }) });
    expect(ids(r)).toContain("final_status_error");
  });

  it("版权年份过期一年以上才提示", () => {
    const now = new Date("2026-08-02T00:00:00Z");
    const stale = assembleReport({ fetched: fetched("<p>© 2023 X</p>"), now });
    expect(ids(stale)).toContain("copyright_stale");
    const fresh = assembleReport({ fetched: fetched("<p>© 2025 X</p>"), now });
    expect(ids(fresh)).not.toContain("copyright_stale");
  });

  it("attention 排在 info 前面", () => {
    const r = assembleReport({ fetched: fetched("<html><p>x</p></html>") });
    const levels = r.findings.map((f) => f.level);
    const firstInfo = levels.indexOf("info");
    const lastAttention = levels.lastIndexOf("attention");
    if (firstInfo !== -1 && lastAttention !== -1) expect(lastAttention).toBeLessThan(firstInfo);
  });
});

describe("特殊入口", () => {
  it("robots 拦截时把限制本身作为发现项", () => {
    const r = buildRobotsBlockedReport("https://example.com/lp");
    expect(ids(r)).toEqual(["robots_disallows_check"]);
    expect(r.findings[0].level).toBe("attention");
  });

  it("抓取失败时如实报告原因，不假装检查过了", () => {
    const r = buildFetchFailedReport("https://example.com/", "private_address", []);
    expect(ids(r)).toEqual(["fetch_failed_private_address"]);
  });

  it("所有入口都标 browserVerified=false（实测只在登录侧发生）", () => {
    expect(assembleReport({ fetched: fetched("<p/>") }).browserVerified).toBe(false);
    expect(buildRobotsBlockedReport("https://x/").browserVerified).toBe(false);
    expect(buildFetchFailedReport("https://x/", "r", []).browserVerified).toBe(false);
  });
});
