# 反同质化风控引擎 · Phase 1（隐形指纹）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 Pro/Agency 已发布落地页按稳定种子确定性打散 DOM / 属性 / meta 指纹，同一模板的不同页面不再逐字节雷同；Free/Starter 输出保持逐字节不变。

**Architecture:** 新增纯函数模块 `landing-renderer/variant.ts` 由种子（默认 `page.id`，可被 `data.variantSeed` 覆盖）确定性派生 `PageVariant`；渲染入口按 owner 套餐门控（`hasAntiBan`）选择 `deriveVariant` 或 `IDENTITY_VARIANT`，并在 `renderSection` 边界注入语义中性 wrapper / `data-*` 盐值，在 `generateMetadata` 注入变化的 `generator` meta。恒等变体保证零回归。

**Tech Stack:** Next.js（App Router, RSC）· React SSR · TypeScript · vitest · Tailwind（仅工具类，候选类名全字面量写死以过 JIT）。

**范围边界（本计划不含，各自后续独立计划）：**
- Phase 1b：编辑器「重新打散指纹」按钮（写 `data.variantSeed`）。本计划的自动种子（`page.id`）已让功能生效，重洗按钮为增强。
- Phase 2：Hero 布局变体 + 等价 class 互换 + 间距/圆角节奏（可见变体，需逐 section 视觉回归）。

**约定：** 命令用 `pnpm`；提交用中文 Conventional Commits、**禁 AI 署名**。每完成一个 Task 提交一次。

---

### Task 1: schema 加 `variantSeed` 字段

**Files:**
- Modify: `types/schema.draft.ts:335-344`（`LandingPageDraft` 接口）

- [ ] **Step 1: 加字段**

在 `LandingPageDraft` 接口内 `seo?: PageSeo;` 之后新增一行：

```ts
  variantSeed?: string;            // 反同质化种子（缺省渲染端回退 page.id；Pro/Agency 生效）
```

- [ ] **Step 2: 类型编译校验**

Run: `pnpm exec tsc --noEmit`
Expected: 无新增错误（新增可选字段，向后兼容）。

- [ ] **Step 3: 提交**

```bash
git add types/schema.draft.ts
git commit -m "feat: 落地页 schema 新增反同质化种子 variantSeed 字段"
```

---

### Task 2: `lib/plans.ts` 加 `hasAntiBan` 门控辅助

**Files:**
- Modify: `lib/plans.ts`（在 `hasWatermark` 附近，约 84 行）
- Test: `lib/plans.antiban.test.ts`（新建）

- [ ] **Step 1: 写失败测试**

创建 `lib/plans.antiban.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { hasAntiBan } from "./plans";

describe("hasAntiBan", () => {
  it("free / starter 关闭", () => {
    expect(hasAntiBan("free")).toBe(false);
    expect(hasAntiBan("starter")).toBe(false);
  });
  it("pro / agency 开启", () => {
    expect(hasAntiBan("pro")).toBe(true);
    expect(hasAntiBan("agency")).toBe(true);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm exec vitest run lib/plans.antiban.test.ts`
Expected: FAIL —「hasAntiBan is not a function / not exported」。

- [ ] **Step 3: 实现**

在 `lib/plans.ts` 中 `hasWatermark` 函数后新增：

```ts
export function hasAntiBan(plan: PlanId): boolean {
  return PLANS[plan].antiBan;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm exec vitest run lib/plans.antiban.test.ts`
Expected: PASS（4 断言）。

- [ ] **Step 5: 提交**

```bash
git add lib/plans.ts lib/plans.antiban.test.ts
git commit -m "feat: 套餐层新增 hasAntiBan 门控辅助"
```

---

### Task 3: 核心变体模块 `landing-renderer/variant.ts`

**Files:**
- Create: `landing-renderer/variant.ts`
- Test: `landing-renderer/variant.test.ts`（新建）

- [ ] **Step 1: 写失败测试**

创建 `landing-renderer/variant.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import {
  fnv1a,
  deriveVariant,
  IDENTITY_VARIANT,
  sectionWrap,
} from "./variant";

describe("fnv1a", () => {
  it("确定性：同串同哈希", () => {
    expect(fnv1a("abc")).toBe(fnv1a("abc"));
  });
  it("异串异哈希（高概率）", () => {
    expect(fnv1a("abc")).not.toBe(fnv1a("abd"));
  });
  it("输出为无符号 32 位整数", () => {
    const h = fnv1a("zonit");
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xffffffff);
  });
});

describe("deriveVariant", () => {
  it("同种子结果完全一致", () => {
    expect(deriveVariant("page-1")).toEqual(deriveVariant("page-1"));
  });
  it("不同种子 seedHash 不同", () => {
    expect(deriveVariant("page-1").seedHash).not.toBe(deriveVariant("page-2").seedHash);
  });
  it("非恒等，且 metaToken 非空", () => {
    const v = deriveVariant("page-1");
    expect(v.identity).toBe(false);
    expect(v.metaToken.length).toBeGreaterThan(0);
  });
});

describe("IDENTITY_VARIANT", () => {
  it("恒等：identity=true、seedHash=0、metaToken 空", () => {
    expect(IDENTITY_VARIANT.identity).toBe(true);
    expect(IDENTITY_VARIANT.seedHash).toBe(0);
    expect(IDENTITY_VARIANT.metaToken).toBe("");
  });
});

describe("sectionWrap", () => {
  it("恒等变体恒返回 none（不包裹）", () => {
    for (let i = 0; i < 8; i++) {
      expect(sectionWrap(IDENTITY_VARIANT, i).tag).toBe("none");
    }
  });
  it("同变体 + 同 index 结果一致", () => {
    const v = deriveVariant("page-1");
    expect(sectionWrap(v, 3)).toEqual(sectionWrap(v, 3));
  });
  it("className 只能是空串或 contents", () => {
    const v = deriveVariant("page-1");
    for (let i = 0; i < 12; i++) {
      expect(["", "contents"]).toContain(sectionWrap(v, i).className);
    }
  });
  it("包裹时 data 属性名在白名单内", () => {
    const v = deriveVariant("page-abc");
    for (let i = 0; i < 12; i++) {
      const w = sectionWrap(v, i);
      if (w.tag === "div" && w.attr) {
        expect(["data-v", "data-sx", "data-blk", "data-r"]).toContain(w.attr);
      }
    }
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm exec vitest run landing-renderer/variant.test.ts`
Expected: FAIL —「Cannot find module './variant'」。

- [ ] **Step 3: 实现**

创建 `landing-renderer/variant.ts`：

```ts
// landing-renderer/variant.ts
// 反同质化 Phase 1：按种子确定性派生「隐形指纹」变体。
// 纯函数、无副作用、SSR 可复现；恒等变体输出与改造前逐字节一致。
// 约束：所有候选类名字面量写死（Tailwind JIT 可扫），运行期只挑选不拼接。

export interface PageVariant {
  /** true = 恒等变体（Free/Starter 或无 antiBan）：输出与改造前完全一致。 */
  identity: boolean;
  /** 种子哈希（identity 时为 0）。 */
  seedHash: number;
  /** <meta name="generator"> 令牌（identity 时为空串 → 不覆盖）。 */
  metaToken: string;
}

export const IDENTITY_VARIANT: PageVariant = { identity: true, seedHash: 0, metaToken: "" };

/** FNV-1a 32bit：字符串 → 无符号 32 位哈希。 */
export function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32：整数种子 → [0,1) 伪随机（确定性）。 */
function mulberry32(seed: number): number {
  let t = (seed + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** generator meta 候选（全字面量，语义等价品牌串）。 */
const META_TOKENS = ["Zap Bridge", "Zap Bridge Sites", "Zap Bridge Pages", "Zap Bridge Studio"];

export function deriveVariant(seed: string): PageVariant {
  const seedHash = fnv1a(seed);
  const metaToken = META_TOKENS[Math.floor(mulberry32(seedHash) * META_TOKENS.length)];
  return { identity: false, seedHash, metaToken };
}

/** 单个 section 的包裹策略（纯函数，按 seedHash + index 确定）。 */
export interface SectionWrap {
  tag: "none" | "div";   // none = 不包裹
  className: string;     // "" 或 "contents"（display:contents，均视觉无副作用）
  attr: string;          // data-* 属性名，"" 表示不加属性
  attrValue: string;
}

const WRAP_ATTRS = ["data-v", "data-sx", "data-blk", "data-r"];

export function sectionWrap(variant: PageVariant, index: number): SectionWrap {
  if (variant.identity) return { tag: "none", className: "", attr: "", attrValue: "" };
  const r = mulberry32((variant.seedHash ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0);
  const mode = r < 0.34 ? "none" : r < 0.67 ? "block" : "contents";
  if (mode === "none") return { tag: "none", className: "", attr: "", attrValue: "" };
  const attr = WRAP_ATTRS[Math.floor(mulberry32((variant.seedHash + index * 131) >>> 0) * WRAP_ATTRS.length)];
  const attrValue = ((variant.seedHash ^ Math.imul(index + 7, 0x85ebca6b)) >>> 0).toString(36);
  return { tag: "div", className: mode === "contents" ? "contents" : "", attr, attrValue };
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm exec vitest run landing-renderer/variant.test.ts`
Expected: PASS（全部断言）。

- [ ] **Step 5: 提交**

```bash
git add landing-renderer/variant.ts landing-renderer/variant.test.ts
git commit -m "feat: 反同质化种子变体核心（fnv1a/mulberry32/deriveVariant/sectionWrap）"
```

---

### Task 4: 渲染链路透传 variant + wrapper 注入

**Files:**
- Modify: `landing-renderer/sections/index.tsx`（`renderSection`）
- Modify: `landing-renderer/LandingPage.tsx:11-30`
- Test: `landing-renderer/fingerprint.test.tsx`（新建）

- [ ] **Step 1: 写失败测试（指纹有效性 + 恒等零回归）**

创建 `landing-renderer/fingerprint.test.tsx`：

```tsx
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LandingPage } from "./LandingPage";
import { deriveVariant, IDENTITY_VARIANT } from "./variant";
import { petDraft } from "@/landing-editor/samples/petDraft";

const render = (variant = IDENTITY_VARIANT) =>
  renderToStaticMarkup(<LandingPage page={petDraft} pageId="p1" variant={variant} />);

describe("反同质化指纹", () => {
  it("默认（不传 variant）= 恒等，与显式 IDENTITY_VARIANT 逐字节一致", () => {
    const a = renderToStaticMarkup(<LandingPage page={petDraft} pageId="p1" />);
    expect(a).toBe(render(IDENTITY_VARIANT));
  });

  it("打散后 HTML 与恒等不同", () => {
    expect(render(deriveVariant("seed-a"))).not.toBe(render(IDENTITY_VARIANT));
  });

  it("不同种子 HTML 不同", () => {
    expect(render(deriveVariant("seed-a"))).not.toBe(render(deriveVariant("seed-b")));
  });

  it("打散不改可见文案（标题仍在）", () => {
    const html = render(deriveVariant("seed-a"));
    expect(html).toContain(petDraft.hero.title);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm exec vitest run landing-renderer/fingerprint.test.tsx`
Expected: FAIL —`LandingPage` 尚不接受 `variant` prop，「打散后不同」断言失败。

- [ ] **Step 3: 改 `renderSection` 支持包裹**

将 `landing-renderer/sections/index.tsx` 的 `renderSection` 改为：内部先算出原始元素，再按 `sectionWrap` 决定是否包裹。完整替换 `renderSection` 函数：

```tsx
import { sectionWrap, IDENTITY_VARIANT, type PageVariant } from "../variant";

function renderInner(section: LandingSection, theme: RendererTheme, key: number) {
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

export function renderSection(
  section: LandingSection,
  theme: RendererTheme,
  key: number,
  variant: PageVariant = IDENTITY_VARIANT,
) {
  const el = renderInner(section, theme, key);
  const w = sectionWrap(variant, key);
  if (w.tag === "none") return el;
  const attrs: Record<string, string> = {};
  if (w.attr) attrs[w.attr] = w.attrValue;
  return (
    <div key={key} className={w.className} {...attrs}>
      {el}
    </div>
  );
}
```

（`assertNever` 保留原样；`import` 段在文件顶部补 `sectionWrap` 那一行。）

- [ ] **Step 4: 改 `LandingPage` 接收并透传 variant**

将 `landing-renderer/LandingPage.tsx` 的 props 与 sections 渲染改为：

```tsx
import { IDENTITY_VARIANT, type PageVariant } from "./variant";

export function LandingPage({
  page,
  theme,
  pageId = "",
  variant = IDENTITY_VARIANT,
}: {
  page: LandingPageDraft;
  theme?: RendererTheme;
  pageId?: string;
  variant?: PageVariant;
}) {
  const resolved = theme ?? resolveTheme(page.branding?.theme);
  const logo = page.branding?.logo;
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Hero data={page.hero} theme={resolved} logo={logo} />
      {page.sections.map((section, i) => renderSection(section, resolved, i, variant))}
      {page.leadForm?.enabled ? <LeadForm data={page.leadForm} pageId={pageId} theme={resolved} /> : null}
      <Footer data={page.footer} theme={resolved} logo={logo} />
      {page.floatingButton && <FloatingButton data={page.floatingButton} theme={resolved} />}
    </div>
  );
}
```

- [ ] **Step 5: 跑测试确认通过**

Run: `pnpm exec vitest run landing-renderer/fingerprint.test.tsx landing-renderer/theme.test.ts`
Expected: PASS（指纹 4 断言 + theme 原有断言均绿；证明恒等零回归）。

- [ ] **Step 6: 提交**

```bash
git add landing-renderer/sections/index.tsx landing-renderer/LandingPage.tsx landing-renderer/fingerprint.test.tsx
git commit -m "feat: 渲染链路透传反同质化变体并在 section 边界注入中性包裹"
```

---

### Task 5: 公开页按套餐门控派生 variant + meta 变化

**Files:**
- Modify: `app/p/[slug]/page.tsx`（`generateMetadata` 与默认导出组件）

- [ ] **Step 1: 组件内门控派生并透传**

在 `app/p/[slug]/page.tsx` 顶部 import 段补：

```ts
import { hasAntiBan } from "@/lib/plans";
import { deriveVariant, IDENTITY_VARIANT } from "@/landing-renderer/variant";
```

在默认导出 `PublicLandingPage` 内，`const tracking = gateTrackingByPlan(...)` 之后新增：

```ts
  const variant = hasAntiBan(plan) ? deriveVariant(page.data.variantSeed ?? page.id) : IDENTITY_VARIANT;
```

并把 `<LandingPage ... />` 改为：

```tsx
      <LandingPage page={page.data} pageId={page.id} variant={variant} />
```

- [ ] **Step 2: `generateMetadata` 注入 generator 变化**

在 `generateMetadata` 内 `const page = await getPublishedBySlug(slug);` 之后（`if (!page) return {};` 之下）新增：

```ts
  const plan = await getUserPlan(page.user_id);
  const variant = hasAntiBan(plan) ? deriveVariant(page.data.variantSeed ?? page.id) : IDENTITY_VARIANT;
```

并在返回的 `Metadata` 对象里加一行（与 `title`、`description` 同级）：

```ts
    generator: variant.metaToken || undefined,
```

在 import 段补 `getUserPlan`（若该函数未在本文件引入）：

```ts
import { getUserPlan } from "@/lib/plans-db";
```

（注：`getUserPlan` 已在组件段使用并 import；确认顶部只需一次 import，勿重复。）

- [ ] **Step 3: 类型 + lint 校验**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: 零错误。

- [ ] **Step 4: 提交**

```bash
git add app/p/[slug]/page.tsx
git commit -m "feat: 公开页按套餐门控派生反同质化指纹并变化 generator meta"
```

---

### Task 6: 全量验证门槛 + 收尾

**Files:** 无（仅验证）

- [ ] **Step 1: 全量单测**

Run: `pnpm test`
Expected: 全绿（含新增 variant / plans.antiban / fingerprint 与既有用例）。

- [ ] **Step 2: Lint + 类型 + 构建**

Run: `pnpm lint && pnpm exec tsc --noEmit && pnpm build`
Expected: 零错误、构建成功。

- [ ] **Step 3: 人工核验（可选，本地起服）**

如本地已配置 DB：以 Pro 账号发布一页，`view-source` 确认 section 出现 `data-*` 盐值 / `contents` 包裹且 `<meta name="generator">` 存在；以 Free 账号发布同模板确认无上述差异、输出与改造前一致。测试完销毁自起服务。

- [ ] **Step 4: 更新记忆**

将 `project_plan_benefits_consistency.md` 中 `antiBan` 由「零实现 TODO」更新为「Phase 1 隐形指纹已实现（渲染核心，自动 page.id 种子）；Phase 1b 重洗按钮 / Phase 2 可见变体待做」。

---

## Self-Review 覆盖核对

- 种子化 variant → Task 3。门控（Pro/Agency 生效、Free/Starter 恒等）→ Task 2 + Task 5。
- Phase 1 三杠杆：wrapper 抖动 + data-* 加盐 → Task 3/4；head/meta 变化 → Task 5。
- 确定性 / 无 hydration mismatch → 纯函数派生（Task 3）+ 恒等零回归测试（Task 4 Step 1）。
- 测试策略：deriveVariant 确定性 / 门控 / 落在允许集 → Task 2/3；恒等逐字节一致 + 异种子指纹不同 + 文案不变 → Task 4。
- Tailwind JIT 约束：候选类仅 `""` / `contents`（`contents` 已在 wrapper 字面量出现，JIT 可扫）→ Task 3。
- 未覆盖（有意，属后续计划）：编辑器重洗按钮（Phase 1b）、可见布局/间距变体（Phase 2）。
