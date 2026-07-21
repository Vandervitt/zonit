import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { fontBody, fontHead, fontMono } from "@/lib/fonts";
import { Providers } from "./providers";
import "./globals.css";

// 字体基座统一在 lib/fonts.ts 定义（单一实例），此处以 CSS 变量注入：
// styles/theme.css 的 --font-sans / --font-display 与 globals.css 的 --font-mono 引用这些变量。

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
