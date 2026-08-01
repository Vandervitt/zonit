// lib/leads/contact-links.ts
// 线索联系方式 → 可点击链接（纯函数）。后台「一键联系」用。
//
// 链接拼装本身在 lib/contact/channel-href.ts，与落地页 CTA 共用同一份实现。
// 本模块只负责后台专属的三件事：渠道排序、中文 label、拼不出链接时降级为纯文本。
import { channelHref } from "@/lib/contact/channel-href";
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

/** 渠道顺序按跟进成功率排：WhatsApp（海外主力、即时）→ 电话 → 邮件 → Telegram。 */
const ORDER: { kind: ContactKind; label: string }[] = [
  { kind: "whatsapp", label: "WhatsApp" },
  { kind: "phone", label: "拨号" },
  { kind: "email", label: "邮件" },
  { kind: "telegram", label: "Telegram" },
];

/**
 * 拼不出可靠链接的一律降级为纯文本——宁可让客户自己复制，也不要给一个拨错的号
 * 或点不开的 t.me。
 */
export function contactLinks(payload: LeadPayload): ContactLinks {
  const links: ContactLink[] = [];
  const plain: string[] = [];

  for (const { kind, label } of ORDER) {
    const value = payload[kind];
    if (!value) continue;
    const resolved = channelHref(kind, value);
    if (resolved) links.push({ kind, label, href: resolved.href, external: resolved.external });
    else plain.push(`${kind}: ${value}`);
  }

  return { links, plain };
}
