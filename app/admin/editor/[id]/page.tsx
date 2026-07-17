import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { Editor } from "@/landing-editor/Editor";
import { getLandingPage } from "@/lib/landing-pages/store";
import { getUserPlan } from "@/lib/plans-db";

export default async function EditorByIdPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ai?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const page = await getLandingPage(id, session.user.id);
  if (!page) notFound();

  const plan = await getUserPlan(session.user.id);
  const { ai } = await searchParams;

  return (
    <Editor
      pageId={page.id}
      initialName={page.name}
      initialDraft={page.data}
      plan={plan}
      autoGenerate={ai === "1"}
    />
  );
}
