// lib/images/optimizable.ts
//
// 落地页图片能否走 Vercel 图片优化（/_next/image）的唯一判据，以及 srcset 生成。
//
// # 为什么需要分流
//
// 租户图片的来源是**不受控的**：媒体库上传落在我们自己的 Blob，但用户也可以直接
// 贴任意外链。`/_next/image` 只接受 remotePatterns 白名单内的 host，命中不了的会
// 直接 400 —— 那是把「图有点大」换成「图打不开」，比不优化糟糕得多。
// 所以白名单内的走优化，其余原样输出 <img src>。
//
// # 为什么不是 next/image 组件
//
// next/image 非 fill 模式**必须**给 width/height，而 ImageRef 里这两个字段是后加的、
// 且历史数据大多没有。手工拼 srcset 则不需要知道原始尺寸：优化器按请求宽度缩放并
// 自动保持比例，于是**存量页面无需任何数据迁移就能立刻受益**。
//
// # ⚠️ 这里的常量必须与 next.config.ts 保持一致，故由本模块单一导出、由它 import
//
// 白名单写两份必然漂移：改了 next.config 而没改这里 → 优化静默失效（图还在，只是没优化）；
// 反过来 → 图片 400 打不开。两种都不会有人立刻发现。

/** 可走图片优化的 host 白名单，**next.config.ts 的 remotePatterns 由此生成**。 */
export const OPTIMIZABLE_IMAGE_HOSTS = [
  "lh3.googleusercontent.com",
  "*.public.blob.vercel-storage.com",
] as const;

/**
 * srcset 使用的宽度档位。
 *
 * ⚠️ **只能取 Next 的 `deviceSizes` 里已有的值**（默认
 * [640,750,828,1080,1200,1920,2048,3840]）——优化器会校验 `w`，不在表内直接 400。
 * 这里取五档覆盖手机到 2x 桌面；档位越多 CDN 上的变体越多，收益递减而成本递增。
 */
const SRCSET_WIDTHS = [640, 828, 1080, 1200, 1920] as const;

/**
 * 默认 sizes：落地页区块基本是「手机满宽、桌面受容器约束」。
 * 给不出精确值时这个保守估计也远好过没有 sizes（没有时浏览器按 100vw 取最大档）。
 */
export const DEFAULT_IMAGE_SIZES = "(max-width: 768px) 100vw, 1200px";

/** host 是否命中白名单（支持 `*.` 前缀的一级通配）。 */
export function isOptimizableImageSrc(src: string): boolean {
  let host: string;
  try {
    // 相对路径本来就同源，交给优化器没有意义也没有风险，统一按「不优化」处理。
    host = new URL(src).hostname.toLowerCase();
  } catch {
    return false;
  }
  return OPTIMIZABLE_IMAGE_HOSTS.some((pattern) => {
    if (pattern.startsWith("*.")) {
      const suffix = pattern.slice(1).toLowerCase(); // ".public.blob.vercel-storage.com"
      return host.length > suffix.length && host.endsWith(suffix);
    }
    return host === pattern.toLowerCase();
  });
}

/** 单个优化后的 URL。q 省略即用 Next 默认 75——`qualities` 默认只允许 75，传别的会 400。 */
export function optimizedImageUrl(src: string, width: number): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
}

/** 生成 srcset；host 不在白名单时返回 undefined，调用方据此退回原始 src。 */
export function optimizedSrcSet(src: string): string | undefined {
  if (!isOptimizableImageSrc(src)) return undefined;
  return SRCSET_WIDTHS.map((w) => `${optimizedImageUrl(src, w)} ${w}w`).join(", ");
}
