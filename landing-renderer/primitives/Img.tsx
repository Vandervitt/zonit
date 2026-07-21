// landing-renderer/primitives/Img.tsx
import type { ImageRef } from "@/types/schema.draft";

// priority=true 用于首屏 LCP 图（如 Hero 主图）：eager 加载 + fetchpriority=high，
// 避免被浏览器当作 lazy 图降级延后，改善 LCP。其余图默认 lazy，不变。
export function Img({
  image,
  className,
  priority,
}: {
  image: ImageRef;
  className?: string;
  priority?: boolean;
}) {
  return (
    <img
      src={image.src}
      alt={image.alt ?? ""}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      className={className}
    />
  );
}
