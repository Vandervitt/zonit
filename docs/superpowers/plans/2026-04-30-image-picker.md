# 图片选择器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为编辑器表单中的图片字段提供 Unsplash 搜索选图 + 素材库占位两个渠道，替换现有纯文本 URL 输入框。

**Architecture:** 新建可复用的 `ImagePickerField` 组件，内嵌弹窗（Dialog + 手动 tab 切换）；Unsplash 搜索通过服务端代理路由保护 API Key；在 `BlockForms.tsx` 中替换/新增相关图片字段。

**Tech Stack:** Next.js 16 App Router, React 19, Radix UI Dialog, lucide-react, Tailwind CSS, Unsplash API

---

## 文件结构

| 操作 | 路径 | 职责 |
|------|------|------|
| 新增 | `app/api/unsplash/search/route.ts` | 服务端代理，保护 UNSPLASH_ACCESS_KEY |
| 新增 | `components/sites/ImagePickerField.tsx` | 可复用图片选择组件 |
| 修改 | `components/sites/BlockForms.tsx` | 替换 Hero/Authority URL 输入；新增 Tier/Review 图片字段 |
| 修改 | `.env.local` | 添加 UNSPLASH_ACCESS_KEY 占位注释 |

---

## Task 1: 添加环境变量占位

**Files:**
- Modify: `.env.local`

- [ ] **Step 1: 追加注释和占位 key**

在 `.env.local` 末尾追加：

```env

# Unsplash API（申请地址：https://unsplash.com/developers）
UNSPLASH_ACCESS_KEY=your_access_key_here
```

- [ ] **Step 2: Commit**

```bash
git add .env.local
git commit -m "chore: 添加 UNSPLASH_ACCESS_KEY 环境变量占位"
```

---

## Task 2: 创建 Unsplash 搜索代理路由

**Files:**
- Create: `app/api/unsplash/search/route.ts`

- [ ] **Step 1: 创建目录并新建路由文件**

创建 `app/api/unsplash/search/route.ts`，内容如下：

```ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? "";
  const page = searchParams.get("page") ?? "1";
  const per_page = searchParams.get("per_page") ?? "8";

  if (!q.trim()) {
    return NextResponse.json({ results: [], total: 0 });
  }

  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key || key === "your_access_key_here") {
    return NextResponse.json({ results: [], total: 0, _demo: true });
  }

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&page=${page}&per_page=${per_page}&orientation=landscape`,
    { headers: { Authorization: `Client-ID ${key}` } },
  );

  if (!res.ok) {
    return NextResponse.json({ results: [], total: 0 }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({
    results: data.results.map((p: {
      id: string;
      urls: { small: string; regular: string };
      alt_description: string | null;
      user: { name: string; username: string };
    }) => ({
      id: p.id,
      urls: { small: p.urls.small, regular: p.urls.regular },
      alt_description: p.alt_description,
      user: { name: p.user.name, username: p.user.username },
    })),
    total: data.total,
  });
}
```

- [ ] **Step 2: 验证路由可访问（key 未配置时返回 _demo）**

在浏览器中访问：
```
http://localhost:3001/api/unsplash/search?q=beauty
```

预期响应（key 未配置）：
```json
{"results":[],"total":0,"_demo":true}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/unsplash/search/route.ts
git commit -m "feat(api): 添加 Unsplash 图片搜索代理路由"
```

---

## Task 3: 创建 ImagePickerField 组件

**Files:**
- Create: `components/sites/ImagePickerField.tsx`

- [ ] **Step 1: 创建组件文件**

创建 `components/sites/ImagePickerField.tsx`，内容如下：

```tsx
"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 与 BlockForms.tsx 保持一致的暗色输入框样式
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
}

export function ImagePickerField({ label, value, onChange }: ImagePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"unsplash" | "media">("unsplash");
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [selected, setSelected] = useState<UnsplashPhoto | null>(null);
  const [loading, setLoading] = useState(false);
  const [noKey, setNoKey] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/unsplash/search?q=${encodeURIComponent(query)}&per_page=8`,
      );
      const data = await res.json();
      if (data._demo) {
        setNoKey(true);
        setPhotos([]);
      } else {
        setPhotos(data.results);
        setNoKey(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setSelected(null);
    setOpen(true);
  };

  const confirm = () => {
    if (!selected) return;
    onChange(selected.urls.regular);
    setOpen(false);
    setSelected(null);
  };

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium block">
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
                    请先配置 <code className="bg-zinc-800 px-1 rounded">UNSPLASH_ACCESS_KEY</code> 环境变量
                  </p>
                )}

                {photos.length > 0 && (
                  <>
                    <div className="grid grid-cols-4 gap-1.5">
                      {photos.map((photo) => (
                        <button
                          key={photo.id}
                          onClick={() => setSelected(photo)}
                          title={photo.user.name}
                          className={`aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                            selected?.id === photo.id
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
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-2xl">
                  🗂
                </div>
                <p className="text-sm text-zinc-400 mb-1">素材库即将上线</p>
                <p className="text-xs text-zinc-600">上传并管理你自己的图片素材</p>
                <span className="inline-block mt-2 text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">
                  Coming soon
                </span>
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
              disabled={!selected}
              className="h-8 px-4 text-xs bg-zinc-100 text-zinc-900 hover:bg-white disabled:opacity-40"
            >
              使用此图片
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: 验证 TypeScript 编译通过**

```bash
npx tsc --noEmit 2>&1 | head -20
```

预期：无错误输出（或仅有与本任务无关的既有错误）。

- [ ] **Step 3: Commit**

```bash
git add components/sites/ImagePickerField.tsx
git commit -m "feat(editor): 新增 ImagePickerField 图片选择组件"
```

---

## Task 4: 升级 HeroForm 和 AuthorityForm 中的图片字段

**Files:**
- Modify: `components/sites/BlockForms.tsx`

- [ ] **Step 1: 在文件顶部添加 ImagePickerField 导入**

在 `components/sites/BlockForms.tsx` 的 import 区块末尾追加：

```tsx
import { ImagePickerField } from "./ImagePickerField";
```

- [ ] **Step 2: 修改 HeroForm 的背景设置区块**

定位到 `HeroForm` 中 `<SectionDivider label="背景设置" />` 下方的 `<div className="grid grid-cols-2 gap-2">` 区块，将其整体替换为：

```tsx
<SectionDivider label="背景设置" />
<Field label="类型">
  <Select
    value={data.background.type}
    onValueChange={v =>
      onChange({ ...data, background: { ...data.background, type: v as "color" | "image" | "video" } })
    }
  >
    <SelectTrigger className={dst}><SelectValue /></SelectTrigger>
    <SelectContent className={dsc}>
      <SelectItem value={BackgroundType.Color} className={dsi}>纯色</SelectItem>
      <SelectItem value={BackgroundType.Image} className={dsi}>图片</SelectItem>
      <SelectItem value={BackgroundType.Video} className={dsi}>视频</SelectItem>
    </SelectContent>
  </Select>
</Field>
{data.background.type === BackgroundType.Image ? (
  <ImagePickerField
    label="背景图片"
    value={data.background.value}
    onChange={value => onChange({ ...data, background: { ...data.background, value } })}
  />
) : (
  <Field label={data.background.type === BackgroundType.Color ? "颜色 Hex" : "视频 URL"}>
    <Input
      className={di}
      value={data.background.value}
      onChange={e => onChange({ ...data, background: { ...data.background, value: e.target.value } })}
      placeholder={data.background.type === BackgroundType.Color ? "#f0f4ff" : "https://..."}
    />
  </Field>
)}
```

- [ ] **Step 3: 修改 AuthorityForm 的配图区块**

定位到 `AuthorityForm` 中 `<SectionDivider label="配图" />` 下方的 `<div className="grid grid-cols-2 gap-2">` 区块，将其整体替换为：

```tsx
<SectionDivider label="配图" />
<ImagePickerField
  label="图片"
  value={data.image.src}
  onChange={src => onChange({ ...data, image: { ...data.image, src } })}
/>
<Field label="Alt 文本">
  <Input
    className={di}
    value={data.image.alt}
    onChange={e => onChange({ ...data, image: { ...data.image, alt: e.target.value } })}
  />
</Field>
```

- [ ] **Step 4: 验证 TypeScript 编译通过**

```bash
npx tsc --noEmit 2>&1 | head -20
```

预期：无新增错误。

- [ ] **Step 5: 在浏览器中验证**

登录后访问任意站点编辑页（`/editor/[siteId]`），展开「首屏主视觉」模块，将背景类型切换为「图片」，确认：
- 显示图片选择器组件（虚线占位框 + "选择图片"按钮）
- 点击按钮弹出选择弹窗
- Unsplash tab：输入关键词、回车或点击搜索 → key 未配置时显示提示
- 素材库 tab：显示 "Coming soon" 占位

展开「权威背书」模块，确认配图字段同样变为 ImagePickerField。

- [ ] **Step 6: Commit**

```bash
git add components/sites/BlockForms.tsx
git commit -m "feat(editor): HeroForm 和 AuthorityForm 升级图片选择器"
```

---

## Task 5: 为 TierEditor 和 ReviewEditor 新增图片字段

**Files:**
- Modify: `components/sites/BlockForms.tsx`

- [ ] **Step 1: 在 TierEditor 中添加套餐配图字段**

定位到 `TierEditor` 组件内的 `<CtaFields .../>` 行，在其**上方**插入：

```tsx
<ImagePickerField
  label="套餐配图"
  value={tier.image ?? ""}
  onChange={url => onChange({ ...tier, image: url || undefined })}
/>
```

- [ ] **Step 2: 在 ReviewEditor 中添加头像和证据截图字段**

定位到 `ReviewEditor` 组件内的 `<Field label="评价内容">` 行，在其**下方**插入：

```tsx
<ImagePickerField
  label="头像"
  value={item.avatar ?? ""}
  onChange={url => onChange({ ...item, avatar: url || undefined })}
/>
<ImagePickerField
  label="证据截图"
  value={item.proofImage ?? ""}
  onChange={url => onChange({ ...item, proofImage: url || undefined })}
/>
```

- [ ] **Step 3: 验证 TypeScript 编译通过**

```bash
npx tsc --noEmit 2>&1 | head -20
```

预期：无新增错误。

- [ ] **Step 4: 在浏览器中验证**

在编辑页中展开「套餐/价格」模块，确认每个套餐卡片出现「套餐配图」字段（ImagePickerField）。

展开「用户评价」模块，确认每条评价出现「头像」和「证据截图」字段。

- [ ] **Step 5: Commit**

```bash
git add components/sites/BlockForms.tsx
git commit -m "feat(editor): TierEditor 和 ReviewEditor 新增图片字段"
```

---

## Task 6: 清理临时文件

**Files:**
- Delete: `public/mockup-image-picker.html`

- [ ] **Step 1: 删除 brainstorm 用的 mockup 文件**

```bash
rm /Users/lajiao/Work/zonit/public/mockup-image-picker.html
```

- [ ] **Step 2: Commit**

```bash
git add public/mockup-image-picker.html
git commit -m "chore: 删除临时设计稿文件"
```
