import type { Locale } from "../config";
import { en, type AdminDictionary } from "./dictionaries/en";
import { zh } from "./dictionaries/zh";

export type { AdminDictionary };
export { resolveAdminLocale } from "./resolve";
export { formatDate, formatDateTime, formatMonthDay } from "./format";

const ADMIN_DICTIONARIES: Record<Locale, AdminDictionary> = { en, zh };

/**
 * 同步取后台字典（静态 import，无 async 开销）。
 *
 * 两种语言都会进 admin 的客户端 chunk——这是刻意的取舍：admin 整页 `"use client"`，
 * 若改成由服务端把选中语言的字典序列化进 RSC payload，则每次导航都要重传一遍文案。
 * 后台在登录态之后、无 LCP 压力，用一次性的 bundle 体积换掉每次导航的 payload 更划算。
 */
export function getAdminDictionary(locale: Locale): AdminDictionary {
  return ADMIN_DICTIONARIES[locale];
}
