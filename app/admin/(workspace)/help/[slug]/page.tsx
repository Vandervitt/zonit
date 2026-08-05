import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { LOCALE_COOKIE } from "@/lib/i18n/config";
import { resolveAdminLocale } from "@/lib/i18n/admin";
import { TEMPLATE_STATS } from "@/lib/templates/stats";
import { getChapter, HELP_SLUGS } from "../_content";
import { fillChapterCounts } from "../_content/fill";
import { HelpChapter } from "../_components/HelpChapter";

export function generateStaticParams() {
  // slug 与语言无关，两种语言共用同一组静态参数。
  return HELP_SLUGS.map((slug) => ({ slug }));
}

export default async function HelpChapterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const locale = resolveAdminLocale(session?.user?.locale, cookieStore.get(LOCALE_COOKIE)?.value);
  const chapter = getChapter(slug, locale);
  if (!chapter) notFound();
  return <HelpChapter chapter={fillChapterCounts(chapter, TEMPLATE_STATS)} />;
}
