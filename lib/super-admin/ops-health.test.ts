import { describe, it, expect } from "vitest";
import { failedCronTasks, cronHealth, aiJobHealth } from "./ops-health";

const NOW = new Date("2026-10-09T03:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3600_000).toISOString();

describe("failedCronTasks", () => {
  it("取出所有 xxxError: true 的子任务名，忽略正常字段", () => {
    expect(failedCronTasks({ capiFlushed: 0, leadSpoolError: true, digestError: true, trialEmails: {} }))
      .toEqual(["leadSpool", "digest"]);
    expect(failedCronTasks({ capiFlushed: 3 })).toEqual([]);
  });
});

describe("cronHealth", () => {
  it("从未运行 → never", () => {
    expect(cronHealth(null, NOW).status).toBe("never");
  });
  it("超过 26 小时未运行 → stale（每日任务漏跑一次就该亮红）", () => {
    expect(cronHealth({ ranAt: hoursAgo(27), failedTasks: [] }, NOW).status).toBe("stale");
  });
  it("最近一次有子任务失败 → partial；全部成功 → ok", () => {
    expect(cronHealth({ ranAt: hoursAgo(2), failedTasks: ["digest"] }, NOW).status).toBe("partial");
    expect(cronHealth({ ranAt: hoursAgo(2), failedTasks: [] }, NOW).status).toBe("ok");
  });
});

describe("aiJobHealth", () => {
  it("失败率向下截断；超过 10 分钟仍 pending 视为卡死并计入失败", () => {
    const h = aiJobHealth(
      [
        { status: "succeeded", createdAt: hoursAgo(5) },
        { status: "failed", createdAt: hoursAgo(4) },
        { status: "pending", createdAt: hoursAgo(1) }, // 卡死
        { status: "pending", createdAt: new Date(NOW.getTime() - 60_000).toISOString() }, // 正在跑
      ],
      NOW,
    );
    expect(h.total).toBe(3); // 正在跑的不进分母
    expect(h.failed).toBe(1);
    expect(h.stuck).toBe(1);
    expect(h.failureRate).toBe(66.6);
  });
  it("无样本时失败率为 null", () => {
    expect(aiJobHealth([], NOW).failureRate).toBeNull();
  });
});
