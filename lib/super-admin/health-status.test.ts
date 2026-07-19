import { describe, it, expect } from "vitest";
import { healthStatusView } from "@/lib/super-admin/health-status";

describe("healthStatusView（健康结果 → 展示态）", () => {
  it("status=ok → 健康/success", () => {
    expect(healthStatusView({ status: "ok" })).toEqual({ label: "健康", tone: "success" });
  });
  it("status=degraded → 异常/error", () => {
    expect(healthStatusView({ status: "degraded" })).toEqual({ label: "异常", tone: "error" });
  });
  it("网络错误（null）→ 未知/default", () => {
    expect(healthStatusView(null)).toEqual({ label: "未知", tone: "default" });
  });
  it("无法识别的 status → 未知/default", () => {
    expect(healthStatusView({ status: "weird" })).toEqual({ label: "未知", tone: "default" });
  });
});
