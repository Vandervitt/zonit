import { notFound } from "next/navigation";
import { getChapter, HELP_CHAPTERS } from "../_content";
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
  return <HelpChapter chapter={chapter} />;
}
