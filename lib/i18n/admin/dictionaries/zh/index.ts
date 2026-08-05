import type { AdminDictionary } from "../en";
import { common } from "./common";
import { shell } from "./shell";
import { settings } from "./settings";

// `satisfies` 是中英对齐的唯一机制：漏 key、多 key、函数签名不符均在编译期报错，
// 不需要运行时校验，也不需要额外的对齐测试。
export const zh = { common, shell, settings } satisfies AdminDictionary;
