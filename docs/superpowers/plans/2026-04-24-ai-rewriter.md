# AI Rewriter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为落地页编辑器添加 AI 一键洗稿功能，同时重写文案和随机化布局变体，从两个维度规避 FB 广告查重。

**Architecture:** Server Action 调用 OpenAI gpt-4o-mini（json_object 模式），同时完成文案重写和布局 variant 随机化；前端 `AiRewriteButton` 组件挂载在每个 block 表单顶部，通过 `onSuccess` 回调将新 JSON 写入 `LandingPageTemplate` state；`PreviewRenderer` 中各 block 组件根据 `variant` 字段条件渲染不同 HTML 结构。

**Tech Stack:** Next.js 14 App Router, TypeScript, Server Actions, `openai` npm package, Tailwind CSS, `sonner` toast

---

## File Map

| 文件 | 操作 |
|------|------|
| `package.json` | 修改：安装 `openai` |
| `.env.local` | 修改：加 `OPENAI_API_KEY` |
| `types/schema.ts` | 修改：Hero/Authority/Bundles/Reviews 加 `variant` 字段 |
| `components/sites/PreviewRenderer.tsx` | 修改：Hero/Authority/Bundles/Reviews block 加变体渲染 |
| `app/actions/ai-rewrite.ts` | 新建：Server Action |
| `components/editor/AiRewriteButton.tsx` | 新建：按钮组件 |
| `components/sites/BlockEditorPanel.tsx` | 修改：每个 renderForm 分支插入按钮 |

---

## Task 1: 安装 openai 包并配置环境变量

**Files:**
- Modify: `package.json`
- Modify: `.env.local`

- [ ] **Step 1: 安装 openai**

```bash
cd /Users/lajiao/Work/zonit && npm install openai
```

Expected: openai 出现在 `package.json` dependencies

- [ ] **Step 2: 在 .env.local 加 OPENAI_API_KEY 占位**

在 `.env.local` 末尾追加：

```
# OpenAI
OPENAI_API_KEY=sk-...your-key-here...
```

（替换为真实 key）

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): 安装 openai npm 包"
```

---

## Task 2: Schema 加 variant 字段

**Files:**
- Modify: `types/schema.ts`

- [ ] **Step 1: 在 HeroSchema 加 variant**

找到 `types/schema.ts` 中 `HeroSchema`，在 `trustText?` 后加一行：

```typescript
export interface HeroSchema {
  badge?: string;
  title: string;
  subtitle: string;
  background: {
    type: 'image' | 'color' | 'video';
    value: string;
    overlayOpacity?: number;
  };
  cta: CallToAction;
  trustText?: string;
  variant?: 'overlay' | 'split-left' | 'split-right';
}
```

- [ ] **Step 2: 在 AuthoritySchema 加 variant**

找到 `AuthoritySchema`，在 `signature?` 后加：

```typescript
export interface AuthoritySchema {
  title: string;
  subtitle?: string;
  paragraphs: string[];
  image: ImageMeta;
  stats?: { label: string; value: string; }[];
  signature?: { name: string; role: string; };
  variant?: 'image-left' | 'image-right';
}
```

- [ ] **Step 3: 在 BundlesSchema 加 variant**

找到 `BundlesSchema`：

```typescript
export interface BundlesSchema {
  title: string;
  subtitle?: string;
  tiers: BundleTier[];
  variant?: 'cards-row' | 'cards-column';
}
```

- [ ] **Step 4: 在 ReviewsSchema 加 variant**

找到 `ReviewsSchema`：

```typescript
export interface ReviewsSchema {
  title: string;
  subtitle?: string;
  averageRating?: number;
  totalReviews?: string;
  items: ReviewItem[];
  variant?: 'grid' | 'carousel';
}
```

- [ ] **Step 5: 类型检查**

```bash
cd /Users/lajiao/Work/zonit && npx tsc --noEmit
```

Expected: 无报错

- [ ] **Step 6: Commit**

```bash
git add types/schema.ts
git commit -m "feat(schema): 为 Hero/Authority/Bundles/Reviews 添加布局变体字段"
```

---

## Task 3: HeroBlock 支持 split-left / split-right 变体

**Files:**
- Modify: `components/sites/PreviewRenderer.tsx` (lines 35-79)

- [ ] **Step 1: 替换 HeroBlock 函数**

将 `PreviewRenderer.tsx` 中的整个 `HeroBlock` 函数替换为以下实现：

```tsx
function HeroBlock({ data, primaryColor, highlight }: { data: HeroSchema; primaryColor: string; highlight?: boolean }) {
  const v = data.variant ?? 'overlay';
  const bgImg = data.background.type === BackgroundType.Image ? data.background.value : undefined;
  const bgColor = data.background.type === BackgroundType.Color ? data.background.value : undefined;

  const textContent = (
    <>
      {data.badge && (
        <div className="inline-block px-3 py-1 rounded-full text-xs mb-3" style={{ backgroundColor: primaryColor + "20", color: primaryColor }}>
          {data.badge}
        </div>
      )}
      <h1 className="text-xl leading-snug mb-2 text-slate-800" style={{ whiteSpace: "pre-line" }}>
        {data.title}
      </h1>
      <p className="text-xs leading-relaxed mb-4 text-slate-500">{data.subtitle}</p>
      <button
        className="px-5 py-2.5 rounded-full text-sm text-white"
        style={{ backgroundColor: ctaThemeColor(data.cta.theme, primaryColor) }}
      >
        {data.cta.text}
      </button>
      {data.trustText && (
        <p className="text-xs mt-2 text-slate-400">{data.trustText}</p>
      )}
    </>
  );

  if (v === 'split-left' || v === 'split-right') {
    return (
      <section
        id="hero"
        className="px-5 py-8"
        style={{ backgroundColor: bgColor ?? '#f8f9ff', boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}
      >
        <div className={`flex items-center gap-4 ${v === 'split-right' ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className="flex-1 min-w-0">{textContent}</div>
          {bgImg && (
            <div className="w-2/5 shrink-0">
              <img src={bgImg} alt="" className="w-full h-32 object-cover rounded-xl" />
            </div>
          )}
        </div>
      </section>
    );
  }

  // overlay (default)
  return (
    <section
      id="hero"
      className="relative px-5 py-12 text-center"
      style={{
        backgroundColor: bgColor ?? "#f8f9ff",
        backgroundImage: bgImg ? `url(${bgImg})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        boxShadow: highlight ? HIGHLIGHT_STYLE : undefined,
      }}
    >
      {bgImg && (
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${data.background.overlayOpacity ?? 0.4})` }} />
      )}
      <div className="relative z-10">
        {data.badge && (
          <div className="inline-block px-3 py-1 rounded-full text-xs mb-4" style={{ backgroundColor: primaryColor + "20", color: primaryColor }}>
            {data.badge}
          </div>
        )}
        <h1 className="text-2xl leading-snug mb-3" style={{ color: bgImg ? "#fff" : "#1e293b", whiteSpace: "pre-line" }}>
          {data.title}
        </h1>
        <p className="text-sm leading-relaxed mb-6 max-w-sm mx-auto" style={{ color: bgImg ? "rgba(255,255,255,0.85)" : "#64748b" }}>
          {data.subtitle}
        </p>
        <button
          className="px-5 py-2.5 rounded-full text-sm text-white"
          style={{ backgroundColor: ctaThemeColor(data.cta.theme, primaryColor) }}
        >
          {data.cta.text}
        </button>
        {data.trustText && (
          <p className="text-xs mt-3" style={{ color: bgImg ? "rgba(255,255,255,0.7)" : "#94a3b8" }}>
            {data.trustText}
          </p>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 类型检查**

```bash
cd /Users/lajiao/Work/zonit && npx tsc --noEmit
```

Expected: 无报错

- [ ] **Step 3: Commit**

```bash
git add components/sites/PreviewRenderer.tsx
git commit -m "feat(preview): Hero 模块支持 split-left/split-right 布局变体"
```

---

## Task 4: AuthorityBlock 支持 image-left / image-right 变体

**Files:**
- Modify: `components/sites/PreviewRenderer.tsx` (AuthorityBlock function)

- [ ] **Step 1: 替换 AuthorityBlock 函数**

将 `PreviewRenderer.tsx` 中的整个 `AuthorityBlock` 函数替换为：

```tsx
function AuthorityBlock({ data, primaryColor, id, highlight }: { data: AuthoritySchema; primaryColor: string; id?: string; highlight?: boolean }) {
  const v = data.variant ?? 'image-left';

  const imageEl = data.image.src ? (
    <img src={data.image.src} alt={data.image.alt} className="w-full h-28 object-cover rounded-xl" />
  ) : null;

  const textEl = (
    <div className="flex-1 min-w-0">
      <p className="text-base text-slate-800 mb-1">{data.title}</p>
      {data.subtitle && <p className="text-xs text-slate-500 mb-3">{data.subtitle}</p>}
      <div className="space-y-1.5">
        {data.paragraphs.map((p, i) => (
          <p key={i} className="text-xs text-slate-600 leading-relaxed">{p}</p>
        ))}
      </div>
      {data.stats && data.stats.length > 0 && (
        <div className="flex gap-4 mt-4 pt-3 border-t border-slate-200">
          {data.stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-lg" style={{ color: primaryColor }}>{s.value}</p>
              <p className="text-[10px] text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}
      {data.signature && (
        <div className="mt-3 pt-2 border-t border-slate-200">
          <p className="text-sm text-slate-800">{data.signature.name}</p>
          <p className="text-xs text-slate-500">{data.signature.role}</p>
        </div>
      )}
    </div>
  );

  return (
    <section id={id} className="px-5 py-10 bg-slate-50" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <div className={`flex gap-4 items-start ${v === 'image-right' ? 'flex-row-reverse' : 'flex-row'}`}>
        {imageEl && <div className="w-2/5 shrink-0">{imageEl}</div>}
        {textEl}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 类型检查**

```bash
cd /Users/lajiao/Work/zonit && npx tsc --noEmit
```

Expected: 无报错

- [ ] **Step 3: Commit**

```bash
git add components/sites/PreviewRenderer.tsx
git commit -m "feat(preview): AuthorityStory 模块支持 image-left/image-right 布局变体"
```

---

## Task 5: BundlesBlock 支持 cards-column 变体

**Files:**
- Modify: `components/sites/PreviewRenderer.tsx` (BundlesBlock function)

- [ ] **Step 1: 替换 BundlesBlock 函数**

将 `PreviewRenderer.tsx` 中的整个 `BundlesBlock` 函数替换为：

```tsx
function BundlesBlock({ data, primaryColor, highlight }: { data: BundlesSchema; primaryColor: string; highlight?: boolean }) {
  const v = data.variant ?? 'cards-row';

  const tierCard = (tier: BundleTier) => (
    <div key={tier.id} className="border-2 rounded-2xl p-4 relative" style={{ borderColor: tier.tag ? primaryColor : "#e2e8f0" }}>
      {tier.tag && (
        <div className="absolute -top-3 left-4 px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: primaryColor }}>
          {tier.tag}
        </div>
      )}
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-sm text-slate-800">{tier.name}</p>
          <p className="text-xs text-slate-500">{tier.description}</p>
        </div>
        <div className="text-right shrink-0 ml-2">
          <p className="text-xl" style={{ color: primaryColor }}>{tier.price}</p>
          {tier.originalPrice && (
            <p className="text-xs text-slate-400 line-through">{tier.originalPrice}</p>
          )}
        </div>
      </div>
      <ul className="space-y-1 my-3">
        {tier.features.map((f, i) => (
          <li key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-emerald-500 text-base leading-none">✓</span> {f}
          </li>
        ))}
      </ul>
      <button
        className="w-full py-2 rounded-full text-xs text-white mt-2"
        style={{ backgroundColor: ctaThemeColor(tier.cta.theme, primaryColor) }}
      >
        {tier.cta.text}
      </button>
    </div>
  );

  return (
    <section id="bundles" className="px-5 py-10" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <p className="text-lg text-center text-slate-800 mb-1">{data.title}</p>
      {data.subtitle && <p className="text-xs text-center text-slate-500 mb-6">{data.subtitle}</p>}
      <div className={v === 'cards-column' ? "grid grid-cols-2 gap-3" : "space-y-4"}>
        {data.tiers.map(tierCard)}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 类型检查**

```bash
cd /Users/lajiao/Work/zonit && npx tsc --noEmit
```

Expected: 无报错

- [ ] **Step 3: Commit**

```bash
git add components/sites/PreviewRenderer.tsx
git commit -m "feat(preview): ProductBundles 模块支持 cards-column 布局变体"
```

---

## Task 6: ReviewsBlock 支持 carousel 变体

**Files:**
- Modify: `components/sites/PreviewRenderer.tsx` (ReviewsBlock function)

- [ ] **Step 1: 替换 ReviewsBlock 函数**

将 `PreviewRenderer.tsx` 中的整个 `ReviewsBlock` 函数替换为：

```tsx
function ReviewsBlock({ data, id, highlight }: { data: ReviewsSchema; id?: string; highlight?: boolean }) {
  const v = data.variant ?? 'grid';

  const reviewCard = (item: ReviewItem) => (
    <div key={item.id} className={`bg-slate-50 rounded-xl p-4 ${v === 'carousel' ? 'w-56 shrink-0' : ''}`}>
      <div className="flex items-start gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600 shrink-0">
          {item.authorName.charAt(0)}
        </div>
        <div>
          <p className="text-xs text-slate-800">{item.authorName}</p>
          {item.authorRole && <p className="text-[10px] text-slate-400">{item.authorRole}</p>}
        </div>
        <div className="ml-auto">
          <StarRating rating={item.rating} />
        </div>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">{item.content}</p>
    </div>
  );

  return (
    <section id={id} className="py-10" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <div className="px-5">
        <p className="text-lg text-center text-slate-800 mb-1">{data.title}</p>
        {data.subtitle && <p className="text-xs text-center text-slate-500 mb-2">{data.subtitle}</p>}
        {data.averageRating && (
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="text-2xl text-amber-400 font-bold">{data.averageRating}</span>
            <StarRating rating={Math.round(data.averageRating)} />
            {data.totalReviews && <span className="text-xs text-slate-400">({data.totalReviews})</span>}
          </div>
        )}
      </div>
      {v === 'carousel' ? (
        <div className="flex gap-3 overflow-x-auto px-5 pb-2 snap-x snap-mandatory">
          {data.items.map(reviewCard)}
        </div>
      ) : (
        <div className="px-5 space-y-3">
          {data.items.map(reviewCard)}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: 类型检查**

```bash
cd /Users/lajiao/Work/zonit && npx tsc --noEmit
```

Expected: 无报错

- [ ] **Step 3: Commit**

```bash
git add components/sites/PreviewRenderer.tsx
git commit -m "feat(preview): Reviews 模块支持 carousel 布局变体"
```

---

## Task 7: 创建 AI Rewrite Server Action

**Files:**
- Create: `app/actions/ai-rewrite.ts`

- [ ] **Step 1: 创建文件并写入 Server Action**

新建 `app/actions/ai-rewrite.ts`：

```typescript
"use server";

import OpenAI from "openai";

const VARIANT_HINTS: Record<string, string> = {
  Hero: "variant 允许值: 'overlay' | 'split-left' | 'split-right'",
  AuthorityStory: "variant 允许值: 'image-left' | 'image-right'",
  ProductBundles: "variant 允许值: 'cards-row' | 'cards-column'",
  Reviews: "variant 允许值: 'grid' | 'carousel'",
  Features: "layout 允许值: 'grid' | 'list'",
};

const SYSTEM_PROMPT = `你是一个顶级的海外直邮广告（Direct Response）文案大师。

任务：
1. 重写用户提供的 JSON 数据中的所有营销文案（保持原意、提升转化率、增加紧迫感）。
2. 如果 JSON 中存在 variant 或 layout 字段，从该字段的允许值中选一个与当前值不同的值写入，实现布局随机化。

严格约束：
- 返回与输入完全相同结构的 JSON，不增删任何 key。
- 不修改 URL、图片 src、颜色 HEX 代码、icon 字符串标识符（如 "WhatsApp", "Check"）。
- 必须返回合法 JSON object，不包含任何解释文字。`;

export async function rewriteBlockContent(
  blockType: string,
  currentData: unknown,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "OPENAI_API_KEY 未配置" };
  }

  const client = new OpenAI({ apiKey });
  const variantHint = VARIANT_HINTS[blockType] ?? "";

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `模块类型: ${blockType}\n${variantHint ? variantHint + "\n" : ""}当前数据:\n${JSON.stringify(currentData, null, 2)}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { success: false, error: "AI 返回格式异常，请重试" };
    }

    return { success: true, data: parsed };
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    return { success: false, error: `重写失败: ${message}` };
  }
}
```

- [ ] **Step 2: 类型检查**

```bash
cd /Users/lajiao/Work/zonit && npx tsc --noEmit
```

Expected: 无报错

- [ ] **Step 3: Commit**

```bash
git add app/actions/ai-rewrite.ts
git commit -m "feat(actions): 添加 AI 洗稿 Server Action"
```

---

## Task 8: 创建 AiRewriteButton 组件

**Files:**
- Create: `components/editor/AiRewriteButton.tsx`

- [ ] **Step 1: 创建组件目录并新建文件**

```bash
mkdir -p /Users/lajiao/Work/zonit/components/editor
```

新建 `components/editor/AiRewriteButton.tsx`：

```tsx
"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { rewriteBlockContent } from "@/app/actions/ai-rewrite";

interface Props {
  blockType: string;
  currentData: unknown;
  onSuccess: (data: unknown) => void;
}

export function AiRewriteButton({ blockType, currentData, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await rewriteBlockContent(blockType, currentData);
      if (result.success && result.data !== undefined) {
        onSuccess(result.data);
        toast.success("文案重写成功 ✨");
      } else {
        toast.error(result.error ?? "重写失败，请重试");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full h-8 rounded-md text-xs font-medium text-white flex items-center justify-center gap-1.5 transition-opacity disabled:opacity-60 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 mb-4"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Sparkles className="w-3.5 h-3.5" />
      )}
      {loading ? "AI 洗稿中..." : "AI 一键洗稿"}
    </button>
  );
}
```

- [ ] **Step 2: 类型检查**

```bash
cd /Users/lajiao/Work/zonit && npx tsc --noEmit
```

Expected: 无报错

- [ ] **Step 3: Commit**

```bash
git add components/editor/AiRewriteButton.tsx
git commit -m "feat(editor): 添加 AI 洗稿按钮组件"
```

---

## Task 9: 在 BlockEditorPanel 集成按钮

**Files:**
- Modify: `components/sites/BlockEditorPanel.tsx`

- [ ] **Step 1: 加 AiRewriteButton import**

`types/schema.ts` 中所有类型（`HeroSchema`、`BundlesSchema` 等）在 `BlockEditorPanel.tsx` 中已全部 import，只需在现有 import 列表后加一行：

```tsx
import { AiRewriteButton } from "../editor/AiRewriteButton";
```

- [ ] **Step 2: 修改 renderForm 的 Hero 分支**

找到：
```tsx
if (meta.key === FixedBlockKey.Hero) {
  return <HeroForm data={data.hero as HeroSchema} onChange={hero => onChange({ ...data, hero })} />;
}
```

替换为：
```tsx
if (meta.key === FixedBlockKey.Hero) {
  return (
    <>
      <AiRewriteButton
        blockType="Hero"
        currentData={data.hero}
        onSuccess={d => onChange({ ...data, hero: d as HeroSchema })}
      />
      <HeroForm data={data.hero as HeroSchema} onChange={hero => onChange({ ...data, hero })} />
    </>
  );
}
```

- [ ] **Step 3: 修改 Bundles 分支**

找到：
```tsx
if (meta.key === FixedBlockKey.Bundles) {
  return <BundlesForm data={data.bundles as BundlesSchema} onChange={bundles => onChange({ ...data, bundles })} />;
}
```

替换为：
```tsx
if (meta.key === FixedBlockKey.Bundles) {
  return (
    <>
      <AiRewriteButton
        blockType="ProductBundles"
        currentData={data.bundles}
        onSuccess={d => onChange({ ...data, bundles: d as BundlesSchema })}
      />
      <BundlesForm data={data.bundles as BundlesSchema} onChange={bundles => onChange({ ...data, bundles })} />
    </>
  );
}
```

- [ ] **Step 4: 修改 HowItWorks 分支**

找到：
```tsx
if (meta.key === FixedBlockKey.HowItWorks) {
  return <HowItWorksForm data={data.howItWorks as HowItWorksSchema} onChange={howItWorks => onChange({ ...data, howItWorks })} />;
}
```

替换为：
```tsx
if (meta.key === FixedBlockKey.HowItWorks) {
  return (
    <>
      <AiRewriteButton
        blockType="HowItWorks"
        currentData={data.howItWorks}
        onSuccess={d => onChange({ ...data, howItWorks: d as HowItWorksSchema })}
      />
      <HowItWorksForm data={data.howItWorks as HowItWorksSchema} onChange={howItWorks => onChange({ ...data, howItWorks })} />
    </>
  );
}
```

- [ ] **Step 5: 修改 Footer 分支**

找到：
```tsx
if (meta.key === FixedBlockKey.Footer) {
  return <FooterForm data={data.footer as MicroFooterSchema} onChange={footer => onChange({ ...data, footer })} />;
}
```

替换为：
```tsx
if (meta.key === FixedBlockKey.Footer) {
  return (
    <>
      <AiRewriteButton
        blockType="MicroFooter"
        currentData={data.footer}
        onSuccess={d => onChange({ ...data, footer: d as MicroFooterSchema })}
      />
      <FooterForm data={data.footer as MicroFooterSchema} onChange={footer => onChange({ ...data, footer })} />
    </>
  );
}
```

- [ ] **Step 6: 修改可选 block 的 switch 分支**

找到 `switch (block.type)` 段，将每个 `case` 从返回单个 Form 改为包含按钮。将整个 switch 替换为：

```tsx
switch (block.type) {
  case "Features":
    return (
      <>
        <AiRewriteButton
          blockType="Features"
          currentData={block.data}
          onSuccess={d => updateOptional(block.id, d as OptionalBlock["data"])}
        />
        <FeaturesForm data={block.data as FeaturesSchema} onChange={d => updateOptional(block.id, d)} />
      </>
    );
  case "Reviews":
    return (
      <>
        <AiRewriteButton
          blockType="Reviews"
          currentData={block.data}
          onSuccess={d => updateOptional(block.id, d as OptionalBlock["data"])}
        />
        <ReviewsForm data={block.data as ReviewsSchema} onChange={d => updateOptional(block.id, d)} />
      </>
    );
  case "TrustBanner":
    return (
      <>
        <AiRewriteButton
          blockType="TrustBanner"
          currentData={block.data}
          onSuccess={d => updateOptional(block.id, d as OptionalBlock["data"])}
        />
        <TrustBannerForm data={block.data as TrustBannerSchema} onChange={d => updateOptional(block.id, d)} />
      </>
    );
  case "AuthorityStory":
    return (
      <>
        <AiRewriteButton
          blockType="AuthorityStory"
          currentData={block.data}
          onSuccess={d => updateOptional(block.id, d as OptionalBlock["data"])}
        />
        <AuthorityForm data={block.data as AuthoritySchema} onChange={d => updateOptional(block.id, d)} />
      </>
    );
  case "FAQ":
    return (
      <>
        <AiRewriteButton
          blockType="FAQ"
          currentData={block.data}
          onSuccess={d => updateOptional(block.id, d as OptionalBlock["data"])}
        />
        <FAQForm data={block.data as FAQSchema} onChange={d => updateOptional(block.id, d)} />
      </>
    );
  default:
    return null;
}
```

- [ ] **Step 7: 类型检查**

```bash
cd /Users/lajiao/Work/zonit && npx tsc --noEmit
```

Expected: 无报错

- [ ] **Step 8: 启动 dev server 手动验证**

```bash
cd /Users/lajiao/Work/zonit && npm run dev
```

验证清单：
1. 打开编辑器，展开任意 block accordion
2. 表单顶部有紫色渐变「AI 一键洗稿」按钮
3. 点击按钮：变为「AI 洗稿中...」+转圈，无法重复点击
4. API key 有效时：toast 显示成功，预览面板文案更新
5. API key 缺失时：toast 显示错误「OPENAI_API_KEY 未配置」
6. 对含 variant 字段的 block（Hero/Features/Authority/Bundles/Reviews）洗稿后，预览中布局结构发生变化

- [ ] **Step 9: Commit**

```bash
git add components/sites/BlockEditorPanel.tsx
git commit -m "feat(editor): 集成 AI 洗稿按钮至所有模块表单"
```
