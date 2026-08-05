// 后台英文字典（事实源）。中文侧 `satisfies AdminDictionary` 与本文件逐 key 对齐，
// 漏 key、多 key、函数签名不符都在编译期报错。
//
// ⚠️ 这套字典**刻意不并入** lib/i18n/dictionaries 的营销站主 Dictionary：
// components/marketing/LocaleSwitcher.tsx 是客户端组件且直接 import getDictionary，
// 合并会把约 2700 行后台文案 ×2 语言打进营销站首页的客户端 bundle，
// 而首页 LCP 是专门优化过的（PR#74/#75）。两套字典互不 import。
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

export const en = { analytics, billing, common, domains, leads, media, overview, pages, shell, settings };

export type AdminDictionary = typeof en;
