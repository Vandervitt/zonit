# Auto SEO On Publish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate lead-generation SEO automatically when a landing page is published.

**Architecture:** Keep SEO generation server-side in the site publish API. A focused `lib/seo.ts` module extracts page content, creates a local fallback, optionally improves it with OpenAI, and writes the result into `data.pageMeta.seo`; the public route maps that saved SEO into Next metadata.

**Tech Stack:** Next.js 16 App Router, TypeScript, OpenAI Node SDK, PostgreSQL JSONB site data.

---

### Task 1: Schema

**Files:**
- Modify: `types/schema.ts`
- Modify: `lib/schema.zod.ts`

- [ ] Add generated SEO fields: `mode`, `ogTitle`, `ogDescription`, `generatedAt`, and `source`.
- [ ] Keep JSON-LD limited to Organization and FAQ by default.

### Task 2: SEO Service

**Files:**
- Create: `lib/seo.ts`

- [ ] Extract landing page content into a compact prompt payload.
- [ ] Build deterministic fallback SEO from brand, hero, offer, market, and slug.
- [ ] Call OpenAI only when `OPENAI_API_KEY` is configured.
- [ ] Never block publish on AI failure.

### Task 3: Publish API

**Files:**
- Modify: `app/api/sites/[id]/route.ts`

- [ ] When `published === true`, generate SEO before saving `data`.
- [ ] Preserve manual SEO overrides.
- [ ] Set canonical URL from request origin and slug.

### Task 4: Public Metadata

**Files:**
- Modify: `app/site/[slug]/page.tsx`
- Modify: `lib/jsonLd.ts`

- [ ] Export `generateMetadata` for the public landing page route.
- [ ] Map saved SEO to title, description, canonical, robots, and Open Graph metadata.
- [ ] Keep Organization and FAQ JSON-LD defaults compatible with existing pages.

### Task 5: Verification

**Commands:**
- `pnpm exec tsc --noEmit`
- `pnpm run lint`

- [ ] Fix any type or lint errors introduced by this change.
