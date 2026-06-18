import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { LandingPage } from "@/landing-renderer/LandingPage";
import { getLandingPage } from "@/lib/landing-pages/store";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const page = await getLandingPage(id, session.user.id);
  if (!page) notFound();

  return <LandingPage page={page.data} />;
}
