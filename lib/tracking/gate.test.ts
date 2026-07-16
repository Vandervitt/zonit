import { describe, it, expect } from "vitest";
import { gateTrackingByPlan } from "./gate";
import type { PageTracking } from "@/types/schema.draft";

const base: PageTracking = {
  pixels: [
    { provider: "meta", id: "M1", enabled: true, serverSide: true },
    { provider: "tiktok", id: "T1", enabled: true, serverSide: true },
    { provider: "ga4", id: "G1", enabled: true },
    { provider: "googleAds", id: "A1", enabled: true },
  ],
  utmPassthrough: false,
  consent: { enabled: true },
};

describe("gateTrackingByPlan", () => {
  it("free：剥离全部像素（免费版无任何追踪）", () => {
    const r = gateTrackingByPlan(base, "free")!;
    expect(r.pixels).toEqual([]);
  });

  it("starter：只留 Meta 客户端 pixel（CAPI 关闭）", () => {
    const r = gateTrackingByPlan(base, "starter")!;
    expect(r.pixels.map((p) => p.provider)).toEqual(["meta"]);
    expect(r.pixels[0].serverSide).toBe(false);
  });

  it("pro：原样保留全部 provider 与 serverSide", () => {
    const r = gateTrackingByPlan(base, "pro")!;
    expect(r.pixels.map((p) => p.provider)).toEqual(["meta", "tiktok", "ga4", "googleAds"]);
    expect(r.pixels.find((p) => p.provider === "tiktok")?.serverSide).toBe(true);
  });

  it("agency：原样保留", () => {
    const r = gateTrackingByPlan(base, "agency")!;
    expect(r.pixels).toHaveLength(4);
  });

  it("undefined 追踪配置原样返回", () => {
    expect(gateTrackingByPlan(undefined, "free")).toBeUndefined();
  });

  it("不改动原对象（返回新引用）", () => {
    const r = gateTrackingByPlan(base, "free")!;
    expect(r).not.toBe(base);
    expect(base.pixels).toHaveLength(4);
  });
});
