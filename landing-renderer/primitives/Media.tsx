// landing-renderer/primitives/Media.tsx
import type { Media as MediaType } from "@/types/schema.draft";

// priority=true 用于首屏 LCP 图（如 Hero 展示图）：eager + fetchpriority=high，改善 LCP。
// 视频不受影响；其余图默认 lazy，不变。
export function Media({
  media,
  className,
  priority,
}: {
  media: MediaType;
  className?: string;
  priority?: boolean;
}) {
  if (media.type === "video") {
    return <video src={media.src} poster={media.poster} controls playsInline className={className} />;
  }
  return (
    <img
      src={media.src}
      alt={media.alt ?? ""}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      className={className}
    />
  );
}
