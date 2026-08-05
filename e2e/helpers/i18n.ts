// E2E 的后台文案来源。
//
// 为什么定位要从字典取、而不是写死中文：
// 登录页国际化（PR#115）之后 /login 变成英文面，原本写死中文 label 的用例
// 从那天起就再也匹配不上——见 e2e/otp-auth.spec.ts 顶部那条注释。
// admin 国际化把同一个坑扩大到了整个后台，故这里统一收口。
//
// ⚠️ 定位（找元素）用字典，断言（验内容对不对）写死字面量。
// 断言也引字典就成了永真断言：字典写错，用例照样绿。
import { getAdminDictionary } from "@/lib/i18n/admin";
import { E2E_LOCALE } from "./db";

/** 测试固定跑的语言下的后台字典。语言由 db.ts 的 E2E_LOCALE 钉死。 */
export const t = getAdminDictionary(E2E_LOCALE);

/** 另一种语言的字典，供双语冒烟用例对照。 */
export const tEn = getAdminDictionary("en");

/**
 * 把字典文案转成可安全嵌进正则的字面量。
 * 后台文案里有「（缺省用主题色兜底）」这类全角括号——直接塞进 RegExp
 * 会被当成分组，匹配不到任何东西且不报错。
 */
export function rx(literal: string): RegExp {
  return new RegExp(literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
}
