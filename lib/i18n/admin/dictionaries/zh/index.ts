import type { AdminDictionary } from "../en";
import { analytics } from "./analytics";
import { billing } from "./billing";
import { common } from "./common";
import { shell } from "./shell";
import { domains } from "./domains";
import { leads } from "./leads";
import { media } from "./media";
import { overview } from "./overview";
import { pages } from "./pages";
import { settings } from "./settings";

// `satisfies` 是中英对齐的唯一机制：漏 key、多 key、函数签名不符均在编译期报错，
// 不需要运行时校验，也不需要额外的对齐测试。
export const zh = { analytics, billing, common, domains, leads, media, overview, pages, shell, settings } satisfies AdminDictionary;
