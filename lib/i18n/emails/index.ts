import { defaultLocale, isLocale, type Locale } from "../config";
import { emails as en, type EmailDictionary } from "./en";
import { emails as zh } from "./zh";

export type { EmailDictionary };

const EMAIL_DICTIONARIES: Record<Locale, EmailDictionary> = { en, zh };

/**
 * 取收件人语言的邮件文案。
 *
 * 入参是 `users.locale` 的原始值（可能为 null / 脏值），故在此收敛而不是要求
 * 每个调用点自己判空——邮件发送分散在 cron、webhook、注册流等处，
 * 少判一处的表现是「有个用户收到的邮件语言不对」，很难被发现。
 */
export function getEmailDictionary(locale: string | null | undefined): EmailDictionary {
  return EMAIL_DICTIONARIES[locale && isLocale(locale) ? locale : defaultLocale];
}
