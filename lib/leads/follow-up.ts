// 跟进字段（备注 / 标签）的约束与规整（纯函数，无 DB 依赖）。
//
// ⚠️ 刻意与 store.ts 分开：后者顶部 import 了 pg 连接池，线索列表是客户端组件，
// 从那里引常量会把 pg 打进浏览器包，整页当场白屏（已经踩过一次）。
// 任何需要被前端引用的线索常量都放这里。

/** 备注长度上限。够写一段跟进记录，又不至于让列表接口拖着一整篇文章。 */
export const MAX_NOTE_LENGTH = 2000;
/** 单条线索的标签上限与单个标签长度上限。 */
export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 24;

/**
 * 标签规整：去空白、去空值、去重、截断、限数量。
 * 「VIP」和「vip」在客户眼里是同一个，故按小写去重，但保留首次出现的写法。
 */
export function normalizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const tag = raw.trim().slice(0, MAX_TAG_LENGTH);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

/** 备注规整：空串视为「清空备注」，存 null 而不是空字符串。 */
export function normalizeNote(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const note = input.trim().slice(0, MAX_NOTE_LENGTH);
  return note || null;
}
