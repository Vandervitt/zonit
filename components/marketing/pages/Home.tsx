import type { Metadata } from "next";
import { fontBody, fontHead, fontMono } from "@/lib/fonts";
import MarketingHome from "@/components/marketing/MarketingHome";
import { Routes } from "@/lib/constants";
import { marketingMetadata, siteStructuredData } from "@/lib/seo/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getCnyRateForLocale } from "@/lib/pricing/fx-server";
import type { Locale } from "@/lib/i18n/config";

/**
 * 首页在 / 与 /zh 两处各有一个薄壳（app/page.tsx、app/zh/page.tsx），
 * 页面体与 metadata 工厂集中在此，避免两棵树各写一份。
 */
export function homeMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale).home.meta;
  return {
    ...marketingMetadata({
      locale,
      title: t.title,
      description: t.description,
      path: Routes.Home,
      ogDescription: t.ogDescription,
    }),
    // GSC URL 前缀验证只注入英文首页，避免中英两页重复输出同一验证标签。
    ...(locale === "en"
      ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION || undefined } }
      : {}),
  };
}

export async function HomeView({ locale }: { locale: Locale }) {
  // 汇率在服务端取好再下传：MarketingHome 是客户端组件，不能自己 fetch。
  const cnyRate = await getCnyRateForLocale(locale);
  return (
    <>
      <JsonLd data={siteStructuredData(locale)} />
      <MarketingHome
        locale={locale}
        cnyRate={cnyRate}
        fonts={{
          display: fontHead.className,
          body: fontBody.className,
          mono: fontMono.className,
        }}
      />
    </>
  );
}
