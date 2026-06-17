import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { Editor } from "@/landing-editor/Editor";
import { getLandingPage } from "@/lib/landing-pages/store";

export default async function EditorByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const page = await getLandingPage(id, session.user.id);
  if (!page) notFound();

  return <Editor pageId={page.id} initialName={page.name} initialDraft={page.data} />;
}
