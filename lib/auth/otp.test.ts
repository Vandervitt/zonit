import { describe, it, expect } from "vitest";
import {
  generateOtpCode,
  hashOtpCode,
  verifyOtpHash,
  evaluateOtp,
  canResend,
  normalizeEmail,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MS,
  OTP_RESEND_COOLDOWN_MS,
} from "./otp";

describe("generateOtpCode", () => {
  it("生成 6 位纯数字（含前导零）", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateOtpCode();
      expect(code).toHaveLength(OTP_LENGTH);
      expect(code).toMatch(/^\d{6}$/);
    }
  });
});

describe("hashOtpCode / verifyOtpHash", () => {
  it("哈希后可验证，且不落明文", async () => {
    const code = "012345";
    const hash = await hashOtpCode(code);
    expect(hash).not.toBe(code);
    expect(hash).not.toContain(code);
    expect(await verifyOtpHash(code, hash)).toBe(true);
    expect(await verifyOtpHash("543210", hash)).toBe(false);
  });
});

describe("evaluateOtp", () => {
  const now = new Date("2026-07-22T12:00:00Z");
  const base = {
    code_hash: "x",
    expires_at: new Date("2026-07-22T12:05:00Z"),
    consumed_at: null,
    attempts: 0,
  };

  it("无记录 → not_found 拦截", () => {
    expect(evaluateOtp(null, now)).toEqual({ blocked: true, reason: "not_found" });
  });

  it("有效未过期未消费 → 放行", () => {
    expect(evaluateOtp(base, now)).toEqual({ blocked: false });
  });

  it("已消费 → consumed 拦截", () => {
    expect(evaluateOtp({ ...base, consumed_at: now }, now)).toEqual({
      blocked: true,
      reason: "consumed",
    });
  });

  it("已过期 → expired 拦截", () => {
    const expired = { ...base, expires_at: new Date("2026-07-22T11:59:59Z") };
    expect(evaluateOtp(expired, now)).toEqual({ blocked: true, reason: "expired" });
  });

  it("达到尝试上限 → too_many_attempts 拦截", () => {
    expect(evaluateOtp({ ...base, attempts: OTP_MAX_ATTEMPTS }, now)).toEqual({
      blocked: true,
      reason: "too_many_attempts",
    });
  });

  it("过期优先于尝试次数判断（过期即拦，不看 attempts）", () => {
    const expired = {
      ...base,
      expires_at: new Date("2026-07-22T11:00:00Z"),
      attempts: 0,
    };
    expect(evaluateOtp(expired, now)).toEqual({ blocked: true, reason: "expired" });
  });
});

describe("canResend", () => {
  const now = new Date("2026-07-22T12:00:00Z");

  it("从未发过 → 允许", () => {
    expect(canResend(null, now)).toBe(true);
  });

  it("冷却期内 → 拒绝", () => {
    const justSent = new Date(now.getTime() - (OTP_RESEND_COOLDOWN_MS - 1));
    expect(canResend(justSent, now)).toBe(false);
  });

  it("冷却期满 → 允许", () => {
    const old = new Date(now.getTime() - OTP_RESEND_COOLDOWN_MS);
    expect(canResend(old, now)).toBe(true);
  });
});

describe("normalizeEmail", () => {
  it("去空格并转小写", () => {
    expect(normalizeEmail("  User@Example.COM ")).toBe("user@example.com");
  });
});

describe("常量合理性", () => {
  it("TTL 10 分钟、冷却 60 秒、尝试上限 5", () => {
    expect(OTP_TTL_MS).toBe(10 * 60_000);
    expect(OTP_RESEND_COOLDOWN_MS).toBe(60_000);
    expect(OTP_MAX_ATTEMPTS).toBe(5);
  });
});
