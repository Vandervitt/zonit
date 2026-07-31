import { notFound } from "next/navigation";
import { TEMPLATE_STATS } from "@/lib/templates/stats";
import { getChapter, HELP_CHAPTERS } from "../_content";
import { fillChapterCounts } from "../_content/fill";
import { HelpChapter } from "../_components/HelpChapter";

export function generateStaticParams() {
  return HELP_CHAPTERS.map((c) => ({ slug: c.slug }));
}

export default async function HelpChapterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) notFound();
  return <HelpChapter chapter={fillChapterCounts(chapter, TEMPLATE_STATS)} />;
}
