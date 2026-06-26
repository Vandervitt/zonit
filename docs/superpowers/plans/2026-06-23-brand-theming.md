# 品牌化主题（预设主题 + Logo + favicon）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让每个落地页可选 6 套预设品牌主题、上传 Logo 与 favicon，并接通目前断开的渲染器换肤链路。

**Architecture:** schema 加 `branding?: { theme, logo?, favicon? }`（`ThemeId` 由 schema 定义为单一真源）。渲染器 `theme.ts` 提供 6 套写死 Tailwind class 主题 + `resolveTheme`；`LandingPage` 内部按 `page.branding.theme` 派生主题（接通换肤），Logo 透传给 Hero/Footer，favicon 注入公开页 `<head>`。编辑器加常驻"品牌主题"配置面板（色卡 + Logo/favicon MediaPicker）。

**Tech Stack:** Next.js 16(App Router)、TypeScript、Tailwind、vitest、Playwright。

设计来源:`docs/superpowers/specs/2026-06-23-brand-theming-design.md`

---

## File Structure

- `types/schema.draft.ts` —（改）定义 `ThemeId`、`Branding`，`LandingPageDraft.branding?`。
- `landing-renderer/theme.ts` —（改）新增 5 套主题 + `THEMES`/`THEME_META`/`resolveTheme`。
- `landing-renderer/theme.test.ts` —（新建）`resolveTheme` + `THEMES` 完整性单测。
- `landing-renderer/LandingPage.tsx` —（改）按 branding 派生主题 + 透传 logo。
- `landing-renderer/sections/Hero.tsx` —（改）顶部显示 logo。
- `landing-renderer/sections/Footer.tsx` —（改）显示 logo。
- `app/p/[slug]/page.tsx` —（改）generateMetadata 注入 favicon。
- `landing-editor/store/defaults.ts` —（改）`createBranding`。
- `landing-editor/store/editorStore.tsx` —（改）state/action/toDraft 接入 branding。
- `landing-editor/sampleDraft.ts` —（改）fromDraft 读入 branding。
- `landing-editor/forms/BrandingForm.tsx` —（新建）配置面板。
- `landing-editor/components/BlockList.tsx` —（改）品牌主题常驻入口。
- `landing-editor/components/EditorDetail.tsx` —（改）渲染 BrandingForm。
- `e2e/branding.spec.ts` —（新建）切主题 + logo e2e。

---

## Task 1: schema 加 ThemeId + Branding

**Files:**
- Modify: `types/schema.draft.ts`

- [ ] **Step 1: 加类型**

在 `types/schema.draft.ts` 中 `LandingPageDraft` 定义之前加：
```ts
/** 预设品牌主题 id（单一真源，渲染器 theme.ts 引用本类型）。 */
export type ThemeId = "teal" | "blue" | "rose" | "amber" | "violet" | "slate";

/** 页面品牌化：主题 + Logo + favicon（页面级，缺省 teal、无标识）。 */
export interface Branding {
  theme: ThemeId;
  logo?: string;
  favicon?: string;
}
```
在 `LandingPageDraft` 接口里（与 `leadForm?` 同级）加：
```ts
  branding?: Branding;
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无输出（通过）

- [ ] **Step 3: 提交**

```bash
git add types/schema.draft.ts
git commit -m "feat: schema 新增 ThemeId 与 Branding 类型"
```

---

## Task 2: 6 套主题 + resolveTheme（TDD）

**Files:**
- Modify: `landing-renderer/theme.ts`
- Test: `landing-renderer/theme.test.ts`

- [ ] **Step 1: 写失败测试**

`landing-renderer/theme.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { THEMES, THEME_META, resolveTheme, type RendererTheme } from "./theme";

const FIELDS: (keyof RendererTheme)[] = [
  "accentGradient", "accentGradientHover", "accentShadow", "accentTextGradient",
  "accentText", "accentSoftBg", "accentSoftBorder", "accentSoftText", "accentIconBg", "glassCard",
];

describe("THEMES", () => {
  it("含 6 套主题", () => {
    expect(Object.keys(THEMES).sort()).toEqual(["amber", "blue", "rose", "slate", "teal", "violet"]);
  });
  it("每套 10 个字段均非空字符串", () => {
    for (const [id, theme] of Object.entries(THEMES)) {
      for (const f of FIELDS) {
        expect(typeof theme[f], `${id}.${f}`).toBe("string");
        expect(theme[f].length, `${id}.${f}`).toBeGreaterThan(0);
      }
    }
  });
});

describe("THEME_META", () => {
  it("6 条，每条有 id/label/swatch", () => {
    expect(THEME_META).toHaveLength(6);
    for (const m of THEME_META) {
      expect(m.id in THEMES).toBe(true);
      expect(m.label.length).toBeGreaterThan(0);
      expect(m.swatch.length).toBeGreaterThan(0);
    }
  });
});

describe("resolveTheme", () => {
  it("命中对应主题", () => {
    expect(resolveTheme("rose")).toBe(THEMES.rose);
  });
  it("undefined 回退 teal", () => {
    expect(resolveTheme(undefined)).toBe(THEMES.teal);
  });
  it("未知 id 回退 teal", () => {
    // @ts-expect-error 测试非法输入
    expect(resolveTheme("nope")).toBe(THEMES.teal);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run landing-renderer/theme.test.ts`
Expected: FAIL（`THEMES`/`THEME_META`/`resolveTheme` 未导出）

- [ ] **Step 3: 写实现**

把 `landing-renderer/theme.ts` 中 `export const defaultTheme = tealEmerald;` 替换为（保留上方 `RendererTheme` 接口与 `tealEmerald` 不动，在其后追加）：
```ts
import type { ThemeId } from "@/types/schema.draft";

export const blueIndigo: RendererTheme = {
  accentGradient: "bg-gradient-to-r from-blue-500 to-indigo-600",
  accentGradientHover: "hover:from-blue-600 hover:to-indigo-700",
  accentShadow: "shadow-lg shadow-blue-500/30",
  accentTextGradient: "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent",
  accentText: "text-blue-600",
  accentSoftBg: "bg-blue-50",
  accentSoftBorder: "border-blue-200",
  accentSoftText: "text-blue-700",
  accentIconBg: "bg-gradient-to-br from-blue-100 to-indigo-100",
  glassCard: "border border-white/10 bg-white/5",
};

export const rosePink: RendererTheme = {
  accentGradient: "bg-gradient-to-r from-rose-500 to-pink-600",
  accentGradientHover: "hover:from-rose-600 hover:to-pink-700",
  accentShadow: "shadow-lg shadow-rose-500/30",
  accentTextGradient: "bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent",
  accentText: "text-rose-600",
  accentSoftBg: "bg-rose-50",
  accentSoftBorder: "border-rose-200",
  accentSoftText: "text-rose-700",
  accentIconBg: "bg-gradient-to-br from-rose-100 to-pink-100",
  glassCard: "border border-white/10 bg-white/5",
};

export const amberOrange: RendererTheme = {
  accentGradient: "bg-gradient-to-r from-amber-500 to-orange-600",
  accentGradientHover: "hover:from-amber-600 hover:to-orange-700",
  accentShadow: "shadow-lg shadow-amber-500/30",
  accentTextGradient: "bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent",
  accentText: "text-amber-600",
  accentSoftBg: "bg-amber-50",
  accentSoftBorder: "border-amber-200",
  accentSoftText: "text-amber-700",
  accentIconBg: "bg-gradient-to-br from-amber-100 to-orange-100",
  glassCard: "border border-white/10 bg-white/5",
};

export const violetPurple: RendererTheme = {
  accentGradient: "bg-gradient-to-r from-violet-500 to-purple-600",
  accentGradientHover: "hover:from-violet-600 hover:to-purple-700",
  accentShadow: "shadow-lg shadow-violet-500/30",
  accentTextGradient: "bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent",
  accentText: "text-violet-600",
  accentSoftBg: "bg-violet-50",
  accentSoftBorder: "border-violet-200",
  accentSoftText: "text-violet-700",
  accentIconBg: "bg-gradient-to-br from-violet-100 to-purple-100",
  glassCard: "border border-white/10 bg-white/5",
};

export const slateNeutral: RendererTheme = {
  accentGradient: "bg-gradient-to-r from-slate-700 to-slate-900",
  accentGradientHover: "hover:from-slate-800 hover:to-black",
  accentShadow: "shadow-lg shadow-slate-700/30",
  accentTextGradient: "bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent",
  accentText: "text-slate-700",
  accentSoftBg: "bg-slate-100",
  accentSoftBorder: "border-slate-300",
  accentSoftText: "text-slate-800",
  accentIconBg: "bg-gradient-to-br from-slate-100 to-slate-200",
  glassCard: "border border-white/10 bg-white/5",
};

export const THEMES: Record<ThemeId, RendererTheme> = {
  teal: tealEmerald,
  blue: blueIndigo,
  rose: rosePink,
  amber: amberOrange,
  violet: violetPurple,
  slate: slateNeutral,
};

/** 编辑器色卡用：swatch 为预览渐变 class（写死，Tailwind JIT 可扫到）。 */
export const THEME_META: { id: ThemeId; label: string; swatch: string }[] = [
  { id: "teal",   label: "青翠", swatch: "bg-gradient-to-r from-teal-500 to-emerald-600" },
  { id: "blue",   label: "蓝",   swatch: "bg-gradient-to-r from-blue-500 to-indigo-600" },
  { id: "rose",   label: "玫红", swatch: "bg-gradient-to-r from-rose-500 to-pink-600" },
  { id: "amber",  label: "琥珀", swatch: "bg-gradient-to-r from-amber-500 to-orange-600" },
  { id: "violet", label: "紫",   swatch: "bg-gradient-to-r from-violet-500 to-purple-600" },
  { id: "slate",  label: "墨",   swatch: "bg-gradient-to-r from-slate-700 to-slate-900" },
];

export const defaultTheme = tealEmerald;

/** 按 id 解析主题；缺省/未知回退 teal。 */
export function resolveTheme(id?: ThemeId): RendererTheme {
  return (id && THEMES[id]) || THEMES.teal;
}
```
> 注：原文件末尾的 `export const defaultTheme = tealEmerald;` 已被上面整段取代（其中保留了同名导出）。确保不要重复声明 `defaultTheme`。

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run landing-renderer/theme.test.ts`
Expected: PASS（全部用例）

- [ ] **Step 5: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无输出

- [ ] **Step 6: 提交**

```bash
git add landing-renderer/theme.ts landing-renderer/theme.test.ts
git commit -m "feat: 6 套预设主题 + THEMES/THEME_META/resolveTheme"
```

---

## Task 3: LandingPage 按 branding 派生主题 + 透传 logo

**Files:**
- Modify: `landing-renderer/LandingPage.tsx`

- [ ] **Step 1: 改写 LandingPage**

把 `landing-renderer/LandingPage.tsx` 替换为：
```tsx
// landing-renderer/LandingPage.tsx
// 渲染器入口：按页面 branding 派生主题（换肤）+ Logo 透传 + sections + 页脚 + 留资表单 + 悬浮按钮。
import type { LandingPageDraft } from "@/types/schema.draft";
import { resolveTheme, type RendererTheme } from "./theme";
import { Hero } from "./sections/Hero";
import { Footer } from "./sections/Footer";
import { FloatingButton } from "./sections/FloatingButton";
import { LeadForm } from "./sections/LeadForm";
import { renderSection } from "./sections";

export function LandingPage({
  page,
  theme,
  pageId = "",
}: {
  page: LandingPageDraft;
  theme?: RendererTheme; // 显式覆盖；默认按 branding 派生
  pageId?: string;
}) {
  const resolved = theme ?? resolveTheme(page.branding?.theme);
  const logo = page.branding?.logo;
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Hero data={page.hero} theme={resolved} logo={logo} />
      {page.sections.map((section, i) => renderSection(section, resolved, i))}
      {page.leadForm?.enabled ? <LeadForm data={page.leadForm} pageId={pageId} theme={resolved} /> : null}
      <Footer data={page.footer} theme={resolved} logo={logo} />
      {page.floatingButton && <FloatingButton data={page.floatingButton} theme={resolved} />}
    </div>
  );
}
```

- [ ] **Step 2: 类型检查（Hero/Footer 尚未加 logo prop，会报错——下一 Task 修）**

Run: `npx tsc --noEmit`
Expected: 仅 Hero/Footer 的 `logo` prop 类型错（Task 4 修）；记录后继续。

- [ ] **Step 3: 提交**

```bash
git add landing-renderer/LandingPage.tsx
git commit -m "feat: LandingPage 按 branding 派生主题并透传 logo"
```

---

## Task 4: Hero/Footer 显示 Logo

**Files:**
- Modify: `landing-renderer/sections/Hero.tsx`
- Modify: `landing-renderer/sections/Footer.tsx`

- [ ] **Step 1: 改 Hero**

`landing-renderer/sections/Hero.tsx`：函数签名加 `logo`，在 badge 之前渲染。把：
```tsx
export function Hero({ data, theme }: { data: HeroSection; theme: RendererTheme }) {
```
改为：
```tsx
export function Hero({ data, theme, logo }: { data: HeroSection; theme: RendererTheme; logo?: string }) {
```
并在 `<div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-6">` 内、`{data.badge && ...}` 之前插入：
```tsx
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="mb-5 h-10 w-auto" />
        ) : null}
```

- [ ] **Step 2: 改 Footer**

`landing-renderer/sections/Footer.tsx`：签名加 `logo`，品牌名上方渲染。把：
```tsx
export function Footer({ data, theme }: { data: FooterSection; theme: RendererTheme }) {
```
改为：
```tsx
export function Footer({ data, theme, logo }: { data: FooterSection; theme: RendererTheme; logo?: string }) {
```
并把 `<div className="text-lg font-bold text-white">{data.brandName}</div>` 之前插入：
```tsx
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="mb-3 h-8 w-auto" />
        ) : null}
```

- [ ] **Step 3: 类型检查 + lint**

Run: `npx tsc --noEmit && npx eslint landing-renderer/sections/Hero.tsx landing-renderer/sections/Footer.tsx landing-renderer/LandingPage.tsx`
Expected: 均无错误（Task 3 的 logo 报错此时消除）

- [ ] **Step 4: 提交**

```bash
git add landing-renderer/sections/Hero.tsx landing-renderer/sections/Footer.tsx
git commit -m "feat: Hero 顶部与 Footer 显示品牌 Logo"
```

---

## Task 5: 公开页注入 favicon

**Files:**
- Modify: `app/p/[slug]/page.tsx`

- [ ] **Step 1: generateMetadata 加 icons**

在 `app/p/[slug]/page.tsx` 的 `generateMetadata` 返回的 `Metadata` 对象里（与 `alternates`/`openGraph` 同级）加：
```ts
    icons: page.data.branding?.favicon ? { icon: page.data.branding.favicon } : undefined,
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无输出（通过）

- [ ] **Step 3: 提交**

```bash
git add "app/p/[slug]/page.tsx"
git commit -m "feat: 公开页注入品牌 favicon"
```

---

## Task 6: 编辑器 store 接入 branding

**Files:**
- Modify: `landing-editor/store/defaults.ts`
- Modify: `landing-editor/store/editorStore.tsx`
- Modify: `landing-editor/sampleDraft.ts`

- [ ] **Step 1: 默认值工厂**

`landing-editor/store/defaults.ts`：import 类型加 `Branding`，在 `createTracking` 之后加：
```ts
export const createBranding = (): Branding => ({ theme: "teal" });
```

- [ ] **Step 2: store 接入**

`landing-editor/store/editorStore.tsx`：
1. 类型 import 加 `Branding`；`import { ..., createBranding } from "./defaults";`
2. 常量加：`export const BRANDING_ID = "branding";`
3. `EditorState` 加：`branding: Branding;`
4. `EditorAction` 加：`| { kind: "updateBranding"; value: Branding }`
5. reducer 加 case（任意位置，建议 `updateTracking` 附近）：
```ts
    case "updateBranding":
      return { ...state, branding: action.value };
```
6. `toDraft` 加（`tracking` 赋值附近）：`draft.branding = state.branding;`

- [ ] **Step 3: fromDraft 读入**

`landing-editor/sampleDraft.ts`：import `createBranding`（从 `./store/defaults`），在 `fromDraft` 返回对象加：
```ts
    branding: draft.branding ?? createBranding(),
```

- [ ] **Step 4: 类型检查（暴露所有 EditorState 构造点）**

Run: `npx tsc --noEmit`
Expected: 若有「缺少 branding」错误，在对应构造处补 `branding`。修到无输出。

- [ ] **Step 5: 提交**

```bash
git add landing-editor/store/defaults.ts landing-editor/store/editorStore.tsx landing-editor/sampleDraft.ts
git commit -m "feat: 编辑器 store 接入 branding（常驻，默认 teal）"
```

---

## Task 7: BrandingForm 配置面板

**Files:**
- Create: `landing-editor/forms/BrandingForm.tsx`

- [ ] **Step 1: 新建面板**

`landing-editor/forms/BrandingForm.tsx`:
```tsx
"use client";
// landing-editor/forms/BrandingForm.tsx
// 品牌主题配置：6 套主题色卡选择 + Logo / favicon 上传。
import type { Branding } from "@/types/schema.draft";
import { THEME_META } from "@/landing-renderer/theme";
import { Field } from "../ui/Field";
import { MediaPicker } from "../ui/MediaPicker";

export function BrandingForm({ value, onChange }: { value: Branding; onChange: (v: Branding) => void }) {
  return (
    <div className="space-y-4">
      <Field label="主题配色">
        <div className="grid grid-cols-3 gap-2">
          {THEME_META.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange({ ...value, theme: m.id })}
              className={
                "flex flex-col items-center gap-1.5 rounded-lg border p-2 transition " +
                (value.theme === m.id ? "border-brand-500 bg-brand-50" : "border-edge hover:border-edge-strong")
              }
            >
              <span className={`h-8 w-full rounded-md ${m.swatch}`} />
              <span className="text-xs text-ink">{m.label}</span>
            </button>
          ))}
        </div>
      </Field>
      <Field label="品牌 Logo（宽图，显示在首屏与页脚）">
        <MediaPicker value={value.logo ?? ""} accept="image" onChange={(src) => onChange({ ...value, logo: src })} />
      </Field>
      <Field label="Favicon（方形小图，浏览器标签图标）">
        <MediaPicker value={value.favicon ?? ""} accept="image" onChange={(src) => onChange({ ...value, favicon: src })} />
      </Field>
    </div>
  );
}
```

- [ ] **Step 2: 类型检查 + lint**

Run: `npx tsc --noEmit && npx eslint landing-editor/forms/BrandingForm.tsx`
Expected: 均无错误

- [ ] **Step 3: 提交**

```bash
git add landing-editor/forms/BrandingForm.tsx
git commit -m "feat: 品牌主题配置面板 BrandingForm（色卡 + Logo/favicon）"
```

---

## Task 8: BlockList 入口 + EditorDetail 渲染

**Files:**
- Modify: `landing-editor/components/BlockList.tsx`
- Modify: `landing-editor/components/EditorDetail.tsx`

- [ ] **Step 1: BlockList 加常驻入口**

`landing-editor/components/BlockList.tsx`：从 store 的 import 加 `BRANDING_ID`。参照现有 `FixedRow`（Hero/Footer 用），在 Footer 的 `FixedRow` 之后（或页面级件区域）加：
```tsx
        <FixedRow
          label="品牌主题"
          hint="配色 / Logo"
          selected={state.selectedId === BRANDING_ID}
          onSelect={() => dispatch({ kind: "select", id: BRANDING_ID })}
        />
```
> 注：`FixedRow` 的 props 以该文件实际定义为准（label/hint/selected/onSelect）。读现有 Hero/Footer 的 FixedRow 用法对齐。

- [ ] **Step 2: EditorDetail 渲染面板**

`landing-editor/components/EditorDetail.tsx`：import 加 `import { BrandingForm } from "../forms/BrandingForm";` 与从 store 的 `BRANDING_ID`。在某个 `else if` 分支（如 FOOTER_ID 之后）加：
```tsx
  } else if (id === BRANDING_ID) {
    title = "品牌主题";
    body = <BrandingForm value={state.branding} onChange={(v) => dispatch({ kind: "updateBranding", value: v })} />;
```

- [ ] **Step 3: 类型检查 + lint**

Run: `npx tsc --noEmit && npx eslint landing-editor/components/BlockList.tsx landing-editor/components/EditorDetail.tsx`
Expected: 均无错误

- [ ] **Step 4: 提交**

```bash
git add landing-editor/components/BlockList.tsx landing-editor/components/EditorDetail.tsx
git commit -m "feat: 编辑器品牌主题入口 + 面板渲染"
```

---

## Task 9: e2e + 全量验证

**Files:**
- Create: `e2e/branding.spec.ts`

- [ ] **Step 1: 写 e2e**

`e2e/branding.spec.ts`:
```ts
// e2e/branding.spec.ts
// 品牌主题：切到 rose 主题 → 预览 CTA 含 rose 渐变 class；填 logo URL → 预览 Hero 出现 logo。
import { test, expect } from "@playwright/test";
import { Pool } from "pg";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const RUN = process.env.RUN_DB_E2E === "1";
const DEV_EMAIL = process.env.DEV_USER_EMAIL ?? "dev@localhost";

function makePool(): Pool {
  const connectionString = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
  return new Pool({ connectionString, ssl: isLocal ? false : { rejectUnauthorized: false } });
}

let pool: Pool;
let devUserId: string;

test.describe("品牌主题", () => {
  test.skip(!RUN, "Set RUN_DB_E2E=1 to run database-backed e2e tests.");

  test.beforeAll(async () => {
    pool = makePool();
    const res = await pool.query(
      `INSERT INTO users (email, name, plan) VALUES ($1, 'Dev User', 'pro')
       ON CONFLICT (email) DO UPDATE SET plan='pro' RETURNING id`, [DEV_EMAIL]);
    devUserId = res.rows[0].id;
    await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
  });

  test.afterAll(async () => {
    if (devUserId) await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
    await pool.end();
  });

  test("切主题 + Logo 反映到预览", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Dev Login/i }).click();
    await page.waitForURL("**/admin", { timeout: 30_000 });

    await page.goto("/admin/editor");
    await page.getByRole("button", { name: "空白开始" }).first().click();
    await page.waitForURL(/\/admin\/editor\/[^/]+$/, { timeout: 30_000 });

    // 打开「品牌主题」面板
    await page.getByText("品牌主题", { exact: true }).first().click();
    // 点「玫红」色卡
    await page.getByRole("button", { name: /玫红/ }).click();

    // 预览 iframe 的 CTA 主按钮 class 含 rose 渐变
    const frame = page.frameLocator('iframe[title="落地页实时预览"]');
    await expect(frame.locator('[class*="from-rose-500"]').first()).toBeVisible({ timeout: 15_000 });

    // 填 Logo URL → 预览 Hero 出现该 img
    const logoUrl = "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200";
    // BrandingForm 的 Logo MediaPicker 文本框（占位符含 https）
    const logoInput = page.getByPlaceholder(/https/).first();
    await logoInput.fill(logoUrl);
    await expect(frame.locator(`img[src="${logoUrl}"]`).first()).toBeVisible({ timeout: 15_000 });
  });
});
```
> 注：若 Logo MediaPicker 文本框定位器歧义（页面可能有多个 https 占位输入），按实际 DOM scope 到品牌面板内再定位；不弱化断言（rose class 出现 + logo img 出现）。

- [ ] **Step 2: 确保 DB 在跑 + seed**

Run: `docker exec zonit-pg-dev pg_isready -U postgres -d zonit && pnpm db:seed-dev`
Expected: accepting connections + seed 成功

- [ ] **Step 3: 跑该 e2e**

Run: `RUN_DB_E2E=1 pnpm exec playwright test e2e/branding.spec.ts`
Expected: 1 passed（定位器不符则按实际调整后跑通）

- [ ] **Step 4: 全量验证**

Run: `npx tsc --noEmit && npx eslint . && npx vitest run && RUN_DB_E2E=1 pnpm test:e2e`
Expected: tsc 通过；eslint 0 error；vitest 全绿（含 theme.test）；e2e 全 passed（原 9 + 新 1）。
（`npx next build` 若因 Google 字体网络不可达失败，属环境问题，单独说明。）

- [ ] **Step 5: 提交**

```bash
git add e2e/branding.spec.ts
git commit -m "test(e2e): 品牌主题切换 + Logo 预览"
```

---

## 验收标准（对照 spec）

- 6 套预设主题可用；`resolveTheme` 缺省/未知回退 teal；schema 有 `branding?`。
- `LandingPage` 按 `branding.theme` 派生主题（换肤链路接通），公开页/预览无需改 theme 传参。
- Hero 顶 + Footer 显示 Logo（无 logo 不显示）；公开页注入 favicon。
- 编辑器有"品牌主题"常驻入口 + 面板（6 色卡 + Logo/favicon MediaPicker）；预览实时反映。
- 单测覆盖 resolveTheme/THEMES 完整性；e2e 覆盖切主题 + Logo。
- tsc / eslint / vitest / e2e 全绿。
