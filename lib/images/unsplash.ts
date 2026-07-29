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
  const url = new URL(imageUrl);
  if (!isUnsplashUrl(url)) return { src: imageUrl };

  const src = buildUnsplashUrl(url, 800);
  const srcSet = RESPONSIVE_WIDTHS.map((width) => `${buildUnsplashUrl(url, width)} ${width}w`).join(", ");

  return { src, srcSet };
}
