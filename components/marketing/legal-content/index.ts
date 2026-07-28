import type { Locale } from "@/lib/i18n/config";
import type { LegalDocs } from "./types";
import { legal as en } from "./en";
import { legal as zh } from "./zh";

export type { LegalDoc, LegalDocs } from "./types";

const LEGAL_BY_LOCALE: Record<Locale, LegalDocs> = { en, zh };

/**
 * 法务文档按语言取用。
 * 两版均含「语言版本」条款，声明英文版为准据文本（见 docs 设计文档决策）。
 */
export function getLegal(locale: Locale): LegalDocs {
  return LEGAL_BY_LOCALE[locale];
}
