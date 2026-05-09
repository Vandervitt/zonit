# Landing Page V2 Schema Renderer Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce the formal `modules / content / design / layout` landing page template model while keeping existing templates compatible.

**Architecture:** Add v2 schema types beside the current schema, then adapt old templates into v2 at render/editor boundaries. The renderer reads ordered module descriptors from `modules`, resolves typed content from `content`, and maps controlled `design/layout` options into existing Tailwind-based block components.

**Tech Stack:** TypeScript, React, Next.js App Router, Zod, Tailwind.

---

### Task 1: Type Contract

**Files:**
- Modify: `types/schema-contract.test.ts`
- Modify: `types/schema.ts`
- Modify: `lib/schema.zod.ts`

- [ ] Add a type-level contract for `LandingPageTemplateV2` with `modules`, `content`, `design`, and `layout`.
- [ ] Run `pnpm exec tsc --noEmit` and verify the new contract fails before production types exist.
- [ ] Add v2 TypeScript interfaces and zod schema.
- [ ] Run `pnpm exec tsc --noEmit` again.

### Task 2: Adapter

**Files:**
- Create: `lib/templates/landing-page-v2-adapter.ts`
- Modify: `components/renderer/registry.ts`

- [ ] Convert legacy `LandingPageTemplate` into v2 without changing stored legacy data.
- [ ] Preserve existing fixed order: hero, offer, howItWorks, optional blocks, leadForm, footer, stickyCta.
- [ ] Expose helpers to resolve module content and legacy optional block data.

### Task 3: Renderer

**Files:**
- Create: `components/renderer/TemplateRenderer.tsx`
- Modify: `components/renderer/LandingPageRenderer.tsx`
- Modify: `components/sites/PreviewRenderer.tsx`

- [ ] Add `TemplateRenderer` that renders v2 modules through a module registry.
- [ ] Keep `LandingPageTemplateRenderer` as compatibility wrapper.
- [ ] Make editor preview use the same renderer so preview and published output share one path.

### Task 4: Editor

**Files:**
- Modify: `components/sites/BlockEditorPanel.tsx`

- [ ] Build the editable module list from v2 modules.
- [ ] Keep existing form components for content editing.
- [ ] Add controlled design/layout editing for global style and per-module layout flags.
- [ ] Convert the edited v2 template back to legacy-compatible shape before calling existing `onChange`.

### Task 5: Verification

**Files:**
- No production changes.

- [ ] Run targeted eslint for changed files.
- [ ] Run `pnpm exec tsc --noEmit`; existing forbidden-template errors may remain and must be reported clearly.
- [ ] Verify `git diff -- templates/template` is empty.
