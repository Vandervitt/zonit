import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import {
  allowedTypesForKind,
  maxBytesForKind,
  type MediaKind,
} from "@/lib/media-constraints";

// 浏览器直传 Vercel Blob 的 token 端点。
// 客户端 upload() 先打这里换取受限的一次性上传 token，然后把文件字节直接传给 Blob，
// 从而绕过 Vercel Function 4.5MB 请求体上限（大文件上传 413 的根因）。
// 安全边界全部在 onBeforeGenerateToken 内：登录校验 + 按类型限定 allowedContentTypes / maximumSizeInBytes。
export async function POST(req: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  const userId = session.user.id;

  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        // clientPayload 不可信：只用它判定「图片/视频」以决定放宽到哪档限额；
        // 真正的类型校验由 allowedContentTypes 在 Blob 侧对实际 content-type 兜底，
        // 谎报 video 来给图片放宽的企图会因类型不匹配被 Blob 拒绝。
        let kind: MediaKind = "image";
        try {
          if (clientPayload) {
            const parsed = JSON.parse(clientPayload) as { kind?: string };
            if (parsed.kind === "video") kind = "video";
          }
        } catch {
          // 解析失败按图片处理（更严格的一档）
        }
        return {
          addRandomSuffix: true,
          allowedContentTypes: allowedTypesForKind(kind),
          maximumSizeInBytes: maxBytesForKind(kind),
          tokenPayload: JSON.stringify({ userId }),
        };
      },
      onUploadCompleted: async () => {
        // 落库改由客户端在 upload() 完成后以小 JSON 请求触发（POST /api/media），
        // 本地开发下 onUploadCompleted 回调无法到达，故此处不做入库，仅留占位。
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (e) {
    const message = e instanceof Error ? e.message : "上传授权失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
