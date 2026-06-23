# 设计：品牌化主题 —— 预设主题 + Logo + favicon（子项 C）

| | |
|---|---|
| 文档类型 | 设计 spec |
| 状态 | 待评审 |
| 日期 | 2026-06-23 |
| 分支 | `feat_20260623_品牌化主题` |
| 关联 | 产品功能缺口拆分（A–G）中的子项 C；A/B/D 已合入 main |

## 背景与目标

落地页"跑在用户自己品牌域名上"，却所有页面长一个样：渲染器主题恒为默认青翠（teal），且公开页/预览**根本没传 theme**——换肤链路从未接通；schema 无任何品牌字段；Hero/Footer 无 Logo，公开页无 favicon。本子项让每个页面可选品牌配色、上传 Logo 与 favicon，兑现"投放级品牌页"。

## 关键架构约束（决定方案）

渲染器 `RendererTheme` 字段值**全是写死的完整 Tailwind class 串**，`theme.ts` 注释明确："严禁运行期拼接类名（Tailwind JIT 扫不到）"。因此"任意 hex 自由选色"在当前架构下不可直接做（需 CSS 变量重构，属 Future Work）。本子项采用**预设主题包**方案：预先做好 6 套完整合法主题，用户选其一。

## 范围

**做（方案 C：预设主题 + 品牌标识）**：6 套预设主题 + 主题注册表/解析；schema 加 `branding`；接通渲染器按页面选主题；Hero 顶 + Footer 显示 Logo；公开页注入 favicon；编辑器"品牌主题"配置面板（色卡选主题 + Logo/favicon 上传）。

**不做（Future Work）**：自由 hex 选色（CSS 变量架构改造）；字体切换；AI 按行业荐主题；主题级深浅模式。

## 关键现状

- `RendererTheme`：10 个字段（`accentGradient`/`accentGradientHover`/`accentShadow`/`accentTextGradient`/`accentText`/`accentSoftBg`/`accentSoftBorder`/`accentSoftText`/`accentIconBg`/`glassCard`），已有 `tealEmerald` 一套，`defaultTheme = tealEmerald`。
- `LandingPage` 收 `theme?` 形参但**公开页/预览都没传**（`app/p/[slug]/page.tsx` 与 `PreviewPane.tsx` 都只传 `page`/`draft`），故恒用 default。
- schema 仅 `FooterSection.brandName`（纯文字），无主题/logo/favicon。
- Hero 无品牌标识区（badge→title 直接开始）；`generateMetadata` 无 icons。
- 页面级件先例：leadForm/floatingButton（BlockList 入口 + EditorDetail 面板 + store toggle/update）；Hero/Footer 是常驻件（无开关）。branding 属常驻件（主题恒有值）。

## 第 1 块：主题系统 & schema

### 6 套预设主题（`landing-renderer/theme.ts`）

`tealEmerald` 作第一套；手工新增 5 套，每套都是完整 10 字段 `RendererTheme`（写死合法 Tailwind class，渐变+浅底+投影协调）：

| id | 名称 | 主色系 |
|---|---|---|
| teal | 青翠 | teal→emerald（现默认）|
| blue | 蓝 | blue→indigo |
| rose | 玫红 | rose→pink |
| amber | 琥珀 | amber→orange |
| violet | 紫 | violet→purple |
| slate | 墨 | slate（中性深）|

导出：
```ts
export type ThemeId = "teal" | "blue" | "rose" | "amber" | "violet" | "slate";
export const THEMES: Record<ThemeId, RendererTheme>;
// 编辑器色卡用：swatch 为预览渐变 class（写死，如 "bg-gradient-to-r from-rose-500 to-pink-600"）
export const THEME_META: { id: ThemeId; label: string; swatch: string }[];
export function resolveTheme(id?: ThemeId): RendererTheme; // 缺省/未知回退 teal
```
`defaultTheme = THEMES.teal` 保留（向后兼容）。

### schema（`types/schema.draft.ts`）

```ts
export interface Branding {
  theme: ThemeId;      // 选定主题，缺省 "teal"
  logo?: string;       // 品牌 Logo URL（宽图，Hero 顶 + Footer 显示）
  favicon?: string;    // favicon URL（方形小图，注入公开页 <head>）
}
// LandingPageDraft 加：branding?: Branding
```
> `ThemeId` 类型从渲染器 theme.ts 引入到 schema，或在 schema 内独立定义同名联合并由 theme.ts 复用——实现时择一，保证单一真源（推荐 schema 定义 `ThemeId`，theme.ts 引用，避免 schema 依赖渲染器）。

旧草稿无 branding → `resolveTheme(undefined)` 回退 teal、logo/favicon 不显示，天然兼容。

## 第 2 块：渲染接入

### 主题选择接通（`landing-renderer/LandingPage.tsx`）

改为内部按 branding 派生主题（保留 `theme?` 形参作显式覆盖，默认走 branding）：
```tsx
export function LandingPage({ page, theme, pageId = "" }: {...}) {
  const resolved = theme ?? resolveTheme(page.branding?.theme);
  // ...用 resolved 渲染所有 section
}
```
公开页/预览**无需改 theme 传参**，自动按页面主题渲染。

### Logo 显示

- `LandingPage` 把 `page.branding?.logo` 透传给 Hero 与 Footer（各加可选 `logo?: string` prop）。
- `Hero.tsx`：badge/title 之前，`logo` 存在则渲染 `<img>`（左对齐，限高 `h-10 w-auto`，`alt` 用 footer brandName 或空）。无 logo 不渲染，保持现状。
- `Footer.tsx`：品牌名上方，`logo` 存在则渲染（限高 `h-8 w-auto`）。
- 渲染器 Tailwind-only：logo 用静态 class，URL 来自数据。`<img>` 加 `eslint-disable @next/next/no-img-element`（与渲染器既有 Img 用法一致）。

### favicon 注入（`app/p/[slug]/page.tsx`）

`generateMetadata` 加：
```ts
icons: page.data.branding?.favicon ? { icon: page.data.branding.favicon } : undefined,
```
预览 iframe 不注入 favicon（展示为主，沿用现有 head 同步）。

### 数据流
```
branding.theme    ─ resolveTheme → RendererTheme → 所有 section
branding.logo     ─→ Hero 顶 + Footer
branding.favicon  ─→ 公开页 <head> icons
```

## 第 3 块：编辑器配置

### store（`landing-editor/store/`）
- `defaults.ts` 加 `createBranding(): Branding => ({ theme: "teal" })`。
- `editorStore.tsx`：`EditorState` 加 `branding: Branding`（**非空**，主题恒有值）；常量 `BRANDING_ID="branding"`；action `{ kind: "updateBranding"; value: Branding }`；reducer case；`toDraft` 输出 `branding`；`fromDraft`（sampleDraft.ts）读入 `draft.branding ?? createBranding()`。
- **影响**：`EditorState` 加非空 `branding` → 所有构造 EditorState 处补 `branding`，靠 tsc 暴露逐个修。
- branding 是常驻件（非开关式），无 toggle。

### 配置面板（`landing-editor/forms/BrandingForm.tsx` 新建，Tailwind-only）
- 主题：渲染 `THEME_META` 的 6 个色卡按钮（用 swatch 渐变 class 做色块），点选 `updateBranding({...value, theme: id})`，当前 theme 高亮。
- Logo：`MediaPicker`（accept="image"，复用子项 B）→ `updateBranding({...value, logo})`。
- Favicon：`MediaPicker`（accept="image"）→ `updateBranding({...value, favicon})`。

### 入口
- `BlockList.tsx`：加"品牌主题"常驻入口（`BRANDING_ID`，类比 Hero/Footer 常驻项，无启用开关），`select` 到 BRANDING_ID。
- `EditorDetail.tsx`：加 `id === BRANDING_ID` 分支渲染 `BrandingForm`（dispatch `updateBranding`）。
- 预览：`PreviewPane` 已整页渲染 `toDraft(state)`，主题/Logo 自动反映（theme 链路第 2 块已接通），无需改预览。

## 测试

- **单测（vitest）**：
  - `resolveTheme`：各 id 命中对应主题；`undefined`/未知 id 回退 teal。
  - `THEMES` 完整性：6 套各 10 个字段均非空字符串（防漏配新主题）。
- **e2e（happy path，Dev Login + pg）**，新建 `e2e/branding.spec.ts`：
  - 编辑器开"品牌主题"→ 点 rose 色卡 → 预览 iframe 内 CTA 按钮 class 含 rose 主题渐变（断言换肤生效）。
  - Logo 字段填一个图片 URL → 预览 Hero 出现该 `<img>`。

## 影响面 / 兼容

- `LandingPage` theme 来源改为 branding 派生：公开页/预览不需改 theme 传参（反而简化），显式 `theme` 仍可覆盖。
- `EditorState.branding` 非空 → 构造点补齐（tsc 兜底）。
- 旧草稿无 branding → 全链路回退 teal、无 logo/favicon，无破坏。
- 渲染器仍 Tailwind-only（theme 字段写死 class，logo/favicon 是数据 URL）。

## Future Work（非本子项）

- 自由 hex 选色（CSS 变量架构改造，方案 B）。
- 主题级字体切换。
- AI 生成时按行业推荐主题。
- 主题深浅模式 / 暗色变体。
