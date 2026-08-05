import type { HelpChapterData } from "../../types";
import { gettingStarted } from "./getting-started";
import { createPages } from "./create-pages";
import { editor } from "./editor";
import { domainsPublishing } from "./domains-publishing";
import { tracking } from "./tracking";
import { leads } from "./leads";
import { analytics } from "./analytics";
import { media } from "./media";
import { billing } from "./billing";
import { account } from "./account";
import { compliance } from "./compliance";
import { faq } from "./faq";

export const EN_CHAPTERS: HelpChapterData[] = [
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
