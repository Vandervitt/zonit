# 图片选择器 设计文档

**日期**: 2026-04-30  
**状态**: 已批准

## 背景

编辑器（`/editor/[siteId]`）的表单面板中，部分模块支持背景图片或配图，但对应的表单字段目前只是纯文本 URL 输入框。用户无法在编辑器内搜索或上传图片，体验断层。

## 目标

为需要图片的表单字段提供两条选图渠道：
1. **Unsplash** — 搜索免费可商用图片
2. **我的素材库** — 用户自己上传的图片（本期做占位，功能延迟）

## 影响范围

| 模块 | 字段 | 当前状态 | 变更 |
|------|------|----------|------|
| 首屏 Hero | `background.value`（type=image 时） | 文本输入 | 升级为 ImagePickerField |
| 权威背书 Authority | `image.src` | 文本输入 | 升级为 ImagePickerField |
| 套餐 Tier | `tier.image` | Schema 有、表单无 | 新增字段 + ImagePickerField |
| 评价 Review | `item.avatar`、`item.proofImage` | Schema 有、表单无 | 新增字段 + ImagePickerField |

## 组件设计

### ImagePickerField

可复用组件，路径：`components/sites/ImagePickerField.tsx`

**Props:**
```ts
interface ImagePickerFieldProps {
  label: string
  value: string          // 当前图片 URL（空字符串表示未设置）
  onChange: (url: string) => void
}
```

**渲染逻辑:**
- `value` 非空：显示 48×48 缩略图 + 截断 URL + "更换图片" / "移除" 按钮
- `value` 为空：显示虚线占位框 + "选择图片" 按钮

点击"选择图片"/"更换图片"时打开 `ImagePickerDialog`。

### ImagePickerDialog

内嵌在 `ImagePickerField` 中，使用现有 Radix UI `<Dialog>`。

**两个 Tab:**

**Unsplash Tab（默认）:**
- 搜索输入框 + 搜索按钮
- 4 列图片网格，点击选中（高亮边框）
- 底部版权说明："Photos by Unsplash · 免费商用 · 使用后需标注来源"
- 确认按钮将选中图片的 `urls.regular` 写入 `value`

**我的素材库 Tab:**
- 空状态占位：图标 + "素材库即将上线" + Coming soon 标签
- 无任何交互功能

## API 路由

### `GET /api/unsplash/search`

服务端代理，避免 API Key 暴露到客户端。

**Query params:** `q` (搜索词), `page` (可选，默认 1), `per_page` (可选，默认 8)

**实现:**
```ts
const res = await fetch(
  `https://api.unsplash.com/search/photos?query=${q}&page=${page}&per_page=${per_page}&orientation=landscape`,
  { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
)
```

**返回格式（精简自 Unsplash 响应）:**
```ts
{
  results: Array<{
    id: string
    urls: { small: string; regular: string }
    alt_description: string | null
    user: { name: string; username: string }
  }>
  total: number
}
```

**未配置 key 时:** 返回 `{ results: [], total: 0, _demo: true }` 而非 500 错误，前端显示"请配置 UNSPLASH_ACCESS_KEY"提示。

## 环境变量

```env
# Unsplash API（https://unsplash.com/developers 申请）
UNSPLASH_ACCESS_KEY=your_key_here
```

添加到 `.env.local`（占位注释）。

## 新增 / 修改文件

| 操作 | 路径 |
|------|------|
| 新增 | `components/sites/ImagePickerField.tsx` |
| 新增 | `app/api/unsplash/search/route.ts` |
| 修改 | `components/sites/BlockForms.tsx` |
| 修改 | `.env.local`（添加注释占位） |

## 不在本期范围

- 素材库上传功能（Vercel Blob 集成，后续单独迭代）
- Unsplash 图片分页加载
- 图片裁剪 / 尺寸调整
- Hero 背景的 overlay 透明度设置（已有独立字段，不变）
