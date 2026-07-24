/**
 * 品牌图标（单一事实源）。
 *
 * 图形本体只维护在 `public/brand-mark.svg` 一处：清澈蓝圆角底 + 白色 Zap 闪电，
 * 与首页顶部导航的品牌标识完全一致。所有需要品牌图标的位置都复用本组件，
 * 通过 `className`（Tailwind）控制尺寸与阴影，避免各处重复拼装渐变方块。
 */
export function BrandMark({ className }: { className?: string }) {
  // 品牌图标为自带配色的静态 SVG，用原生 <img> 引用单一源文件即可，无需 next/image 优化。
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand-mark.svg" alt="Zap Bridge" className={className} />;
}
