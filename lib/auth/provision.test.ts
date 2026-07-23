import { describe, it, expect, vi, beforeEach } from "vitest";

// 隔离 db/邮件/埋点：只验证建号语义（注册赠送 Pro 试用、邀请权益并存、老用户不受影响）。
const { clientQuery, connect, recordMilestone } = vi.hoisted(() => {
  const clientQuery = vi.fn();
  return {
    clientQuery,
    connect: vi.fn(async () => ({ query: clientQuery, release: vi.fn() })),
    recordMilestone: vi.fn(async () => undefined),
  };
});
vi.mock("@/lib/db", () => ({ default: { connect } }));
vi.mock("@/lib/email", () => ({ sendWelcomeEmail: vi.fn(async () => undefined) }));
vi.mock("@/lib/platform-milestones", () => ({ recordMilestone }));

import { provisionUserByEmail } from "./provision";
import { SIGNUP_TRIAL_PLAN, SIGNUP_TRIAL_DAYS } from "@/lib/plans";

beforeEach(() => {
  clientQuery.mockReset();
  recordMilestone.mockClear();
});

/** 按 SQL 前缀路由的 client.query 桩。 */
function stubQueries(opts: { existing?: unknown[]; invitation?: unknown[] }) {
  clientQuery.mockImplementation(async (sql: string) => {
    if (sql.startsWith("BEGIN") || sql.startsWith("COMMIT") || sql.startsWith("ROLLBACK")) return { rows: [] };
    if (sql.includes("FROM users")) return { rows: opts.existing ?? [] };
    if (sql.includes("FROM invitations")) return { rows: opts.invitation ?? [] };
    if (sql.includes("INSERT INTO users")) return { rows: [{ id: "u-new", email: "a@b.c", name: null, image: null }] };
    if (sql.includes("UPDATE invitations")) return { rows: [] };
    throw new Error(`unexpected sql: ${sql}`);
  });
}

describe("provisionUserByEmail", () => {
  it("新用户（无邀请）：建号即赠 Pro 试用（comp_plan + 到期约 7 天后），并记 signup 里程碑", async () => {
    stubQueries({});
    const before = Date.now();
    const user = await provisionUserByEmail("a@b.c");
    expect(user.id).toBe("u-new");

    const insertCall = clientQuery.mock.calls.find(([sql]) => (sql as string).includes("INSERT INTO users"));
    expect(insertCall).toBeDefined();
    const [sql, params] = insertCall as [string, unknown[]];
    expect(sql).toContain("comp_plan");
    expect(sql).toContain("comp_plan_expires_at");
    // 参数顺序：email,name,plan,trial_expires_at,invited_at,comp_plan,comp_plan_expires_at
    expect(params[2]).toBe("free");
    expect(params[5]).toBe(SIGNUP_TRIAL_PLAN);
    const expiry = params[6] as Date;
    const days = (expiry.getTime() - before) / 86_400_000;
    expect(days).toBeGreaterThan(SIGNUP_TRIAL_DAYS - 0.01);
    expect(days).toBeLessThan(SIGNUP_TRIAL_DAYS + 0.01);

    expect(recordMilestone).toHaveBeenCalledWith("u-new", "signup");
  });

  it("新用户（带有效邀请）：邀请套餐照常应用，同时仍赠送试用（生效档取较高）", async () => {
    stubQueries({
      invitation: [{ id: "inv1", plan: "agency", duration_days: 30 }],
    });
    await provisionUserByEmail("a@b.c", { token: "tok" });
    const [, params] = clientQuery.mock.calls.find(([sql]) => (sql as string).includes("INSERT INTO users")) as [string, unknown[]];
    expect(params[2]).toBe("agency"); // 邀请档写入 plan
    expect(params[5]).toBe(SIGNUP_TRIAL_PLAN); // 试用照常赠送
  });

  it("已存在用户：直接返回，不 INSERT、不重复记里程碑", async () => {
    stubQueries({ existing: [{ id: "u-old", email: "a@b.c", name: "A", image: null, disabled_at: null }] });
    const user = await provisionUserByEmail("a@b.c");
    expect(user.id).toBe("u-old");
    expect(clientQuery.mock.calls.some(([sql]) => (sql as string).includes("INSERT INTO users"))).toBe(false);
    expect(recordMilestone).not.toHaveBeenCalled();
  });
});
