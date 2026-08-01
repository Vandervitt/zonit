// lib/contact/channel-href.ts
// 渠道 + 值 → 可点击链接（纯函数）。落地页 CTA 与后台「一键联系」共用的唯一拼装点。
//
// 之所以能这么简单，是因为写入侧已保证格式：号码一律 E.164、telegram 一律裸用户名
// （见 lib/leads/contact-format.ts）。这里只做拼接与拒绝，不做解析、不做猜测。
//
// 拼不出可靠链接一律返回 null —— 宁可不渲染这个按钮，也不要给访客一个拨错的号，
// 或者一个点了原地不动的 href=""。
import { isE164, normalizeTelegram } from "@/lib/leads/contact-format";
import { LEAD_FORM_ANCHOR_ID } from "@/landing-renderer/sections/LeadForm";
import type { LeadChannel } from "@/types/schema.draft";

export interface ChannelHref {
  href: string;
  /** 外链需新开标签页；mailto / tel / 页内锚点交给浏览器处理，不开新窗。 */
  external: boolean;
}

/**
 * @param prefill 点开聊天时预填进输入框的消息，仅 WhatsApp 支持（wa.me 的 ?text= 参数）。
 *   其他渠道忽略：tel: / mailto: 各有自己的语义，t.me 不支持预填。
 */
export function channelHref(channel: LeadChannel, value: string, prefill?: string): ChannelHref | null {
  switch (channel) {
    case "form":
      // 表单是页内锚点，与 value 无关。表单是否启用由校验层负责——
      // 这里判断了也没用：拼装器不该知道页面结构。
      return { href: `#${LEAD_FORM_ANCHOR_ID}`, external: false };
    case "whatsapp": {
      // wa.me 只吃纯数字，须去掉 E.164 的 `+`
      if (!isE164(value)) return null;
      const query = prefill?.trim() ? `?text=${encodeURIComponent(prefill)}` : "";
      return { href: `https://wa.me/${value.slice(1)}${query}`, external: true };
    }
    case "phone":
      return isE164(value) ? { href: `tel:${value}`, external: false } : null;
    case "email":
      return value.includes("@") ? { href: `mailto:${value}`, external: false } : null;
    case "telegram": {
      const username = normalizeTelegram(value);
      return username ? { href: `https://t.me/${username}`, external: true } : null;
    }
  }
}
