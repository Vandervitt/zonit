import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { insertMedia } from "@/lib/media-db";

// 仅允许从 Unsplash 官方域拉取，避免该端点被当作任意 URL 代理（SSRF）
function isUnsplashApi(u: string): boolean {
  try {
    return new URL(u).hostname === "api.unsplash.com";
  } catch {
    return false;
  }
}
function isUnsplashImage(u: string): boolean {
  try {
    return new URL(u).hostname === "images.unsplash.com";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const downloadLocation: string = body?.downloadLocation ?? "";
  const imageUrl: string = body?.imageUrl ?? "";
  const creditName: string | null = body?.creditName ?? null;
  const creditUrl: string | null = body?.creditUrl ?? null;

  if (!isUnsplashApi(downloadLocation) || !isUnsplashImage(imageUrl)) {
    return NextResponse.json({ error: "非法的 Unsplash 链接" }, { status: 400 });
  }

  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key || key === "your_access_key_here") {
    return NextResponse.json({ error: "未配置 Unsplash" }, { status: 400 });
  }

  // ① Unsplash 条款要求：选用时触发下载计数。失败不阻断落库。
  try {
    await fetch(downloadLocation, { headers: { Authorization: `Client-ID ${key}` } });
  } catch {
    console.warn("[unsplash] download trigger failed");
  }

  // ② 拉取图片字节
  let imgRes: Response;
  try {
    imgRes = await fetch(imageUrl);
  } catch {
    return NextResponse.json({ error: "下载 Unsplash 图片失败" }, { status: 502 });
  }
  if (!imgRes.ok) {
    return NextResponse.json({ error: "下载 Unsplash 图片失败" }, { status: 502 });
  }
  const buf = Buffer.from(await imgRes.arrayBuffer());
  const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";

  // ③ 落 Blob → 入库
  const filename = `unsplash-${Date.now()}.jpg`;
  const blob = await put(filename, buf, { access: "public", addRandomSuffix: true, contentType });
  const item = await insertMedia(session.user.id, blob.url, filename, "image", buf.byteLength, {
    source: "unsplash",
    creditName,
    creditUrl,
  });

  return NextResponse.json(item, { status: 201 });
}
