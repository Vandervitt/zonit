import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getMedia, deleteMedia } from "@/lib/media-db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const { id } = await params;
  const item = await getMedia(id, session.user.id);
  if (!item) {
    return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  }

  await del(item.url);
  await deleteMedia(id, session.user.id);

  return new NextResponse(null, { status: 204 });
}
