// landing-renderer/tracking/events.ts
// 内部事件 → 各平台标准事件的内置映射（系统固定、非交易）；以及 CTA 渠道推断。
import type { PixelProvider } from "@/types/schema.draft";

export type InternalEvent = "page_view" | "cta_click";

/** 各平台标准事件名（均为非交易事件，不可由用户改动）。 */
export const EVENT_MAP: Record<PixelProvider, Record<InternalEvent, string>> = {
  meta:      { page_view: "PageView",  cta_click: "Lead" },
  ga4:       { page_view: "page_view", cta_click: "generate_lead" },
  googleAds: { page_view: "page_view", cta_click: "conversion" },
  tiktok:    { page_view: "Pageview",  cta_click: "Contact" },
};

/** 由链接前缀推断 CTA 渠道，作为 data-cta 值与事件参数。 */
export function inferChannel(link: string): string {
  const v = link.trim().toLowerCase();
  if (v.startsWith("whatsapp:") || v.startsWith("https://wa.me")) return "whatsapp";
  if (v.startsWith("tel:")) return "tel";
  if (v.startsWith("mailto:")) return "mailto";
  if (v.startsWith("sms:")) return "sms";
  if (v.startsWith("tg:") || v.startsWith("https://t.me")) return "telegram";
  return "external";
}
