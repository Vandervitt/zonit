// lib/unsplash.ts
// Unsplash 搜索结果的服务端纯映射：原始照片 → 前端所需形状。
// utm 归属参数为 Unsplash API 使用条款要求（署名链接需带 utm_source=应用名）。
const UTM = "utm_source=zap_bridge&utm_medium=referral";

export interface UnsplashRaw {
  id: string;
  urls: { small: string; regular: string };
  alt_description: string | null;
  links: { download_location: string };
  user: { name: string; username: string };
}

export interface UnsplashResult {
  id: string;
  urls: { small: string; regular: string };
  alt_description: string | null;
  downloadLocation: string;
  user: { name: string; username: string; profileUrl: string };
}

export function unsplashProfileUrl(username: string): string {
  return `https://unsplash.com/@${username}?${UTM}`;
}

export function mapUnsplashPhoto(p: UnsplashRaw): UnsplashResult {
  return {
    id: p.id,
    urls: { small: p.urls.small, regular: p.urls.regular },
    alt_description: p.alt_description,
    downloadLocation: p.links.download_location,
    user: { name: p.user.name, username: p.user.username, profileUrl: unsplashProfileUrl(p.user.username) },
  };
}
