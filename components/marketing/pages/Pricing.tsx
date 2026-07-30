import type { Metadata } from "next";
import { PlanComparison } from "@/components/billing/PlanComparison";
import { Routes } from "@/lib/constants";
import { marketingMetadata } from "@/lib/seo/site";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getCnyRateForLocale } from "@/lib/pricing/fx-server";
import type { Locale } from "@/lib/i18n/config";

export function pricingMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale).pricing.meta;
  return marketingMetadata({
    locale,
    title: t.title,
    description: t.description,
    path: Routes.Pricing,
    ogTitle: t.ogTitle,
  });
}

export async function PricingView({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).pricing;
  const cnyRate = await getCnyRateForLocale(locale);
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-aqua-50 via-background to-background py-20 px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-glow-1/15 blur-3xl" />
      </div>
      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-foreground mb-3">{t.title}</h1>
          <p className="text-muted-foreground text-lg">{t.subtitle}</p>
        </div>
        <PlanComparison locale={locale} cnyRate={cnyRate} />
      </div>
    </main>
  );
}
