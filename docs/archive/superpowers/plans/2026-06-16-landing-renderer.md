# 落地页渲染器（从零重构）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于 `types/schema.draft.ts` 的 `LandingPageDraft`，从零构建一套纯展示型落地页渲染器，先用 `app/preview-next` 吃样例跑通。

**Architecture:** 新建隔离目录 `landing-renderer/`，与旧 `components/renderer/` 完全并存、零参考。组件全为纯展示（server 可渲染），唯一 client 小岛是倒计时。强调色由单一 `RendererTheme` 对象（字段全是写死的完整 Tailwind class 串）以 prop 向下传，整页一处换肤。section 分发用穷尽 `switch`（`never` 兜底，编译期保证覆盖全部 12 类）。

**Tech Stack:** Next.js 16（App Router）、React Server Components、TypeScript、Tailwind v4（`source(none)` + `@source '../**/*'`，无需改配置）、Playwright e2e。

**前置说明（测试策略）：** 本项目无单测 runner（vitest/jest），`*.test.ts` 为类型级测试靠 `tsc` 校验。纯展示组件不做低价值的标记断言单测；**逐组件验证 = `npx tsc --noEmit`**（穷尽 switch 与各 props 类型对齐由它保证），**端到端验收 = Playwright e2e**（`/preview-next` 200 + 关键文案可见）。

**约束：** Tailwind only（无自定义 CSS / 无内联 style）；强调色一律走主题对象里的完整 class 字面量，**严禁运行期拼接类名**；非交易（不得引入支付/结账/订单/订阅等概念，Plans 的 label/valueProps 仅展示文案）。当前分支 `preview`（非保护分支，可提交）；commit 用中文 Conventional Commits，**不带任何 AI 署名**。

---

## 文件结构

```
landing-renderer/
  theme.ts                      RendererTheme 接口 + tealEmerald 预置 + defaultTheme
  primitives/
    Img.tsx                     ImageRef -> <img loading=lazy>
    Media.tsx                   Media 联合类型（image|video）
    Badge.tsx                   Badge 渐变小标签
    Cta.tsx                     CtaButton 主/次按钮
    SectionHeading.tsx          统一 title(string|IconHeading)/subtitle
    SectionShell.tsx            区块外壳：容器宽度 + 纵向间距 + tone
  components/
    Countdown.tsx               "use client" 活倒计时小岛（dark/light 两态）
  sections/
    Hero.tsx Footer.tsx FloatingButton.tsx
    Stats.tsx Features.tsx Process.tsx Guarantee.tsx Trust.tsx Products.tsx
    Plans.tsx BeforeAfter.tsx Reviews.tsx Story.tsx CountdownBanner.tsx Faq.tsx
    index.tsx                   renderSection(section,theme,key) 穷尽 switch 分发
  LandingPage.tsx               组合器：Hero + sections.map + Footer + FloatingButton
app/preview-next/page.tsx       独立预览路由（吃样例）
e2e/preview-next.spec.ts        Playwright 冒烟
```

> 组件命名避开与 schema 接口同名：section 组件用 `Stats`/`Plans`/… ，倒计时区块用 `CountdownBanner`（区别于 client 小岛 `Countdown`）。

---

## Task 1: 主题常量 theme.ts

**Files:**
- Create: `landing-renderer/theme.ts`

- [ ] **Step 1: 写 theme.ts**

```ts
// landing-renderer/theme.ts
// 渲染器主题：字段值全部是写死的完整 Tailwind class 串。
// 换肤 = 另定义一个同形状对象。严禁运行期拼接类名（Tailwind JIT 扫不到）。
export interface RendererTheme {
  accentGradient: string;       // 实心渐变背景（CTA / 序号 / AFTER 角标 / 倒计时条 / 悬浮按钮）
  accentGradientHover: string;  // CTA hover
  accentShadow: string;         // CTA 投影
  accentTextGradient: string;   // 渐变文字（stats 数字）
  accentText: string;           // 强调文字（链接 / channel / ✓ / +）
  accentSoftBg: string;         // 浅底（badge / plan badge）
  accentSoftBorder: string;     // 浅边（badge）
  accentSoftText: string;       // 浅底上的强调文字
  accentIconBg: string;         // 特性图标渐变底
  glassCard: string;            // 暗色区块上的玻璃卡
}

export const tealEmerald: RendererTheme = {
  accentGradient: "bg-gradient-to-r from-teal-500 to-emerald-600",
  accentGradientHover: "hover:from-teal-600 hover:to-emerald-700",
  accentShadow: "shadow-lg shadow-teal-500/30",
  accentTextGradient: "bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent",
  accentText: "text-teal-600",
  accentSoftBg: "bg-teal-50",
  accentSoftBorder: "border-teal-200",
  accentSoftText: "text-teal-700",
  accentIconBg: "bg-gradient-to-br from-teal-100 to-emerald-100",
  glassCard: "border border-white/10 bg-white/5",
};

export const defaultTheme = tealEmerald;
```

- [ ] **Step 2: 类型校验**

Run: `npx tsc --noEmit`
Expected: PASS（无新增错误）

- [ ] **Step 3: 提交**

```bash
git add landing-renderer/theme.ts
git commit -m "feat(renderer): 新增渲染器主题常量与换肤接口"
```

---

## Task 2: 原子组件 primitives

**Files:**
- Create: `landing-renderer/primitives/Img.tsx`
- Create: `landing-renderer/primitives/Media.tsx`
- Create: `landing-renderer/primitives/Badge.tsx`
- Create: `landing-renderer/primitives/Cta.tsx`
- Create: `landing-renderer/primitives/SectionHeading.tsx`
- Create: `landing-renderer/primitives/SectionShell.tsx`

- [ ] **Step 1: Img.tsx**

```tsx
// landing-renderer/primitives/Img.tsx
import type { ImageRef } from "@/types/schema.draft";

export function Img({ image, className }: { image: ImageRef; className?: string }) {
  return <img src={image.src} alt={image.alt ?? ""} loading="lazy" className={className} />;
}
```

- [ ] **Step 2: Media.tsx**

```tsx
// landing-renderer/primitives/Media.tsx
import type { Media as MediaType } from "@/types/schema.draft";

export function Media({ media, className }: { media: MediaType; className?: string }) {
  if (media.type === "video") {
    return <video src={media.src} poster={media.poster} controls playsInline className={className} />;
  }
  return <img src={media.src} alt={media.alt ?? ""} loading="lazy" className={className} />;
}
```

- [ ] **Step 3: Badge.tsx**

```tsx
// landing-renderer/primitives/Badge.tsx
import type { Badge as BadgeType } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";

export function Badge({ badge, theme }: { badge: BadgeType; theme: RendererTheme }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${theme.accentSoftBg} ${theme.accentSoftBorder} ${theme.accentSoftText}`}>
      {badge.emoji && <span aria-hidden>{badge.emoji}</span>}
      {badge.text}
    </span>
  );
}
```

- [ ] **Step 4: Cta.tsx**

```tsx
// landing-renderer/primitives/Cta.tsx
import type { CtaButton } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";

export function Cta({ cta, theme, variant = "primary" }: { cta: CtaButton; theme: RendererTheme; variant?: "primary" | "secondary" }) {
  if (variant === "secondary") {
    return (
      <a href={cta.link} className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
        {cta.text}
      </a>
    );
  }
  return (
    <a href={cta.link} className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-white transition ${theme.accentGradient} ${theme.accentGradientHover} ${theme.accentShadow}`}>
      {cta.text}
    </a>
  );
}
```

- [ ] **Step 5: SectionHeading.tsx**

```tsx
// landing-renderer/primitives/SectionHeading.tsx
import type { IconHeading } from "@/types/schema.draft";

export function SectionHeading({ title, subtitle }: { title: string | IconHeading; subtitle?: string }) {
  const text = typeof title === "string" ? title : title.text;
  const icon = typeof title === "string" ? undefined : title.icon;
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
        {icon && <span className="mr-2" aria-hidden>{icon}</span>}
        {text}
      </h2>
      {subtitle && <p className="mt-2 text-sm text-slate-500 sm:text-base">{subtitle}</p>}
    </div>
  );
}
```

- [ ] **Step 6: SectionShell.tsx**

```tsx
// landing-renderer/primitives/SectionShell.tsx
import type { ReactNode } from "react";

export function SectionShell({ children, tone = "light", className }: { children: ReactNode; tone?: "light" | "muted"; className?: string }) {
  const toneClass = tone === "muted" ? "bg-slate-50" : "bg-white";
  return (
    <section className={`${toneClass} ${className ?? ""}`}>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6">{children}</div>
    </section>
  );
}
```

- [ ] **Step 7: 类型校验 + lint**

Run: `npx tsc --noEmit && pnpm lint`
Expected: PASS

- [ ] **Step 8: 提交**

```bash
git add landing-renderer/primitives
git commit -m "feat(renderer): 新增图片/媒体/徽章/CTA/标题/外壳等原子组件"
```

---

## Task 3: 倒计时 client 小岛 Countdown

**Files:**
- Create: `landing-renderer/components/Countdown.tsx`

- [ ] **Step 1: Countdown.tsx**

```tsx
// landing-renderer/components/Countdown.tsx
"use client";
import { useEffect, useState } from "react";

type Parts = { d: number; h: number; m: number; s: number };

function diff(target: number): Parts {
  const ms = Math.max(0, target - Date.now());
  const s = Math.floor(ms / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

export function Countdown({ endsAt, tone = "dark" }: { endsAt: string; tone?: "dark" | "light" }) {
  const target = new Date(endsAt).getTime();
  const [parts, setParts] = useState<Parts | null>(null);

  useEffect(() => {
    if (Number.isNaN(target)) return;
    setParts(diff(target));
    const id = setInterval(() => setParts(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (Number.isNaN(target)) return null;
  const p = parts ?? diff(target);
  const cellCls = tone === "light" ? "bg-slate-100 text-slate-900" : "bg-white/10 text-white";
  const labelCls = tone === "light" ? "text-slate-500" : "text-white/60";
  const cell = (v: number, label: string) => (
    <div className={`flex flex-col items-center rounded-lg px-3 py-2 ${cellCls}`}>
      <span className="text-xl font-extrabold tabular-nums">{String(v).padStart(2, "0")}</span>
      <span className={`text-[10px] uppercase ${labelCls}`}>{label}</span>
    </div>
  );

  return (
    <div className="flex justify-center gap-2">
      {cell(p.d, "days")}
      {cell(p.h, "hrs")}
      {cell(p.m, "min")}
      {cell(p.s, "sec")}
    </div>
  );
}
```

- [ ] **Step 2: 类型校验**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add landing-renderer/components/Countdown.tsx
git commit -m "feat(renderer): 新增倒计时 client 小岛（支持暗/亮两态）"
```

---

## Task 4: 顶层单例 Hero / Footer / FloatingButton

**Files:**
- Create: `landing-renderer/sections/Hero.tsx`
- Create: `landing-renderer/sections/Footer.tsx`
- Create: `landing-renderer/sections/FloatingButton.tsx`

- [ ] **Step 1: Hero.tsx**

```tsx
// landing-renderer/sections/Hero.tsx
import type { HeroSection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { Img } from "../primitives/Img";
import { Media } from "../primitives/Media";
import { Badge } from "../primitives/Badge";
import { Cta } from "../primitives/Cta";

export function Hero({ data, theme }: { data: HeroSection; theme: RendererTheme }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      {data.backgroundImage && (
        <Img image={data.backgroundImage} className="absolute inset-0 h-full w-full object-cover opacity-15" />
      )}
      <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-6">
        {data.badge && <Badge badge={data.badge} theme={theme} />}
        <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
          {data.title}
        </h1>
        {data.subtitle && <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">{data.subtitle}</p>}
        <div className="mt-7 flex flex-wrap gap-3">
          <Cta cta={data.cta} theme={theme} />
          {data.secondaryCta && <Cta cta={data.secondaryCta} theme={theme} variant="secondary" />}
        </div>
        {data.endorsementText && <p className="mt-4 text-sm text-slate-500">{data.endorsementText}</p>}
        {data.showcase && <Media media={data.showcase} className="mt-10 w-full rounded-2xl object-cover shadow-xl" />}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Footer.tsx**

```tsx
// landing-renderer/sections/Footer.tsx
import type { FooterSection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";

export function Footer({ data, theme }: { data: FooterSection; theme: RendererTheme }) {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6">
        <div className="text-lg font-bold text-white">{data.brandName}</div>
        <p className="mt-3 max-w-2xl text-xs leading-relaxed">{data.privacyPolicy}</p>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed">{data.termsOfService}</p>
        <a href={`mailto:${data.contactEmail}`} className={`mt-4 inline-block text-xs ${theme.accentText}`}>
          {data.contactEmail}
        </a>
        <div className="mt-6 text-[11px] text-slate-500">© {data.copyrightYear} {data.brandName}</div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: FloatingButton.tsx**

```tsx
// landing-renderer/sections/FloatingButton.tsx
import type { FloatingButton as FloatingButtonData } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";

export function FloatingButton({ data, theme }: { data: FloatingButtonData; theme: RendererTheme }) {
  return (
    <a href={data.link} className={`fixed bottom-5 right-5 z-50 inline-flex items-center rounded-full px-5 py-3 text-sm font-bold text-white ${theme.accentGradient} ${theme.accentShadow}`}>
      {data.text}
    </a>
  );
}
```

- [ ] **Step 4: 类型校验**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add landing-renderer/sections/Hero.tsx landing-renderer/sections/Footer.tsx landing-renderer/sections/FloatingButton.tsx
git commit -m "feat(renderer): 新增首屏/页脚/悬浮按钮三个顶层单例"
```

---

## Task 5: 简单 section（Stats / Features / Process / Guarantee / Trust / Products）

**Files:**
- Create: `landing-renderer/sections/Stats.tsx`
- Create: `landing-renderer/sections/Features.tsx`
- Create: `landing-renderer/sections/Process.tsx`
- Create: `landing-renderer/sections/Guarantee.tsx`
- Create: `landing-renderer/sections/Trust.tsx`
- Create: `landing-renderer/sections/Products.tsx`

- [ ] **Step 1: Stats.tsx**

```tsx
// landing-renderer/sections/Stats.tsx
import type { StatsSection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";

export function Stats({ data, theme }: { data: StatsSection; theme: RendererTheme }) {
  return (
    <section className="bg-slate-900">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{data.title}</h2>
          {data.subtitle && <p className="mt-2 text-sm text-slate-400">{data.subtitle}</p>}
        </div>
        {data.items.length > 0 && (
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {data.items.map((it, i) => (
              <div key={i} className={`rounded-2xl p-5 text-center ${theme.glassCard}`}>
                {it.icon && <div className="text-lg">{it.icon}</div>}
                <div className={`mt-1 text-3xl font-extrabold ${theme.accentTextGradient}`}>{it.value}</div>
                <div className="mt-1 text-xs text-slate-400">{it.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Features.tsx**

```tsx
// landing-renderer/sections/Features.tsx
import type { FeaturesSection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { SectionShell } from "../primitives/SectionShell";
import { SectionHeading } from "../primitives/SectionHeading";

export function Features({ data, theme }: { data: FeaturesSection; theme: RendererTheme }) {
  return (
    <SectionShell>
      <SectionHeading title={data.title} subtitle={data.subtitle} />
      {data.items.length > 0 && (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {data.items.map((it, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 p-5">
              {it.icon && (
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${theme.accentIconBg}`}>{it.icon}</div>
              )}
              <h3 className="mt-4 text-sm font-bold text-slate-900">{it.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{it.description}</p>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
```

- [ ] **Step 3: Process.tsx**

```tsx
// landing-renderer/sections/Process.tsx
import type { ProcessSection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { SectionShell } from "../primitives/SectionShell";
import { SectionHeading } from "../primitives/SectionHeading";
import { Img } from "../primitives/Img";

export function Process({ data, theme }: { data: ProcessSection; theme: RendererTheme }) {
  return (
    <SectionShell tone="muted">
      <SectionHeading title={data.title} subtitle={data.subtitle} />
      {data.steps.length > 0 && (
        <ol className="mx-auto mt-10 grid max-w-3xl gap-3">
          {data.steps.map((s, i) => (
            <li key={i} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${theme.accentGradient}`}>{i + 1}</span>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">{s.title}</h3>
                <p className="text-xs text-slate-500">{s.description}</p>
              </div>
              {s.image && <Img image={s.image} className="h-12 w-12 shrink-0 rounded-lg object-cover" />}
            </li>
          ))}
        </ol>
      )}
    </SectionShell>
  );
}
```

- [ ] **Step 4: Guarantee.tsx**

```tsx
// landing-renderer/sections/Guarantee.tsx
import type { GuaranteeSection } from "@/types/schema.draft";
import { SectionShell } from "../primitives/SectionShell";
import { SectionHeading } from "../primitives/SectionHeading";

export function Guarantee({ data }: { data: GuaranteeSection }) {
  return (
    <SectionShell>
      <SectionHeading title={data.title} subtitle={data.subtitle ?? data.description} />
      {data.items.length > 0 && (
        <div className="mx-auto mt-10 grid max-w-3xl gap-5 sm:grid-cols-2">
          {data.items.map((it, i) => (
            <div key={i} className="flex items-start gap-3">
              {it.icon && <span className="text-xl">{it.icon}</span>}
              <div>
                <h3 className="text-sm font-bold text-slate-900">{it.title}</h3>
                {it.subtitle && <p className="text-xs text-slate-500">{it.subtitle}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
```

- [ ] **Step 5: Trust.tsx**

```tsx
// landing-renderer/sections/Trust.tsx
import type { TrustSection } from "@/types/schema.draft";
import { Img } from "../primitives/Img";

export function Trust({ data }: { data: TrustSection }) {
  return (
    <section className="relative overflow-hidden bg-slate-900">
      {data.backgroundImage && (
        <Img image={data.backgroundImage} className="absolute inset-0 h-full w-full object-cover opacity-20" />
      )}
      <div className="relative mx-auto max-w-6xl px-5 py-14 sm:px-6">
        {data.badges.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-3">
            {data.badges.map((b, i) => (
              <div key={i} className="text-center text-white">
                {b.icon && <div className="text-2xl">{b.icon}</div>}
                <h3 className="mt-2 text-sm font-bold">{b.title}</h3>
                {b.subtitle && <p className="text-xs text-white/60">{b.subtitle}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Products.tsx**

```tsx
// landing-renderer/sections/Products.tsx
import type { ProductsSection } from "@/types/schema.draft";
import { SectionShell } from "../primitives/SectionShell";
import { SectionHeading } from "../primitives/SectionHeading";
import { Img } from "../primitives/Img";

export function Products({ data }: { data: ProductsSection }) {
  return (
    <SectionShell>
      <SectionHeading title={data.title} subtitle={data.subtitle} />
      {data.items.length > 0 && (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((it, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-slate-200">
              {it.backgroundImage && <Img image={it.backgroundImage} className="h-40 w-full object-cover" />}
              <div className="p-5">
                <h3 className="text-sm font-bold text-slate-900">{it.name}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{it.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
```

- [ ] **Step 7: 类型校验 + lint**

Run: `npx tsc --noEmit && pnpm lint`
Expected: PASS

- [ ] **Step 8: 提交**

```bash
git add landing-renderer/sections/Stats.tsx landing-renderer/sections/Features.tsx landing-renderer/sections/Process.tsx landing-renderer/sections/Guarantee.tsx landing-renderer/sections/Trust.tsx landing-renderer/sections/Products.tsx
git commit -m "feat(renderer): 新增数据/特性/流程/保障/信任/产品六类区块"
```

---

## Task 6: 复杂 section（Plans / BeforeAfter / Reviews / Story / CountdownBanner / Faq）

**Files:**
- Create: `landing-renderer/sections/Plans.tsx`
- Create: `landing-renderer/sections/BeforeAfter.tsx`
- Create: `landing-renderer/sections/Reviews.tsx`
- Create: `landing-renderer/sections/Story.tsx`
- Create: `landing-renderer/sections/CountdownBanner.tsx`
- Create: `landing-renderer/sections/Faq.tsx`

- [ ] **Step 1: Plans.tsx**（非交易：label/valueProps 仅展示文案）

```tsx
// landing-renderer/sections/Plans.tsx
import type { PlansSection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { SectionShell } from "../primitives/SectionShell";
import { SectionHeading } from "../primitives/SectionHeading";
import { Cta } from "../primitives/Cta";
import { Countdown } from "../components/Countdown";

export function Plans({ data, theme }: { data: PlansSection; theme: RendererTheme }) {
  return (
    <SectionShell>
      <SectionHeading title={data.title} subtitle={data.subtitle} />
      {data.items.length > 0 && (
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {data.items.map((p, i) => (
            <div key={i} className="flex flex-col rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                {p.badge && (
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${theme.accentSoftBg} ${theme.accentSoftText}`}>{p.badge}</span>
                )}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{p.description}</p>
              {p.label && <div className={`mt-4 text-sm font-bold ${theme.accentText}`}>{p.label}</div>}
              {p.valueProps.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {p.valueProps.map((v, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className={theme.accentText}>✓</span>
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              )}
              {p.countdown && (
                <div className="mt-4">
                  <Countdown endsAt={p.countdown.endsAt} tone="light" />
                </div>
              )}
              <div className="mt-6 pt-2">
                <Cta cta={p.cta} theme={theme} />
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
```

- [ ] **Step 2: BeforeAfter.tsx**

```tsx
// landing-renderer/sections/BeforeAfter.tsx
import type { BeforeAfterSection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { SectionShell } from "../primitives/SectionShell";
import { SectionHeading } from "../primitives/SectionHeading";
import { Img } from "../primitives/Img";

export function BeforeAfter({ data, theme }: { data: BeforeAfterSection; theme: RendererTheme }) {
  return (
    <SectionShell>
      <SectionHeading title={data.title} subtitle={data.subtitle} />
      {data.items.length > 0 && (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {data.items.map((it, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-2">
                <div className="relative">
                  <Img image={it.beforeImage} className="h-44 w-full object-cover" />
                  <span className="absolute bottom-2 left-2 rounded bg-slate-900/70 px-2 py-0.5 text-[10px] font-semibold text-white">BEFORE</span>
                </div>
                <div className="relative">
                  <Img image={it.afterImage} className="h-44 w-full object-cover" />
                  <span className={`absolute bottom-2 left-2 rounded px-2 py-0.5 text-[10px] font-semibold text-white ${theme.accentGradient}`}>AFTER</span>
                </div>
              </div>
              <div className="p-4">
                <div className="text-sm font-bold text-slate-900">{it.crmName} · {it.duration}</div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{it.caseDescription}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {data.disclaimer && (
        <p className="mx-auto mt-8 max-w-3xl text-center text-[11px] leading-relaxed text-slate-400">{data.disclaimer}</p>
      )}
    </SectionShell>
  );
}
```

- [ ] **Step 3: Reviews.tsx**

```tsx
// landing-renderer/sections/Reviews.tsx
import type { ReviewsSection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { SectionShell } from "../primitives/SectionShell";
import { SectionHeading } from "../primitives/SectionHeading";
import { Img } from "../primitives/Img";

export function Reviews({ data, theme }: { data: ReviewsSection; theme: RendererTheme }) {
  return (
    <SectionShell tone="muted">
      <SectionHeading title={data.title} subtitle={data.subtitle ?? data.description} />
      {data.items.length > 0 && (
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {data.items.map((it, i) => (
            <figure key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
              <blockquote className="text-sm italic leading-relaxed text-slate-700">“{it.content.text}”</blockquote>
              {it.content.image && <Img image={it.content.image} className="mt-3 w-full rounded-lg object-cover" />}
              <figcaption className="mt-4 flex items-center gap-2">
                {it.avatar && <Img image={it.avatar} className="h-8 w-8 rounded-full object-cover" />}
                <span className="text-xs text-slate-500">
                  <span className="font-bold text-slate-800">{it.name}</span>
                  {it.location && <> · {it.location}</>}
                  {it.channel && <span className={theme.accentText}> · {it.channel}</span>}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
```

- [ ] **Step 4: Story.tsx**

```tsx
// landing-renderer/sections/Story.tsx
import type { StorySection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { Img } from "../primitives/Img";

export function Story({ data, theme }: { data: StorySection; theme: RendererTheme }) {
  return (
    <section className="relative overflow-hidden bg-slate-900">
      {data.backgroundImage && (
        <Img image={data.backgroundImage} className="absolute inset-0 h-full w-full object-cover opacity-25" />
      )}
      <div className="relative mx-auto max-w-3xl px-5 py-20 text-white sm:px-6">
        {data.subtitle && <div className={`text-sm font-semibold ${theme.accentText}`}>{data.subtitle}</div>}
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{data.title}</h2>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">{data.body}</p>
        {(data.signatureName || data.signatureRole) && (
          <div className="mt-6 text-sm">
            {data.signatureName && <span className="font-bold">{data.signatureName}</span>}
            {data.signatureRole && <span className="text-slate-400"> · {data.signatureRole}</span>}
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: CountdownBanner.tsx**

```tsx
// landing-renderer/sections/CountdownBanner.tsx
import type { CountdownSection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { Countdown } from "../components/Countdown";

export function CountdownBanner({ data, theme }: { data: CountdownSection; theme: RendererTheme }) {
  return (
    <section className={theme.accentGradient}>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-5 py-14 text-center text-white sm:px-6">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {data.title.icon && <span className="mr-2" aria-hidden>{data.title.icon}</span>}
          {data.title.text}
        </h2>
        {data.subtitle && <p className="text-sm text-white/80">{data.subtitle}</p>}
        <Countdown endsAt={data.endsAt} />
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Faq.tsx**（原生 `<details>`，无需 JS）

```tsx
// landing-renderer/sections/Faq.tsx
import type { FaqSection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { SectionShell } from "../primitives/SectionShell";

export function Faq({ data, theme }: { data: FaqSection; theme: RendererTheme }) {
  return (
    <SectionShell tone="muted">
      <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
        {data.title.icon && <span className="mr-2" aria-hidden>{data.title.icon}</span>}
        {data.title.text}
      </h2>
      {data.subtitle && <p className="mt-2 text-center text-sm text-slate-500">{data.subtitle}</p>}
      {data.items.length > 0 && (
        <div className="mx-auto mt-8 max-w-2xl space-y-2.5">
          {data.items.map((it, i) => (
            <details key={i} className="group rounded-xl border border-slate-200 bg-white p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-slate-900">
                {it.question}
                <span className={`ml-2 transition group-open:rotate-45 ${theme.accentText}`}>+</span>
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{it.answer}</p>
            </details>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
```

- [ ] **Step 7: 类型校验 + lint**

Run: `npx tsc --noEmit && pnpm lint`
Expected: PASS

- [ ] **Step 8: 提交**

```bash
git add landing-renderer/sections/Plans.tsx landing-renderer/sections/BeforeAfter.tsx landing-renderer/sections/Reviews.tsx landing-renderer/sections/Story.tsx landing-renderer/sections/CountdownBanner.tsx landing-renderer/sections/Faq.tsx
git commit -m "feat(renderer): 新增套餐/前后对比/评价/故事/倒计时/常见问题六类区块"
```

---

## Task 7: section 分发器 sections/index.tsx（穷尽 switch）

**Files:**
- Create: `landing-renderer/sections/index.tsx`

- [ ] **Step 1: index.tsx**

```tsx
// landing-renderer/sections/index.tsx
// 按 section.type 分发到对应区块组件。switch 为穷尽匹配：
// 新增 LandingSectionType 而未在此补 case 时，assertNever 会触发编译错误。
import type { LandingSection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { Stats } from "./Stats";
import { Plans } from "./Plans";
import { Products } from "./Products";
import { BeforeAfter } from "./BeforeAfter";
import { Process } from "./Process";
import { Trust } from "./Trust";
import { Features } from "./Features";
import { Reviews } from "./Reviews";
import { Story } from "./Story";
import { CountdownBanner } from "./CountdownBanner";
import { Faq } from "./Faq";
import { Guarantee } from "./Guarantee";

function assertNever(x: never): null {
  void x;
  return null;
}

export function renderSection(section: LandingSection, theme: RendererTheme, key: number) {
  switch (section.type) {
    case "stats":       return <Stats key={key} data={section.data} theme={theme} />;
    case "plans":       return <Plans key={key} data={section.data} theme={theme} />;
    case "products":    return <Products key={key} data={section.data} />;
    case "beforeAfter": return <BeforeAfter key={key} data={section.data} theme={theme} />;
    case "process":     return <Process key={key} data={section.data} theme={theme} />;
    case "trust":       return <Trust key={key} data={section.data} />;
    case "features":    return <Features key={key} data={section.data} theme={theme} />;
    case "reviews":     return <Reviews key={key} data={section.data} theme={theme} />;
    case "story":       return <Story key={key} data={section.data} theme={theme} />;
    case "countdown":   return <CountdownBanner key={key} data={section.data} theme={theme} />;
    case "faq":         return <Faq key={key} data={section.data} theme={theme} />;
    case "guarantee":   return <Guarantee key={key} data={section.data} />;
    default:            return assertNever(section);
  }
}
```

- [ ] **Step 2: 类型校验（验证穷尽性）**

Run: `npx tsc --noEmit`
Expected: PASS（若漏 case，`assertNever(section)` 会报 `Argument of type ... is not assignable to parameter of type 'never'`）

- [ ] **Step 3: 提交**

```bash
git add landing-renderer/sections/index.tsx
git commit -m "feat(renderer): 新增 section 穷尽分发器"
```

---

## Task 8: 组合器 LandingPage.tsx

**Files:**
- Create: `landing-renderer/LandingPage.tsx`

- [ ] **Step 1: LandingPage.tsx**

```tsx
// landing-renderer/LandingPage.tsx
// 渲染器入口：首屏 + 可排序 sections（数组顺序即页面顺序）+ 页脚 + 悬浮按钮。
// theme 缺省 defaultTheme；传入其他 RendererTheme 即整页换肤。
import type { LandingPageDraft } from "@/types/schema.draft";
import { defaultTheme, type RendererTheme } from "./theme";
import { Hero } from "./sections/Hero";
import { Footer } from "./sections/Footer";
import { FloatingButton } from "./sections/FloatingButton";
import { renderSection } from "./sections";

export function LandingPage({ page, theme = defaultTheme }: { page: LandingPageDraft; theme?: RendererTheme }) {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Hero data={page.hero} theme={theme} />
      {page.sections.map((section, i) => renderSection(section, theme, i))}
      <Footer data={page.footer} theme={theme} />
      {page.floatingButton && <FloatingButton data={page.floatingButton} theme={theme} />}
    </div>
  );
}
```

- [ ] **Step 2: 类型校验**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add landing-renderer/LandingPage.tsx
git commit -m "feat(renderer): 新增渲染器组合器 LandingPage"
```

---

## Task 9: 预览路由 + e2e 冒烟 + 全量验收

**Files:**
- Create: `app/preview-next/page.tsx`
- Create: `e2e/preview-next.spec.ts`

- [ ] **Step 1: 写 e2e 冒烟（先失败）**

```ts
// e2e/preview-next.spec.ts
import { test, expect } from "@playwright/test";

test.describe("preview-next 渲染器冒烟", () => {
  test("整页渲染样例关键内容", async ({ page }) => {
    const res = await page.goto("/preview-next");
    expect(res?.status()).toBe(200);
    // Hero 主标题（样例：Skincare that actually fits your skin）
    await expect(page.getByRole("heading", { name: /Skincare that actually fits/i })).toBeVisible();
    // Footer 品牌名
    await expect(page.getByText("Aurae Skincare").first()).toBeVisible();
    // FAQ 标题
    await expect(page.getByText("Frequently asked questions")).toBeVisible();
  });
});
```

- [ ] **Step 2: 运行 e2e 验证失败**

Run: `pnpm test:e2e e2e/preview-next.spec.ts`
Expected: FAIL（`/preview-next` 404，断言不通过）

- [ ] **Step 3: 写预览路由**

```tsx
// app/preview-next/page.tsx
// 独立预览路由：用样例数据驱动新渲染器（不接编辑器 / 数据库）。
import { LandingPage } from "@/landing-renderer/LandingPage";
import { skincareConsultDraft } from "@/landing-editor/samples/skincareConsultDraft";

export default function PreviewNextPage() {
  return <LandingPage page={skincareConsultDraft} />;
}
```

- [ ] **Step 4: 运行 e2e 验证通过**

Run: `pnpm test:e2e e2e/preview-next.spec.ts`
Expected: PASS

- [ ] **Step 5: 全量门禁**

Run: `npx tsc --noEmit && pnpm lint && pnpm build`
Expected: 三者均 PASS（build 应包含 `/preview-next` 路由，且 `Countdown` 被标记为 client 边界）

- [ ] **Step 6: 提交**

```bash
git add app/preview-next/page.tsx e2e/preview-next.spec.ts
git commit -m "feat(renderer): 新增 /preview-next 预览路由与渲染器冒烟用例"
```

---

## Task 10: 换肤机制验收（临时验证后还原）

**目的：** 证明「整页一处换肤」机制可用——临时传入第二套主题，确认全页强调色变化，再还原。

**Files:**
- Modify: `app/preview-next/page.tsx`（临时，最终还原）

- [ ] **Step 1: 临时加一套紫色主题并传入**

在 `app/preview-next/page.tsx` 临时改为：

```tsx
import { LandingPage } from "@/landing-renderer/LandingPage";
import { skincareConsultDraft } from "@/landing-editor/samples/skincareConsultDraft";
import type { RendererTheme } from "@/landing-renderer/theme";

const violet: RendererTheme = {
  accentGradient: "bg-gradient-to-r from-violet-500 to-fuchsia-600",
  accentGradientHover: "hover:from-violet-600 hover:to-fuchsia-700",
  accentShadow: "shadow-lg shadow-violet-500/30",
  accentTextGradient: "bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent",
  accentText: "text-violet-600",
  accentSoftBg: "bg-violet-50",
  accentSoftBorder: "border-violet-200",
  accentSoftText: "text-violet-700",
  accentIconBg: "bg-gradient-to-br from-violet-100 to-fuchsia-100",
  glassCard: "border border-white/10 bg-white/5",
};

export default function PreviewNextPage() {
  return <LandingPage page={skincareConsultDraft} theme={violet} />;
}
```

- [ ] **Step 2: 启动并人工核对换肤**

Run: `pnpm dev`，浏览器访问 `http://localhost:3001/preview-next`
Expected: 首屏 CTA、Stats 渐变数字、Process 序号、BeforeAfter 的 AFTER 角标、倒计时条、悬浮按钮等强调色**整页变为紫色**（证明仅改一处主题即可换肤）。

- [ ] **Step 3: 还原为默认主题**

将 `app/preview-next/page.tsx` 还原为 Task 9 Step 3 的版本（去掉 `violet` 与 `theme` 传参）。

- [ ] **Step 4: 复核门禁**

Run: `npx tsc --noEmit && pnpm lint`
Expected: PASS；`git diff app/preview-next/page.tsx` 无残留临时代码

- [ ] **Step 5: 提交（若还原后有差异则跳过）**

```bash
git add app/preview-next/page.tsx
git commit -m "chore(renderer): 还原预览路由默认主题（换肤机制验收完成）" || true
```

---

## 计划自审

- **spec 覆盖：** 范围(C 起步/preview-next)=T9；复用性(纯展示/server)=T1–T8 全程；主题换肤=T1+T10；目录隔离=文件结构；视觉(B+C/青绿)=各 section；client/server(仅 Countdown)=T3；图片(原生 img)=Img/Media；第 8 节各模块版式=T4–T6 全 14 类 + 顶层单例；Tailwind-only/非交易=约束段 + Plans 注释；验证(200/tsc/eslint/build/换肤)=T9+T10。无遗漏。
- **占位扫描：** 无 TBD/TODO；每个改代码的 step 均含完整代码与运行命令。
- **类型一致性：** `RendererTheme` 字段集在 T1 定义，T2–T6 引用一致；section 组件名 `Stats/Plans/Products/BeforeAfter/Process/Trust/Features/Reviews/Story/CountdownBanner/Faq/Guarantee` 在 T5/T6 定义、T7 分发器引用一致；`Countdown`(island, tone 参数) 在 T3 定义、Plans(tone="light")/CountdownBanner(默认 dark) 引用一致；`renderSection(section,theme,key)` 在 T7 定义、T8 调用一致；`LandingPage({page,theme})` 在 T8 定义、T9 使用一致。
```
