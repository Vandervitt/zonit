# AI 一键洗稿 (AI Rewriter) 功能设计

**日期**: 2026-04-24  
**状态**: 已批准

## 背景

落地页编辑器需要一个 AI 洗稿功能，将现有模块的 JSON 文案通过 OpenAI API 重写，生成独一无二的广告文案，同时随机化 HTML 布局结构，从两个维度规避 Facebook 广告查重风控。

## 架构

### 数据流

```
AccordionContent (BlockEditorPanel.renderForm)
  └─ AiRewriteButton (blockType, currentData, onSuccess)
       │ 调用 Server Action
       ▼
  app/actions/ai-rewrite.ts :: rewriteBlockContent(blockType, currentData)
       │ OpenAI gpt-4o-mini (response_format: json_object)
       │ 同时重写文案 + 选择布局变体
       ▼
  { success: true, data: <rewritten JSON with variant> }
       │ onSuccess(newData)
       ▼
  BlockEditorPanel onChange → LandingPageTemplate state
       │
       ▼
  Block 组件按 variant 字段渲染不同 HTML 结构
```

### 集成点

在 `BlockEditorPanel.tsx` 的 `renderForm()` 方法中，每个 `<XxxForm>` 渲染前插入 `<AiRewriteButton>`，`onSuccess` 直接复用已有的 `onChange` 回调。

## 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `types/schema.ts` | 修改 | 5 个 schema 加 `variant` 字段 |
| `app/actions/ai-rewrite.ts` | 新建 | Server Action，调用 OpenAI |
| `components/editor/AiRewriteButton.tsx` | 新建 | 按钮 UI 组件 |
| `components/sites/BlockEditorPanel.tsx` | 修改 | 在 renderForm 里插入按钮 |
| `components/blocks/Hero.tsx` 等 | 修改 | 按 variant 条件渲染布局 |
| `package.json` | 修改 | 安装 `openai` npm 包 |

## Schema 变体字段

在以下 5 个 schema 中各加一个可选 `variant` 字段，无值时 fallback 到默认布局：

| Schema | 字段 | 允许值 | 默认 |
|--------|------|--------|------|
| `HeroSchema` | `variant?` | `'overlay' \| 'split-left' \| 'split-right'` | `'overlay'` |
| `FeaturesSchema` | 复用现有 `layout?` | `'grid' \| 'list'` | `'grid'` |
| `AuthoritySchema` | `variant?` | `'image-left' \| 'image-right'` | `'image-left'` |
| `BundlesSchema` | `variant?` | `'cards-row' \| 'cards-column'` | `'cards-row'` |
| `ReviewsSchema` | `variant?` | `'grid' \| 'carousel'` | `'grid'` |

## Server Action 设计

**文件**: `app/actions/ai-rewrite.ts`

```typescript
"use server";
export async function rewriteBlockContent(
  blockType: string,
  currentData: unknown
): Promise<{ success: boolean; data?: unknown; error?: string }>
```

**System Prompt 要点**:
- 角色：顶级海外直邮广告（Direct Response）文案大师
- 任务：重写 JSON 中所有营销文案，保持原意、提升转化率、增加紧迫感
- 布局任务：如果 JSON 中存在 `variant` 或 `layout` 字段，从该字段的允许值中选一个与当前值**不同**的值写入，实现布局随机化
- 严格约束：返回与输入完全相同结构的 JSON；不修改 URL、图片 src、颜色 HEX 代码、icon 标识符；不增删任何 key

**User Prompt**：将 `blockType` 和 `JSON.stringify(currentData)` 一并传入，让 AI 有类型上下文。

**OpenAI 调用配置**:
- 模型：`gpt-4o-mini`
- `response_format: { type: "json_object" }`
- 超时/错误处理：catch 所有异常，返回 `{ success: false, error: string }`
- 环境变量：`OPENAI_API_KEY`（缺失时提前返回错误）

**返回值校验**:
- 解析后必须是 object（非 null、非 array）

## AiRewriteButton 组件设计

**文件**: `components/editor/AiRewriteButton.tsx`

**Props**:
```typescript
interface Props {
  blockType: string;
  currentData: unknown;
  onSuccess: (data: unknown) => void;
}
```

**状态**: `idle | loading`（成功/失败均回 idle）

**样式**:
- 宽度：`w-full`，高度 `h-8`
- 背景：紫色渐变 `from-violet-600 to-purple-600`，hover 加深
- 图标：`Sparkles`（idle）/ `Loader2 animate-spin`（loading）
- loading 时禁用点击

**交互逻辑**:
1. 点击 → 设 loading
2. 调用 `rewriteBlockContent(blockType, currentData)`
3. 成功 → `onSuccess(data)` + `toast.success("文案重写成功 ✨")`
4. 失败 → `toast.error(error ?? "重写失败，请重试")`
5. 无论结果 → 恢复 idle

## BlockEditorPanel 改动

在 `renderForm()` 的每个分支中，在 `<XxxForm>` 上方插入：

```tsx
<AiRewriteButton
  blockType={meta.type}
  currentData={<当前 block 数据>}
  onSuccess={<对应的 onChange handler>}
/>
```

具体：
- `FixedBlockKey.Hero`：`currentData={data.hero}`，`onSuccess={d => onChange({ ...data, hero: d as HeroSchema })}`
- `FixedBlockKey.Bundles`：`currentData={data.bundles}`，`onSuccess={d => onChange({ ...data, bundles: d as BundlesSchema })}`
- `FixedBlockKey.HowItWorks`：`currentData={data.howItWorks}`，`onSuccess={d => onChange({ ...data, howItWorks: d as HowItWorksSchema })}`
- `FixedBlockKey.Footer`：`currentData={data.footer}`，`onSuccess={d => onChange({ ...data, footer: d as MicroFooterSchema })}`
- 可选 block：`currentData={block.data}`，`onSuccess={d => updateOptional(block.id, d as OptionalBlock["data"])}`

## Block 组件变体渲染

每个支持变体的 block 组件读取 `variant`（或 `layout`）字段，用条件分支渲染不同 HTML 结构：

- **Hero**：`overlay` = 文字居中覆盖背景图；`split-left` = 左文右图；`split-right` = 右文左图
- **Features**：`grid` = 图标网格；`list` = 横向列表
- **AuthorityStory**：`image-left` = 图左文右；`image-right` = 图右文左
- **ProductBundles**：`cards-row` = 卡片横排；`cards-column` = 卡片纵列
- **Reviews**：`grid` = 网格展示；`carousel` = 横向轮播

## 约束与边界

- **类型安全**：`onSuccess` 接收 `unknown`，在 `BlockEditorPanel` 集成点用 `as` cast，AI 返回同结构 JSON 保证运行时安全
- **非文本数据保护**：Prompt 明确禁止修改 URL、src、HEX、icon 名称
- **变体 fallback**：组件渲染时 `variant` 缺失视为默认值，不崩溃
- **可复用性**：Action 和按钮组件与 blockType 无关，未来新增 block 类型只需加 schema variant 字段和组件分支
- **环境变量**：`OPENAI_API_KEY` 通过 `.env.local` 注入，缺失时返回友好错误
