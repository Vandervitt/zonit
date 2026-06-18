# 落地页追踪闭环（首刀）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让发布的落地页支持「多方 Pixel 注入 + page_view/cta_click 埋点 + UTM 捕获透传 + 最小 CMP opt-in 同意」，全部围绕核心 schema `types/schema.draft.ts`，纯客户端闭环。

**Architecture:** `LandingPageDraft` 加顶层 `tracking`；公开页 `app/p/[slug]` 用客户端 `TrackingProvider` 包裹现有渲染器，做 UTM 捕获 → 同意门控 → Pixel 注入与发火 → CTA 委托监听；事件经 `EventSink` 抽象广播（首刀只实现 `PixelSink`，预留 first-party 采集扩展点）；编辑器工具栏加「追踪」面板配置。

**Tech Stack:** Next.js App Router（魔改版，写代码前读 `node_modules/next/dist/docs/`）、React 客户端组件、`next/script`、TypeScript、Tailwind only、Playwright（E2E）。

**关于测试：** 本仓库**无单元测试运行器**（仅 `npm run test:e2e` 为 Playwright；`docs/constraints/testing-and-validation.md` 要求「避免写 specs、偏好 happy-path」）。因此纯逻辑用**临时 `tsx` 校验脚本**（在仓库根建 `_check_*.ts`，跑完即删）验证 RED→GREEN，集成层用 `npx tsc --noEmit` + `npm run lint`（只看本次改动文件 0 错）+ 浏览器 E2E。**不要引入 jest/vitest。**

**前置（执行第一步前先做一次）：** 当前应在分支 `docs_20260618_落地页追踪spec` 或另开特性分支；**严禁在 main 上改动**。若在 main，先 `git checkout main && git pull --ff-only && git checkout -b feat_20260618_落地页追踪闭环`。提交信息用中文 Conventional Commits、**禁止任何 AI 署名**。

---

## 文件结构总览

**新建**
- `landing-renderer/tracking/utm.ts` — UTM 解析与合并到 URL（纯函数）
- `landing-renderer/tracking/events.ts` — 内部事件类型、事件→平台映射表、渠道推断（纯函数/常量）
- `landing-renderer/tracking/sinks.ts` — `EventSink` 接口与 `PixelSink` 实现（含 SDK 注入）
- `landing-renderer/tracking/ConsentBar.tsx` — 最小同意条（客户端）
- `landing-renderer/tracking/TrackingProvider.tsx` — 运行期编排（客户端）
- `landing-editor/components/TrackingPanel.tsx` — 编辑器「追踪」配置面板（客户端）
- `landing-editor/lib/trackingIssues.ts` — `tracking` 字段的发布门禁校验

**修改**
- `types/schema.draft.ts` — 加 `PixelProvider`/`PixelConfig`/`PageTracking` 与 `LandingPageDraft.tracking?`
- `landing-editor/store/defaults.ts` — 加 `createTracking()`
- `landing-editor/store/editorStore.tsx` — `EditorState.tracking`、`updateTracking` action、`toDraft` 输出 tracking
- `landing-editor/sampleDraft.ts` — `fromDraft` 注入 `tracking`
- `landing-editor/components/EditorToolbar.tsx` — 加「追踪」按钮，打开 `TrackingPanel`
- `landing-editor/lib/publishIssues.ts` — `collectPublishIssues` 合并 `collectTrackingIssues`
- `landing-renderer/primitives/Cta.tsx` — CTA `<a>` 加 `data-cta`
- `landing-renderer/sections/FloatingButton.tsx` — 悬浮按钮 `<a>` 加 `data-cta`
- `app/p/[slug]/page.tsx` — 用 `TrackingProvider` 包裹 `<LandingPage>`

---

## Task 1：schema 新增 tracking 类型

**Files:**
- Modify: `types/schema.draft.ts`（在「页面组合」`LandingPageDraft` 定义附近，约 244-270 行）

- [ ] **Step 1: 在 `LandingPageDraft` 定义之前插入追踪类型**

在 `// ============ 页面组合 ============` 区块上方插入：

```ts
// ============ 页面级追踪（Pixel / UTM / 同意）============
// 事件名不进 schema：内部事件→各平台标准事件映射为代码内置常量（见 landing-renderer/tracking/events.ts），
// 用户只填 Pixel ID，从根上杜绝越界交易事件名（非交易硬约束）。

/** 支持的 Pixel 平台（首刀 4 家；扩展只需在此与映射表增项）。 */
export type PixelProvider = 'meta' | 'ga4' | 'googleAds' | 'tiktok';

/** 单平台 Pixel 配置：用户只填 ID。 */
export interface PixelConfig {
  provider: PixelProvider;
  id: string;        // Pixel / Measurement / Conversion ID
  enabled: boolean;  // 关闭则不注入（保留已填 ID）
}

/** 页面级追踪配置。 */
export interface PageTracking {
  pixels: PixelConfig[];        // 多方 pixel，按 provider 去重
  utmPassthrough: boolean;      // 是否把 UTM 拼到 http(s) 外链 CTA
  consent: {
    enabled: boolean;           // 是否显示同意条并做 opt-in 门控
    text?: string;              // 同意条文案（留空用默认）
  };
}
```

- [ ] **Step 2: 给 `LandingPageDraft` 加可选字段**

在 `LandingPageDraft` 接口内 `floatingButton?: FloatingButton;` 之后加一行：

```ts
  tracking?: PageTracking;          // 页面级追踪配置（缺省视为无 pixel）
```

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit 2>&1 | grep -E "schema.draft" ; echo "exit:$?"`
Expected: 无 `schema.draft` 相关报错（grep 无输出）。

- [ ] **Step 4: Commit**

```bash
git add types/schema.draft.ts
git commit -m "feat(schema): LandingPageDraft 新增页面级 tracking 配置类型"
```

---

## Task 2：UTM 纯函数

**Files:**
- Create: `landing-renderer/tracking/utm.ts`

- [ ] **Step 1: 写校验脚本（RED）**

在仓库根建 `_check_utm.ts`：

```ts
import { parseUtm, mergeUtmIntoUrl } from "@/landing-renderer/tracking/utm";

const u = parseUtm("?utm_source=fb&utm_medium=cpc&gclid=abc&foo=bar");
console.log("parse:", JSON.stringify(u)); // 期望只含 utm_source/utm_medium/gclid

console.log("http 合并:", mergeUtmIntoUrl("https://book.example.com/x?a=1", u));
// 期望保留 a=1 并追加 utm_source/utm_medium/gclid
console.log("已有同名不覆盖:", mergeUtmIntoUrl("https://x.com/?utm_source=keep", u));
// 期望 utm_source 仍为 keep
console.log("深链不改:", mergeUtmIntoUrl("https://wa.me/1555", u), "|", mergeUtmIntoUrl("tel:+1555", u));
// 期望原样返回（wa.me 视为非通用外链，保持原样）
```

Run: `npx tsx _check_utm.ts`
Expected: 报错「Cannot find module .../utm」（文件未建）。

- [ ] **Step 2: 实现 `utm.ts`（GREEN）**

```ts
// landing-renderer/tracking/utm.ts
// UTM / 点击 id 的捕获与合并（纯函数，可服务端/客户端复用）。

const UTM_KEYS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "gclid", "fbclid", "ttclid",
] as const;

/** 从 location.search 提取 UTM/点击 id（只保留白名单键、非空值）。 */
export function parseUtm(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const out: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const v = params.get(key);
    if (v) out[key] = v;
  }
  return out;
}

/** 仅对 http(s) 链接合并 UTM；已存在的同名参数不覆盖；其它协议/深链原样返回。 */
export function mergeUtmIntoUrl(url: string, utm: Record<string, string>): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return url;
  // wa.me 等虽是 https，但作为聊天深链不追加（无意义且污染分享文案）
  if (parsed.hostname === "wa.me" || parsed.hostname === "t.me") return url;
  for (const [k, v] of Object.entries(utm)) {
    if (!parsed.searchParams.has(k)) parsed.searchParams.set(k, v);
  }
  return parsed.toString();
}
```

- [ ] **Step 3: 跑校验脚本（GREEN）**

Run: `npx tsx _check_utm.ts`
Expected: parse 只含 3 个键；http 合并含 `a=1` 且追加 3 个 utm；已有同名为 `keep`；`wa.me`/`tel:` 原样。

- [ ] **Step 4: 删脚本并提交**

```bash
rm _check_utm.ts
git add landing-renderer/tracking/utm.ts
git commit -m "feat(tracking): 新增 UTM 解析与外链合并纯函数"
```

---

## Task 3：事件映射表与渠道推断

**Files:**
- Create: `landing-renderer/tracking/events.ts`

- [ ] **Step 1: 写校验脚本（RED）**

`_check_events.ts`：

```ts
import { EVENT_MAP, inferChannel } from "@/landing-renderer/tracking/events";

console.log("meta cta_click:", EVENT_MAP.meta.cta_click);   // 期望 "Lead"
console.log("ga4 cta_click:", EVENT_MAP.ga4.cta_click);     // 期望 "generate_lead"
console.log("tiktok page_view:", EVENT_MAP.tiktok.page_view); // 期望 "Pageview"
console.log("ch wa:", inferChannel("https://wa.me/1555"));  // whatsapp
console.log("ch tel:", inferChannel("tel:+1"));             // tel
console.log("ch ext:", inferChannel("https://book.x.com")); // external
```

Run: `npx tsx _check_events.ts`
Expected: 报错找不到 events 模块。

- [ ] **Step 2: 实现 `events.ts`（GREEN）**

```ts
// landing-renderer/tracking/events.ts
// 内部事件 → 各平台标准事件的内置映射（系统固定、非交易）；以及 CTA 渠道推断。
import type { PixelProvider } from "@/types/schema.draft";

export type InternalEvent = "page_view" | "cta_click";

/** 各平台标准事件名（均为非交易事件，不可由用户改动）。 */
export const EVENT_MAP: Record<PixelProvider, Record<InternalEvent, string>> = {
  meta:      { page_view: "PageView",  cta_click: "Lead" },
  ga4:       { page_view: "page_view", cta_click: "generate_lead" },
  googleAds: { page_view: "page_view", cta_click: "conversion" },
  tiktok:    { page_view: "Pageview",  cta_click: "Contact" },
};

/** 由链接前缀推断 CTA 渠道，作为 data-cta 值与事件参数。 */
export function inferChannel(link: string): string {
  const v = link.trim().toLowerCase();
  if (v.startsWith("whatsapp:") || v.startsWith("https://wa.me")) return "whatsapp";
  if (v.startsWith("tel:")) return "tel";
  if (v.startsWith("mailto:")) return "mailto";
  if (v.startsWith("sms:")) return "sms";
  if (v.startsWith("tg:") || v.startsWith("https://t.me")) return "telegram";
  return "external";
}
```

- [ ] **Step 3: 跑校验脚本（GREEN）**

Run: `npx tsx _check_events.ts`
Expected: 输出 `Lead` / `generate_lead` / `Pageview` / `whatsapp` / `tel` / `external`。

- [ ] **Step 4: 删脚本并提交**

```bash
rm _check_events.ts
git add landing-renderer/tracking/events.ts
git commit -m "feat(tracking): 新增事件映射表与 CTA 渠道推断"
```

---

## Task 4：事件 sink 抽象与 PixelSink

**Files:**
- Create: `landing-renderer/tracking/sinks.ts`

> 说明：`PixelSink` 调用各平台全局对象（`fbq`/`gtag`/`ttq`），SDK 由 `TrackingProvider` 用 `next/script` 注入。本文件只负责「初始化各平台 + 按映射发火」，不直接插 `<script>`。first-party 采集 sink（如 `BeaconSink → /api/track`）**本刀不实现**，仅在文件尾注释预留。

- [ ] **Step 1: 实现 `sinks.ts`**

```ts
// landing-renderer/tracking/sinks.ts
// 事件 sink 抽象：统一 init/track 接口，TrackingProvider 广播事件给所有 sink。
// 首刀只实现 PixelSink；first-party 采集 sink 留作后续刀（见文件尾）。
import type { PixelConfig } from "@/types/schema.draft";
import { EVENT_MAP, type InternalEvent } from "./events";

export type EventParams = Record<string, string>;

export interface EventSink {
  init(): void;
  track(event: InternalEvent, params: EventParams): void;
}

// 各平台全局对象的最小类型声明
type Fbq = (...args: unknown[]) => void;
type Gtag = (...args: unknown[]) => void;
interface Ttq { load(id: string): void; page(): void; track(name: string, params?: EventParams): void; }
declare global {
  interface Window { fbq?: Fbq; gtag?: Gtag; ttq?: Ttq; dataLayer?: unknown[]; }
}

/** 单平台 Pixel sink：假定对应 SDK 已由 TrackingProvider 注入到 window。 */
export class PixelSink implements EventSink {
  constructor(private readonly config: PixelConfig) {}

  init(): void {
    const { provider, id } = this.config;
    if (provider === "meta") window.fbq?.("init", id);
    if (provider === "ga4" || provider === "googleAds") window.gtag?.("config", id);
    if (provider === "tiktok") window.ttq?.load(id);
  }

  track(event: InternalEvent, params: EventParams): void {
    const { provider, id } = this.config;
    const name = EVENT_MAP[provider][event];
    if (provider === "meta") {
      window.fbq?.("track", name, params);
    } else if (provider === "ga4") {
      window.gtag?.("event", name, params);
    } else if (provider === "googleAds") {
      window.gtag?.("event", name, { send_to: id, ...params });
    } else if (provider === "tiktok") {
      if (event === "page_view") window.ttq?.page();
      else window.ttq?.track(name, params);
    }
  }
}

// 后续刀扩展点：first-party 采集（不在本刀实现）
// export class BeaconSink implements EventSink {
//   init() {}
//   track(event, params) { navigator.sendBeacon("/api/track", JSON.stringify({ event, ...params })); }
// }
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit 2>&1 | grep -E "tracking/sinks" ; echo done`
Expected: 仅打印 `done`（无 sinks 报错）。

- [ ] **Step 3: Commit**

```bash
git add landing-renderer/tracking/sinks.ts
git commit -m "feat(tracking): 新增事件 sink 抽象与 PixelSink"
```

---

## Task 5：渲染器 CTA 加 data-cta

**Files:**
- Modify: `landing-renderer/primitives/Cta.tsx`
- Modify: `landing-renderer/sections/FloatingButton.tsx`

- [ ] **Step 1: 先确认没有其它直接写 CTA `<a>` 的地方**

Run: `grep -rn "href={.*\.link" landing-renderer/sections landing-renderer/primitives`
Expected: 仅命中 `primitives/Cta.tsx` 与 `sections/FloatingButton.tsx`（Footer 的 mailto 联系链接不算转化 CTA，不加）。若出现其它区块，按相同方式给其 CTA `<a>` 加 `data-cta={inferChannel(link)}`。

- [ ] **Step 2: 修改 `Cta.tsx`**

整文件替换为：

```tsx
// landing-renderer/primitives/Cta.tsx
import type { CtaButton } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { inferChannel } from "../tracking/events";

export function Cta({ cta, theme, variant = "primary" }: { cta: CtaButton; theme: RendererTheme; variant?: "primary" | "secondary" }) {
  const dataCta = inferChannel(cta.link);
  if (variant === "secondary") {
    return (
      <a href={cta.link} data-cta={dataCta} className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
        {cta.text}
      </a>
    );
  }
  return (
    <a href={cta.link} data-cta={dataCta} className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-white transition ${theme.accentGradient} ${theme.accentGradientHover} ${theme.accentShadow}`}>
      {cta.text}
    </a>
  );
}
```

- [ ] **Step 3: 修改 `FloatingButton.tsx`**

整文件替换为：

```tsx
// landing-renderer/sections/FloatingButton.tsx
import type { FloatingButton as FloatingButtonData } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { inferChannel } from "../tracking/events";

export function FloatingButton({ data, theme }: { data: FloatingButtonData; theme: RendererTheme }) {
  return (
    <a href={data.link} data-cta={inferChannel(data.link)} className={`fixed bottom-5 right-5 z-50 inline-flex items-center rounded-full px-5 py-3 text-sm font-bold text-white ${theme.accentGradient} ${theme.accentShadow}`}>
      {data.text}
    </a>
  );
}
```

- [ ] **Step 4: 校验**

Run: `npx tsc --noEmit 2>&1 | grep -E "Cta.tsx|FloatingButton" ; npx eslint landing-renderer/primitives/Cta.tsx landing-renderer/sections/FloatingButton.tsx`
Expected: 无报错、eslint exit 0。

- [ ] **Step 5: Commit**

```bash
git add landing-renderer/primitives/Cta.tsx landing-renderer/sections/FloatingButton.tsx
git commit -m "feat(tracking): 渲染器 CTA 标注 data-cta 渠道"
```

---

## Task 6：同意条 ConsentBar

**Files:**
- Create: `landing-renderer/tracking/ConsentBar.tsx`

- [ ] **Step 1: 实现 `ConsentBar.tsx`**

```tsx
// landing-renderer/tracking/ConsentBar.tsx
"use client";

const DEFAULT_TEXT = "我们使用 Cookie 与第三方分析像素来改善投放效果。点击「接受」即表示同意。";

export function ConsentBar({ text, onAccept, onDecline }: { text?: string; onAccept: () => void; onDecline: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-slate-200 bg-white/95 px-5 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">{text || DEFAULT_TEXT}</p>
        <div className="flex shrink-0 gap-2">
          <button onClick={onDecline} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">拒绝</button>
          <button onClick={onAccept} className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">接受</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 校验**

Run: `npx eslint landing-renderer/tracking/ConsentBar.tsx ; echo exit:$?`
Expected: exit:0。

- [ ] **Step 3: Commit**

```bash
git add landing-renderer/tracking/ConsentBar.tsx
git commit -m "feat(tracking): 新增最小同意条 ConsentBar"
```

---

## Task 7：TrackingProvider 编排

**Files:**
- Create: `landing-renderer/tracking/TrackingProvider.tsx`

> 读 Next 文档：写前看 `node_modules/next/dist/docs/` 里 `next/script` 用法，确认 `<Script>` 的 `strategy`/`onLoad` 在本版本的写法。

- [ ] **Step 1: 实现 `TrackingProvider.tsx`**

```tsx
// landing-renderer/tracking/TrackingProvider.tsx
"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Script from "next/script";
import type { PageTracking } from "@/types/schema.draft";
import { parseUtm, mergeUtmIntoUrl } from "./utm";
import { PixelSink, type EventSink } from "./sinks";
import { inferChannel } from "./events";
import { ConsentBar } from "./ConsentBar";

const CONSENT_KEY = "lp_consent";
const UTM_KEY = "lp_utm";

export function TrackingProvider({ tracking, children }: { tracking?: PageTracking; children: ReactNode }) {
  const consentEnabled = tracking?.consent.enabled ?? true;
  const [consented, setConsented] = useState<boolean>(!consentEnabled);
  const utmRef = useRef<Record<string, string>>({});
  const sinksRef = useRef<EventSink[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const enabledPixels = (tracking?.pixels ?? []).filter((p) => p.enabled && p.id.trim());

  // 捕获 UTM（一次）
  useEffect(() => {
    const utm = parseUtm(window.location.search);
    if (Object.keys(utm).length) sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
    try { utmRef.current = JSON.parse(sessionStorage.getItem(UTM_KEY) ?? "{}"); } catch { utmRef.current = {}; }
  }, []);

  // 读已存同意
  useEffect(() => {
    if (!consentEnabled) return;
    if (localStorage.getItem(CONSENT_KEY) === "accepted") setConsented(true);
  }, [consentEnabled]);

  // 同意后：建 sink、init、发 page_view
  useEffect(() => {
    if (!consented || sinksRef.current.length) return;
    sinksRef.current = enabledPixels.map((p) => new PixelSink(p));
    sinksRef.current.forEach((s) => s.init());
    sinksRef.current.forEach((s) => s.track("page_view", { ...utmRef.current }));
    // enabledPixels 取自 props，consented 变 true 时执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consented]);

  // CTA 委托点击
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest("a[data-cta]") as HTMLAnchorElement | null;
    if (!target) return;
    const channel = target.getAttribute("data-cta") ?? "external";
    sinksRef.current.forEach((s) => s.track("cta_click", { channel, ...utmRef.current }));
    if (tracking?.utmPassthrough && inferChannel(target.href) === "external") {
      const merged = mergeUtmIntoUrl(target.href, utmRef.current);
      if (merged !== target.href) { e.preventDefault(); window.location.href = merged; }
    }
  }, [tracking?.utmPassthrough]);

  const accept = () => { localStorage.setItem(CONSENT_KEY, "accepted"); setConsented(true); };
  const decline = () => { localStorage.setItem(CONSENT_KEY, "declined"); };

  return (
    <div ref={containerRef} onClickCapture={onClickCapture}>
      {consented && enabledPixels.map((p) => <PixelScript key={p.provider} provider={p.provider} id={p.id} />)}
      {children}
      {consentEnabled && !consented && localStorage.getItem(CONSENT_KEY) !== "declined" && (
        <ConsentBar text={tracking?.consent.text} onAccept={accept} onDecline={decline} />
      )}
    </div>
  );
}

/** 按平台注入官方 SDK（同意后才渲染）。 */
function PixelScript({ provider, id }: { provider: string; id: string }) {
  if (provider === "meta") {
    return (
      <Script id={`px-meta-${id}`} strategy="afterInteractive">{`
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      `}</Script>
    );
  }
  if (provider === "ga4" || provider === "googleAds") {
    return (
      <>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
        <Script id={`px-g-${id}`} strategy="afterInteractive">{`
          window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=window.gtag||gtag;gtag('js',new Date());
        `}</Script>
      </>
    );
  }
  if (provider === "tiktok") {
    return (
      <Script id={`px-tt-${id}`} strategy="afterInteractive">{`
        !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
        ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
        ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
        ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
        var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
        }(window,document,'ttq');
      `}</Script>
    );
  }
  return null;
}
```

- [ ] **Step 2: 校验**

Run: `npx tsc --noEmit 2>&1 | grep -E "TrackingProvider" ; npx eslint landing-renderer/tracking/TrackingProvider.tsx ; echo exit:$?`
Expected: 无 tsc 报错、eslint exit:0。

- [ ] **Step 3: Commit**

```bash
git add landing-renderer/tracking/TrackingProvider.tsx
git commit -m "feat(tracking): 新增 TrackingProvider 编排（UTM/同意/注入/埋点）"
```

---

## Task 8：公开页接入 TrackingProvider

**Files:**
- Modify: `app/p/[slug]/page.tsx`

- [ ] **Step 1: 包裹渲染器**

把默认导出的返回值由 `return <LandingPage page={page.data} />;` 改为：

```tsx
  return (
    <TrackingProvider tracking={page.data.tracking}>
      <LandingPage page={page.data} />
    </TrackingProvider>
  );
```

并在顶部加导入：

```tsx
import { TrackingProvider } from "@/landing-renderer/tracking/TrackingProvider";
```

- [ ] **Step 2: 校验**

Run: `npx tsc --noEmit 2>&1 | grep -E "app/p/" ; npx eslint "app/p/[slug]/page.tsx" ; echo exit:$?`
Expected: 无报错、eslint exit:0。

- [ ] **Step 3: Commit**

```bash
git add "app/p/[slug]/page.tsx"
git commit -m "feat(tracking): 公开落地页接入 TrackingProvider"
```

---

## Task 9：编辑器状态接入 tracking

**Files:**
- Modify: `landing-editor/store/defaults.ts`
- Modify: `landing-editor/store/editorStore.tsx`
- Modify: `landing-editor/sampleDraft.ts`

- [ ] **Step 1: `defaults.ts` 加工厂**

在文件顶部 import 的类型里加 `PageTracking`，并在 `createFloatingButton` 之后加：

```ts
export const createTracking = (): PageTracking => ({
  pixels: [],
  utmPassthrough: true,
  consent: { enabled: true },
});
```

（`PageTracking` 加进现有 `import type { ... } from "@/types/schema.draft";` 列表。）

- [ ] **Step 2: `editorStore.tsx` 加状态与 action**

1）import 增加 `PageTracking`：在现有 `import type { ... } from "@/types/schema.draft";` 列表中加 `PageTracking`。并 `import { createSection, createFloatingButton, createTracking } from "./defaults";`（加 `createTracking`）。

2）`EditorState` 接口加字段：

```ts
  tracking: PageTracking;
```

3）`EditorAction` 联合类型加一项：

```ts
  | { kind: "updateTracking"; value: PageTracking }
```

4）`reducer` 的 `switch` 里加 case（放在 `updateFloating` 之后）：

```ts
    case "updateTracking":
      return { ...state, tracking: action.value };
```

5）`toDraft` 在返回的 `draft` 上补 tracking（在 `if (state.floatingButton) ...` 之后、`return draft;` 之前）：

```ts
  draft.tracking = state.tracking;
```

- [ ] **Step 3: `sampleDraft.ts` 的 `fromDraft` 注入 tracking**

`import` 增加 `import { createTracking } from "./store/defaults";`，并在返回对象里加：

```ts
    tracking: draft.tracking ?? createTracking(),
```

- [ ] **Step 4: 校验**

Run: `npx tsc --noEmit 2>&1 | grep -E "editorStore|defaults|sampleDraft" ; echo done`
Expected: 仅打印 `done`。

- [ ] **Step 5: Commit**

```bash
git add landing-editor/store/defaults.ts landing-editor/store/editorStore.tsx landing-editor/sampleDraft.ts
git commit -m "feat(editor): 编辑器状态接入页面级 tracking"
```

---

## Task 10：发布门禁校验 tracking

**Files:**
- Create: `landing-editor/lib/trackingIssues.ts`
- Modify: `landing-editor/lib/publishIssues.ts`

> 说明：Pixel ID 采「宽松」校验——已启用且填了 ID 但含空白字符即报错（避免误粘贴）。事件名系统固定，无交易越界可能。本刀只做前端门禁；后端 `collectFieldIssues` 不识别 tracking 键（其值键为 `id`，不在 link/src/contactEmail 白名单内），符合预期。

- [ ] **Step 1: 写校验脚本（RED）**

`_check_tracking.ts`：

```ts
import { collectTrackingIssues } from "@/landing-editor/lib/trackingIssues";
import type { LandingPageDraft } from "@/types/schema.draft";

const draft = {
  hero: { title: "t", cta: { text: "c", link: "" } },
  sections: [],
  footer: { brandName: "b", copyrightYear: "2026", contactEmail: "", privacyPolicy: "", termsOfService: "" },
  tracking: { pixels: [{ provider: "meta", id: "123 456", enabled: true }], utmPassthrough: true, consent: { enabled: true } },
} as unknown as LandingPageDraft;

console.log("含空白 id:", collectTrackingIssues(draft)); // 期望 1 条
```

Run: `npx tsx _check_tracking.ts`
Expected: 报错找不到 trackingIssues 模块。

- [ ] **Step 2: 实现 `trackingIssues.ts`（GREEN）**

```ts
// landing-editor/lib/trackingIssues.ts
// tracking 字段的发布门禁校验：宽松策略——启用且填了 ID，但含空白字符即视为非法。
import type { LandingPageDraft, PixelProvider } from "@/types/schema.draft";

const PROVIDER_LABEL: Record<PixelProvider, string> = {
  meta: "Meta Pixel",
  ga4: "Google Analytics（GA4）",
  googleAds: "Google Ads",
  tiktok: "TikTok Pixel",
};

export function collectTrackingIssues(draft: LandingPageDraft): string[] {
  const pixels = draft.tracking?.pixels ?? [];
  const out: string[] = [];
  for (const p of pixels) {
    if (!p.enabled) continue;
    const id = p.id.trim();
    if (!id) continue; // 启用但留空：视为未配置，不报错
    if (/\s/.test(p.id)) out.push(`${PROVIDER_LABEL[p.provider]}：ID 不应包含空格`);
  }
  return [...new Set(out)];
}
```

- [ ] **Step 3: 跑校验脚本（GREEN）**

Run: `npx tsx _check_tracking.ts`
Expected: 打印 1 条「Meta Pixel：ID 不应包含空格」。

- [ ] **Step 4: 合并进 `publishIssues.ts`**

在 `collectPublishIssues` 里合并字段问题与 tracking 问题。把：

```ts
import { collectFieldIssues } from "./validate";
```

下面加：

```ts
import { collectTrackingIssues } from "./trackingIssues";
```

并把 `collectPublishIssues` 的返回改为：

```ts
export function collectPublishIssues(draft: LandingPageDraft): string[] {
  return [...collectStructureIssues(draft), ...collectFieldIssues(draft), ...collectTrackingIssues(draft)];
}
```

- [ ] **Step 5: 删脚本、校验并提交**

```bash
rm _check_tracking.ts
npx tsc --noEmit 2>&1 | grep -E "trackingIssues|publishIssues" ; echo done
git add landing-editor/lib/trackingIssues.ts landing-editor/lib/publishIssues.ts
git commit -m "feat(editor): 发布门禁纳入 tracking 字段校验"
```

Expected：grep 仅打印 `done`。

---

## Task 11：编辑器「追踪」面板与工具栏入口

**Files:**
- Create: `landing-editor/components/TrackingPanel.tsx`
- Modify: `landing-editor/components/EditorToolbar.tsx`

- [ ] **Step 1: 实现 `TrackingPanel.tsx`**

```tsx
// landing-editor/components/TrackingPanel.tsx
"use client";
import { useEditorState, useEditorDispatch } from "../store/editorStore";
import type { PixelProvider } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";

const PROVIDERS: { provider: PixelProvider; label: string; placeholder: string }[] = [
  { provider: "meta", label: "Meta Pixel ID", placeholder: "如 1234567890" },
  { provider: "ga4", label: "Google Analytics（GA4）ID", placeholder: "如 G-XXXXXXX" },
  { provider: "googleAds", label: "Google Ads 转化 ID", placeholder: "如 AW-XXXXXXXXX" },
  { provider: "tiktok", label: "TikTok Pixel ID", placeholder: "如 CXXXXXXXXXXXXXXXXX" },
];

export function TrackingPanel({ onClose }: { onClose: () => void }) {
  const state = useEditorState();
  const dispatch = useEditorDispatch();
  const t = state.tracking;

  const setPixel = (provider: PixelProvider, id: string) => {
    const rest = t.pixels.filter((p) => p.provider !== provider);
    const pixels = id.trim() ? [...rest, { provider, id, enabled: true }] : rest;
    dispatch({ kind: "updateTracking", value: { ...t, pixels } });
  };
  const idOf = (provider: PixelProvider) => t.pixels.find((p) => p.provider === provider)?.id ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="w-[460px] rounded-xl bg-panel p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-ink">追踪与转化</h2>
        <p className="mt-1 text-xs text-ink-muted">填入各平台 Pixel ID（留空即不启用）。事件按系统内置规则上报，仅咨询/留资，无交易语义。</p>

        <div className="mt-4 space-y-3">
          {PROVIDERS.map(({ provider, label, placeholder }) => (
            <Field key={provider} label={label}>
              <TextInput value={idOf(provider)} onChange={(e) => setPixel(provider, e.target.value)} placeholder={placeholder} />
            </Field>
          ))}

          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={t.utmPassthrough}
              onChange={(e) => dispatch({ kind: "updateTracking", value: { ...t, utmPassthrough: e.target.checked } })}
              className="h-3.5 w-3.5 rounded border-edge-strong text-brand-600 focus:ring-brand-500/30"
            />
            把 UTM 透传到 http(s) 外链 CTA
          </label>

          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={t.consent.enabled}
              onChange={(e) => dispatch({ kind: "updateTracking", value: { ...t, consent: { ...t.consent, enabled: e.target.checked } } })}
              className="h-3.5 w-3.5 rounded border-edge-strong text-brand-600 focus:ring-brand-500/30"
            />
            显示 Cookie 同意条（同意前不加载像素）
          </label>

          {t.consent.enabled && (
            <Field label="同意条文案（留空用默认）">
              <TextInput
                value={t.consent.text ?? ""}
                onChange={(e) => dispatch({ kind: "updateTracking", value: { ...t, consent: { ...t.consent, text: e.target.value || undefined } } })}
                placeholder="我们使用 Cookie 与第三方分析像素来改善投放效果…"
              />
            </Field>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button onClick={onClose} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">完成</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `EditorToolbar.tsx` 加入口**

1）顶部 import 加：

```tsx
import { TrackingPanel } from "./TrackingPanel";
```

2）组件内 state 区加：

```tsx
  const [trackingOpen, setTrackingOpen] = useState(false);
```

3）在「预览」`<Link>` 之前插入「追踪」按钮：

```tsx
      <button
        onClick={() => setTrackingOpen(true)}
        className="rounded-md border border-edge px-3 py-1.5 text-sm text-ink-soft hover:bg-canvas"
      >
        追踪
      </button>
```

4）在底部 `{publishOpen && <PublishDialog ... />}` 之后加：

```tsx
      {trackingOpen && <TrackingPanel onClose={() => setTrackingOpen(false)} />}
```

- [ ] **Step 3: 校验**

Run: `npx tsc --noEmit 2>&1 | grep -E "TrackingPanel|EditorToolbar" ; npx eslint landing-editor/components/TrackingPanel.tsx landing-editor/components/EditorToolbar.tsx ; echo exit:$?`
Expected: 无 tsc 报错、eslint exit:0。

- [ ] **Step 4: Commit**

```bash
git add landing-editor/components/TrackingPanel.tsx landing-editor/components/EditorToolbar.tsx
git commit -m "feat(editor): 工具栏新增追踪面板配置 Pixel/UTM/同意"
```

---

## Task 12：整体校验 + 浏览器 E2E

**Files:**（不改源码，仅验证；如发现问题回到对应 Task 修）

- [ ] **Step 1: 全量类型检查（只看本次相关，templates/ 既有错误无关）**

Run: `npx tsc --noEmit 2>&1 | grep -E "landing-renderer/tracking|landing-editor|app/p/|schema.draft|trackingIssues|publishIssues" ; echo done`
Expected: 仅打印 `done`。

- [ ] **Step 2: lint 本次改动文件**

Run:
```bash
npx eslint landing-renderer/tracking/*.tsx landing-renderer/tracking/*.ts \
  landing-renderer/primitives/Cta.tsx landing-renderer/sections/FloatingButton.tsx \
  landing-editor/components/TrackingPanel.tsx landing-editor/components/EditorToolbar.tsx \
  landing-editor/lib/trackingIssues.ts landing-editor/lib/publishIssues.ts \
  landing-editor/store/editorStore.tsx landing-editor/store/defaults.ts \
  landing-editor/sampleDraft.ts "app/p/[slug]/page.tsx"
echo exit:$?
```
Expected: exit:0。

- [ ] **Step 2.5: 确认 dev 库已 seed、dev server 在 3001**

Run: `lsof -nP -iTCP:3001 -sTCP:LISTEN | head` （无则 `npm run dev` 后台启动）；`docker ps | grep zonit-pg-dev`（无则 `npm run db:start && npm run db:seed-dev`）。

- [ ] **Step 3: 浏览器 E2E（用 chrome-devtools MCP，手动驱动）**

依次验证（用 `admin@zapbridge.com / Password1!` 登录）：

1. 进编辑器 → 点「追踪」→ 填 Meta Pixel ID（如 `1234567890`）→ 等「已保存」→ 关闭。
2. 发布该页到 `dev-acme.test`（已 seed 验证域名）。
3. 新标签打开 `http://dev-acme.test:3001/`：
   - **未点同意**：`list_network_requests` 不含 `connect.facebook.net`；DOM 无 fbq 脚本。
   - 点同意条「接受」→ 出现 `connect.facebook.net/en_US/fbevents.js` 请求；`evaluate_script` 取 `window.fbq` 为 function。
   - 点主 CTA（外链场景）→ 控制台/网络可见 `fbq track Lead`（或用 `evaluate_script` 预先 patch `window.fbq` 记录调用）；若 CTA 为 http(s) 外链，跳转 URL 带上 `utm_*`（先以 `?utm_source=fb` 打开落地页再点）。
4. 回退用例：同意条点「拒绝」→ 刷新后仍无第三方请求。

Expected: 未同意无第三方像素请求；同意后注入并发 page_view；CTA 点击发 cta_click；http(s) 外链带 UTM、wa.me 深链不带。

- [ ] **Step 4: 收尾提交（如校验中有微调）**

```bash
git add -A
git commit -m "test(tracking): 浏览器 E2E 验证追踪闭环并修正细节" || echo "无改动可提交"
```

---

## 自审记录（对照 spec）

- ✅ schema 顶层 `tracking`（Task 1）
- ✅ 运行期 UTM 捕获/同意门控/Pixel 注入 page_view/CTA cta_click+外链透传（Task 7、8）
- ✅ 4 家 Pixel + 通用 provider 结构（Task 1、3、4、7）
- ✅ 事件 sink 抽象 + first-party 扩展点预留（Task 4）
- ✅ 内置非交易映射表（Task 3）
- ✅ 渲染器 data-cta 唯一侵入（Task 5）
- ✅ 编辑器工具栏「追踪」面板（Task 11）+ 自动保存链路（Task 9）
- ✅ 发布门禁 tracking 校验（Task 10）
- ✅ 合规：同意 opt-in 门控、无 PII、无交易事件名（Task 6、7、3）
- ✅ 测试：纯逻辑 tsx 校验 + tsc/lint + 浏览器 E2E（各 Task + Task 12）
- ✅ 边界：CAPI、first-party 采集与 super-admin 面板均不在本刀（spec 第十节，本计划未含）
```
