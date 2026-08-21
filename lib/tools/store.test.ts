import { describe, it, expect, vi, beforeEach } from "vitest";

// 隔离真实数据库：这里验证的是 SQL 语义与容错行为，不是查询结果本身。
const { query, connect } = vi.hoisted(() => ({ query: vi.fn(), connect: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: { query, connect } }));

import {
  SOFT_EXPIRE_DAYS,
  HARD_DELETE_GRACE_DAYS,
  getReport,
  getReportForView,
  getBatchForView,
  recordReportView,
  recordBatchView,
  pruneExpiredReports,
  pruneExpiredBatches,
} from "./store";

beforeEach(() => {
  query.mockReset();
  connect.mockReset();
});

/** 构造一行 page_check_reports 查询结果。 */
function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "rep1",
    input_url: "https://example.com/lp",
    final_url: "https://example.com/lp",
    host: "example.com",
    locale: "en",
    status: 200,
    bytes: 1024,
    hops: 0,
    findings: [],
    browser_verified: false,
    created_at: new Date("2026-08-20T10:00:00Z"),
    expires_at: new Date("2026-09-19T10:00:00Z"),
    ...overrides,
  };
}

const future = new Date(Date.now() + 86_400_000);
const past = new Date(Date.now() - 86_400_000);

describe("过期语义：软过期不等于消失", () => {
  it("未过期的报告返回 live", async () => {
    query.mockResolvedValueOnce({ rows: [row({ expires_at: future })] });
    const res = await getReportForView("rep1");
    expect(res?.state).toBe("live");
    if (res?.state === "live") expect(res.report.inputUrl).toBe("https://example.com/lp");
  });

  it("已过期的报告返回 expired 且仍带出原始 URL", async () => {
    // 这是本次改动的核心：过期链接必须还能告诉访客「当初查的是哪个页面」，
    // 否则外发出去的链接过期后就是一个死胡同。
    query.mockResolvedValueOnce({ rows: [row({ expires_at: past })] });
    const res = await getReportForView("rep1");
    expect(res?.state).toBe("expired");
    if (res?.state === "expired") {
      expect(res.inputUrl).toBe("https://example.com/lp");
      expect(res.id).toBe("rep1");
    }
  });

  it("行已被硬删除时才返回 null", async () => {
    query.mockResolvedValueOnce({ rows: [] });
    expect(await getReportForView("gone")).toBeNull();
  });

  it("getReportForView 查询不得带 expires_at 过滤（否则永远读不到过期行）", async () => {
    query.mockResolvedValueOnce({ rows: [row()] });
    await getReportForView("rep1");
    const [sql] = query.mock.calls[0];
    expect(sql).not.toContain("expires_at > now()");
    expect(sql).toContain("expires_at");
  });

  it("getReport 仍然只返回未过期报告（软过期不得泄漏进正常读取路径）", async () => {
    // 复用报告缓存、浏览器实测等路径都走 getReport，它们拿到过期内容是错的。
    query.mockResolvedValueOnce({ rows: [] });
    await getReport("rep1");
    const [sql] = query.mock.calls[0];
    expect(sql).toContain("expires_at > now()");
  });

  it("多页对比过期后仍带出全部原始 URL", async () => {
    query.mockResolvedValueOnce({
      rows: [
        row({ id: "a", input_url: "https://a.com", expires_at: past }),
        row({ id: "b", input_url: "https://b.com", expires_at: past }),
      ],
    });
    const res = await getBatchForView("batch1");
    expect(res?.state).toBe("expired");
    if (res?.state === "expired") {
      expect(res.inputUrls).toEqual(["https://a.com", "https://b.com"]);
    }
  });

  it("批次内只要有一条过期就整体按过期处理", async () => {
    // 对比报告的价值在于「同一时点的横向对比」，混着新旧数据展示是误导。
    query.mockResolvedValueOnce({
      rows: [
        row({ id: "a", expires_at: future }),
        row({ id: "b", expires_at: past }),
      ],
    });
    const res = await getBatchForView("batch1");
    expect(res?.state).toBe("expired");
  });
});

describe("清理：硬删除必须晚于软过期", () => {
  it("报告清理按 expires_at + 宽限期，而不是 expires_at", async () => {
    // 回归守卫：改回 `expires_at <= now()` 会让过期链接重新变成 404。
    query.mockResolvedValueOnce({ rowCount: 3 });
    await pruneExpiredReports();
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain("make_interval");
    expect(sql).not.toMatch(/expires_at\s*<=\s*now\(\)\s*$/);
    expect(params).toEqual([HARD_DELETE_GRACE_DAYS]);
  });

  it("批次清理同样带宽限期", async () => {
    query.mockResolvedValueOnce({ rowCount: 1 });
    await pruneExpiredBatches();
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain("make_interval");
    expect(params).toEqual([HARD_DELETE_GRACE_DAYS]);
  });

  it("宽限期严格大于 0，否则等于没有软过期窗口", () => {
    expect(HARD_DELETE_GRACE_DAYS).toBeGreaterThan(0);
    expect(SOFT_EXPIRE_DAYS).toBeGreaterThan(0);
  });
});

describe("浏览记录", () => {
  it("以 INSERT…SELECT 写入，创建者判定在 SQL 内完成", async () => {
    // 走 SELECT 而非 VALUES 有两个作用：报告不存在时自然不写（不触发外键错误），
    // 且创建者 ip_hash 永远不出应用层。
    query.mockResolvedValueOnce({ rowCount: 1 });
    await recordReportView("rep1", { ip: "1.2.3.4", userAgent: "Mozilla/5.0 (Macintosh) Chrome/127" });
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain("INSERT INTO page_check_report_views");
    expect(sql).toContain("SELECT");
    expect(sql).toContain("page_check_reports");
    expect(sql).toContain("is_creator");
    expect(params[0]).toBe("rep1");
  });

  it("真实浏览器 UA 记为非机器人", async () => {
    query.mockResolvedValueOnce({ rowCount: 1 });
    await recordReportView("rep1", {
      ip: "1.2.3.4",
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile Safari/604.1",
    });
    const params = query.mock.calls[0][1];
    expect(params).toContain(false);
  });

  it("邮件网关抓取记为机器人但仍然入库", async () => {
    // 关键取舍：标记而不是丢弃。写入时判断错了就再也补不回来。
    query.mockResolvedValueOnce({ rowCount: 1 });
    await recordReportView("rep1", { ip: "1.2.3.4", userAgent: "Mimecast Link Scanner" });
    expect(query).toHaveBeenCalledTimes(1);
    const params = query.mock.calls[0][1];
    expect(params).toContain(true);
  });

  it("写入失败不抛错（它跑在报告页渲染路径上）", async () => {
    // 记录访问失败绝不能让访客看到报错页——外发链接打不开的代价远大于丢一条记录。
    query.mockRejectedValueOnce(new Error("connection refused"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(recordReportView("rep1", { ip: "1.2.3.4", userAgent: "curl/8" })).resolves.toBeUndefined();
    spy.mockRestore();
  });

  it("批次浏览写 batch_id 而非 report_id", async () => {
    query.mockResolvedValueOnce({ rowCount: 1 });
    await recordBatchView("batch1", { ip: "1.2.3.4", userAgent: "curl/8" });
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain("batch_id");
    expect(sql).toContain("page_check_batches");
    expect(params[0]).toBe("batch1");
  });
});
