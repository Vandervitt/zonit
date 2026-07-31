// lib/leads/contact-format.ts
// 联系方式规范化（纯函数，客户端表单与服务端校验共用）。
//
// 目标：号码进库即 E.164（`+国码本地号`），Telegram 进库即裸用户名。
// 这样后台「一键联系」只需拼字符串，不必在读取时反推访客当初是什么格式。

/** E.164：`+` + 首位非 0 的国码 + 共 7~15 位数字。 */
const E164 = /^\+[1-9]\d{6,14}$/;
/** Telegram 用户名规则：5~32 位字母数字下划线，且必须以字母开头（纯数字串是手机号，不是用户名）。 */
const TELEGRAM_USERNAME = /^[A-Za-z][A-Za-z0-9_]{4,31}$/;

export function isE164(value: string): boolean {
  return E164.test(value);
}

/**
 * 国码 + 访客手填的本地号 → E.164。
 * 处理三种常见输入：带格式符（空格/括号/横杠）、带本地中继前缀 0、
 * 以及访客自己又写了一遍国码（`+86…` / `0086…`）。本地号为空时返回空串，
 * 避免产出「只有国码」的假号码——必填与否交给表单和校验判断。
 */
export function composeE164(dial: string, national: string): string {
  const dialDigits = dial.replace(/\D/g, "");
  let digits = national.replace(/\D/g, "");
  if (!digits) return "";
  // 访客重复写国码：国际前缀 00 / + 形式都归一到裸数字后再比对
  if (digits.startsWith(`00${dialDigits}`)) digits = digits.slice(2 + dialDigits.length);
  else if (digits.startsWith(dialDigits) && digits.length > dialDigits.length) digits = digits.slice(dialDigits.length);
  // 本地中继前缀（英国 07911、澳洲 0412……）在 E.164 里不保留
  digits = digits.replace(/^0+/, "");
  if (!digits) return "";
  return `+${dialDigits}${digits}`;
}

/**
 * Telegram 输入 → 裸用户名；无法跳转 t.me 的输入（手机号、含空格等）返回 null。
 * 宁可让访客当场改，也不要存一个后台点不开的链接。
 */
export function normalizeTelegram(value: string): string | null {
  const trimmed = value.trim().replace(/^https?:\/\//i, "").replace(/^t\.me\//i, "").replace(/^@/, "");
  return TELEGRAM_USERNAME.test(trimmed) ? trimmed : null;
}
