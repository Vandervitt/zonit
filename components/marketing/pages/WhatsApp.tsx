import type { Metadata } from "next";
import WhatsAppNarrative from "@/components/marketing/WhatsAppNarrative";
import { fonts } from "@/lib/fonts";
import { Routes } from "@/lib/constants";
import { marketingMetadata } from "@/lib/seo/site";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { TEMPLATE_STATS, fillCounts } from "@/lib/templates/stats";
import type { Locale } from "@/lib/i18n/config";

export function whatsappMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale).whatsapp.meta;
  return marketingMetadata({
    locale,
    title: t.title,
    // meta 侧在服务端直接 fillCounts；页面正文的占位符走 stats 下传给客户端组件。
    description: fillCounts(t.description),
    path: Routes.WhatsAppLanding,
    ogTitle: t.ogTitle,
    ogDescription: t.ogDescription,
  });
}

export function WhatsAppView({ locale }: { locale: Locale }) {
  return <WhatsAppNarrative locale={locale} fonts={fonts} stats={TEMPLATE_STATS} />;
}
