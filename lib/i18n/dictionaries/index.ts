import type { Locale } from "../config";
import { en, type Dictionary } from "./en";
import { zh } from "./zh";

export type { Dictionary };

const DICTIONARIES: Record<Locale, Dictionary> = { en, zh };

/**
 * 同步返回字典（静态 import，无 async 开销）。
 * Server Component 直接取；client 组件由父级以 props 传入需要的切片，
 * 只有被用到的切片会进客户端 payload，不会两种语言都打包。
 */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
