// landing-renderer/lib/resolveCta.ts
// CTA 落点解析：CtaTarget + PageContact → 可点击链接。渲染期唯一解析点。
//
// 返回 null 表示「这个按钮渲染不出来」（引用的渠道没填值），调用方应当不渲染它，
// 而不是渲染 href="" 的死按钮 —— 访客点了原地不动比没有按钮更糟。
import { channelHref, type ChannelHref } from "@/lib/contact/channel-href";
import type { CtaTarget, LeadChannel, PageContact } from "@/types/schema.draft";

/** 取某渠道在该页面上配置的值。form 没有值，交给 channelHref 处理。 */
function channelValue(contact: PageContact, channel: LeadChannel): string {
  return channel === "form" ? "" : (contact[channel] ?? "");
}

export function resolveCtaHref(target: CtaTarget, contact: PageContact): ChannelHref | null {
  switch (target.kind) {
    case "url":
      // 二级外链（Instagram / 官网等）原样返回，不做归一也不做校验 ——
      // 格式合法性由编辑期的 validateLink 负责，渲染期不重复判断。
      return target.url.trim() ? { href: target.url, external: true } : null;
    case "primary":
      return channelHref(contact.primary, channelValue(contact, contact.primary), target.prefill);
    case "channel":
      return channelHref(target.channel, channelValue(contact, target.channel), target.prefill);
  }
}

/**
 * 该 CTA 最终指向哪个渠道（埋点用）。url 类落点归为 external。
 *
 * 取代了 tracking/events.ts 的 inferChannel —— 那是从 URL 字符串前缀反推渠道，
 * 现在渠道是显式的，不必再猜。
 */
export function resolveCtaChannel(target: CtaTarget, contact: PageContact): LeadChannel | "external" {
  if (target.kind === "url") return "external";
  return target.kind === "primary" ? contact.primary : target.channel;
}
