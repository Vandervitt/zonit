// landing-renderer/primitives/Media.tsx
import type { Media as MediaType } from "@/types/schema.draft";
import { Img } from "./Img";

/**
 * 富媒体：图片或视频。
 *
 * ⚠️ 图片分支**必须委托给 Img，不要在这里再写一个 <img>**。
 * 这里原本是自己渲染的，结果 2026-09-01 给落地页图片加优化时只改了 Img，
 * 于是 Hero 主图（恰恰是首屏 LCP 元素）成了整页唯一没走优化器的图，
 * 84KiB 原始 JPEG，占当时剩余图片重量的一半以上——两个地方各渲染一次图片，
 * 改动漏一个不会报错、也不会有人立刻发现。
 *
 * priority 用于首屏 LCP（Hero 展示图）：eager + fetchpriority=high。视频不受影响。
 */
export function Media({
  media,
  className,
  priority,
  sizes,
}: {
  media: MediaType;
  className?: string;
  priority?: boolean;
  /** 透传给 Img；区块知道自己的布局时给得更准。 */
  sizes?: string;
}) {
  if (media.type === "video") {
    return <video src={media.src} poster={media.poster} controls playsInline className={className} />;
  }
  return (
    <Img
      image={{ src: media.src, alt: media.alt, width: media.width, height: media.height }}
      className={className}
      priority={priority}
      sizes={sizes}
    />
  );
}
