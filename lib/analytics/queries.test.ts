import { describe, it, expect } from "vitest";
import { buildSeries, summarize, buildFunnel, buildFormFunnel } from "./queries";

describe("analytics 整形", () => {
  it("summarize 计算 ctr 与线索转化率（无 views 时为 0）", () => {
    expect(summarize(100, 5, 2)).toEqual({ views: 100, clicks: 5, leads: 2, ctr: 0.05, cvr: 0.02 });
    expect(summarize(0, 0, 0)).toEqual({ views: 0, clicks: 0, leads: 0, ctr: 0, cvr: 0 });
  });
  it("buildFunnel 三步转化：曝光→CTA 点击→线索，rate 相对上一步、pct 相对曝光", () => {
    expect(buildFunnel(100, 20, 5)).toEqual([
      { key: "views", label: "曝光", count: 100, rate: 1, pct: 1 },
      { key: "clicks", label: "CTA 点击", count: 20, rate: 0.2, pct: 0.2 },
      { key: "leads", label: "线索", count: 5, rate: 0.25, pct: 0.05 },
    ]);
  });
  it("buildFunnel 上一步为 0 时 rate 记 0（避免除零）", () => {
    const f = buildFunnel(0, 0, 0);
    expect(f.map((s) => s.rate)).toEqual([1, 0, 0]);
    expect(f.map((s) => s.pct)).toEqual([1, 0, 0]);
  });
  it("buildSeries 按天补零并保序", () => {
    const rows = [{ date: "2026-06-20", views: 10, clicks: 2 }];
    const s = buildSeries(rows, ["2026-06-19", "2026-06-20"]);
    expect(s).toEqual([
      { date: "2026-06-19", views: 0, clicks: 0 },
      { date: "2026-06-20", views: 10, clicks: 2 },
    ]);
  });
});

describe("buildFormFunnel", () => {
  it("完成率 = 提交成功 / 开始填写——改表单控件前后就看它", () => {
    const f = buildFormFunnel(200, 150, []);
    expect(f.completion).toBe(0.75);
    expect(f.errors).toBe(0);
  });

  it("无人开始填写时完成率为 0 而不是 NaN", () => {
    expect(buildFormFunnel(0, 0, []).completion).toBe(0);
  });

  it("错误按码汇总，errors 为总次数（占比高的码说明某个字段卡住了访客）", () => {
    const f = buildFormFunnel(100, 60, [
      { detail: "bad_whatsapp", count: 25 },
      { detail: "need_contact", count: 5 },
    ]);
    expect(f.errors).toBe(30);
    expect(f.errorBreakdown[0]).toEqual({ detail: "bad_whatsapp", count: 25 });
  });
});
