import { common } from "./common";
import { home } from "./home";
import { plans } from "./plans";
import { pricing } from "./pricing";
import { antiban } from "./antiban";
import { auth } from "./auth";
import { templates } from "./templates";
import { templateContent } from "./templateContent";
import { templateIndustry } from "./templateIndustry";
import { guides } from "./guides";

export const en = { common, home, plans, pricing, antiban, auth, templates, templateContent, templateIndustry, guides };

/** 英文是字典事实源；中文以 `satisfies Dictionary` 对齐，漏 key / 多 key 均编译期报错。 */
export type Dictionary = typeof en;
