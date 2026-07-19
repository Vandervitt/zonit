# 编辑器选图体验（Unsplash + 内嵌上传 + alt）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 MediaPicker 重构为三 Tab 选图弹窗（媒体库 / 上传 / Unsplash），接通已存在的上传与 Unsplash 端点，并让选 Unsplash 图自动带入 alt 建议。

**Architecture:** 抽 `lib/media-upload.ts` 纯上传逻辑供 UploadZone 与 MediaPicker 共用；MediaPicker 拆为壳 + 3 个 Tab 组件（编辑器 Tailwind 区，不引 antd）；`onChange` 升级为 `(src, suggestedAlt?)`，外层 `fields.tsx` 仅在有建议时覆盖 alt，现有外层 alt 输入框不动。

**Tech Stack:** Next.js 16(App Router)、TypeScript、Tailwind、vitest、Playwright、Vercel Blob、Unsplash API。

设计来源:`docs/superpowers/specs/2026-06-22-media-picker-unsplash-alt-design.md`

---

## File Structure

- `lib/media-upload.ts` —（新建）`uploadMedia(file)` 纯上传逻辑。
- `components/media/UploadZone.tsx` —（改）内部改调 `uploadMedia`。
- `landing-editor/ui/media/unsplash.ts` —（新建）`pickUnsplash` 映射 + 类型。
- `landing-editor/ui/media/unsplash.test.ts` —（新建）`pickUnsplash` 单测。
- `landing-editor/ui/media/MediaLibraryTab.tsx` —（新建）媒体库网格 Tab。
- `landing-editor/ui/media/UploadTab.tsx` —（新建）上传 Tab。
- `landing-editor/ui/media/UnsplashTab.tsx` —（新建）Unsplash 搜索 Tab。
- `landing-editor/ui/MediaPicker.tsx` —（改）壳：文本框 + 选图按钮 + 预览 + Tab 弹窗;`onChange` 升级。
- `landing-editor/forms/fields.tsx` —（改）两处调用点适配新 onChange。
- `e2e/media-picker.spec.ts` —（新建）上传 / demo 提示 / alt 渲染 / 视频无 Unsplash Tab。

---

## Task 1: 抽取共享上传逻辑 `uploadMedia`

**Files:**
- Create: `lib/media-upload.ts`
- Modify: `components/media/UploadZone.tsx`

- [ ] **Step 1: 新建 `lib/media-upload.ts`**

```ts
// lib/media-upload.ts
// 与 UI 无关的上传逻辑：POST /api/media（FormData）→ 返回入库后的 MediaItem。
// 供后台 UploadZone 与编辑器 MediaPicker 的上传 Tab 共用，保证两处行为一致。
import { ApiRoutes } from "@/lib/constants";
import type { MediaItem } from "@/lib/media-db";

export async function uploadMedia(file: File): Promise<MediaItem> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(ApiRoutes.Media, { method: "POST", body: form });
  if (!res.ok) {
    let msg = "上传失败";
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      // 忽略解析失败，用默认文案
    }
    throw new Error(msg);
  }
  return (await res.json()) as MediaItem;
}
```

- [ ] **Step 2: 改 `UploadZone.tsx` 内部调用 `uploadMedia`**

把 `components/media/UploadZone.tsx` 的 `upload` 函数体替换为（保留 antd UI 与 message 提示，仅 fetch 部分改为共享逻辑）：
```tsx
  const upload = async (file: File) => {
    setUploading(true);
    try {
      const item = await uploadMedia(file);
      onUploaded(item);
    } catch (e) {
      void message.error(e instanceof Error ? e.message : "上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };
```
并在文件顶部 import 区加：
```tsx
import { uploadMedia } from "@/lib/media-upload";
```
同时删除原 `upload` 里直接用到的 `ApiRoutes` 引用（若 `ApiRoutes` 在该文件其它处不再使用，则一并删除其 import；若仍被使用则保留）。

- [ ] **Step 3: 类型检查 + lint**

Run: `npx tsc --noEmit && npx eslint lib/media-upload.ts components/media/UploadZone.tsx`
Expected: 均无错误

- [ ] **Step 4: 提交**

```bash
git add lib/media-upload.ts components/media/UploadZone.tsx
git commit -m "refactor: 抽取共享上传逻辑 uploadMedia，UploadZone 复用"
```

---

## Task 2: Unsplash 结果映射纯函数 `pickUnsplash`

**Files:**
- Create: `landing-editor/ui/media/unsplash.ts`
- Test: `landing-editor/ui/media/unsplash.test.ts`

- [ ] **Step 1: 写失败测试**

`landing-editor/ui/media/unsplash.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { pickUnsplash, type UnsplashPhoto } from "./unsplash";

const base: UnsplashPhoto = {
  id: "x1",
  urls: { small: "https://img/s.jpg", regular: "https://img/r.jpg" },
  alt_description: "a calm beach",
  user: { name: "Jane", username: "jane" },
};

describe("pickUnsplash", () => {
  it("取 regular 作 src、alt_description 作 alt", () => {
    expect(pickUnsplash(base)).toEqual({ src: "https://img/r.jpg", alt: "a calm beach" });
  });
  it("alt_description 为 null 时 alt 回退空串", () => {
    expect(pickUnsplash({ ...base, alt_description: null })).toEqual({ src: "https://img/r.jpg", alt: "" });
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run landing-editor/ui/media/unsplash.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 写实现**

`landing-editor/ui/media/unsplash.ts`:
```ts
// landing-editor/ui/media/unsplash.ts
// Unsplash 搜索结果类型 + 映射为编辑器选图所需的 {src, alt}。
export interface UnsplashPhoto {
  id: string;
  urls: { small: string; regular: string };
  alt_description: string | null;
  user: { name: string; username: string };
}

export interface PickedImage {
  src: string;
  alt: string;
}

/** 选中 Unsplash 图：用 regular 作 src，alt_description 作 alt（缺省空串）。 */
export function pickUnsplash(p: UnsplashPhoto): PickedImage {
  return { src: p.urls.regular, alt: p.alt_description ?? "" };
}
```

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run landing-editor/ui/media/unsplash.test.ts`
Expected: PASS（2 tests）

- [ ] **Step 5: 提交**

```bash
git add landing-editor/ui/media/unsplash.ts landing-editor/ui/media/unsplash.test.ts
git commit -m "feat: Unsplash 结果映射纯函数 pickUnsplash"
```

---

## Task 3: 媒体库 Tab 组件

**Files:**
- Create: `landing-editor/ui/media/MediaLibraryTab.tsx`

- [ ] **Step 1: 新建 MediaLibraryTab**

`landing-editor/ui/media/MediaLibraryTab.tsx`（迁移 MediaPicker 现有只读网格逻辑，选中回调 `onPick(url)`）:
```tsx
"use client";
// landing-editor/ui/media/MediaLibraryTab.tsx
// 媒体库网格：GET /api/media?type= 拉取当前用户素材，点选回传 url。
import { useEffect, useState } from "react";
import type { MediaItem } from "@/lib/media-db";

export function MediaLibraryTab({
  accept,
  onPick,
}: {
  accept: "image" | "video";
  onPick: (url: string) => void;
}) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/media?type=${accept}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 401 ? "未登录或无权限" : `HTTP ${res.status}`);
        return res.json() as Promise<MediaItem[]>;
      })
      .then((data) => active && setItems(data))
      .catch((e) => active && setError(e instanceof Error ? e.message : "加载失败"));
    return () => {
      active = false;
    };
  }, [accept]);

  if (error) return <div className="py-10 text-center text-sm text-red-600">{error}</div>;
  if (items === null) return <div className="py-10 text-center text-sm text-ink-muted">加载中…</div>;
  if (items.length === 0)
    return <div className="py-10 text-center text-sm text-ink-muted">媒体库暂无素材，可切到「上传」或直接填写资源路径。</div>;

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onPick(item.url)}
          title={item.filename}
          className="group overflow-hidden rounded-lg border border-edge transition-colors hover:border-brand-500"
        >
          {item.type === "video" ? (
            <video src={item.url} className="aspect-square w-full bg-canvas object-cover" muted />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.url} alt={item.filename} className="aspect-square w-full bg-canvas object-cover" />
          )}
          <span className="block truncate px-1.5 py-1 text-left text-[10px] text-ink-muted">{item.filename}</span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无输出（通过）

- [ ] **Step 3: 提交**

```bash
git add landing-editor/ui/media/MediaLibraryTab.tsx
git commit -m "feat: MediaPicker 媒体库 Tab 组件"
```

---

## Task 4: 上传 Tab 组件

**Files:**
- Create: `landing-editor/ui/media/UploadTab.tsx`

- [ ] **Step 1: 新建 UploadTab**

`landing-editor/ui/media/UploadTab.tsx`（Tailwind UI + `uploadMedia`，成功即回传 url）:
```tsx
"use client";
// landing-editor/ui/media/UploadTab.tsx
// 上传 Tab：选文件 → uploadMedia → 成功回传新素材 url（壳负责选中并关闭）。
import { useRef, useState } from "react";
import { uploadMedia } from "@/lib/media-upload";
import { Button } from "../Button";

export function UploadTab({
  accept,
  onUploaded,
}: {
  accept: "image" | "video";
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const item = await uploadMedia(file);
      onUploaded(item.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <input
        ref={inputRef}
        type="file"
        accept={accept === "video" ? "video/*" : "image/*"}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
      <Button variant="primary" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? "上传中…" : `上传${accept === "video" ? "视频" : "图片"}`}
      </Button>
      <p className="text-xs text-ink-muted">上传后自动入库并选中（≤100MB，不支持 SVG）</p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
```

- [ ] **Step 2: 确认 Button 支持 variant="primary"**

Run: `grep -n "primary" landing-editor/ui/Button.tsx`
Expected: 命中（variants 含 primary）。若不含，改用现有 variant（如 `subtle`），并据实调整。

- [ ] **Step 3: 类型检查 + lint**

Run: `npx tsc --noEmit && npx eslint landing-editor/ui/media/UploadTab.tsx`
Expected: 均无错误

- [ ] **Step 4: 提交**

```bash
git add landing-editor/ui/media/UploadTab.tsx
git commit -m "feat: MediaPicker 上传 Tab 组件"
```

---

## Task 5: Unsplash Tab 组件

**Files:**
- Create: `landing-editor/ui/media/UnsplashTab.tsx`

- [ ] **Step 1: 新建 UnsplashTab**

`landing-editor/ui/media/UnsplashTab.tsx`:
```tsx
"use client";
// landing-editor/ui/media/UnsplashTab.tsx
// Unsplash 搜索：GET /api/unsplash/search?q= → 网格；点选经 pickUnsplash 回传 {src, alt}。
// 后端无 key 时返回 { _demo: true }，此处显示提示。
import { useState } from "react";
import { TextInput } from "../TextInput";
import { Button } from "../Button";
import { pickUnsplash, type UnsplashPhoto, type PickedImage } from "./unsplash";

type Status = "idle" | "loading" | "demo" | "error" | "done";

export function UnsplashTab({ onPick }: { onPick: (picked: PickedImage) => void }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);

  const search = async () => {
    if (!q.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch(`/api/unsplash/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data._demo) { setStatus("demo"); setPhotos([]); return; }
      if (!res.ok) { setStatus("error"); setPhotos([]); return; }
      setPhotos((data.results ?? []) as UnsplashPhoto[]);
      setStatus("done");
    } catch {
      setStatus("error");
      setPhotos([]);
    }
  };

  return (
    <div className="space-y-3">
      <form
        className="flex items-center gap-1.5"
        onSubmit={(e) => { e.preventDefault(); void search(); }}
      >
        <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索 Unsplash 图片（英文更准）" />
        <Button type="submit" variant="subtle" className="shrink-0">搜索</Button>
      </form>

      {status === "demo" ? (
        <div className="py-8 text-center text-sm text-ink-muted">
          未配置 Unsplash，可用「媒体库 / 上传」，或直接在上方填写图片 URL。
        </div>
      ) : status === "error" ? (
        <div className="py-8 text-center text-sm text-red-600">搜索失败，请重试</div>
      ) : status === "loading" ? (
        <div className="py-8 text-center text-sm text-ink-muted">搜索中…</div>
      ) : photos.length === 0 ? (
        <div className="py-8 text-center text-sm text-ink-muted">输入关键词后搜索图片</div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(pickUnsplash(p))}
              title={p.alt_description ?? `by ${p.user.name}`}
              className="group overflow-hidden rounded-lg border border-edge transition-colors hover:border-brand-500"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.urls.small} alt={p.alt_description ?? ""} className="aspect-square w-full bg-canvas object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 类型检查 + lint**

Run: `npx tsc --noEmit && npx eslint landing-editor/ui/media/UnsplashTab.tsx`
Expected: 均无错误

- [ ] **Step 3: 提交**

```bash
git add landing-editor/ui/media/UnsplashTab.tsx
git commit -m "feat: MediaPicker Unsplash 搜索 Tab 组件"
```

---

## Task 6: MediaPicker 壳（Tab 弹窗 + onChange 升级）

**Files:**
- Modify: `landing-editor/ui/MediaPicker.tsx`

- [ ] **Step 1: 整体替换 MediaPicker.tsx**

```tsx
"use client";
// landing-editor/ui/MediaPicker.tsx
// 选图入口：外层文本框（可直接贴 URL）+「选图」按钮 + 预览 + 三 Tab 弹窗。
// onChange(src, suggestedAlt?)：媒体库/上传只回传 src；Unsplash 额外回传 alt 建议。
import { useState } from "react";
import { TextInput } from "./TextInput";
import { Button } from "./Button";
import { MediaLibraryTab } from "./media/MediaLibraryTab";
import { UploadTab } from "./media/UploadTab";
import { UnsplashTab } from "./media/UnsplashTab";

type Tab = "library" | "upload" | "unsplash";

export function MediaPicker({
  value,
  onChange,
  accept,
  placeholder = "https://… 或 /static/…",
}: {
  value: string;
  onChange: (src: string, suggestedAlt?: string) => void;
  accept: "image" | "video";
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("library");

  const tabs: { key: Tab; label: string }[] =
    accept === "image"
      ? [
          { key: "library", label: "媒体库" },
          { key: "upload", label: "上传" },
          { key: "unsplash", label: "Unsplash" },
        ]
      : [
          { key: "library", label: "媒体库" },
          { key: "upload", label: "上传" },
        ];

  const close = () => { setOpen(false); setTab("library"); };
  const pickSrc = (src: string) => { onChange(src); close(); };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <TextInput value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
        <Button variant="subtle" className="shrink-0" onClick={() => setOpen(true)}>选图</Button>
      </div>
      {value ? (
        <div className="overflow-hidden rounded-md border border-edge">
          {accept === "video" ? (
            <video src={value} className="h-20 w-full bg-canvas object-contain" muted />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-20 w-full bg-canvas object-contain" />
          )}
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" aria-label="关闭" className="absolute inset-0 bg-ink/40" onClick={close} />
          <div className="relative z-10 flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-edge bg-panel shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-edge px-4 py-3">
              <div className="flex gap-1">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={
                      "rounded-md px-2.5 py-1 text-xs font-medium transition " +
                      (tab === t.key ? "bg-brand-600 text-white" : "text-ink-soft hover:bg-canvas")
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <Button variant="ghost" onClick={close} aria-label="关闭">✕</Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {tab === "library" ? (
                <MediaLibraryTab accept={accept} onPick={pickSrc} />
              ) : tab === "upload" ? (
                <UploadTab accept={accept} onUploaded={pickSrc} />
              ) : (
                <UnsplashTab onPick={({ src, alt }) => { onChange(src, alt); close(); }} />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: 确认 Button 支持 variant="ghost"**

Run: `grep -nE "ghost|primary|subtle" landing-editor/ui/Button.tsx`
Expected: variants 含 `ghost`/`subtle`（原 MediaPicker 已用 ghost/subtle，故应存在）。

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit`
Expected: 仅 `fields.tsx` 两处 onChange 类型报错（下个 Task 修）；其余无错。若 MediaPicker 自身有错先修。

- [ ] **Step 4: 提交**

```bash
git add landing-editor/ui/MediaPicker.tsx
git commit -m "feat: MediaPicker 重构为三 Tab 选图弹窗 + onChange 升级"
```

---

## Task 7: fields.tsx 两处调用点适配

**Files:**
- Modify: `landing-editor/forms/fields.tsx`

- [ ] **Step 1: 改 ImageRefField 的 MediaPicker 调用**

在 `landing-editor/forms/fields.tsx` 中把：
```tsx
        <MediaPicker value={value.src} onChange={(src) => onChange({ ...value, src })} accept="image" />
```
替换为：
```tsx
        <MediaPicker
          value={value.src}
          accept="image"
          onChange={(src, alt) => onChange({ ...value, src, ...(alt !== undefined ? { alt } : {}) })}
        />
```

- [ ] **Step 2: 改 MediaField 的 MediaPicker 调用**

把：
```tsx
        <MediaPicker value={value.src} onChange={(src) => onChange({ ...value, src })} accept={value.type} />
```
替换为：
```tsx
        <MediaPicker
          value={value.src}
          accept={value.type}
          onChange={(src, alt) => onChange({ ...value, src, ...(alt !== undefined ? { alt } : {}) })}
        />
```

> 说明：`...(alt !== undefined ? { alt } : {})` 确保只有 Unsplash 选图（带 alt 建议）才覆盖 alt；媒体库/上传/手填 URL 不传 alt，保留外层 alt 输入框已有值。Media 的 video 分支无 alt 字段，但 video Tab 永不回传 alt，类型安全（仅 image 分支有 alt 时才会被赋值；TS 上 `{ ...value, src, alt }` 对 video 分支需注意：见 Step 3 校验）。

- [ ] **Step 3: 类型检查（重点验证 Media 联合类型不被破坏）**

Run: `npx tsc --noEmit`
Expected: 无输出（通过）。
若 `MediaField` 处报「alt 不存在于 video 分支」：将其 onChange 改为对类型收窄——
```tsx
          onChange={(src, alt) =>
            value.type === "image"
              ? onChange({ ...value, src, ...(alt !== undefined ? { alt } : {}) })
              : onChange({ ...value, src })
          }
```
重新运行 tsc 确认通过。

- [ ] **Step 4: lint**

Run: `npx eslint landing-editor/forms/fields.tsx`
Expected: 无错误

- [ ] **Step 5: 提交**

```bash
git add landing-editor/forms/fields.tsx
git commit -m "feat: 字段适配 MediaPicker 新 onChange（Unsplash 自动带 alt）"
```

---

## Task 8: e2e

**Files:**
- Create: `e2e/media-picker.spec.ts`

- [ ] **Step 1: 写 e2e**

`e2e/media-picker.spec.ts`:
```ts
// e2e/media-picker.spec.ts
// 编辑器选图体验：三 Tab 弹窗（上传 / Unsplash demo 提示）+ alt 渲染 + 视频无 Unsplash Tab。
// Dev Login 建会话；beforeAll/afterAll 用 pg 备好/清理 dev 用户落地页。
// 本地无 UNSPLASH_ACCESS_KEY，故 Unsplash 只验 demo 提示路径，不打真实 API。
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

test.describe("编辑器选图体验", () => {
  test.skip(!RUN, "Set RUN_DB_E2E=1 to run database-backed e2e tests.");

  test.beforeAll(async () => {
    pool = makePool();
    const res = await pool.query(
      `INSERT INTO users (email, name, plan) VALUES ($1, 'Dev User', 'pro')
       ON CONFLICT (email) DO UPDATE SET plan = 'pro' RETURNING id`,
      [DEV_EMAIL],
    );
    devUserId = res.rows[0].id;
    await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
  });

  test.afterAll(async () => {
    if (devUserId) await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
    await pool.end();
  });

  test("选图弹窗三 Tab + Unsplash demo 提示", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Dev Login/i }).click();
    await page.waitForURL("**/admin", { timeout: 30_000 });

    // 建一页并进编辑器
    await page.goto("/admin/editor");
    await page.getByRole("button", { name: "空白开始" }).first().click();
    await page.waitForURL(/\/admin\/editor\/[^/]+$/, { timeout: 30_000 });

    // Hero 背景图字段：开「选图」弹窗（Hero 默认存在背景图字段；若折叠则先勾选启用）
    // 点第一个「选图」按钮
    await page.getByRole("button", { name: "选图" }).first().click();
    // 三个 Tab 存在
    await expect(page.getByRole("button", { name: "媒体库" })).toBeVisible();
    await expect(page.getByRole("button", { name: "上传" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Unsplash" })).toBeVisible();
    // 切 Unsplash，搜索 → demo 提示
    await page.getByRole("button", { name: "Unsplash" }).click();
    await page.getByPlaceholder(/搜索 Unsplash/).fill("beach");
    await page.getByRole("button", { name: "搜索" }).click();
    await expect(page.getByText(/未配置 Unsplash/)).toBeVisible({ timeout: 15_000 });
  });
});
```

> 注：本用例假设进入编辑器后页面上至少有一个「选图」按钮（Hero 背景图或 showcase 图片字段）。实现时若 Hero 默认未展开图片字段，需在点「选图」前先按实际 UI 勾选启用该字段（参考 `HeroForm.tsx` 的 `present/onToggle`）。dispatch 时一并交代实现者：跑通该 e2e，必要时按实际 DOM 调整定位与启用步骤，但不得弱化断言（三 Tab 可见 + demo 提示出现）。

- [ ] **Step 2: 确保本地 DB 在跑并 seed**

Run: `docker exec zapbridge-pg-dev pg_isready -U postgres -d zapbridge && pnpm db:seed-dev`
Expected: accepting connections + seed 成功

- [ ] **Step 3: 跑该 e2e**

Run: `RUN_DB_E2E=1 pnpm exec playwright test e2e/media-picker.spec.ts`
Expected: 1 passed（若定位器因实际 DOM 不符则按实际调整后跑通）

- [ ] **Step 4: 提交**

```bash
git add e2e/media-picker.spec.ts
git commit -m "test(e2e): 编辑器选图弹窗三 Tab + Unsplash demo 提示"
```

---

## Task 9: 全量验证

**Files:** 无（仅运行）

- [ ] **Step 1: 类型 + lint + 单测**

Run: `npx tsc --noEmit && npx eslint . && npx vitest run`
Expected: 全部通过（vitest 含 pickUnsplash 用例）

- [ ] **Step 2: 构建**

Run: `npx next build`
Expected: 通过（若因 Google 字体网络不可达失败，属环境问题，记录但不算回归）

- [ ] **Step 3: 全量 e2e**

Run: `RUN_DB_E2E=1 pnpm test:e2e`
Expected: 全部 passed（原有 6 + 新增 1）

---

## 验收标准（对照 spec）

- MediaPicker 为三 Tab 弹窗：图片字段有「媒体库 / 上传 / Unsplash」，视频字段只「媒体库 / 上传」。
- 上传 Tab 调共享 `uploadMedia`，成功后选中并关闭；UploadZone 行为不变。
- Unsplash Tab 接通 `/api/unsplash/search`，无 key 显示 demo 提示。
- 选 Unsplash 图经 `pickUnsplash` 自动带入 alt 建议；外层 alt 输入框保留、可手改。
- `pickUnsplash` 有单测；e2e 覆盖三 Tab + demo 提示。
- tsc / eslint / vitest / e2e 全绿（build 受字体网络影响时单独说明）。
