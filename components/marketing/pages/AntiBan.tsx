import type { Metadata } from "next";
import AntiBanNarrative from "@/components/marketing/AntiBanNarrative";
import { fonts } from "@/lib/fonts";
import { Routes } from "@/lib/constants";
import { marketingMetadata } from "@/lib/seo/site";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

export function antiBanMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale).antiban.meta;
  return marketingMetadata({
    locale,
    title: t.title,
    description: t.description,
    path: Routes.AntiBan,
    ogTitle: t.ogTitle,
    ogDescription: t.ogDescription,
  });
}

export function AntiBanView({ locale }: { locale: Locale }) {
  return (
    <AntiBanNarrative
      locale={locale}
      fonts={fonts}
    />
  );
}
