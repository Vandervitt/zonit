import { describe, it, expect, vi } from "vitest";
import type { DbLike } from "@/lib/ai/usage";
import { checkAndConsume } from "@/lib/ai/usage";

function mockDb(rows: Record<string, Record<string, unknown>[]>): DbLike {
  return {
    query: vi.fn(async (sql: string) => {
      if (sql.includes("count")) return { rows: rows.count ?? [{ c: "0" }] };
      if (sql.includes("ai_credit_balance") && sql.startsWith("SELECT"))
        return { rows: rows.balance ?? [{ ai_credit_balance: 0 }] };
      return { rows: [] };
    }),
  };
}

describe("checkAndConsume page", () => {
  it("月额度未满 → 用 quota 成功", async () => {
    const db = mockDb({ count: [{ c: "1" }], balance: [{ ai_credit_balance: 0 }] });
    const r = await checkAndConsume(db, "u1", "page", 3);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.source).toBe("quota");
  });

  it("月额度满但有 credit → 用 credit", async () => {
    const db = mockDb({ count: [{ c: "3" }], balance: [{ ai_credit_balance: 5 }] });
    const r = await checkAndConsume(db, "u1", "page", 3);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.source).toBe("credit");
  });

  it("额度与 credit 皆空 → 拒绝", async () => {
    const db = mockDb({ count: [{ c: "3" }], balance: [{ ai_credit_balance: 0 }] });
    const r = await checkAndConsume(db, "u1", "page", 3);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("ai_quota_exhausted");
  });

  it("rewrite 满额 → 拒绝（不查 credit）", async () => {
    const db = mockDb({ count: [{ c: "10" }] });
    const r = await checkAndConsume(db, "u1", "rewrite", 10);
    expect(r.ok).toBe(false);
  });

  it("Infinity 额度永远放行", async () => {
    const db = mockDb({ count: [{ c: "9999" }] });
    const r = await checkAndConsume(db, "u1", "rewrite", Infinity);
    expect(r.ok).toBe(true);
  });
});
