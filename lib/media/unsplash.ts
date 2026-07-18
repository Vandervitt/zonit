// lib/media/unsplash.ts
// 服务端 Unsplash helper：检索 + 「触发下载→拉字节→存 Blob→入库」的落地，供
// /api/unsplash/search、/api/media/unsplash 与 AI 一键成页自动配图共用（单一事实源）。
import { put } from "@vercel/blob";
import { mapUnsplashPhoto, type UnsplashRaw, type UnsplashResult } from "@/lib/unsplash";
import { insertMedia } from "@/lib/media-db";

function accessKey(): string | null {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  return key && key !== "your_access_key_here" ? key : null;
}

// 仅允许 Unsplash 官方域，避免把落库端点当任意 URL 代理（SSRF）。
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
// 署名链接只接受 https 的 Unsplash 主页，杜绝 javascript: 等恶意 scheme 入库。
function safeCreditUrl(u: string | null): string | null {
  if (!u) return null;
  try {
    const parsed = new URL(u);
    return parsed.protocol === "https:" && parsed.hostname === "unsplash.com" ? u : null;
  } catch {
    return null;
  }
}

export interface SearchPhotosResult {
  results: UnsplashResult[];
  total: number;
  demo?: boolean;
}

/** Unsplash 检索取向：普通配图用 landscape，评价头像用 squarish（更贴近头像裁切）。 */
export type UnsplashOrientation = "landscape" | "portrait" | "squarish";

/** 检索照片（分页）。未配置 key 时返回 demo 空结果。 */
export async function searchPhotos(
  q: string,
  page = 1,
  perPage = 8,
  orientation: UnsplashOrientation = "landscape",
): Promise<SearchPhotosResult> {
  if (!q.trim()) return { results: [], total: 0 };
  const key = accessKey();
  if (!key) return { results: [], total: 0, demo: true };

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&page=${page}&per_page=${perPage}&orientation=${orientation}`,
    { headers: { Authorization: `Client-ID ${key}` } },
  );
  if (!res.ok) {
    const err = new Error(`unsplash search ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return { results: (data.results as UnsplashRaw[]).map(mapUnsplashPhoto), total: data.total };
}

/** 取某检索词的首张结果；无配置 / 无结果 / 出错都返回 null（供尽力而为的自动配图使用）。 */
export async function searchTopPhoto(
  query: string,
  orientation: UnsplashOrientation = "landscape",
): Promise<UnsplashResult | null> {
  try {
    const { results } = await searchPhotos(query, 1, 1, orientation);
    return results[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * 从检索结果池里按序号取一张（供评价头像避免撞脸）：同一检索词下，用递增 index 取不同结果，
 * index 超出池大小则回绕。无配置 / 无结果 / 出错都返回 null。
 */
export async function searchPhotoAt(
  query: string,
  index: number,
  orientation: UnsplashOrientation = "squarish",
  poolSize = 10,
): Promise<UnsplashResult | null> {
  try {
    const { results } = await searchPhotos(query, 1, poolSize, orientation);
    if (results.length === 0) return null;
    return results[index % results.length];
  } catch {
    return null;
  }
}

export interface PersistInput {
  downloadLocation: string; // api.unsplash.com 的 download_location
  imageUrl: string; // images.unsplash.com 的图片 URL
  creditName?: string | null;
  creditUrl?: string | null;
}

/**
 * 触发 Unsplash 下载计数 → 拉图片字节 → 存 Vercel Blob → 入 media 库，返回落地 URL 等。
 * 校验失败返回 { error }；下载/Blob 失败抛错（路由映射为 502，自动配图侧 catch 后回退原图）。
 */
export async function persistUnsplashPhoto(userId: string, input: PersistInput) {
  const { downloadLocation, imageUrl, creditName = null, creditUrl = null } = input;
  if (!isUnsplashApi(downloadLocation) || !isUnsplashImage(imageUrl)) {
    return { error: "非法的 Unsplash 链接" as const };
  }
  const key = accessKey();
  if (!key) return { error: "未配置 Unsplash" as const };

  // ① Unsplash 条款：选用时触发下载计数，失败不阻断。
  try {
    await fetch(downloadLocation, { headers: { Authorization: `Client-ID ${key}` } });
  } catch {
    console.warn("[unsplash] download trigger failed");
  }

  // ② 拉字节
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`download image ${imgRes.status}`);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";

  // ③ 存 Blob → 入库
  const filename = `unsplash-${Date.now()}.jpg`;
  const blob = await put(filename, buf, { access: "public", addRandomSuffix: true, contentType });
  const item = await insertMedia(userId, blob.url, filename, "image", buf.byteLength, {
    source: "unsplash",
    creditName,
    creditUrl: safeCreditUrl(creditUrl),
  });
  return { item };
}
