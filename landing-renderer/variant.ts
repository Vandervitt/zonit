// landing-renderer/variant.ts
// 反同质化 Phase 1：按种子确定性派生「隐形指纹」变体。
// 纯函数、无副作用、SSR 可复现；恒等变体输出与改造前逐字节一致。
// 约束：所有候选类名字面量写死（Tailwind JIT 可扫），运行期只挑选不拼接。

export interface PageVariant {
  /** true = 恒等变体（Free/Starter 或无 antiBan）：输出与改造前完全一致。 */
  identity: boolean;
  /** 种子哈希（identity 时为 0）。 */
  seedHash: number;
  /** <meta name="generator"> 令牌（identity 时为空串 → 不覆盖）。 */
  metaToken: string;
}

export const IDENTITY_VARIANT: PageVariant = { identity: true, seedHash: 0, metaToken: "" };

/** FNV-1a 32bit：字符串 → 无符号 32 位哈希。 */
export function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32：整数种子 → [0,1) 伪随机（确定性）。 */
function mulberry32(seed: number): number {
  let t = (seed + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** generator meta 候选（全字面量，语义等价品牌串）。 */
const META_TOKENS = ["Zap Bridge", "Zap Bridge Sites", "Zap Bridge Pages", "Zap Bridge Studio"];

export function deriveVariant(seed: string): PageVariant {
  const seedHash = fnv1a(seed);
  const metaToken = META_TOKENS[Math.floor(mulberry32(seedHash) * META_TOKENS.length)];
  return { identity: false, seedHash, metaToken };
}

/** 单个 section 的包裹策略（纯函数，按 seedHash + index 确定）。 */
export interface SectionWrap {
  tag: "none" | "div";   // none = 不包裹
  className: string;     // "" 或 "contents"（display:contents，均视觉无副作用）
  attr: string;          // data-* 属性名，"" 表示不加属性
  attrValue: string;
}

const WRAP_ATTRS = ["data-v", "data-sx", "data-blk", "data-r"];

export function sectionWrap(variant: PageVariant, index: number): SectionWrap {
  if (variant.identity) return { tag: "none", className: "", attr: "", attrValue: "" };
  const r = mulberry32((variant.seedHash ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0);
  const mode = r < 0.34 ? "none" : r < 0.67 ? "block" : "contents";
  if (mode === "none") return { tag: "none", className: "", attr: "", attrValue: "" };
  const attr = WRAP_ATTRS[Math.floor(mulberry32((variant.seedHash + index * 131) >>> 0) * WRAP_ATTRS.length)];
  const attrValue = ((variant.seedHash ^ Math.imul(index + 7, 0x85ebca6b)) >>> 0).toString(36);
  return { tag: "div", className: mode === "contents" ? "contents" : "", attr, attrValue };
}
