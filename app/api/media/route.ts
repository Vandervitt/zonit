import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { listMedia, insertMedia } from "@/lib/media-db";
import {
  isVercelBlobUrl,
  kindForContentType,
  maxBytesForKind,
} from "@/lib/media-constraints";

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

// 文件字节已由客户端直传 Vercel Blob（见 /api/media/blob-token）。
// 这里只接收上传结果的元数据（小 JSON，不经过 4.5MB 请求体上限）并落库。
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const url: unknown = body?.url;
  const filename: unknown = body?.filename;
  const contentType: unknown = body?.contentType;
  const size: unknown = body?.size;

  if (typeof url !== "string" || !isVercelBlobUrl(url)) {
    return NextResponse.json({ error: "非法的素材地址" }, { status: 400 });
  }
  if (typeof filename !== "string" || filename.length === 0 || filename.length > 255) {
    return NextResponse.json({ error: "文件名无效" }, { status: 400 });
  }
  if (typeof contentType !== "string") {
    return NextResponse.json({ error: "仅支持图片和视频文件" }, { status: 400 });
  }

  const kind = kindForContentType(contentType);
  if (!kind) {
    return NextResponse.json({ error: "仅支持图片和视频文件" }, { status: 400 });
  }

  // 体积二次兜底：token 侧已限，此处防止元数据被伪造出异常值。
  const bytes = typeof size === "number" && Number.isFinite(size) && size >= 0 ? size : 0;
  if (bytes > maxBytesForKind(kind)) {
    return NextResponse.json({ error: "文件超过大小上限" }, { status: 400 });
  }

  const item = await insertMedia(session.user.id, url, filename, kind, bytes);
  return NextResponse.json(item, { status: 201 });
}
