// lib/contact/convert-draft.ts
// 旧 draft（link 裸字符串）→ 新 draft（contact 真源 + target 引用）。纯函数，迁移与测试共用。
//
// 硬规则：识别不了的落点一律转成 { kind: "url" } 原样保留。
// 同页出现第二个不同的 WhatsApp 号是合法状态（用户手改过其一），绝不归一 ——
// 那会静默改变客户正在投放的页面。宁可留一个没接入新模型的落点。
import type { CtaTarget, LandingPageDraft, LeadChannel, PageContact } from "@/types/schema.draft";
import type { LegacyCtaButton, LegacyDraft } from "./cta-inventory";

/** 从旧 link 反推渠道与规范化后的值；识别不了返回 null。 */
export function parseLegacyLink(link: string): { channel: LeadChannel; value: string } | null {
  const v = link.trim();
  if (!v) return null;
  if (v === "#lead-form") return { channel: "form", value: "" };
  const wa = v.match(/^https:\/\/wa\.me\/(\d{7,15})$/i);
  if (wa) return { channel: "whatsapp", value: `+${wa[1]}` };
  const tel = v.match(/^tel:\+?([\d\s()-]{7,20})$/i);
  if (tel) return { channel: "phone", value: `+${tel[1].replace(/\D/g, "")}` };
  const mail = v.match(/^mailto:(.+@.+)$/i);
  if (mail) return { channel: "email", value: mail[1] };
  const tg = v.match(/^https:\/\/t\.me\/([A-Za-z][A-Za-z0-9_]{4,31})$/i);
  if (tg) return { channel: "telegram", value: tg[1] };
  return null;
}

/**
 * hero 链接被置空时，猜这张页面原本用的是哪个渠道。
 *
 * blankPrimaryCtaLinks 跳过锚点（isPageAnchor），所以空链接必然原本是深链、
 * 绝不可能是表单 —— 兜成 form 会解析出 #lead-form 而原值是空，等价性立刻破。
 * 故从 draft 里残留的其他深链推断，推不出则默认 whatsapp。
 *
 * 无论猜成哪个，值都留空，故解析结果恒为 null，等价性不受影响；
 * 真实值由用户在阶段 2 的联系方式面板里填。
 */
function inferBlankedChannel(legacy: LegacyDraft): LeadChannel {
  let found: LeadChannel | null = null;
  JSON.stringify(legacy, (k, v) => {
    if (k === "link" && typeof v === "string" && !found) {
      const parsed = parseLegacyLink(v);
      if (parsed && parsed.channel !== "form") found = parsed.channel;
    }
    return v;
  });
  return found ?? "whatsapp";
}

export function convertDraft(legacy: LegacyDraft): LandingPageDraft {
  const out = JSON.parse(JSON.stringify(legacy)) as Record<string, unknown> & {
    hero: Record<string, unknown>;
    footer: Record<string, unknown>;
    sections?: unknown;
  };

  // ① 主渠道：以 hero.cta.link 为准，空链接走上面的兜底
  const heroParsed = parseLegacyLink(legacy.hero.cta?.link ?? "");
  const contact: PageContact = { primary: heroParsed?.channel ?? inferBlankedChannel(legacy) };
  if (heroParsed && heroParsed.channel !== "form") {
    contact[heroParsed.channel] = heroParsed.value;
  }

  // ② 页脚邮箱并入 contact（该字段随后删除）
  const footerEmail = (legacy.footer.contactEmail ?? "").trim();
  if (footerEmail && !contact.email) contact.email = footerEmail;

  // ③ 逐个落点转引用：只有与已收录渠道的值完全一致才转成引用，
  //    否则原样保留为 url —— 这就是「不强行归一」那条硬规则的落点
  const toTarget = (link: string): CtaTarget => {
    const parsed = parseLegacyLink(link);
    if (!parsed) return { kind: "url", url: link };
    if (parsed.channel !== "form" && contact[parsed.channel] !== parsed.value) {
      return { kind: "url", url: link };
    }
    return parsed.channel === contact.primary
      ? { kind: "primary" }
      : { kind: "channel", channel: parsed.channel };
  };

  const convertCta = (cta: LegacyCtaButton) => ({ text: cta.text, target: toTarget(cta.link) });

  // sections 里的 CTA 就地改写：加 target、删 link
  const visit = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== "object") return;
    const obj = node as Record<string, unknown>;
    if (typeof obj.text === "string" && typeof obj.link === "string") {
      obj.target = toTarget(obj.link);
      delete obj.link;
      return;
    }
    Object.values(obj).forEach(visit);
  };

  if (legacy.hero.cta) out.hero.cta = convertCta(legacy.hero.cta);
  if (legacy.hero.secondaryCta) out.hero.secondaryCta = convertCta(legacy.hero.secondaryCta);
  if (legacy.floatingButton) out.floatingButton = convertCta(legacy.floatingButton);
  visit(out.sections);
  delete out.footer.contactEmail;
  out.contact = contact;

  return out as unknown as LandingPageDraft;
}
