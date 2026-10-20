// 注册首触来源的契约：只在平台主站营销页采集；服务端只认白名单字段且截断长度。
import { describe, it, expect } from "vitest";
import { buildFirstTouch, sanitizeSignupSource } from "./signup-source";

const SITE = "https://urgizat.com";
const NOW = new Date("2026-10-20T08:00:00.000Z");

describe("buildFirstTouch", () => {
  it("营销页：记录落地路径（不含查询串）、外站来源与 utm", () => {
    const ft = buildFirstTouch({
      href: "https://urgizat.com/zh/templates/b2b-sourcing?utm_source=xhs&utm_campaign=rfq&foo=1",
      referrer: "https://www.xiaohongshu.com/explore/abc?x=1",
      siteOrigin: SITE,
      now: NOW,
    });
    expect(ft).toEqual({
      landing: "/zh/templates/b2b-sourcing",
      referrer: "www.xiaohongshu.com/explore/abc",
      utm: { utm_source: "xhs", utm_campaign: "rfq" },
      at: "2026-10-20T08:00:00.000Z",
    });
  });

  it("站内跳转的 referrer 不算来源", () => {
    const ft = buildFirstTouch({ href: `${SITE}/pricing`, referrer: `${SITE}/`, siteOrigin: SITE, now: NOW });
    expect(ft?.referrer).toBeNull();
  });

  it("无 referrer、无 utm 时为直接访问", () => {
    expect(buildFirstTouch({ href: `${SITE}/`, referrer: "", siteOrigin: SITE, now: NOW })).toEqual({
      landing: "/",
      referrer: null,
      utm: {},
      at: NOW.toISOString(),
    });
  });

  it.each([
    ["客户自定义域名", "https://acme-dental.com/"],
    ["平台子域", "https://glow.zapbridge.site/"],
  ])("非平台主站（%s）不采集", (_l, href) => {
    expect(buildFirstTouch({ href, referrer: "", siteOrigin: SITE, now: NOW })).toBeNull();
  });

  it.each(["/admin", "/admin/leads", "/super-admin", "/preview/tok", "/p/my-page"])(
    "后台、预览与托管落地页 %s 不采集",
    (path) => {
      expect(buildFirstTouch({ href: `${SITE}${path}`, referrer: "", siteOrigin: SITE, now: NOW })).toBeNull();
    },
  );

  it("超长值被截断", () => {
    const ft = buildFirstTouch({
      href: `${SITE}/${"a".repeat(500)}?utm_source=${"s".repeat(500)}`,
      referrer: `https://ref.com/${"r".repeat(500)}`,
      siteOrigin: SITE,
      now: NOW,
    });
    expect(ft!.landing.length).toBe(200);
    expect(ft!.referrer!.length).toBe(200);
    expect(ft!.utm.utm_source!.length).toBe(100);
  });
});

describe("sanitizeSignupSource", () => {
  const valid = {
    landing: "/zh/templates/b2b-sourcing",
    referrer: "www.google.com/",
    utm: { utm_source: "google" },
    at: "2026-10-20T08:00:00.000Z",
  };

  it("合法输入原样通过", () => {
    expect(sanitizeSignupSource(valid)).toEqual(valid);
  });

  it("丢弃白名单外字段与非 utm 键", () => {
    expect(
      sanitizeSignupSource({ ...valid, email: "x@y.com", utm: { utm_source: "g", evil: "1" } }),
    ).toEqual({ ...valid, utm: { utm_source: "g" } });
  });

  it("超长字符串被截断而不是拒绝", () => {
    const out = sanitizeSignupSource({ ...valid, landing: `/${"a".repeat(500)}`, utm: { utm_term: "t".repeat(500) } });
    expect(out!.landing.length).toBe(200);
    expect(out!.utm.utm_term!.length).toBe(100);
  });

  it.each([
    ["非对象", "nope"],
    ["null", null],
    ["landing 非站内路径", { ...valid, landing: "https://evil.com" }],
    ["landing 缺失", { ...valid, landing: undefined }],
    ["at 不是时间", { ...valid, at: "yesterday" }],
    ["utm 值非字符串", { ...valid, utm: { utm_source: 1 } }],
    ["referrer 类型错误", { ...valid, referrer: 42 }],
  ])("拒绝%s", (_l, input) => {
    expect(sanitizeSignupSource(input)).toBeNull();
  });
});
