# 素材库 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增素材库功能，用户可上传图片/视频到 Vercel Blob，在 `/media` 页面管理，并在编辑器 `ImagePickerField` 中使用。

**Architecture:** 使用 `@vercel/blob` 存储文件，Postgres `media` 表持久化元数据。三个 API 端点（列表/上传/删除）服务于独立管理页 `/media` 和 `ImagePickerField` 弹窗内的"我的素材库"tab。项目使用 pnpm，Next.js 16 App Router。

**Tech Stack:** `@vercel/blob`, PostgreSQL (`pg`), Next.js 16 App Router, React client components (useSWR), Tailwind CSS v4, shadcn-style Radix UI

---

## 文件结构

| 操作 | 路径 | 职责 |
|------|------|------|
| 新建 | `migrations/008_add_media_table.js` | DB 迁移：创建 media 表 |
| 新建 | `lib/media-db.ts` | DB 查询：list / insert / get / delete |
| 新建 | `app/api/media/route.ts` | GET（列表）+ POST（上传）|
| 新建 | `app/api/media/[id]/route.ts` | DELETE（删除）|
| 新建 | `components/media/MediaGrid.tsx` | 素材卡片网格，支持 light/dark 两种风格 |
| 新建 | `components/media/UploadZone.tsx` | 文件上传 UI |
| 新建 | `app/(dashboard)/media/page.tsx` | `/media` 页面（纯客户端组件，同 sites/page.tsx） |
| 修改 | `lib/constants/routes.ts` | 新增 `Routes.Media`、`ApiRoutes.Media`、`apiMediaPath()` |
| 修改 | `next.config.ts` | remotePatterns 添加 Vercel Blob 域名 |
| 修改 | `components/Sidebar.tsx` | 新增"素材库"导航项 |
| 修改 | `components/sites/ImagePickerField.tsx` | "我的素材库"tab 实现真实功能，新增 `accept` prop |

---

### Task 1: 安装 @vercel/blob + 更新 next.config.ts

**Files:**
- Modify: `package.json` (pnpm add)
- Modify: `next.config.ts`

- [ ] **Step 1: 安装依赖**

```bash
pnpm add @vercel/blob
```

Expected: `@vercel/blob` 出现在 `package.json` 的 `dependencies` 中，`pnpm-lock.yaml` 更新。

- [ ] **Step 2: 更新 next.config.ts，添加 Vercel Blob 域名**

完整替换 `next.config.ts`：

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],
  images: {
    remotePatterns: [
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 3: 提交**

```bash
git add package.json pnpm-lock.yaml next.config.ts
git commit -m "chore: 安装 @vercel/blob，添加 Blob CDN 域名到 remotePatterns"
```

---

### Task 2: DB 迁移

**Files:**
- Create: `migrations/008_add_media_table.js`

- [ ] **Step 1: 创建迁移文件**

```javascript
// migrations/008_add_media_table.js
/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS media (
      id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      url        TEXT        NOT NULL,
      filename   TEXT        NOT NULL,
      type       TEXT        NOT NULL CHECK (type IN ('image', 'video')),
      size       INTEGER     NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_media_user_id ON media(user_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_media_user_id;
    DROP TABLE IF EXISTS media;
  `);
};
```

- [ ] **Step 2: 执行迁移**

```bash
pnpm migrate:up
```

Expected 输出包含：`Migrating up: 008_add_media_table`，无报错。

- [ ] **Step 3: 提交**

```bash
git add migrations/008_add_media_table.js
git commit -m "feat(db): 新增 media 表"
```

---

### Task 3: 路由常量

**Files:**
- Modify: `lib/constants/routes.ts`

- [ ] **Step 1: 添加 Media 路由和 helper**

完整替换 `lib/constants/routes.ts`：

```typescript
export enum Routes {
  Home = '/',
  Login = '/login',
  Register = '/register',
  Sites = '/sites',
  Domains = '/domains',
  Media = '/media',
  Billing = '/billing',
  Pricing = '/pricing',
}

export enum ApiRoutes {
  Sites = '/api/sites',
  Domains = '/api/domains',
  Media = '/api/media',
  Templates = '/api/templates',
  Register = '/api/register',
  BillingCheckout = '/api/billing/checkout',
  BillingPortal = '/api/billing/portal',
  AdminTemplates = '/api/admin/templates',
  AdminInvite = '/api/admin/invite',
}

export const apiAdminTemplatePath = (id: string) => `/api/admin/templates/${id}`;
export const apiMediaPath = (id: string) => `/api/media/${id}`;

export const siteEditorPath = (id: string) => `/editor/${id}`;
export const sitePath = (slug: string) => `/site/${slug}`;
export const apiSitePath = (id: string) => `/api/sites/${id}`;
export const apiDomainPath = (id: string) => `/api/domains/${id}`;
export const apiDomainStatusPath = (id: string) => `/api/domains/${id}/status`;
```

- [ ] **Step 2: 提交**

```bash
git add lib/constants/routes.ts
git commit -m "feat(constants): 新增 Media 路由常量和 apiMediaPath helper"
```

---

### Task 4: lib/media-db.ts

**Files:**
- Create: `lib/media-db.ts`

- [ ] **Step 1: 创建 DB 查询模块**

```typescript
// lib/media-db.ts
import pool from "@/lib/db";

export interface MediaItem {
  id: string;
  userId: string;
  url: string;
  filename: string;
  type: "image" | "video";
  size: number;
  createdAt: string;
}

interface Row {
  id: string;
  user_id: string;
  url: string;
  filename: string;
  type: "image" | "video";
  size: number;
  created_at: string;
}

function rowToMediaItem(row: Row): MediaItem {
  return {
    id: row.id,
    userId: row.user_id,
    url: row.url,
    filename: row.filename,
    type: row.type,
    size: row.size,
    createdAt: row.created_at,
  };
}

export async function listMedia(
  userId: string,
  type?: "image" | "video",
): Promise<MediaItem[]> {
  const result = type
    ? await pool.query<Row>(
        "SELECT * FROM media WHERE user_id = $1 AND type = $2 ORDER BY created_at DESC",
        [userId, type],
      )
    : await pool.query<Row>(
        "SELECT * FROM media WHERE user_id = $1 ORDER BY created_at DESC",
        [userId],
      );
  return result.rows.map(rowToMediaItem);
}

export async function insertMedia(
  userId: string,
  url: string,
  filename: string,
  type: "image" | "video",
  size: number,
): Promise<MediaItem> {
  const result = await pool.query<Row>(
    `INSERT INTO media (user_id, url, filename, type, size)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, url, filename, type, size],
  );
  return rowToMediaItem(result.rows[0]);
}

export async function getMedia(
  id: string,
  userId: string,
): Promise<MediaItem | null> {
  const result = await pool.query<Row>(
    "SELECT * FROM media WHERE id = $1 AND user_id = $2",
    [id, userId],
  );
  return result.rows[0] ? rowToMediaItem(result.rows[0]) : null;
}

export async function deleteMedia(id: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    "DELETE FROM media WHERE id = $1 AND user_id = $2",
    [id, userId],
  );
  return (result.rowCount ?? 0) > 0;
}
```

- [ ] **Step 2: 提交**

```bash
git add lib/media-db.ts
git commit -m "feat(media): 新增 media-db 查询函数"
```

---

### Task 5: API 路由

**Files:**
- Create: `app/api/media/route.ts`
- Create: `app/api/media/[id]/route.ts`

- [ ] **Step 1: 创建 GET + POST /api/media**

```typescript
// app/api/media/route.ts
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { listMedia, insertMedia } from "@/lib/media-db";

const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const raw = req.nextUrl.searchParams.get("type");
  const type = raw === "image" || raw === "video" ? raw : undefined;

  const items = await listMedia(session.user.id, type);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "缺少文件" }, { status: 400 });
  }

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "仅支持图片和视频文件" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "文件不能超过 100MB" }, { status: 400 });
  }

  const mediaType = isImage ? "image" : "video";
  const blob = await put(file.name, file, { access: "public" });
  const item = await insertMedia(session.user.id, blob.url, file.name, mediaType, file.size);

  return NextResponse.json(item, { status: 201 });
}
```

- [ ] **Step 2: 创建 DELETE /api/media/[id]**

注意：Next.js 16 App Router 的动态路由 params 是 `Promise`，必须 `await`。

```typescript
// app/api/media/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getMedia, deleteMedia } from "@/lib/media-db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const { id } = await params;
  const item = await getMedia(id, session.user.id);
  if (!item) {
    return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  }

  await del(item.url);
  await deleteMedia(id, session.user.id);

  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 3: 提交**

```bash
git add app/api/media/route.ts "app/api/media/[id]/route.ts"
git commit -m "feat(api): 新增素材库 GET/POST/DELETE 端点"
```

---

### Task 6: MediaGrid 组件

**Files:**
- Create: `components/media/MediaGrid.tsx`

- [ ] **Step 1: 创建素材网格组件**

该组件支持 `variant` prop：`'light'`（用于 `/media` 页）和 `'dark'`（用于 `ImagePickerField` 弹窗）。

```typescript
// components/media/MediaGrid.tsx
"use client";

import { useState } from "react";
import { Trash2, PlayCircle } from "lucide-react";
import { apiMediaPath } from "@/lib/constants";
import type { MediaItem } from "@/lib/media-db";

interface MediaGridProps {
  items: MediaItem[];
  onDeleted: (id: string) => void;
  onSelect?: (item: MediaItem) => void;
  selectedId?: string;
  variant?: "light" | "dark";
}

export function MediaGrid({
  items,
  onDeleted,
  onSelect,
  selectedId,
  variant = "light",
}: MediaGridProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, item: MediaItem) => {
    e.stopPropagation();
    if (!confirm(`确认删除"${item.filename}"？`)) return;
    setDeletingId(item.id);
    try {
      const res = await fetch(apiMediaPath(item.id), { method: "DELETE" });
      if (res.ok) onDeleted(item.id);
    } finally {
      setDeletingId(null);
    }
  };

  const emptyClass =
    variant === "dark"
      ? "text-center py-8 text-zinc-500 text-sm"
      : "text-center py-12 text-slate-400 text-sm";

  const cardBg = variant === "dark" ? "bg-zinc-800" : "bg-slate-200";
  const videoBg = variant === "dark" ? "bg-zinc-900" : "bg-slate-800";
  const borderSelected = "border-blue-500";
  const borderHover = variant === "dark" ? "hover:border-zinc-500" : "hover:border-slate-400";

  if (items.length === 0) {
    return (
      <div className={emptyClass}>
        还没有素材，点击"上传素材"开始
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {items.map((item) => (
        <div
          key={item.id}
          className={`group relative rounded-md overflow-hidden border-2 transition-colors ${
            onSelect ? "cursor-pointer" : ""
          } ${selectedId === item.id ? borderSelected : `border-transparent ${borderHover}`}`}
          onClick={() => onSelect?.(item)}
        >
          <div className={`aspect-square ${cardBg}`}>
            {item.type === "image" ? (
              <img
                src={item.url}
                alt={item.filename}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full ${videoBg} flex flex-col items-center justify-center gap-1`}>
                <PlayCircle className="w-7 h-7 text-slate-400" />
                <span className="text-[10px] text-slate-500 px-1 text-center truncate w-full leading-tight">
                  {item.filename}
                </span>
              </div>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-[10px] text-white truncate">{item.filename}</p>
          </div>
          <button
            className="absolute top-1 right-1 w-5 h-5 rounded bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 disabled:opacity-30"
            onClick={(e) => handleDelete(e, item)}
            disabled={deletingId === item.id}
            title="删除"
          >
            <Trash2 className="w-3 h-3 text-white" />
          </button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add components/media/MediaGrid.tsx
git commit -m "feat(media): 新增 MediaGrid 组件"
```

---

### Task 7: UploadZone 组件

**Files:**
- Create: `components/media/UploadZone.tsx`

- [ ] **Step 1: 创建上传组件**

`compact` 模式用于 `ImagePickerField` 弹窗内；默认模式用于 `/media` 页头部按钮。

```typescript
// components/media/UploadZone.tsx
"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { ApiRoutes } from "@/lib/constants";
import type { MediaItem } from "@/lib/media-db";

interface UploadZoneProps {
  onUploaded: (item: MediaItem) => void;
  compact?: boolean;
  accept?: "image" | "video" | "all";
}

export function UploadZone({ onUploaded, compact = false, accept = "all" }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptAttr =
    accept === "image" ? "image/*" : accept === "video" ? "video/*" : "image/*,video/*";

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(ApiRoutes.Media, { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "上传失败");
        return;
      }
      const item: MediaItem = await res.json();
      onUploaded(item);
    } catch {
      setError("上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        className="hidden"
        onChange={handleChange}
      />
      {compact ? (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="h-7 px-3 text-xs bg-zinc-800 border border-zinc-700 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          {uploading ? "上传中…" : "上传素材"}
        </button>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 h-9 px-4 text-sm rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {uploading ? "上传中…" : "上传素材"}
        </button>
      )}
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add components/media/UploadZone.tsx
git commit -m "feat(media): 新增 UploadZone 上传组件"
```

---

### Task 8: /media 页面

**Files:**
- Create: `app/(dashboard)/media/page.tsx`

参考 `app/(dashboard)/sites/page.tsx` 的模式：完整客户端组件，使用 `useSWR`。

- [ ] **Step 1: 创建 /media 页面**

```typescript
// app/(dashboard)/media/page.tsx
"use client";

import { useState } from "react";
import useSWR from "swr";
import { Image as ImageIcon } from "lucide-react";
import { ApiRoutes } from "@/lib/constants";
import { MediaGrid } from "@/components/media/MediaGrid";
import { UploadZone } from "@/components/media/UploadZone";
import type { MediaItem } from "@/lib/media-db";

type FilterTab = "all" | "image" | "video";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MediaPage() {
  const [filter, setFilter] = useState<FilterTab>("all");

  const apiUrl =
    filter === "all" ? ApiRoutes.Media : `${ApiRoutes.Media}?type=${filter}`;

  const { data, mutate } = useSWR<MediaItem[]>(apiUrl, fetcher);
  const items = data ?? [];

  const handleUploaded = (item: MediaItem) => {
    void mutate([item, ...items]);
  };

  const handleDeleted = (id: string) => {
    void mutate(items.filter((i) => i.id !== id));
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "全部" },
    { key: "image", label: "图片" },
    { key: "video", label: "视频" },
  ];

  return (
    <main className="flex-1 flex flex-col overflow-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-slate-800 text-2xl">素材库</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} 个素材</p>
        </div>
        <UploadZone onUploaded={handleUploaded} />
      </header>

      {/* Filter tabs */}
      <div className="flex gap-1 px-6 border-b border-slate-200">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === key
                ? "border-slate-800 text-slate-800"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 px-6 py-5 overflow-auto">
        {!data ? (
          <div className="text-slate-400 text-sm">加载中…</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <ImageIcon className="w-10 h-10 text-slate-300" />
            <p className="text-sm">还没有素材，点击右上角"上传素材"开始</p>
          </div>
        ) : (
          <MediaGrid items={items} onDeleted={handleDeleted} />
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add "app/(dashboard)/media/page.tsx"
git commit -m "feat(media): 新增 /media 管理页面"
```

---

### Task 9: 更新侧边栏

**Files:**
- Modify: `components/Sidebar.tsx`

- [ ] **Step 1: 在 navItems 中添加"素材库"入口**

在 `components/Sidebar.tsx` 中，找到 `navItems` 数组，在 `Domains` 条目之后插入：

```typescript
// 原来：
import {
  LayoutDashboard,
  BarChart2,
  CheckSquare,
  FileText,
  Bell,
  Settings,
  HelpCircle,
  Grid2x2,
  Globe,
  LogOut,
  CreditCard,
  Link2,
} from "lucide-react";
// 改为（新增 Image）：
import {
  LayoutDashboard,
  BarChart2,
  CheckSquare,
  FileText,
  Bell,
  Settings,
  HelpCircle,
  Grid2x2,
  Globe,
  LogOut,
  CreditCard,
  Link2,
  Image,
} from "lucide-react";
```

然后在 `navItems` 中 `Link2`（Domains）条目后添加一行：

```typescript
const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Globe, label: "Sites", href: "/sites" },
  { icon: Link2, label: "Domains", href: "/domains" },
  { icon: Image, label: "素材库", href: "/media" },       // ← 新增
  { icon: BarChart2, label: "Statistics", href: "/statistics" },
  { icon: CheckSquare, label: "Task list", href: "/tasks" },
  { icon: FileText, label: "Report", href: "/reports" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
];
```

- [ ] **Step 2: 提交**

```bash
git add components/Sidebar.tsx
git commit -m "feat(nav): 侧边栏新增素材库入口"
```

---

### Task 10: 更新 ImagePickerField

**Files:**
- Modify: `components/sites/ImagePickerField.tsx`

将"我的素材库"tab 从 Coming soon 改为真实功能。新增 `accept` prop（`'image' | 'video' | 'all'`，默认 `'image'`）控制媒体类型过滤和确认按钮文案。

- [ ] **Step 1: 完整替换 ImagePickerField.tsx**

```typescript
// components/sites/ImagePickerField.tsx
"use client";

import { useState, useEffect } from "react";
import { ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaGrid } from "@/components/media/MediaGrid";
import { UploadZone } from "@/components/media/UploadZone";
import { ApiRoutes } from "@/lib/constants";
import type { MediaItem } from "@/lib/media-db";

const di =
  "h-9 text-sm bg-zinc-800/60 border-zinc-700/70 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-500/60 focus-visible:border-zinc-600";

interface UnsplashPhoto {
  id: string;
  urls: { small: string; regular: string };
  alt_description: string | null;
  user: { name: string; username: string };
}

interface ImagePickerFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: "image" | "video" | "all";
}

export function ImagePickerField({
  label,
  value,
  onChange,
  accept = "image",
}: ImagePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"unsplash" | "media">("unsplash");

  // Unsplash state
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<UnsplashPhoto | null>(null);
  const [loading, setLoading] = useState(false);
  const [noKey, setNoKey] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Media library state
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const mediaType = accept === "all" ? undefined : accept;

  const fetchMedia = async () => {
    setMediaLoading(true);
    try {
      const url = mediaType
        ? `${ApiRoutes.Media}?type=${mediaType}`
        : ApiRoutes.Media;
      const res = await fetch(url);
      if (res.ok) setMediaItems(await res.json());
    } finally {
      setMediaLoading(false);
    }
  };

  useEffect(() => {
    if (open && tab === "media") fetchMedia();
  }, [open, tab]);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `/api/unsplash/search?q=${encodeURIComponent(query)}&per_page=8`,
      );
      if (!res.ok) {
        setSearchError("搜索失败，请重试");
        return;
      }
      const data = await res.json();
      if (data._demo) {
        setNoKey(true);
        setPhotos([]);
      } else {
        setPhotos(data.results);
        setNoKey(false);
      }
    } catch {
      setSearchError("搜索失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setSelectedPhoto(null);
    setSelectedMedia(null);
    setOpen(true);
  };

  const confirm = () => {
    if (tab === "unsplash" && selectedPhoto) {
      onChange(selectedPhoto.urls.regular);
    } else if (tab === "media" && selectedMedia) {
      onChange(selectedMedia.url);
    }
    setOpen(false);
    setSelectedPhoto(null);
    setSelectedMedia(null);
  };

  const handleMediaUploaded = (item: MediaItem) => {
    setMediaItems((prev) => [item, ...prev]);
    setSelectedMedia(item);
  };

  const handleMediaDeleted = (id: string) => {
    setMediaItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedMedia?.id === id) setSelectedMedia(null);
  };

  const confirmDisabled =
    tab === "unsplash" ? !selectedPhoto : !selectedMedia;

  const confirmLabel = accept === "video" ? "使用此视频" : "使用此图片";

  const fieldId = `img-picker-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={fieldId}
        className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium block"
      >
        {label}
      </label>

      <div className="flex items-center gap-2">
        {value ? (
          <>
            <div className="w-12 h-12 rounded-md overflow-hidden shrink-0 border border-zinc-700/50">
              <img src={value} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-zinc-500 truncate mb-1.5">
                {value.split("/").pop()?.split("?")[0]}
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={handleOpen}
                  className="h-6 px-2 text-[11px] bg-zinc-800 border border-zinc-700 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
                >
                  更换
                </button>
                <button
                  onClick={() => onChange("")}
                  className="h-6 px-2 text-[11px] bg-zinc-800 border border-zinc-700 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  移除
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-md border border-dashed border-zinc-700 flex items-center justify-center shrink-0">
              <ImageIcon className="w-4 h-4 text-zinc-600" />
            </div>
            <button
              id={fieldId}
              onClick={handleOpen}
              className="h-7 px-3 text-xs bg-zinc-800 border border-zinc-700 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              选择图片
            </button>
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100 max-w-lg p-0 gap-0">
          <DialogHeader className="px-5 py-4 border-b border-zinc-800">
            <DialogTitle className="text-sm font-semibold">选择图片</DialogTitle>
          </DialogHeader>

          {/* Tab 切换 */}
          <div className="flex border-b border-zinc-800 px-5 gap-1">
            {(["unsplash", "media"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  tab === t
                    ? "border-white text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {t === "unsplash" ? "🔍 Unsplash" : "🗂 我的素材库"}
              </button>
            ))}
          </div>

          <div className="p-5 min-h-[260px]">
            {tab === "unsplash" ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    className={`${di} flex-1`}
                    placeholder="搜索图片，如 beauty, skincare, product…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && search()}
                  />
                  <Button
                    size="sm"
                    onClick={search}
                    disabled={loading}
                    className="h-9 px-4 bg-zinc-100 text-zinc-900 hover:bg-white text-xs shrink-0"
                  >
                    {loading ? "搜索中…" : "搜索"}
                  </Button>
                </div>

                {noKey && (
                  <p className="text-xs text-amber-400 text-center py-4">
                    请先配置{" "}
                    <code className="bg-zinc-800 px-1 rounded">
                      UNSPLASH_ACCESS_KEY
                    </code>{" "}
                    环境变量
                  </p>
                )}

                {searchError && (
                  <p className="text-xs text-rose-400 text-center py-4">
                    {searchError}
                  </p>
                )}

                {photos.length > 0 && (
                  <>
                    <div className="grid grid-cols-4 gap-1.5">
                      {photos.map((photo) => (
                        <button
                          key={photo.id}
                          onClick={() => setSelectedPhoto(photo)}
                          title={photo.user.name}
                          className={`aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                            selectedPhoto?.id === photo.id
                              ? "border-blue-500"
                              : "border-transparent hover:border-zinc-500"
                          }`}
                        >
                          <img
                            src={photo.urls.small}
                            alt={photo.alt_description ?? ""}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-zinc-600 text-center">
                      Photos by{" "}
                      <a
                        href="https://unsplash.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-zinc-400"
                      >
                        Unsplash
                      </a>{" "}
                      · 免费商用 · 使用后需标注来源
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-500">
                    {mediaLoading ? "加载中…" : `${mediaItems.length} 个素材`}
                  </p>
                  <UploadZone
                    onUploaded={handleMediaUploaded}
                    compact
                    accept={accept}
                  />
                </div>
                {!mediaLoading && (
                  <MediaGrid
                    items={mediaItems}
                    onDeleted={handleMediaDeleted}
                    onSelect={setSelectedMedia}
                    selectedId={selectedMedia?.id}
                    variant="dark"
                  />
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 px-5 py-3 border-t border-zinc-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 text-xs text-zinc-400 hover:text-zinc-200"
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={confirm}
              disabled={confirmDisabled}
              className="h-8 px-4 text-xs bg-zinc-100 text-zinc-900 hover:bg-white disabled:opacity-40"
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add components/sites/ImagePickerField.tsx
git commit -m "feat(editor): ImagePickerField 实现素材库 tab，支持 accept prop"
```

---

## 环境变量提示

部署前需要在 Vercel 项目设置中添加：

```
BLOB_READ_WRITE_TOKEN=<vercel blob token>
```

本地开发：运行 `vercel env pull .env.local`（需安装 Vercel CLI）或手动添加到 `.env.local`。

---

## 验收标准

- [ ] `/media` 页面可以上传图片和视频，显示在网格中，删除后消失
- [ ] 编辑器 `ImagePickerField` 弹窗"我的素材库"tab 显示用户已上传的素材
- [ ] 在弹窗内上传后，新素材立即出现并自动选中
- [ ] 选择素材后点击"使用此图片/视频"，URL 回填到字段
- [ ] 侧边栏有"素材库"导航入口，点击跳转 `/media`
