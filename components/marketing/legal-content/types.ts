import type { LegalSection } from "@/components/marketing/LegalPage";

/** 一份法务文档（隐私政策 / 服务条款）的完整内容。 */
export interface LegalDoc {
  metaTitle: string;
  metaDescription: string;
  title: string;
  subtitle: string;
  /** 「最后更新」展示文本，按各语言的日期书写习惯。 */
  updated: string;
  sections: LegalSection[];
}

export interface LegalDocs {
  privacy: LegalDoc;
  terms: LegalDoc;
}

export const LEGAL_CONTACT = "vandervitt.li@gmail.com";
