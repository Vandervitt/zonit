// lib/tools/report.test.ts
//
// 报告层的契约：不给评分、不给总评；「静态看不到」必须表述为 unknown 而不是
// 「没有」；所有 finding 只带可核实事实，不带判断文案。
import { describe, it, expect } from "vitest";
import {
  assembleReport,
  buildRobotsBlockedReport,
  buildFetchFailedReport,
  applyAiFindings,
} from "./report";
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

  // 回归：表单是本产品与市场共同推荐的主转化方式，而 detectContact 只认
  // mailto/tel。以表单为唯一转化的页面曾被判成 contact_missing（attention）——
  // 即自检器诬告我们自己生成的页面。这是「只认某种写法」的第二次复发
  // （第一次是政策链接只认 <a>）。
  it("只有留资表单、没有 mailto/tel 时不判 contact_missing", () => {
    const html = `<form action="/api/leads" method="post">
      <input type="email" name="email" required />
      <button type="submit">Get my free quote</button>
    </form>`;
    const r = assembleReport({ fetched: fetched(html) });
    expect(ids(r)).not.toContain("contact_missing");
    expect(ids(r)).toContain("contact_ok");
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
    // id 必须稳定（它同时是 i18n 键），原因走 data
    expect(ids(r)).toEqual(["fetch_failed"]);
    expect(r.findings[0].data?.reason).toBe("private_address");
  });

  it("所有入口都标 browserVerified=false（实测只在登录侧发生）", () => {
    expect(assembleReport({ fetched: fetched("<p/>") }).browserVerified).toBe(false);
    expect(buildRobotsBlockedReport("https://x/").browserVerified).toBe(false);
    expect(buildFetchFailedReport("https://x/", "r", []).browserVerified).toBe(false);
  });
});

describe("applyAiFindings · AI 只能补充，不能推翻静态事实", () => {
  const AI = { heroClear: "no", ctaClear: "yes", trustSignals: "yes" } as const;

  it("追加 AI 结论并标记 aiAssisted", () => {
    const r = applyAiFindings(assembleReport({ fetched: fetched("<html></html>") }), AI);
    expect(ids(r)).toContain("ai_hero_unclear");
    expect(ids(r)).toContain("ai_cta_clear");
    expect(r.aiAssisted).toBe(true);
  });

  // 这条是与 applyBrowserVerification 的关键差别：实测可以推翻静态像素结论，
  // AI 阅读不行——正则得出的是非题（有没有隐私页、有没有表单）比模型可靠。
  it("不移除、不改写任何静态 finding", () => {
    const base = assembleReport({ fetched: fetched("<html></html>") });
    const after = applyAiFindings(base, AI);
    const kept = ids(after);
    for (const f of base.findings) {
      // trust 那条是唯一允许被接管的，单独在下一个用例里断言。
      if (f.id === "trust_signals_not_found") continue;
      expect(kept).toContain(f.id);
    }
  });

  // 唯一的例外：静态那条本来就是 unknown（正则只认英文关键词）。模型真读了正文
  // 之后这个 unknown 有了答案，再并列显示「没找到」只会让人困惑。
  it("模型给出信任元素答案时，接管静态那条 unknown", () => {
    const base = assembleReport({ fetched: fetched("<html></html>") });
    expect(ids(base)).toContain("trust_signals_not_found");
    const after = applyAiFindings(base, AI);
    expect(ids(after)).not.toContain("trust_signals_not_found");
    expect(ids(after)).toContain("ai_trust_present");
  });

  it("模型对信任元素也说不准时，保留静态的 unknown", () => {
    const after = applyAiFindings(assembleReport({ fetched: fetched("<html></html>") }), {
      ...AI,
      trustSignals: "unknown",
    });
    expect(ids(after)).toContain("trust_signals_not_found");
    expect(ids(after)).not.toContain("ai_trust_present");
    expect(ids(after)).not.toContain("ai_trust_absent");
  });

  it("仍然不产出评分或判定字段", () => {
    const r = applyAiFindings(assembleReport({ fetched: fetched("<html></html>") }), AI);
    expect(r).not.toHaveProperty("score");
    expect(r).not.toHaveProperty("passed");
  });
});
