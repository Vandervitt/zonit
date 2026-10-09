import { describe, it, expect } from "vitest";
import { activationStage, daysUntil, matchesView, type OpsFacts } from "./user-ops";

const NOW = new Date("2026-10-09T00:00:00Z");
const day = (n: number) => new Date(NOW.getTime() + n * 86400_000).toISOString();

const base: OpsFacts = {
  createdAt: day(-10), lastSeenAt: day(-1), milestones: ["signup"],
  publishedAt: null, lastLeadAt: null, compExpiresAt: null, paid: false, disabled: false, internal: false,
};

describe("activationStage", () => {
  it("取已达成的最高阶段，域名验证不算阶段（平台子域可跳过它）", () => {
    expect(activationStage(["signup"])).toBe("signup");
    expect(activationStage(["signup", "page_created", "domain_verified"])).toBe("page_created");
    expect(activationStage(["signup", "page_created", "page_published", "first_lead"])).toBe("first_lead");
    expect(activationStage([])).toBe("signup");
  });
});

describe("daysUntil", () => {
  it("剩余不足一天按 1 天算，已过期为负或 0，无到期为 null", () => {
    expect(daysUntil(day(0.2), NOW)).toBe(1);
    expect(daysUntil(day(3), NOW)).toBe(3);
    expect(daysUntil(day(-2), NOW)).toBeLessThanOrEqual(0);
    expect(daysUntil(null, NOW)).toBeNull();
  });
});

describe("matchesView", () => {
  it("stuck_no_page：注册超过 3 天仍未建页", () => {
    expect(matchesView(base, "stuck_no_page", NOW)).toBe(true);
    expect(matchesView({ ...base, createdAt: day(-2) }, "stuck_no_page", NOW)).toBe(false);
    expect(matchesView({ ...base, milestones: ["signup", "page_created"] }, "stuck_no_page", NOW)).toBe(false);
  });

  it("published_no_lead：已发布超过 7 天且近 7 天无线索", () => {
    const pub = { ...base, milestones: ["signup", "page_created", "page_published"] as OpsFacts["milestones"], publishedAt: day(-8) };
    expect(matchesView(pub, "published_no_lead", NOW)).toBe(true);
    expect(matchesView({ ...pub, publishedAt: day(-3) }, "published_no_lead", NOW)).toBe(false);
    expect(matchesView({ ...pub, lastLeadAt: day(-2) }, "published_no_lead", NOW)).toBe(false);
    expect(matchesView({ ...pub, lastLeadAt: day(-9) }, "published_no_lead", NOW)).toBe(true);
  });

  it("trial_ending：未付费且赠送 3 天内到期（已过期不算）", () => {
    expect(matchesView({ ...base, compExpiresAt: day(2) }, "trial_ending", NOW)).toBe(true);
    expect(matchesView({ ...base, compExpiresAt: day(5) }, "trial_ending", NOW)).toBe(false);
    expect(matchesView({ ...base, compExpiresAt: day(-1) }, "trial_ending", NOW)).toBe(false);
    expect(matchesView({ ...base, compExpiresAt: day(2), paid: true }, "trial_ending", NOW)).toBe(false);
  });

  it("dormant：超过 14 天未活跃；从未记录到活跃时按注册时间算", () => {
    expect(matchesView({ ...base, lastSeenAt: day(-15) }, "dormant", NOW)).toBe(true);
    expect(matchesView({ ...base, lastSeenAt: day(-3) }, "dormant", NOW)).toBe(false);
    expect(matchesView({ ...base, lastSeenAt: null, createdAt: day(-20) }, "dormant", NOW)).toBe(true);
    expect(matchesView({ ...base, lastSeenAt: null, createdAt: day(-5) }, "dormant", NOW)).toBe(false);
  });

  it("所有待办视图都排除内部与已禁用账号；all 不过滤", () => {
    expect(matchesView({ ...base, internal: true }, "stuck_no_page", NOW)).toBe(false);
    expect(matchesView({ ...base, disabled: true }, "stuck_no_page", NOW)).toBe(false);
    expect(matchesView({ ...base, internal: true }, "all", NOW)).toBe(true);
  });
});
