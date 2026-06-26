# 设计：SEO 编辑面板（子项 F）

| | |
|---|---|
| 文档类型 | 设计 spec |
| 状态 | 待评审 |
| 日期 | 2026-06-26 |
| 分支 | `feat_20260626_seo编辑面板` |
| 关联 | 产品功能缺口拆分（A–G）中的子项 F；A/B/C/D/E 已合入 main |

## 背景与目标

公开页 `generateMetadata` 已成体系（title/description/canonical/OG/twitter/favicon），但**全部从 hero/footer/branding 派生，用户无法自定义**。投放落地页的标题与社交分享图直接影响点击率，需让用户每页可覆盖 SEO 元数据。robots/sitemap 已按 host 动态且健全，本子项仅在其上加 noindex 分支。

## 范围

**做**：schema 加 `seo?`（metaTitle/metaDescription/ogImage/noindex）；`generateMetadata` 覆盖优先、hero 派生兜底；noindex 同时落到 `<meta robots>` 与自有域 robots.txt；编辑器 SEO 配置面板（页面级件）。

**不做（Future Work）**：keywords；自定义 canonical；独立 OG/twitter 文案；结构化数据 JSON-LD；AI 生成 SEO 文案。

## 关键现状

- `app/p/[slug]/page.tsx` 的 `generateMetadata`：`title=hero.title`、`description=hero.subtitle`、`ogImage=heroOgImage(hero)`、canonical=自有域根、favicon=branding——全派生，无覆盖入口。
- schema 无任何 SEO 字段。
- `app/robots.ts` 按 host 动态：自有域 `allow:"/"` + sitemap；平台域放营销面禁后台。`app/sitemap.ts` 自有域输出该页。健全，仅加 noindex 分支。
- 页面级件先例：branding（常驻，BlockList `FixedRow` 入口 + EditorDetail 分支 + Form + store updateX + toDraft/fromDraft）。SEO 完全类比。

## 第 1 块：schema + 元数据覆盖逻辑

### schema（`types/schema.draft.ts`）
```ts
export interface PageSeo {
  metaTitle?: string;        // 覆盖 <title> 与 OG/twitter title
  metaDescription?: string;  // 覆盖 description 与 OG/twitter description
  ogImage?: string;          // 社交分享图（覆盖 hero 派生图）
  noindex?: boolean;         // 禁止搜索引擎收录
}
// LandingPageDraft 加：seo?: PageSeo
```
旧草稿无 seo → 全回退 hero 派生，兼容。

### 纯函数 `resolvePageMeta`（新建 `lib/seo/resolve.ts`，便于单测）
```ts
interface ResolvedMeta { title: string; description: string; ogImage?: string; noindex: boolean; }
resolvePageMeta(data: LandingPageDraft): ResolvedMeta
```
- `title = seo.metaTitle?.trim() || hero.title.replace(/\n/g," ")`
- `description = seo.metaDescription?.trim() || hero.subtitle`
- `ogImage = seo.ogImage?.trim() || heroOgImage(hero)`（`heroOgImage` 逻辑移入此模块或复用）
- `noindex = seo.noindex === true`

### `generateMetadata`（`app/p/[slug]/page.tsx`）
改用 `resolvePageMeta(page.data)`：
- title/description/openGraph/twitter 用解析结果（OG/twitter 复用同一套 title/desc/image）。
- `noindex` 为真 → 加 `robots: { index: false, follow: false }`。
- canonical、favicon 维持现状。

## 第 2 块：robots.txt noindex 落实

`app/robots.ts` 自有域分支改为：取该域已发布页（复用 `getLandingSlugByCustomDomain` + `getPublishedBySlug`，与 sitemap.ts 一致），读 `page.data.seo?.noindex`：
- noindex=true：`rules: { userAgent:"*", disallow:"/" }`，不输出 sitemap。
- 否则：维持现状（`allow:"/"` + sitemap）。
- 平台主域分支不变。

双重保险：`<meta robots noindex>`（第 1 块）+ robots.txt `disallow:/`（本块）。自有域单页站，disallow `/` 即禁整站收录，语义正确。

## 第 3 块：编辑器 SEO 面板

### store（`landing-editor/store/`）
- `defaults.ts` 加 `createSeo(): PageSeo => ({})`。
- `editorStore.tsx`：`EditorState` 加 `seo: PageSeo`（非空，缺省 `{}`）；常量 `SEO_ID="seo"`；action `{ kind:"updateSeo"; value: PageSeo }`；reducer case；`toDraft` 总是写 `draft.seo = state.seo`（空对象无害）；`fromDraft`（sampleDraft.ts）读入 `draft.seo ?? createSeo()`。
- 常驻件（无开关），类比 branding。

### 配置面板（`landing-editor/forms/SeoForm.tsx`，Tailwind-only）
- `metaTitle`：TextInput（占位"留空用首屏标题"，提示建议 ≤60 字）。
- `metaDescription`：TextArea（占位"留空用首屏副标题"，建议 ≤160 字）。
- `ogImage`：MediaPicker（accept="image"，复用子项 B）。
- `noindex`：checkbox（「禁止搜索引擎收录此页」）。

### 入口
- `BlockList`：加"SEO"常驻 `FixedRow` 入口（`SEO_ID`）。
- `EditorDetail`：加 `id === SEO_ID` 分支渲染 `SeoForm`（dispatch `updateSeo`）。
- 预览：SEO 是 `<head>` 元数据，预览 iframe 不体现（与 favicon 一致），属正常。

## 测试

- **单测（vitest）**：`resolvePageMeta`——各字段覆盖时用覆盖值、缺省/空白时回退 hero 派生；noindex 透传；metaTitle 去换行。
- **e2e（happy path，Dev Login + pg）**，新建 `e2e/seo.spec.ts`：
  - 编辑器开"SEO"面板填 metaTitle/metaDescription + 勾 noindex → 发布 → 请求自有域公开页 HTML：断言 `<title>` 为自定义值、`<meta name="description">` 为自定义值、含 robots noindex。
  - 请求该自有域 `/robots.txt`：断言含 `Disallow: /`。
  - （自有域多租户路由：参考 landing-pages-flow.spec.ts 既有自有域 fixture 方式。）

## 影响面 / 兼容

- `LandingPageDraft.seo?` 可选 → 旧 draft 无则全回退，兼容。
- `EditorState.seo` 非空 → 构造点（sampleDraft `fromDraft`）补 `seo`，tsc 兜底。
- `generateMetadata`/`robots` 改为覆盖优先，无 seo 全回退，无破坏。
- `heroOgImage` 逻辑移入 `lib/seo/resolve.ts` 复用（`generateMetadata` 改 import）。

## Future Work（非本子项）

- keywords、自定义 canonical、独立 OG/twitter 文案。
- 结构化数据（JSON-LD：Organization / Product / FAQ）。
- AI 生成 SEO 文案（接子项 AI 能力）。
