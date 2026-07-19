import type { HelpChapterData } from "./types";
import { gettingStarted } from "./chapters/getting-started";
import { createPages } from "./chapters/create-pages";
import { editor } from "./chapters/editor";
import { domainsPublishing } from "./chapters/domains-publishing";
import { tracking } from "./chapters/tracking";
import { leads } from "./chapters/leads";
import { analytics } from "./chapters/analytics";
import { media } from "./chapters/media";
import { billing } from "./chapters/billing";
import { account } from "./chapters/account";
import { compliance } from "./chapters/compliance";
import { faq } from "./chapters/faq";

/** 目录顺序即阅读顺序：主链路（上手→建页→编辑→发布→追踪→线索）在前。 */
export const HELP_CHAPTERS: HelpChapterData[] = [
  gettingStarted,
  createPages,
  editor,
  domainsPublishing,
  tracking,
  leads,
  analytics,
  media,
  billing,
  account,
  compliance,
  faq,
];

export function getChapter(slug: string): HelpChapterData | undefined {
  return HELP_CHAPTERS.find((c) => c.slug === slug);
}

export function getAdjacentChapters(slug: string): {
  prev?: HelpChapterData;
  next?: HelpChapterData;
} {
  const i = HELP_CHAPTERS.findIndex((c) => c.slug === slug);
  if (i < 0) return {};
  return { prev: HELP_CHAPTERS[i - 1], next: HELP_CHAPTERS[i + 1] };
}
