import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { fontBody, fontHead, fontMono } from "@/lib/fonts";
import { SITE_URL } from "@/lib/seo/site";
import { Providers } from "./providers";
import "./globals.css";

// 字体基座统一在 lib/fonts.ts 定义（单一实例），此处以 CSS 变量注入：
// styles/theme.css 的 --font-sans / --font-display 与 globals.css 的 --font-mono 引用这些变量。

// metadataBase 供相对 URL（OG/canonical）解析为绝对地址。租户 /p 页面均自行
// 提供绝对 canonical/OG，故此处以主站为 base 不会影响其归属。
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Zap Bridge",
  description: "Build and publish high-converting landing pages on your own domain.",
  icons: { icon: "/brand-mark.svg" },
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
