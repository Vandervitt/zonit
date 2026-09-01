// 访客哈希的契约：同一天同一人稳定、跨天不可关联、拿不到 IP 时不折叠。
import { describe, it, expect } from "vitest";
import { visitorHash } from "./visitor";

const UA = "Mozilla/5.0 (iPhone)";
const D1 = new Date("2026-09-01T10:00:00Z");
const D2 = new Date("2026-09-02T10:00:00Z");

describe("visitorHash", () => {
  it("同一天、同 IP+UA+页面 → 同一个哈希（这才能去重）", () => {
    expect(visitorHash("1.2.3.4", UA, "p1", D1)).toBe(visitorHash("1.2.3.4", UA, "p1", D1));
  });

  it("同一天内跨小时仍然稳定（盐按天轮换，不按请求）", () => {
    const later = new Date("2026-09-01T23:59:00Z");
    expect(visitorHash("1.2.3.4", UA, "p1", D1)).toBe(visitorHash("1.2.3.4", UA, "p1", later));
  });

  // 盐每天换，所以跨天不可关联——这正是它不构成长期假名标识符的原因，
  // 代价是「UV」的口径只能是「按天去重」，文案里必须这么说。
  it("跨天必须变化", () => {
    expect(visitorHash("1.2.3.4", UA, "p1", D1)).not.toBe(visitorHash("1.2.3.4", UA, "p1", D2));
  });

  it("不同 IP / UA / 页面互不相同", () => {
    const base = visitorHash("1.2.3.4", UA, "p1", D1);
    expect(visitorHash("5.6.7.8", UA, "p1", D1)).not.toBe(base);
    expect(visitorHash("1.2.3.4", "curl/8", "p1", D1)).not.toBe(base);
    expect(visitorHash("1.2.3.4", UA, "p2", D1)).not.toBe(base);
  });

  // 折叠成同一个哈希会让这些访问被算作「一个人」，UV 被系统性低估。
  it("拿不到 IP 时返回 null，不折叠成同一个访客", () => {
    expect(visitorHash("", UA, "p1", D1)).toBeNull();
    expect(visitorHash(null, UA, "p1", D1)).toBeNull();
    expect(visitorHash("unknown", UA, "p1", D1)).toBeNull();
  });

  it("不回显任何明文：输出是定长十六进制", () => {
    const h = visitorHash("1.2.3.4", UA, "p1", D1)!;
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toContain("1.2.3.4");
  });
});
