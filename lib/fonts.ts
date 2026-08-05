// 全站字体：改用系统字体栈，不再下载 Web 字体。
//
// 原方案是 next/font/google 拉 Sora / Syne / JetBrains Mono。换掉的理由：
// ① 构建与本地 dev 都依赖能连上 fonts.googleapis.com，断网或被墙时整站 500
//    （根布局引字体，首页也起不来），这在本地反复出现过；
// ② 大陆访客要额外等一次跨境字体请求；
// ③ 三款拉丁字体本就不含中文字形，后台与中文营销页的汉字一直在走系统字体——
//    也就是说「统一的品牌字体」这件事，在中文面从来没成立过。
//
// family 的实际取值在 styles/theme.css（--font-sans / --font-display）与
// app/globals.css（--font-mono）里定义；本文件只导出各页共用的工具类名，
// 让营销组件的 Fonts 契约保持不变。
import type { Fonts } from "@/components/marketing/chrome";

/**
 * 营销页共用的字体类名。
 *
 * 三个键指向 Tailwind 依 @theme 生成的工具类；display 与 body 目前解析到同一
 * 系统栈——系统字体里没有可靠可用的展示体，硬塞一个各平台长相差异过大的字体
 * 反而更糟。字重与字距仍由各处 class 控制，标题层级不受影响。
 */
export const fonts: Fonts = {
  display: "font-display",
  body: "font-sans",
  mono: "font-mono",
};
