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
  if (!res.ok) {
    let msg = "上传失败";
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      // 忽略解析失败，用默认文案
    }
    throw new Error(msg);
  }
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
  if (!res.ok) {
    let msg = "从 Unsplash 添加失败";
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      // 忽略解析失败，用默认文案
    }
    throw new Error(msg);
  }
  return (await res.json()) as MediaItem;
}
