import type { Metadata } from "next";
import { Syne, Sora, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "./providers";
import "./globals.css";

// 全局字体基座（玫瑰智核）：正文 Sora、标题 Syne、等宽 JetBrains Mono。
// 以 CSS 变量注入，由 styles/theme.css 的 --font-sans / --font-display / --font-mono 引用。
const fontBody = Sora({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body", display: "swap" });
const fontHead = Syne({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-head", display: "swap" });
const fontMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono-app", display: "swap" });

export const metadata: Metadata = {
  title: "Zap Bridge",
  description: "Build and publish high-converting landing pages on your own domain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${fontBody.variable} ${fontHead.variable} ${fontMono.variable}`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
