import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { persistUnsplashPhoto } from "@/lib/media/unsplash";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  try {
    const out = await persistUnsplashPhoto(session.user.id, {
      downloadLocation: body?.downloadLocation ?? "",
      imageUrl: body?.imageUrl ?? "",
      creditName: body?.creditName ?? null,
      creditUrl: body?.creditUrl ?? null,
    });
    // 校验失败（非法链接 / 未配置）→ 400，沿用原状态码与文案。
    if ("error" in out) {
      return NextResponse.json({ error: out.error }, { status: 400 });
    }
    return NextResponse.json(out.item, { status: 201 });
  } catch {
    // 下载 / Blob 失败 → 502，沿用原文案。
    return NextResponse.json({ error: "下载 Unsplash 图片失败" }, { status: 502 });
  }
}
