// lib/leads/contact-links.ts
// 线索联系方式 → 可点击链接（纯函数）。后台「一键联系」用。
//
// 之所以能这么简单，是因为写入侧已经保证了格式：号码一律 E.164、telegram 一律裸用户名
// （见 contact-format.ts 与 landing-renderer 的国码选择器）。这里只做拼接与降级，不做解析。
import { isE164, normalizeTelegram } from "./contact-format";
import type { LeadPayload } from "./validate";

export type ContactKind = "whatsapp" | "phone" | "email" | "telegram";

export interface ContactLink {
  kind: ContactKind;
  label: string;
  href: string;
  /** 外链需新开标签页；mailto / tel 交给系统处理，不开新窗。 */
  external: boolean;
}

export interface ContactLinks {
  links: ContactLink[];
  /** 格式不合法、拼不出可靠链接的联系方式，交给 UI 原样展示。 */
  plain: string[];
}

/**
 * 渠道顺序按跟进成功率排：WhatsApp（海外主力、即时）→ 电话 → 邮件 → Telegram。
 * 拼不出可靠链接的一律降级为纯文本——宁可让客户自己复制，也不要给一个拨错的号
 * 或点不开的 t.me。
 */
export function contactLinks(payload: LeadPayload): ContactLinks {
  const links: ContactLink[] = [];
  const plain: string[] = [];

  if (payload.whatsapp) {
    // wa.me 只吃纯数字，须去掉 E.164 的 `+`
    if (isE164(payload.whatsapp)) links.push({ kind: "whatsapp", label: "WhatsApp", href: `https://wa.me/${payload.whatsapp.slice(1)}`, external: true });
    else plain.push(`whatsapp: ${payload.whatsapp}`);
  }
  if (payload.phone) {
    if (isE164(payload.phone)) links.push({ kind: "phone", label: "拨号", href: `tel:${payload.phone}`, external: false });
    else plain.push(`phone: ${payload.phone}`);
  }
  if (payload.email) {
    if (payload.email.includes("@")) links.push({ kind: "email", label: "邮件", href: `mailto:${payload.email}`, external: false });
    else plain.push(`email: ${payload.email}`);
  }
  if (payload.telegram) {
    const username = normalizeTelegram(payload.telegram);
    if (username) links.push({ kind: "telegram", label: "Telegram", href: `https://t.me/${username}`, external: true });
    else plain.push(`telegram: ${payload.telegram}`);
  }

  return { links, plain };
}
