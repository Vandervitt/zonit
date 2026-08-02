// lib/contact/cta-inventory.ts
// 从 draft 里提取全部 CTA 的 (文案, 最终 href) 清单 —— 迁移正确性的唯一判据。
//
// 迁移做的事只有「换一种方式表达同一个链接」，所以只要转换前后这张清单逐项相等，
// 页面对访客而言就是完全没变。这个判据可以对全部数据自动跑，不依赖人眼看页面。
//
// 排序后比较：转换不改变 CTA 的数量与内容，但不保证遍历顺序稳定，
// 排序把「顺序变了」这种无害差异排除在外。
import { resolveCtaHref } from "@/landing-renderer/lib/resolveCta";
import type { CtaButton, LandingPageDraft } from "@/types/schema.draft";

/** 转换前的 CTA 形状（link 为裸字符串）。仅迁移与 fixture 测试使用。 */
export interface LegacyCtaButton {
  text: string;
  link: string;
}

/** 转换前的 draft 形状。字段刻意宽松——它只用来读，不用来构造。 */
export interface LegacyDraft {
  hero: { cta?: LegacyCtaButton; secondaryCta?: LegacyCtaButton; [k: string]: unknown };
  sections: { type: string; data: Record<string, unknown> }[];
  footer: { contactEmail?: string; [k: string]: unknown };
  floatingButton?: LegacyCtaButton;
  leadForm?: { enabled?: boolean; [k: string]: unknown };
  [k: string]: unknown;
}

/** 文案与 href 用空格拼接：任何一侧变化都会让整项不等。 */
const key = (text: string, href: string | null) => `${text} ${href ?? ""}`;

/**
 * 深度遍历 sections，找出所有 CTA 形状的对象。
 * 判定条件是「有 text 字段，且有 link 或 target 字段」——这能同时覆盖新旧两种形状，
 * 且不会误伤只有 text 的普通文案节点。
 */
function walkSectionCtas(
  sections: { data: Record<string, unknown> }[],
  pick: (cta: Record<string, unknown>) => string,
): string[] {
  const out: string[] = [];
  const visit = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== "object") return;
    const obj = node as Record<string, unknown>;
    if (typeof obj.text === "string" && ("link" in obj || "target" in obj)) {
      out.push(pick(obj));
      return;
    }
    Object.values(obj).forEach(visit);
  };
  sections.forEach((s) => visit(s.data));
  return out;
}

/** 转换前：href 就是 link 字段本身。 */
export function legacyCtaInventory(draft: LegacyDraft): string[] {
  const out: string[] = [];
  const add = (cta?: LegacyCtaButton) => { if (cta) out.push(key(cta.text, cta.link)); };
  add(draft.hero.cta);
  add(draft.hero.secondaryCta);
  add(draft.floatingButton);
  out.push(...walkSectionCtas(draft.sections ?? [], (c) => key(c.text as string, (c.link as string) ?? null)));
  return out.sort();
}

/** 转换后：href 由 resolveCtaHref 从 contact 算出。 */
export function ctaInventory(draft: LandingPageDraft): string[] {
  const href = (cta: CtaButton) => resolveCtaHref(cta.target, draft.contact)?.href ?? null;
  const out: string[] = [];
  const add = (cta?: CtaButton) => { if (cta) out.push(key(cta.text, href(cta))); };
  add(draft.hero.cta);
  add(draft.hero.secondaryCta);
  add(draft.floatingButton);
  out.push(...walkSectionCtas(
    (draft.sections ?? []) as unknown as { data: Record<string, unknown> }[],
    (c) => key(c.text as string, href(c as unknown as CtaButton)),
  ));
  return out.sort();
}
