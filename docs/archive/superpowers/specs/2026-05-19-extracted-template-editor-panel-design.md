# Extracted Template Editor Panel — Design Spec

**Date:** 2026-05-19
**Scope:** Hero + FAQ text-field editing for `ExtractedTemplate` data in the site editor sidebar.

---

## Background

The site editor (`app/editor/[siteId]/page.tsx`) already detects `isExtractedTemplateData(data)` and branches the aside. Currently the extracted-template branch shows a static placeholder message. The preview iframe already routes to `BeautyTemplateRenderer` correctly via `PreviewRenderer`.

This spec covers wiring up a real editing panel for the aside branch, limited to the `hero` and `faq` modules, text fields only (no CTA editor).

---

## Files Changed

| File | Action |
|------|--------|
| `components/sites/ExtractedTemplateEditorPanel.tsx` | **New** |
| `app/editor/[siteId]/page.tsx` | **Modify** (2 lines) |

---

## New Component: `ExtractedTemplateEditorPanel`

**Location:** `components/sites/ExtractedTemplateEditorPanel.tsx`

### Props

```ts
{
  template: ExtractedTemplate;
  onChange: (t: ExtractedTemplate) => void;
}
```

### Layout

- Wraps content in `ScrollArea` (full sidebar height).
- Uses `Accordion` (shadcn/ui) with one item per supported module.
- **Light theme only** — white/slate palette, no dark background classes.

### Content patch helper

```ts
function patchContent(template: ExtractedTemplate, dataKey: string, value: unknown): ExtractedTemplate {
  return { ...template, content: { ...template.content, [dataKey]: value } };
}
```

### Module iteration

Iterate `template.modules`. For each module:
- `type === "hero"` → render `HeroEditor`
- `type === "faq"` → render `FaqEditor`
- anything else → skip (no accordion item rendered)

If neither hero nor faq is found in modules, render a short "no editable modules" message.

---

## Sub-editors

### `HeroEditor`

Input type: `HeroContent` (from `@/components/template-extraction/types`)

Editable fields (all `<Input>` or `<Textarea>`):

| Field | Label | Component |
|-------|-------|-----------|
| `badge` | Badge 文字 | `Input` |
| `title` | 主标题 | `Textarea` |
| `subtitle` | 副标题 | `Textarea` |
| `background.src` | 背景图 URL | `Input` |
| `media?.src` | 产品图 URL | `Input` (shown only if `media` exists in data) |
| `trustText` | 背书文字 | `Input` |

CTA fields are **not** editable in this phase.

### `FaqEditor`

Input type: `FaqContent` (from `@/components/template-extraction/types`)

Editable fields:

| Field | Label | Component |
|-------|-------|-----------|
| `title` | 标题 | `Input` |
| `subtitle` | 副标题 | `Input` |
| `items[].question` | 问题 | `Input` |
| `items[].answer` | 回答 | `Textarea` |

List controls:
- Each item has a delete button (×).
- "添加问题" button appends a new item with `id: crypto.randomUUID()` and placeholder text.

`contactCta` is **not** editable in this phase.

---

## Editor Page Changes (`app/editor/[siteId]/page.tsx`)

### 1. Fix `handleDataChange` type

```ts
// Before
const handleDataChange = (newData: LandingPageTemplate) => { ... }

// After
const handleDataChange = (newData: PresetTemplateData) => { ... }
```

`autoSave` already accepts `PresetTemplateData` via the `data` state. `updateSite` stores whatever is passed as `data`; the signature must accommodate `PresetTemplateData`. If `updateSite` is narrowly typed to `LandingPageTemplate`, widen it to `PresetTemplateData` there too.

### 2. Replace placeholder in aside

```tsx
// Before
{isExtractedTemplateData(data) ? (
  <div className="p-4 text-sm text-zinc-400">…placeholder…</div>
) : (
  <BlockEditorPanel … />
)}

// After
{isExtractedTemplateData(data) ? (
  <ExtractedTemplateEditorPanel template={data} onChange={handleDataChange} />
) : (
  <BlockEditorPanel … />
)}
```

---

## Constraints

- Tailwind only — no custom CSS, no inline styles.
- Light theme — use `bg-white`, `border-slate-200`, `text-slate-*` palette.
- No CTA editing in this phase.
- No dark-mode classes.
