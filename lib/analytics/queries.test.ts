import { describe, it, expect } from "vitest";
import { buildSeries, summarize, buildFunnel, buildFormFunnel } from "./queries";

describe("analytics 整形", () => {
  it("summarize 计算 ctr 与线索转化率（无 views 时为 0）", () => {
    expect(summarize(100, 5, 2)).toEqual({
      views: 100, clicks: 5, leads: 2, ctr: 0.05, cvr: 0.02, uniqueViews: null,
    });
    expect(summarize(0, 0, 0)).toEqual({
      views: 0, clicks: 0, leads: 0, ctr: 0, cvr: 0, uniqueViews: null,
    });
  });
  it("buildFunnel 三步转化：曝光→CTA 点击→线索，rate 相对上一步、pct 相对曝光", () => {
    expect(buildFunnel(100, 20, 5)).toEqual([
      { key: "views", count: 100, rate: 1, pct: 1 },
      { key: "clicks", count: 20, rate: 0.2, pct: 0.2 },
      { key: "leads", count: 5, rate: 0.25, pct: 0.05 },
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

// 口径断裂的处理规则。迁移 050 之前的行没有 visitor_hash，且补不回来
// （原始 IP/UA 从未落库）——所以「没采集」必须与「真的 0 个访客」区分开。
describe("UV 口径：没采集 ≠ 0", () => {
  it("传入访客数时如实带出", () => {
    expect(summarize(100, 5, 2, 40).uniqueViews).toBe(40);
  });

  it("默认是 null 而不是 0——省略参数意味着「这段没数据」", () => {
    expect(summarize(100, 5, 2).uniqueViews).toBeNull();
  });

  // 0 是一个有意义的值：采集在跑、但这段区间确实没有可去重的访客。
  // 它与 null 必须能区分，否则界面无从选择显示「0」还是「无数据」。
  it("0 与 null 是两回事，不能互相折叠", () => {
    expect(summarize(0, 0, 0, 0).uniqueViews).toBe(0);
    expect(summarize(0, 0, 0, null).uniqueViews).toBeNull();
  });

  it("UV 不参与 ctr / cvr 的计算，分母仍是 PV（不改既有指标语义）", () => {
    const a = summarize(100, 5, 2, 10);
    const b = summarize(100, 5, 2, null);
    expect(a.ctr).toBe(b.ctr);
    expect(a.cvr).toBe(b.cvr);
  });
});
