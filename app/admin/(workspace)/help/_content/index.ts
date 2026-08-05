import type { Locale } from "@/lib/i18n/config";
import type { HelpChapterData } from "./types";
import { ZH_CHAPTERS } from "./chapters/zh";
import { EN_CHAPTERS } from "./chapters/en";

/**
 * 目录顺序即阅读顺序：主链路（上手→建页→编辑→发布→追踪→线索）在前。
 * 两种语言必须逐章对应且同序——slug 是 URL 的一部分，切语言不该换页；
 * 对齐由 content.test.ts 机械核对。
 */
const CHAPTERS: Record<Locale, HelpChapterData[]> = { en: EN_CHAPTERS, zh: ZH_CHAPTERS };

export function getHelpChapters(locale: Locale): HelpChapterData[] {
  return CHAPTERS[locale];
}

export function getChapter(slug: string, locale: Locale): HelpChapterData | undefined {
  return CHAPTERS[locale].find((c) => c.slug === slug);
}

export function getAdjacentChapters(
  slug: string,
  locale: Locale,
): { prev?: HelpChapterData; next?: HelpChapterData } {
  const chapters = CHAPTERS[locale];
  const i = chapters.findIndex((c) => c.slug === slug);
  if (i < 0) return {};
  return { prev: chapters[i - 1], next: chapters[i + 1] };
}

/** 章节 slug 清单（与语言无关，供 generateStaticParams 用）。 */
export const HELP_SLUGS: string[] = ZH_CHAPTERS.map((c) => c.slug);
