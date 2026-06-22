# 设计：编辑器选图体验 —— Unsplash 搜索 + 内嵌上传 + alt（子项 B）

| | |
|---|---|
| 文档类型 | 设计 spec |
| 状态 | 待评审 |
| 日期 | 2026-06-22 |
| 分支 | `feat_20260622_选图体验Unsplash与alt` |
| 关联 | 产品功能缺口拆分（A–G）中的子项 B；A 已合入 main |

## 背景与目标

编辑器选图当前只能「填 URL 或从只读媒体库选」。痛点在编辑器选图当下：用户得离开去别处找图、单独上传、alt 全靠手填。后端能力其实已就绪但未接通：

- `POST /api/media`（上传到 Vercel Blob + 落库）已存在，但 MediaPicker 不能在选图时上传。
- `GET /api/unsplash/search` 端点完整（有 key 走真实，无 key 返回 `_demo`），但前端零调用——孤儿。
- schema 的 `ImageRef.alt?` / `Media(image).alt?` 字段、以及外层字段（`ImageRefField`、`MediaField`）里的 alt 输入框都已存在，但选 Unsplash 图时不会自动带 alt。

目标：把「找图—上传—填 alt」收敛进编辑器内一次完成。

## 范围

**做**：MediaPicker 重构为三 Tab 选图弹窗（媒体库 / 上传 / Unsplash）；上传逻辑复用；Unsplash 搜索接通；选 Unsplash 图自动带入其 `alt_description` 作 alt 建议。

**不做**：素材库管理页（`/admin/(workspace)/media`）的搜索/重命名/标签/文件夹组织（属另一子项）；视频走 Unsplash（Unsplash 是图库，仅图片字段显示该 Tab）；新增 alt 输入框（外层已有，原样保留）。

## 关键现状（设计据此对齐，避免破坏既有边界）

- **alt 输入框已在外层**：`landing-editor/forms/fields.tsx` 的 `ImageRefField`（背景图、各区块内容图）与 `MediaField` 的 image 分支各自已有「图片描述 (alt)」输入框。**保持不动**——alt 状态归外层字段，不搬进 MediaPicker。
- **MediaPicker 当前只管 src**：`value: string` + `onChange: (url) => void`，弹窗是只读媒体库网格。
- **UploadZone 是 antd 组件**（`components/media/UploadZone.tsx`，用 `App.useApp`/antd Button），位于后台 antd 区；MediaPicker 在编辑器 Tailwind 区。**不可直接复用该组件**（会把 antd 引入 Tailwind 区）——复用应抽「上传逻辑」纯函数。

## 架构

### 1. 抽取共享上传逻辑

新建 `lib/media-upload.ts`：把 `UploadZone` 里的 fetch 上传抽成与 UI 无关的纯逻辑：
```
uploadMedia(file: File): Promise<MediaItem>
```
- 内部：`FormData` append file → `POST /api/media` → 非 ok 抛 `Error(data.error ?? "上传失败")` → ok 返回 `MediaItem`。
- `UploadZone.tsx` 改为调用 `uploadMedia`（保留其 antd UI 与 message 提示，仅把 fetch 部分换成调用共享函数），消除重复、保证两处行为一致。
- MediaPicker 的「上传」Tab 也调 `uploadMedia`，但用 Tailwind UI + 自有错误展示。

### 2. MediaPicker 重构为三 Tab 弹窗

`MediaPicker` 现 125 行，重构后拆分以保持单一职责：

- `landing-editor/ui/MediaPicker.tsx`：壳——外层文本框（保留，可直接贴 URL）+「选图」按钮 + 预览 + 弹窗容器与 Tab 切换。
- `landing-editor/ui/media/MediaLibraryTab.tsx`：媒体库网格（迁移现有 `GET /api/media?type=` 拉取 + 选中逻辑）。
- `landing-editor/ui/media/UploadTab.tsx`：拖拽/选文件 → `uploadMedia` → 成功后直接以该项 url 调用选中回调并关闭弹窗（与「在媒体库点选一项」终态一致，省去再切 Tab）。
- `landing-editor/ui/media/UnsplashTab.tsx`：搜索框 + 结果网格（仅图片字段挂载）。

Tab 集合：`accept==="image"` → 媒体库 / 上传 / Unsplash 三个；`accept==="video"` → 媒体库 / 上传 两个。

### 3. onChange 契约升级（最小改动，不破坏外层 alt 边界）

- 签名：`onChange: (src: string) => void` → `onChange: (src: string, suggestedAlt?: string) => void`。
- 媒体库 / 上传选中：`onChange(url)`（无 alt 建议）。
- Unsplash 选中：`onChange(urls.regular, alt_description ?? "")`。
- 外层适配（`fields.tsx`）：
  ```
  // ImageRefField
  <MediaPicker value={value.src} accept="image"
    onChange={(src, alt) => onChange({ ...value, src, ...(alt !== undefined ? { alt } : {}) })} />
  // MediaField（image/video 共用，video 永远不会传 alt）
  <MediaPicker value={value.src} accept={value.type}
    onChange={(src, alt) => onChange({ ...value, src, ...(alt !== undefined ? { alt } : {}) })} />
  ```
  仅当有 `suggestedAlt` 时覆盖 alt；否则保留用户已填值。外层 alt 输入框原样保留。

### 4. Unsplash 结果映射（纯函数，便于单测）

`landing-editor/ui/media/unsplash.ts`：
```
interface UnsplashPhoto { id: string; urls: { small: string; regular: string }; alt_description: string | null; user: { name: string; username: string }; }
interface PickedImage { src: string; alt: string; }
pickUnsplash(p: UnsplashPhoto): PickedImage  // { src: p.urls.regular, alt: p.alt_description ?? "" }
```

## 数据流

```
UnsplashTab 选图 ─ pickUnsplash → onChange(src, alt)
媒体库/上传 选图 ───────────────→ onChange(src)
                                        │
                          MediaPicker（壳）
                                        │ onChange(src, suggestedAlt?)
                          外层字段 ImageRefField / MediaField
                          （合并 src，必要时覆盖 alt；alt 输入框仍可手改）
                                        │
                                  editorStore → 渲染器 <img alt={alt}>
```
渲染器无需改（`ImageRef.alt`/`Media.alt` 本就被消费，此前一直为空）。

## 错误处理

- 上传：`uploadMedia` 抛错 → 上传 Tab 内显示错误文案（Tailwind），不切 Tab、不关弹窗；大小/类型校验仍在 `/api/media` 服务端（沿用，含拒 SVG、≤100MB）。
- Unsplash：响应含 `_demo`（无 key）→ 网格区显示「未配置 Unsplash，可用媒体库 / 上传，或直接在上方填写图片 URL」；502/非 200 → 显示「搜索失败，请重试」；空查询不请求。
- alt 选填：为空渲染 `alt=""`（合法，背景图装饰场景）。

## 测试

- **单测（vitest）**：`pickUnsplash` 映射（有 alt_description / null → ""）。
- **e2e（happy path，沿用 Dev Login + pg 清理）**，新建 `e2e/media-picker.spec.ts`：
  - 进编辑器某图片字段 → 开选图弹窗 → 切「上传」Tab，上传一张图片 → 图片被选中（字段 src 变为 blob URL，预览出现）。
  - 切「Unsplash」Tab：本地无 key → 断言出现 demo 提示文案（不打真实 Unsplash API）。
  - 在外层 alt 输入框填描述 → 经预览 iframe 断言渲染出 `img[alt="…"]`。
  - 视频字段：开弹窗仅见「媒体库 / 上传」两 Tab，无 Unsplash。

## 影响面 / 兼容

- 改 `onChange` 签名 → 同步 `fields.tsx` 两处调用点（`ImageRefField`、`MediaField`）；tsc 兜底全覆盖。
- `UploadZone` 行为不变（仅内部改调 `uploadMedia`）；素材库管理页不受影响。
- 新增文件均在编辑器 Tailwind 区，不引入 antd；`lib/media-upload.ts` 为无 UI 纯逻辑。

## Future Work（非本子项）

- 素材库管理页增强：搜索 / 重命名 / 标签 / 文件夹组织。
- MediaPicker 上传 Tab 支持多文件 / 拖拽进度。
- Unsplash 下载追踪（合规：触发 download endpoint）与作者署名展示。
