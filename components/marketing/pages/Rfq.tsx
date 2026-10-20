import type { Metadata } from "next";
import RfqNarrative from "@/components/marketing/RfqNarrative";
import { fonts } from "@/lib/fonts";
import { Routes } from "@/lib/constants";
import { marketingMetadata } from "@/lib/seo/site";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { TEMPLATE_STATS, fillCounts } from "@/lib/templates/stats";
import type { Locale } from "@/lib/i18n/config";

export function rfqMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale).rfq.meta;
  return marketingMetadata({
    locale,
    title: t.title,
    // meta 侧在服务端直接 fillCounts；页面正文的占位符走 stats 下传给客户端组件。
    description: fillCounts(t.description),
    path: Routes.RfqLanding,
    ogTitle: t.ogTitle,
    ogDescription: t.ogDescription,
  });
}

export function RfqView({ locale }: { locale: Locale }) {
  return <RfqNarrative locale={locale} fonts={fonts} stats={TEMPLATE_STATS} />;
}
