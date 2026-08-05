import type { Metadata } from "next";
import { fonts } from "@/lib/fonts";
import { LegalPage } from "@/components/marketing/LegalPage";
import { Routes } from "@/lib/constants";
import { marketingMetadata } from "@/lib/seo/site";
import { getLegal } from "@/components/marketing/legal-content";
import type { Locale } from "@/lib/i18n/config";


type LegalKind = "privacy" | "terms";

const PATH: Record<LegalKind, Routes> = {
  privacy: Routes.Privacy,
  terms: Routes.Terms,
};

export function legalMetadata(kind: LegalKind, locale: Locale): Metadata {
  const doc = getLegal(locale)[kind];
  return marketingMetadata({
    locale,
    title: doc.metaTitle,
    description: doc.metaDescription,
    path: PATH[kind],
  });
}

export function LegalView({ kind, locale }: { kind: LegalKind; locale: Locale }) {
  const doc = getLegal(locale)[kind];
  return (
    <LegalPage
      fonts={fonts}
      title={doc.title}
      subtitle={doc.subtitle}
      updated={doc.updated}
      sections={doc.sections}
    />
  );
}
