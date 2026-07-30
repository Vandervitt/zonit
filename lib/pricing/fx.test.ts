import { describe, it, expect, vi, afterEach } from "vitest";
import { USD_TO_CNY_FALLBACK, isSaneRate, extractCnyRate, approxCnyAmount } from "./fx";
import { getUsdToCnyRate, getCnyRateForLocale } from "./fx-server";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isSaneRate", () => {
  it("接受合理区间内的有限数", () => {
    expect(isSaneRate(7.1)).toBe(true);
    expect(isSaneRate(5)).toBe(true);
    expect(isSaneRate(10)).toBe(true);
  });

  it("拒绝区间外的值、非数字与非有限数", () => {
    expect(isSaneRate(0)).toBe(false);
    expect(isSaneRate(4.99)).toBe(false);
    expect(isSaneRate(10.01)).toBe(false);
    expect(isSaneRate(NaN)).toBe(false);
    expect(isSaneRate(Infinity)).toBe(false);
    expect(isSaneRate("7.1")).toBe(false);
    expect(isSaneRate(null)).toBe(false);
  });
});

describe("extractCnyRate", () => {
  it("从正常响应里取出 CNY 汇率", () => {
    expect(extractCnyRate({ rates: { CNY: 7.23, EUR: 0.9 } })).toBe(7.23);
  });

  it("结构不符或数值离谱一律返回 null", () => {
    expect(extractCnyRate({ rates: { EUR: 0.9 } })).toBeNull();
    expect(extractCnyRate({ rates: { CNY: 0 } })).toBeNull();
    expect(extractCnyRate({ rates: { CNY: 71000 } })).toBeNull();
    expect(extractCnyRate({})).toBeNull();
    expect(extractCnyRate(null)).toBeNull();
    expect(extractCnyRate("boom")).toBeNull();
  });
});

describe("approxCnyAmount", () => {
  it("按汇率换算并保留两位小数", () => {
    expect(approxCnyAmount(19.99, 7.1)).toBe("141.93");
    expect(approxCnyAmount(5.99, 7.1)).toBe("42.53");
  });

  it("免费档与非法汇率不产出换算", () => {
    expect(approxCnyAmount(0, 7.1)).toBeNull();
    expect(approxCnyAmount(19.99, 0)).toBeNull();
    expect(approxCnyAmount(19.99, NaN)).toBeNull();
  });
});

describe("getUsdToCnyRate", () => {
  it("接口正常时用接口汇率", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ rates: { CNY: 7.23 } }) }),
    );
    await expect(getUsdToCnyRate()).resolves.toBe(7.23);
  });

  it("非 2xx、脏数据、抛错三种情况都回落到常量", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    await expect(getUsdToCnyRate()).resolves.toBe(USD_TO_CNY_FALLBACK);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ rates: { CNY: "7.1" } }) }),
    );
    await expect(getUsdToCnyRate()).resolves.toBe(USD_TO_CNY_FALLBACK);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    await expect(getUsdToCnyRate()).resolves.toBe(USD_TO_CNY_FALLBACK);
  });
});

describe("getCnyRateForLocale", () => {
  it("英文面不取汇率（返回 null，页面得以保持纯静态）", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    await expect(getCnyRateForLocale("en")).resolves.toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("中文面取汇率", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ rates: { CNY: 7.23 } }) }),
    );
    await expect(getCnyRateForLocale("zh")).resolves.toBe(7.23);
  });
});
