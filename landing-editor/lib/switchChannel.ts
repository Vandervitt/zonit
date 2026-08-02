// landing-editor/lib/switchChannel.ts
// 切换主渠道时，把跟随主渠道的 CTA 文案换成该渠道的版本。
//
// 文案跟随刻意放在编辑器而不是渲染器：渲染器只认 text 一个字符串，所见即所得，
// 发布快照存的就是最终显示的内容。渲染期再解析会让「编辑器里看到的」和
// 「线上显示的」成为两件需要各自推理的事。
import type { CtaButton, LandingPageDraft, LeadChannel } from "@/types/schema.draft";

/** 只有跟随主渠道的 CTA 才需要换文案；钉死渠道的和外链的不动。 */
function followsPrimary(cta: CtaButton): boolean {
  return cta.target?.kind === "primary";
}

function retext(cta: CtaButton, channel: LeadChannel): void {
  if (!followsPrimary(cta)) return;
  // 用户手改过就以他为准——平台不该覆盖人写的东西
  if (cta.textEdited) return;
  const next = cta.textByChannel?.[channel];
  // 目标渠道没备文案时保留原文案：空按钮比措辞不贴切的按钮糟糕得多
  if (next) cta.text = next;
}

/**
 * 切换主渠道，并同步所有跟随它的 CTA 文案。深拷贝，不改原对象。
 *
 * 不校验目标渠道有没有值 —— 用户完全可能先选渠道再填号码，
 * 那种中间状态由发布门槛拦，不该在这里阻止他操作。
 */
export function switchPrimaryChannel(draft: LandingPageDraft, channel: LeadChannel): LandingPageDraft {
  const out = JSON.parse(JSON.stringify(draft)) as LandingPageDraft;
  out.contact.primary = channel;

  if (out.hero?.cta) retext(out.hero.cta, channel);
  if (out.hero?.secondaryCta) retext(out.hero.secondaryCta, channel);
  if (out.floatingButton) retext(out.floatingButton, channel);

  // sections 里的 CTA 嵌套深浅不一（plans.items[].cta 等），统一深度遍历
  const visit = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== "object") return;
    const obj = node as Record<string, unknown>;
    if (typeof obj.text === "string" && "target" in obj) {
      retext(obj as unknown as CtaButton, channel);
      return;
    }
    Object.values(obj).forEach(visit);
  };
  visit(out.sections);

  return out;
}
