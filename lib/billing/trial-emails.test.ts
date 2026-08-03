import { describe, it, expect } from "vitest";
import { resolveTrialEmail, type TrialCandidate } from "./trial-emails";

const NOW = new Date("2026-08-03T03:00:00Z");
const DAY = 86_400_000;

/** 相对 now 偏移天数的到期时刻（正数=未来）。 */
const at = (days: number) => new Date(NOW.getTime() + days * DAY);

const base: Omit<TrialCandidate, "expiresAt"> = { overQuota: false, sentStages: [] };
const c = (expiresAt: Date, over = base): TrialCandidate => ({ ...over, expiresAt });

describe("resolveTrialEmail · 窗口", () => {
  it("到期前 3 天内 → t_minus_3", () => {
    expect(resolveTrialEmail(c(at(2.5)), NOW)).toBe("t_minus_3");
  });

  it("恰好 3 天（闭端）仍算 t_minus_3", () => {
    expect(resolveTrialEmail(c(at(3)), NOW)).toBe("t_minus_3");
  });

  it("超过 3 天 → 不发", () => {
    expect(resolveTrialEmail(c(at(3.01)), NOW)).toBeNull();
  });

  it("刚过期不足 1 天 → expiry_day", () => {
    expect(resolveTrialEmail(c(at(-0.5)), NOW)).toBe("expiry_day");
  });

  it("到期时刻本身 → expiry_day（而非 t_minus_3）", () => {
    expect(resolveTrialEmail(c(at(0)), NOW)).toBe("expiry_day");
  });

  it("过期 1~2 天 → win_back", () => {
    expect(resolveTrialEmail(c(at(-1.5)), NOW)).toBe("win_back");
  });

  // 上线安全：库里有一批早就过期的 comp_plan，窄窗口保证第一次 cron 不群发挽回信。
  it("过期超过 2 天 → 不发（历史用户不补发）", () => {
    expect(resolveTrialEmail(c(at(-2.01)), NOW)).toBeNull();
    expect(resolveTrialEmail(c(at(-30)), NOW)).toBeNull();
  });
});

describe("resolveTrialEmail · 幂等", () => {
  it("该阶段已发过 → 不重发", () => {
    expect(resolveTrialEmail({ ...base, expiresAt: at(2), sentStages: ["t_minus_3"] }, NOW)).toBeNull();
  });

  it("发过前一阶段不影响当前阶段", () => {
    expect(
      resolveTrialEmail({ ...base, expiresAt: at(-0.5), sentStages: ["t_minus_3"] }, NOW),
    ).toBe("expiry_day");
  });
});

describe("resolveTrialEmail · 与配额信互斥", () => {
  // 到期当天额度回落，超额者会被 sweepPublishQuota 发 start_grace 信；
  // 那封更具体（几张页、还剩几天、哪几张下线），到期信与挽回信让位。
  it("超额者跳过 expiry_day", () => {
    expect(resolveTrialEmail({ ...base, expiresAt: at(-0.5), overQuota: true }, NOW)).toBeNull();
  });

  it("超额者跳过 win_back", () => {
    expect(resolveTrialEmail({ ...base, expiresAt: at(-1.5), overQuota: true }, NOW)).toBeNull();
  });

  it("超额者仍收 t_minus_3（那时配额序列尚未开始）", () => {
    expect(resolveTrialEmail({ ...base, expiresAt: at(2), overQuota: true }, NOW)).toBe("t_minus_3");
  });
});
