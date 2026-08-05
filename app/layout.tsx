import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_URL } from "@/lib/seo/site";
import { Providers } from "./providers";
import "./globals.css";

// 字体为系统字体栈，family 直接定义在 styles/theme.css / app/globals.css，
// 根布局不再注入任何字体变量（原先是 next/font 的 .variable，见 lib/fonts.ts）。

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
