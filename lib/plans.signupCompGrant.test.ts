import { describe, it, expect } from "vitest";
import { signupCompGrant, SIGNUP_TRIAL_PLAN, SIGNUP_TRIAL_DAYS } from "./plans";

const NOW = new Date("2026-07-28T00:00:00.000Z");
const daysBetween = (a: Date, b: Date) => (a.getTime() - b.getTime()) / 86_400_000;

describe("signupCompGrant", () => {
  it("无邀请：默认注册赠送 Pro 7 天", () => {
    const g = signupCompGrant(null, NOW);
    expect(g.plan).toBe(SIGNUP_TRIAL_PLAN);
    expect(daysBetween(g.expiresAt, NOW)).toBe(SIGNUP_TRIAL_DAYS);
  });

  it("undefined 与 null 等价", () => {
    expect(signupCompGrant(undefined, NOW)).toEqual(signupCompGrant(null, NOW));
  });

  it("有邀请：按邀请的档位与天数发放", () => {
    const g = signupCompGrant({ plan: "agency", durationDays: 30 }, NOW);
    expect(g.plan).toBe("agency");
    expect(daysBetween(g.expiresAt, NOW)).toBe(30);
  });

  it("邀请档低于默认赠送时不回抬——超管的显式选择优先", () => {
    const g = signupCompGrant({ plan: "starter", durationDays: 3 }, NOW);
    expect(g.plan).toBe("starter");
    expect(daysBetween(g.expiresAt, NOW)).toBe(3);
  });

  it("不修改传入的 now", () => {
    const now = new Date(NOW);
    signupCompGrant({ plan: "pro", durationDays: 10 }, now);
    expect(now.getTime()).toBe(NOW.getTime());
  });
});
