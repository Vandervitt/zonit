// landing-editor/ui/media/unsplash.ts
// Unsplash 搜索结果类型（与 /api/unsplash/search 返回对齐）+ 映射为 import 入参。
import type { UnsplashImportInput } from "@/lib/media-upload";

export interface UnsplashPhoto {
  id: string;
  urls: { small: string; regular: string };
  alt_description: string | null;
  downloadLocation: string;
  user: { name: string; username: string; profileUrl: string };
}

/** 选中 Unsplash 图 → import 端点入参（下载 regular 落库）。 */
export function toImportInput(p: UnsplashPhoto): UnsplashImportInput {
  return {
    downloadLocation: p.downloadLocation,
    imageUrl: p.urls.regular,
    creditName: p.user.name,
    creditUrl: p.user.profileUrl,
    alt: p.alt_description ?? "",
  };
}
