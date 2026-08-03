// lib/tools/copy-coverage.test.ts
//
// finding 的 id 同时是 i18n 键。漏一条 = 报告页上出现一个空白条目，
// 而且只在用户真的碰到那个 finding 时才会暴露——测试是唯一能提前发现的地方。
import { describe, it, expect } from "vitest";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { locales } from "@/lib/i18n/config";
import { assembleReport, buildRobotsBlockedReport, buildFetchFailedReport } from "./report";
import type { FetchResult } from "./fetch-page";

/** report.ts 能产出的全部 finding id——新增 finding 必须同步登记在此。 */
const ALL_FINDING_IDS = [
  "privacy_missing", "privacy_broken", "privacy_ok",
  "terms_missing", "terms_broken", "terms_ok",
  "redirect_chain", "final_status_error",
  "contact_missing", "contact_ok",
  "pixel_before_consent_suspected", "pixel_with_cmp", "pixel_not_found_in_html",
  "pixel_before_consent_verified", "pixel_no_fire_before_consent_verified",
  "page_heavy", "blocking_scripts", "copyright_stale",
  "robots_disallows_check", "fetch_failed",
];

/** fetch-page / url-guard 能产出的全部失败原因。 */
const ALL_FAIL_REASONS = [
  "invalid_url", "scheme_not_https", "credentials_in_url", "port_not_allowed",
  "ip_literal_host", "private_address", "dns_failed",
  "too_many_redirects", "bad_redirect", "response_too_large",
  "unsupported_content_type", "fetch_failed", "exception",
];

describe("自检器文案覆盖", () => {
  it.each(locales)("%s 每个 finding id 都有文案", (locale) => {
    const f = getDictionary(locale).tools.findings as Record<string, { title: string }>;
    for (const id of ALL_FINDING_IDS) {
      expect(f[id], `缺 finding 文案：${id}`).toBeTruthy();
      expect(f[id].title.trim(), `${id} 标题为空`).not.toBe("");
    }
  });

  it.each(locales)("%s 每个失败原因都有文案", (locale) => {
    const f = getDictionary(locale).tools.fetchFailed as Record<string, string>;
    for (const reason of ALL_FAIL_REASONS) {
      expect(f[reason], `缺失败原因文案：${reason}`).toBeTruthy();
    }
  });

  it.each(locales)("%s 字典里没有多余的 finding 键（防止改名后遗留死文案）", (locale) => {
    const keys = Object.keys(getDictionary(locale).tools.findings);
    expect(keys.sort()).toEqual([...ALL_FINDING_IDS].sort());
  });

  // 红线的执行方式：**正向断言免责声明在场**，而不是禁词。
  //
  // 这里踩过两次坑：先禁「会过审 / will pass」，被 disclaimer 里
  // 「无法告诉你广告会不会过审 / can't tell you whether an ad will be approved」误杀；
  // 改成禁「打分 / we score」，又被「我们不给页面打分 / we don't score」误杀。
  // 禁词表分不清断言与否定，而这份文案的正确写法**恰恰大量使用否定式**——
  // 工具选错了，不是词选错了。可执行的判据只有下面这条正向断言。
  it.each(locales)("%s 报告页必须明确声明「这不是判定」", (locale) => {
    const d = getDictionary(locale).tools.report.disclaimer;
    const mustSay = locale === "zh" ? ["不是判定", "不给页面打分"] : ["not a verdict", "don't score"];
    for (const phrase of mustSay) {
      expect(d.includes(phrase), `免责声明缺少「${phrase}」`).toBe(true);
    }
  });

  it("实际产出的 finding id 都在登记表内", () => {
    const html = `<a href="/privacy">Privacy</a><script>fbq('init')</script><p>© 2019 X</p>`;
    const fetched = {
      ok: true as const, finalUrl: "https://e.com/", status: 404, html,
      bytes: 2_000_000, headers: {},
      chain: [{ url: "https://e.com/a", status: 301 }, { url: "https://e.com/", status: 404 }],
    } satisfies Extract<FetchResult, { ok: true }>;
    const produced = [
      ...assembleReport({ fetched, linkStatus: { privacy: 404 }, now: new Date("2026-01-01") }).findings,
      ...buildRobotsBlockedReport("https://e.com/").findings,
      ...buildFetchFailedReport("https://e.com/", "dns_failed", []).findings,
    ].map((f) => f.id);
    for (const id of produced) expect(ALL_FINDING_IDS).toContain(id);
  });
});
