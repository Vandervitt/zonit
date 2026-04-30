import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { listMedia, insertMedia } from "@/lib/media-db";

const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const raw = req.nextUrl.searchParams.get("type");
  const type = raw === "image" || raw === "video" ? raw : undefined;

  const items = await listMedia(session.user.id, type);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "缺少文件" }, { status: 400 });
  }

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "仅支持图片和视频文件" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "文件不能超过 100MB" }, { status: 400 });
  }

  const mediaType = isImage ? "image" : "video";
  const blob = await put(file.name, file, { access: "public" });
  const item = await insertMedia(session.user.id, blob.url, file.name, mediaType, file.size);

  return NextResponse.json(item, { status: 201 });
}
