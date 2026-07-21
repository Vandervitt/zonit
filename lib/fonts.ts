import { Syne, Sora, JetBrains_Mono } from "next/font/google";

// 全局字体基座（玫瑰智核）：正文 Sora、标题 Syne、等宽 JetBrains Mono。
// 单一实例：根布局用 `.variable` 注入 CSS 变量（--font-body / --font-head / --font-mono-app），
// 首页营销组件复用同一实例的 `.className`。两处引用同一份，避免生成重复字体文件、消除重复下载。
export const fontBody = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const fontHead = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-head",
  display: "swap",
});

export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-app",
  display: "swap",
});
