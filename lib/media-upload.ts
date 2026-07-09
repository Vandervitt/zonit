// lib/media-upload.ts
// 与 UI 无关的上传逻辑：POST /api/media（FormData）→ 返回入库后的 MediaItem。
// 供后台 UploadZone 与编辑器 MediaPicker 的上传 Tab 共用，保证两处行为一致。
import { ApiRoutes } from "@/lib/constants";
import type { MediaItem } from "@/lib/media-db";

export async function uploadMedia(file: File): Promise<MediaItem> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(ApiRoutes.Media, { method: "POST", body: form });
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
