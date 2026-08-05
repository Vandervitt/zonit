// lib/media-upload.ts
// 与 UI 无关的上传逻辑。文件字节浏览器直传 Vercel Blob（换取 /api/media/blob-token 的
// 受限一次性 token），绕过 Vercel Function 4.5MB 请求体上限；上传完成后再以小 JSON
// 请求把结果元数据落库（POST /api/media）。供后台 UploadZone 与编辑器 MediaPicker 共用。
import { upload } from "@vercel/blob/client";
import { ApiRoutes } from "@/lib/constants";
import {
  kindForContentType,
  maxBytesForKind,
  humanMaxForKind,
} from "@/lib/media-constraints";
import type { MediaItem } from "@/lib/media-db";

/**
 * 把 uploadMedia / importUnsplashMedia 抛出的错误码翻成可展示文案。
 *
 * 未知码（或解析失败时的空串）一律走 fallback：与其把 media_url_invalid
 * 这种内部标识丢给用户，不如给一句他能看懂的通用失败提示。
 */
export function uploadErrorText(
  err: unknown,
  fallback: string,
  dict: Record<string, string>,
): string {
  const code = err instanceof Error ? err.message : "";
  return dict[code] ?? fallback;
}

/**
 * 取后端错误码（不是可展示文案）。
 *
 * 此前这里直接把服务端返回的中文原样抛给用户，等于把 UI 文案写在了 API 里——
 * 后台改成双语后那些串永远是中文。现在服务端只回 ApiErrors 的码，
 * 翻译交给调用点（它们已经拿得到字典）。解析失败时回空串，由调用点用兜底文案。
 */
async function errorCode(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return typeof data?.error === "string" ? data.error : "";
  } catch {
    return "";
  }
}

export async function uploadMedia(file: File): Promise<MediaItem> {
  const kind = kindForContentType(file.type);
  if (!kind) {
    throw new Error("仅支持图片和视频文件（不含 SVG）");
  }
  // 前端即时提示：避免大文件先传满再被 Blob 拒，浪费带宽与等待。
  if (file.size > maxBytesForKind(kind)) {
    throw new Error(`文件超过大小上限（${kind === "video" ? "视频" : "图片"}最大 ${humanMaxForKind(kind)}）`);
  }

  const blob = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: ApiRoutes.MediaBlobToken,
    clientPayload: JSON.stringify({ kind }),
    multipart: true,
  });

  const res = await fetch(ApiRoutes.Media, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: blob.url,
      filename: file.name,
      contentType: file.type,
      size: file.size,
    }),
  });
  if (!res.ok) throw new Error(await errorCode(res));
  return (await res.json()) as MediaItem;
}

export interface UnsplashImportInput {
  downloadLocation: string;
  imageUrl: string;
  creditName: string;
  creditUrl: string;
  alt?: string;
}

export async function importUnsplashMedia(input: UnsplashImportInput): Promise<MediaItem> {
  const res = await fetch(ApiRoutes.MediaUnsplash, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await errorCode(res));
  return (await res.json()) as MediaItem;
}
