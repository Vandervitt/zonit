// landing-renderer/primitives/Media.tsx
import type { Media as MediaType } from "@/types/schema.draft";

export function Media({ media, className }: { media: MediaType; className?: string }) {
  if (media.type === "video") {
    return <video src={media.src} poster={media.poster} controls playsInline className={className} />;
  }
  return <img src={media.src} alt={media.alt ?? ""} loading="lazy" className={className} />;
}
