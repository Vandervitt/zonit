// landing-renderer/primitives/Img.tsx
import type { ImageRef } from "@/types/schema.draft";
import { optimizedSrcSet, DEFAULT_IMAGE_SIZES } from "@/lib/images/optimizable";

/**
 * 落地页图片。
 *
 * 三件事，都刻意做成「有就用、没有就退回原样」，因为租户数据是历史遗留且不受控：
 *
 * 1. **优化**：src 命中白名单时输出指向 /_next/image 的 srcset，由优化器按视口宽度
 *    缩放并协商 WebP。命中不了（用户贴的外链）就只输出原始 src——`/_next/image`
 *    对白名单外的 host 会 400，宁可不优化也不能让图打不开。
 *    不用 next/image 组件是因为它非 fill 模式必须给 width/height，而多数存量图没有；
 *    手工 srcset 不需要知道原始尺寸，**存量页面零迁移即可受益**。
 *
 * 2. **占位**：width/height 齐全时输出这两个属性，浏览器据此预留空间消除 CLS。
 *    只有其一时不输出——单个值算不出比例，浏览器会当成没有。
 *
 * 3. **优先级**：priority 用于首屏 LCP 图（如 Hero 主图），eager + fetchpriority=high，
 *    避免被浏览器当作 lazy 图降级延后。其余默认 lazy。
 */
export function Img({
  image,
  className,
  priority,
  sizes,
}: {
  image: ImageRef;
  className?: string;
  priority?: boolean;
  /** 覆盖默认 sizes；区块知道自己的布局时给得更准，浏览器就能挑更小的档。 */
  sizes?: string;
}) {
  const srcSet = optimizedSrcSet(image.src);
  const hasIntrinsicSize = Boolean(image.width && image.height);
  return (
    /*
     * 刻意用 <img> + 手工 srcset，不用 next/image：后者非 fill 模式必须给
     * width/height（多数存量图没有），且对 remotePatterns 外的 host 直接 400，
     * 而租户图片来源不受控 —— 换过去等于把「图偏大」变成「图打不开」。
     * 优化本身已由上面的 srcSet 完成，这条 lint 警告在这里不适用。
     */
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.src}
      srcSet={srcSet}
      // sizes 只在有 srcset 时有意义：没有候选集时它不影响任何选择。
      sizes={srcSet ? (sizes ?? DEFAULT_IMAGE_SIZES) : undefined}
      alt={image.alt ?? ""}
      width={hasIntrinsicSize ? image.width : undefined}
      height={hasIntrinsicSize ? image.height : undefined}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      className={className}
    />
  );
}
