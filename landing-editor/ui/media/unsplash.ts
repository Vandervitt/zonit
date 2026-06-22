// landing-editor/ui/media/unsplash.ts
// Unsplash 搜索结果类型 + 映射为编辑器选图所需的 {src, alt}。
export interface UnsplashPhoto {
  id: string;
  urls: { small: string; regular: string };
  alt_description: string | null;
  user: { name: string; username: string };
}

export interface PickedImage {
  src: string;
  alt: string;
}

/** 选中 Unsplash 图：用 regular 作 src，alt_description 作 alt（缺省空串）。 */
export function pickUnsplash(p: UnsplashPhoto): PickedImage {
  return { src: p.urls.regular, alt: p.alt_description ?? "" };
}
