import { common } from "./common";
import { home } from "./home";
import { plans } from "./plans";

export const en = { common, home, plans };

/** 英文是字典事实源；中文以 `satisfies Dictionary` 对齐，漏 key / 多 key 均编译期报错。 */
export type Dictionary = typeof en;
