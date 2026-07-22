// 邮箱验证码（OTP）核心逻辑与存储。
// 安全决策（生成/过期/尝试上限/重发冷却/邮箱归一）拆成纯函数，便于单测；
// DB 读写为薄封装。防爆破是重点——6 位码空间仅 10^6，靠「短有效期 + 尝试上限 + 发送限流」三重防护。
import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 10 * 60_000; // 有效期 10 分钟
export const OTP_RESEND_COOLDOWN_MS = 60_000; // 重发冷却 60 秒
export const OTP_MAX_ATTEMPTS = 5; // 单个码最多校验次数

const BCRYPT_ROUNDS = 10;

/** 生成 6 位纯数字验证码（crypto 强随机，保留前导零）。 */
export function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(OTP_LENGTH, "0");
}

/** 哈希验证码（与项目密码哈希一致用 bcrypt），绝不落明文。 */
export function hashOtpCode(code: string): Promise<string> {
  return bcrypt.hash(code, BCRYPT_ROUNDS);
}

/** 常量时间比对验证码与哈希。 */
export function verifyOtpHash(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

/** 邮箱归一：去空格 + 转小写，作为存储与查询的统一 key。 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type OtpRecord = {
  code_hash: string;
  expires_at: Date | string;
  consumed_at: Date | string | null;
  attempts: number;
};

export type OtpBlockReason =
  | "not_found"
  | "consumed"
  | "expired"
  | "too_many_attempts";

export type OtpVerifyResult = "ok" | OtpBlockReason | "mismatch";

/**
 * 纯判定：在比对码值之前，先判断该记录是否处于可校验状态。
 * 顺序（过期优先于尝试次数）：不存在 → 已消费 → 已过期 → 尝试超限。
 */
export function evaluateOtp(
  record: OtpRecord | null,
  now: Date,
): { blocked: true; reason: OtpBlockReason } | { blocked: false } {
  if (!record) return { blocked: true, reason: "not_found" };
  if (record.consumed_at) return { blocked: true, reason: "consumed" };
  if (new Date(record.expires_at).getTime() < now.getTime()) {
    return { blocked: true, reason: "expired" };
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    return { blocked: true, reason: "too_many_attempts" };
  }
  return { blocked: false };
}

/** 纯判定：距上次发码是否已过冷却期。 */
export function canResend(lastCreatedAt: Date | string | null, now: Date): boolean {
  if (!lastCreatedAt) return true;
  return now.getTime() - new Date(lastCreatedAt).getTime() >= OTP_RESEND_COOLDOWN_MS;
}

// ---- DB 薄封装（跨实例可靠的冷却与单活跃码约束在此保证） ----

/**
 * 签发一枚新验证码：DB 冷却校验 → 作废旧未消费码 → 落库新码哈希。
 * 返回明文码供发信；冷却期内返回 { error: "cooldown" }。
 */
export async function issueOtp(
  rawEmail: string,
  now: Date = new Date(),
): Promise<{ code: string } | { error: "cooldown" }> {
  const email = normalizeEmail(rawEmail);

  const last = await pool.query(
    `SELECT created_at FROM email_otps WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
    [email],
  );
  if (last.rows[0] && !canResend(last.rows[0].created_at, now)) {
    return { error: "cooldown" };
  }

  const code = generateOtpCode();
  const codeHash = await hashOtpCode(code);
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

  // 单活跃码：作废该邮箱此前所有未消费码，避免多码并存被利用。
  await pool.query(
    `UPDATE email_otps SET consumed_at = NOW() WHERE email = $1 AND consumed_at IS NULL`,
    [email],
  );
  await pool.query(
    `INSERT INTO email_otps (email, code_hash, expires_at) VALUES ($1, $2, $3)`,
    [email, codeHash, expiresAt],
  );

  return { code };
}

/**
 * 校验验证码：取最新未消费码 → 状态判定 → 比对；
 * 比对失败累加 attempts；成功则标记 consumed（一次性）。
 */
export async function verifyOtp(
  rawEmail: string,
  code: string,
  now: Date = new Date(),
): Promise<OtpVerifyResult> {
  const email = normalizeEmail(rawEmail);

  const res = await pool.query(
    `SELECT id, code_hash, expires_at, consumed_at, attempts
       FROM email_otps
      WHERE email = $1 AND consumed_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1`,
    [email],
  );
  const record = res.rows[0] ?? null;

  const gate = evaluateOtp(record, now);
  if (gate.blocked) return gate.reason;

  const match = await verifyOtpHash(code, record!.code_hash);
  if (!match) {
    await pool.query(`UPDATE email_otps SET attempts = attempts + 1 WHERE id = $1`, [
      record!.id,
    ]);
    return "mismatch";
  }

  await pool.query(`UPDATE email_otps SET consumed_at = NOW() WHERE id = $1`, [record!.id]);
  return "ok";
}
