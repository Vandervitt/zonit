// landing-renderer/primitives/Img.tsx
import type { ImageRef } from "@/types/schema.draft";

export function Img({ image, className }: { image: ImageRef; className?: string }) {
  return <img src={image.src} alt={image.alt ?? ""} loading="lazy" className={className} />;
}
