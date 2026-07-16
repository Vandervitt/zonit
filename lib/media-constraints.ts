// lib/media-constraints.ts
// 素材上传的体积/类型约束，前后端共用（纯常量 + 纯函数，可在 client 安全导入）。
// 上传改为浏览器直传 Vercel Blob（绕过 Vercel Function 4.5MB 请求体上限），
// 真正的体积/类型边界由 token 路由的 maximumSizeInBytes / allowedContentTypes 守住，
// 这里的常量供 token 路由、落库校验与前端即时提示三处保持一致。

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 图片 10MB
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 视频 100MB

// 显式列白名单：既限定格式，也顺带排除 SVG（XSS 风险）。
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export type MediaKind = "image" | "video";

export function kindForContentType(contentType: string): MediaKind | null {
  if ((ALLOWED_IMAGE_TYPES as readonly string[]).includes(contentType)) return "image";
  if ((ALLOWED_VIDEO_TYPES as readonly string[]).includes(contentType)) return "video";
  return null;
}

export function maxBytesForKind(kind: MediaKind): number {
  return kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
}

export function allowedTypesForKind(kind: MediaKind): string[] {
  return kind === "video" ? [...ALLOWED_VIDEO_TYPES] : [...ALLOWED_IMAGE_TYPES];
}

export function humanMaxForKind(kind: MediaKind): string {
  return kind === "video" ? "100MB" : "10MB";
}

// 仅接受 Vercel Blob 存储域的 URL，避免落库端点被用来把任意外链写进素材库。
export function isVercelBlobUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}
