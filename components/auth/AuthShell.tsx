import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";
import { LocaleSwitcher } from "@/components/marketing/LocaleSwitcher";
import { Routes } from "@/lib/constants";
import { localePath } from "@/lib/i18n/routes";
import type { Locale } from "@/lib/i18n/config";

/**
 * 登录/注册页的居中卡片外壳。
 * 英文侧由 app/(auth)/layout.tsx 提供，中文侧由 app/zh/(auth)/layout.tsx 提供——
 * 两处共用本组件，避免版式重复。
 *
 * 这两页没有站点导航，故在角落单独放语言切换器：落在英文登录页的中文用户
 * 否则没有任何切到中文的出口。
 */
export function AuthShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4 bg-gradient-to-br from-aqua-50 via-background to-tech-soft/20">
      {/* 粉色科技光晕装饰 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-glow-1/25 blur-3xl" />
        <div className="absolute -bottom-24 right-1/4 h-96 w-96 rounded-full bg-glow-2/20 blur-3xl" />
      </div>

      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-4 text-sm">
        <Link href={localePath(locale, Routes.Home)} className="flex items-center gap-2">
          <BrandMark className="h-6 w-6 rounded-md" />
          <span className="font-semibold text-foreground">Zap Bridge</span>
        </Link>
        <LocaleSwitcher
          locale={locale}
          className="rounded-lg px-3 py-1.5 text-muted-foreground transition-colors hover:text-aqua-700"
        />
      </div>

      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
