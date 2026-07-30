const UNSPLASH_HOSTNAME = "images.unsplash.com";
const RESPONSIVE_WIDTHS = [400, 800, 1200] as const;

export interface UnsplashImageSources {
  src: string;
  srcSet?: string;
}

function isUnsplashUrl(url: URL): boolean {
  return url.hostname === UNSPLASH_HOSTNAME;
}

function buildUnsplashUrl(url: URL, width: number): string {
  const params = new URLSearchParams(url.search);
  params.delete("fm");
  params.set("auto", "format");
  params.set("w", String(width));
  if (!params.has("q")) params.set("q", "80");

  return `${url.origin}${url.pathname}?${params.toString()}`;
}

export function buildUnsplashImageSources(imageUrl: string): UnsplashImageSources {
  // thumbnail 仅约束为 string，可能是空串或相对路径；此处在 Server Component 内同步执行，
  // 解析失败必须降级为原值，不能让整页渲染抛错。
  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    return { src: imageUrl };
  }

  if (!isUnsplashUrl(url)) return { src: imageUrl };

  const src = buildUnsplashUrl(url, 800);
  const srcSet = RESPONSIVE_WIDTHS.map((width) => `${buildUnsplashUrl(url, width)} ${width}w`).join(", ");

  return { src, srcSet };
}
