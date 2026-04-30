# 素材库功能设计文档

**日期：** 2026-04-30  
**状态：** 已批准，待实现

## 概述

为 Zonit 平台新增素材库（媒体库）功能，支持用户上传、管理和在站点编辑器中使用图片与视频素材。文件存储使用 Vercel Blob，元数据持久化到 Postgres。

## 背景

`ImagePickerField` 组件已有"我的素材库"tab 存根（显示 Coming soon）。本功能将完整实现该 tab，并新增独立的 `/media` 管理页面。

---

## 数据模型

新增 `media` 表：

```sql
CREATE TABLE media (
  id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url        TEXT        NOT NULL,
  filename   TEXT        NOT NULL,
  type       TEXT        NOT NULL CHECK (type IN ('image', 'video')),
  size       INTEGER     NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_media_user_id ON media(user_id);
```

- `url`：Vercel Blob 公共访问 URL
- `type`：`'image'` 或 `'video'`，用于前端过滤
- 用户删除时通过外键级联清除所有素材记录（但 Blob 文件需应用层单独删除）

---

## API 设计

### `GET /api/media`
- 需要登录
- 查询参数：`?type=image|video`（可选）
- 返回当前用户的素材列表，按 `created_at DESC` 排序

### `POST /api/media`
- 需要登录
- 请求体：`multipart/form-data`，字段名 `file`
- 服务端校验：
  - MIME 类型必须为 `image/*` 或 `video/*`
  - 单文件大小上限 100MB
- 流程：`@vercel/blob` `put()` → INSERT media → 返回新记录
- 返回：`{ id, url, filename, type, size, created_at }`

### `DELETE /api/media/[id]`
- 需要登录
- 校验该记录属于当前用户
- 先从 Vercel Blob 删除文件（`del(url)`），再从 DB 删除记录
- 返回 204

---

## 组件设计

### 新增文件

| 文件 | 职责 |
|------|------|
| `migrations/008_add_media_table.js` | DB 迁移，创建 media 表 |
| `lib/media-db.ts` | `listMedia(userId, type?)` / `insertMedia()` / `deleteMedia()` |
| `app/api/media/route.ts` | GET（列表）+ POST（上传）|
| `app/api/media/[id]/route.ts` | DELETE（删除）|
| `app/(dashboard)/media/page.tsx` | 服务端页面入口，鉴权后渲染客户端组件 |
| `components/media/MediaLibraryPage.tsx` | 客户端主组件，管理状态 |
| `components/media/MediaGrid.tsx` | 素材卡片网格，悬停显示删除按钮 |
| `components/media/UploadZone.tsx` | 上传区域（点击选文件）|

### 修改文件

| 文件 | 改动 |
|------|------|
| `components/sites/ImagePickerField.tsx` | "我的素材库" tab 替换为真实网格；新增 `accept?: 'image' \| 'video' \| 'all'` prop；弹窗内增加上传入口 |
| `components/Sidebar.tsx` | 新增"素材库"导航项，`ImageIcon`，路由 `/media` |
| `lib/constants/routes.ts` | 新增 `Media = '/media'` |
| `next.config.ts` | `remotePatterns` 添加 Vercel Blob 域名（`*.public.blob.vercel-storage.com`）|
| `package.json` | 添加 `@vercel/blob` 依赖 |

---

## 界面说明

### `/media` 页面

- 暗色风格，与编辑器一致（`bg-zinc-900`）
- 顶部：页面标题 + "上传素材"按钮 + All / 图片 / 视频 tab 过滤
- 主体：响应式网格（`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`）
  - 图片卡：显示缩略图，底部文件名
  - 视频卡：黑色背景 + `PlayCircle` 图标 + 文件名
  - 悬停：显示删除图标按钮，点击后确认删除
- 空状态：引导用户上传第一个素材

### `ImagePickerField` 素材库 tab

- 顶部有一个"上传图片"（或"上传素材"）的小按钮
- 下方显示与 `/media` 页相同风格的素材网格
- 根据 `accept` prop 过滤类型（默认只显示图片）
- 点击卡片选中，确认后回填 URL

---

## 技术约束

- 不做套餐容量限制（后续迭代）
- 不做拖拽上传（后续迭代）
- 不做文件夹/分组（后续迭代）
- 上传进度条：显示简单的 loading 状态即可
