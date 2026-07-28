import type { Metadata } from "next";
import { Syne, Sora, JetBrains_Mono } from "next/font/google";
import AntiBanNarrative from "@/components/marketing/AntiBanNarrative";
import { Routes } from "@/lib/constants";
import { marketingMetadata } from "@/lib/seo/site";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

const display = Syne({ subsets: ["latin"], weight: ["700", "800"], display: "swap" });
const body = Sora({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap" });

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
      fonts={{
        display: display.className,
        body: body.className,
        mono: mono.className,
      }}
    />
  );
}
