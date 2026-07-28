# 平台营销站国际化（en 默认 / zh 可切）设计

- 日期：2026-07-27
- 预期分支：`feat_20260727_营销站国际化`
- 状态：设计待评审（尚未建分支、尚未实现）

## 1. 目标与范围

把平台主站的**公开营销面**改造为双语：默认英文，可切换简体中文。

### 范围内

| 路由 | 说明 | 中文量(字) |
| --- | --- | --- |
| `/` | 营销首页 | ~1,300（含 nav/footer） |
| `/pricing` | 套餐定价 | ~106 + 套餐权益 ~580 |
| `/anti-ban` | 反同质化叙事页 | ~920 |
| `/templates`、`/templates/[slug]`×33 | 公开模板画廊与详情 | ~6,000 |
| `/guides`、`/guides/[slug]`×3 | 获客指南（长文） | ~2,900 |
| `/privacy`、`/terms` | 法务页 | ~2,610 |
| `/login`、`/register` | 登录注册 | ~250 |
| `/not-found`、`/error` | 全局兜底页 | ~74 |
| `/llms.txt`、`/og`、`/sitemap.xml` | 公开元数据面 | ~416 |

### 范围外（本次明确不动）

- `/admin` 租户后台、`/super-admin` 平台后台（含 12 章帮助中心）—— 保持简体中文
- `/p/[slug]` 租户落地页、`/preview/[token]` —— 属租户内容，语言由租户自己决定
- `/api/**`

## 2. 已决策项

| 决策 | 结论 | 依据 |
| --- | --- | --- |
| 范围 | 公开营销面全量 | 用户选定 |
| URL 策略 | `/` 英文无前缀 + `/zh/*` 中文 | 用户选定；英文作为主要 SEO 资产占据根路径 |
| 路由实现 | **方案 B：`app/zh/` 镜像树** | 用户选定；`proxy.ts` 零改动，无改写魔法，未知路由 404 行为天然保持 |
| 文案来源 | 由 AI 产出（本地化改写，非逐字直译） | 用户选定 |
| 技术选型 | 自研轻量字典，零新依赖 | 用户选定；与项目刚完成的瘦身（deps 76→34）及 `/guides`「零新 deps」先例一致 |
| 法务页语言差异 | **以英文版为准** | 用户选定 |

## 3. 路由结构

### 3.1 物理布局

英文页保持现有物理路径不动，新增 `app/zh/` 镜像树：

```
app/
  page.tsx                    → /                    (en)
  pricing/page.tsx            → /pricing             (en)
  anti-ban/page.tsx
  templates/page.tsx
  templates/[slug]/page.tsx
  guides/page.tsx
  guides/[slug]/page.tsx
  privacy/page.tsx
  terms/page.tsx
  (auth)/{layout,login,register}
  zh/
    layout.tsx                → 中文子树布局
    page.tsx                  → /zh
    pricing/page.tsx          → /zh/pricing
    anti-ban/page.tsx
    templates/page.tsx
    templates/[slug]/page.tsx
    guides/page.tsx
    guides/[slug]/page.tsx
    privacy/page.tsx
    terms/page.tsx
    (auth)/{layout,login,register}
```

### 3.2 页面文件是薄壳

项目现有 `app/page.tsx`（35 行）已经是「壳 + `components/marketing/MarketingHome`」的形态，本方案把这个既有模式贯彻到全部营销页。每个路由文件收敛为 ~8 行：

```tsx
// app/pricing/page.tsx
import { pricingMetadata, PricingView } from "@/components/marketing/pages/Pricing";
export const metadata = pricingMetadata("en");
export default function Page() {
  return <PricingView locale="en" />;
}

// app/zh/pricing/page.tsx —— 仅两处 "en" → "zh"
```

动态路由（`templates/[slug]`、`guides/[slug]`）用 `generateMetadata` 委托同一个工厂，并各自 `generateStaticParams`。

需要新抽出的共享页面体（目前逻辑内联在路由文件里）：

- `components/marketing/pages/Pricing.tsx`
- `components/marketing/pages/TemplateGallery.tsx`、`TemplateDetail.tsx`
- `components/marketing/pages/GuideIndex.tsx`、`GuideDetail.tsx`
- `components/marketing/pages/Legal.tsx`（复用现有 `LegalPage.tsx`）

已存在的 `MarketingHome.tsx`、`AntiBanNarrative.tsx`、`chrome.tsx`、`PlanComparison.tsx` 只加 `locale` / 字典切片 prop。

### 3.3 单一事实源：路由清单

B 方案的固有风险是**新增营销页忘记补镜像**。用一份清单同时驱动四件事，把风险收敛到一处：

```ts
// lib/i18n/routes.ts
export const LOCALIZED_ROUTES = ["/", "/pricing", "/anti-ban", "/templates",
  "/guides", "/privacy", "/terms", "/login", "/register"] as const;
```

驱动：① `localePath()` 的合法性守卫；② `sitemap.ts` 双语条目生成；③ 路由镜像对等性测试；④ 语言切换器的可见性判定。

分期交付期间，清单按 PR 逐条追加——对等性测试只校验清单内的路由，因此不会在中途变红。

## 4. i18n 基建（约 150 行，零新依赖）

```
lib/i18n/
  config.ts            locales / defaultLocale / Locale 类型 / html lang / og locale 映射
  routes.ts            LOCALIZED_ROUTES + localePath() + stripLocale()
  dictionaries/
    en/{common,home,antiban,pricing,templates,guides,auth}.ts
    zh/{...}           同结构
    index.ts           getDictionary(locale)
```

### 4.1 字典 key 一致性靠 TypeScript 本身

```ts
// dictionaries/en/index.ts
export const en = { common, home, antiban, pricing, templates, guides, auth };
export type Dictionary = typeof en;

// dictionaries/zh/index.ts
export const zh = { ... } satisfies Dictionary;   // 漏 key / 多 key 均编译期报错
```

英文是事实源。`satisfies` 同时捕获缺失键和多余键——这是自研方案相对 next-intl 必须保留的核心能力，不能省。

### 4.2 传递方式：props，不引入 Context

`getDictionary()` 同步返回（静态 import，无 async 开销）。Server Component 直接取；`MarketingHome` / `AntiBanNarrative` 是 `"use client"`，已经在接 `fonts` prop，再接一个字典切片即可。

不引入 React Context：字典是纯静态数据，走 props 少一层 provider，且只有被用到的切片会被序列化进客户端 payload（单语言，不是两份）。

### 4.3 长文内容不进字典

字典只装 **UI chrome 与营销短文案**。长文属于内容而非界面字符串，留在各自的内容模块中做 locale 变体：

- 指南：`app/guides/_content/articles/<slug>/{en,zh}.ts`，`getGuides(locale)` / `getGuide(locale, slug)`
- 法务：`components/marketing/legal-content/{en,zh}.ts`

两种语言**共用同一 slug**（`/guides/whatsapp-lead-landing-page` ↔ `/zh/guides/whatsapp-lead-landing-page`），使 hreflang 配对无需额外映射表。模板 id 同理。

### 4.4 localePath 守卫

```ts
export function localePath(locale: Locale, path: string): string {
  // 非营销路由（/admin、/api 等）不加前缀——加了会 404
  if (!isLocalizedRoute(path)) return path;
  if (locale === "en") return path;
  return path === "/" ? "/zh" : `/zh${path}`;
}
```

`/admin`、`/super-admin` 的链接必须保持裸路径。守卫让误用在测试中暴露，而不是在生产变 404。

### 4.5 语言切换器

`components/marketing/LocaleSwitcher.tsx`（client）：读 `usePathname()`，在 `/zh` 前缀有无之间互换，落到 SiteNav 与 SiteFooter。

**URL 是渲染语言的唯一事实源**——切换器本身就是一个普通链接，不改变任何页面的渲染依据。

切换时额外写一枚 `zb_locale` cookie，仅供 §4.6 的首页 IP 分流判断「用户已手动表态」，不参与渲染。

### 4.6 首页 IP 分流（2026-07-28 追加）

`lib/proxy/locale-proxy.ts`，挂在 `proxy.ts` 的租户改写之后、鉴权之前：中国大陆 IP（Vercel 边缘注入的 `x-vercel-ip-country === "CN"`）访问 `/` 时 307 到 `/zh`，其余地区维持英文默认页。

本节推翻了本文档原先「不做任何自动重定向」的决定。原决定要防的是**污染 canonical / hreflang 与 GSC 投入（PR#108）**，该目的通过三道闸原样保留：

| 闸 | 作用 |
| --- | --- |
| 爬虫 UA 豁免 | Googlebot / Bingbot / Baiduspider / GPTBot / ClaudeBot 等一律不跳，抓到的永远是 URL 自身对应的语言版本 |
| 仅首页文档请求 | 只认 `sec-fetch-dest: document`；RSC 预取与客户端导航不跳，否则语言切换器会被中间件劫回中文 |
| cookie 优先于 IP | `zb_locale=en` 时大陆 IP 也不跳，用户的手动选择不会被地理规则反复推翻 |

其他口径：仅大陆，港澳台不跳（目前只有简体词典）；用 307 而非 308，避免浏览器与中间盒把「/ → /zh」永久固化；跳转响应带 `cache-control: no-store`，防止 CDN 把中文跳转缓存给全球访客。

分流范围**仅限 `/`**——`/pricing`、`/templates` 等保持用户点进来的语言，外链与搜索结果的落点不被改写。

## 5. SEO（必须与改造同批，不可后补）

| 项 | 现状 | 改后 |
| --- | --- | --- |
| `SITE_LOCALE` | 写死 `"zh_CN"`，而 `<html lang>` 写死 `"en"`，**本就自相矛盾** | 按 locale 派生 `en_US` / `zh_CN` |
| `SITE_DESCRIPTION` | 单中文 | 双语 |
| `marketingMetadata()` | 单 canonical | 加 `locale` 入参，输出 `alternates.languages`：`en` / `zh-Hans` / `x-default: en` |
| `siteStructuredData()` | `inLanguage: "zh-CN"` | 按 locale 派生 |
| `sitemap.ts` | 单语全量 | 双语全量 + 每条 `alternates.languages`；由 `LOCALIZED_ROUTES` 驱动 |
| `/og` | 品牌卡片，渲染文案已全是拉丁字符（那 68 个中文字全在注释里） | **无需改动**，双语共用 |
| `llms.txt` | 中文 | 改英文主体，正文列出双语 URL（不做 `/zh/llms.txt`——属过度设计） |
| `site.ts` 注释、`llms.txt` 正文 | 「面向中国出海广告主」 | 英文面改为国际化表述 |

全站正文中的中国语境表述只有上述 2 处（均在 metadata / 注释层），业务正文无污染。

### 5.1 `<html lang>`：B 方案的唯一实质妥协

Next.js App Router 中只有根布局能输出 `<html>`，而 B 方案下 `/zh/*` 与 `/` 共用 `app/layout.tsx`，且没有 proxy 注入的 locale 头可读。

**决定**：`<html lang="en">` 保持不变（对默认语言而言现在反而是正确的），`app/zh/layout.tsx` 在其子树最外层包一个 `<div lang="zh-Hans">`，并附一个 ~5 行的 client effect 同步 `document.documentElement.lang`。

- 语言信号对搜索引擎主要由 hreflang + `og:locale` + JSON-LD `inLanguage` 承担，这三项本方案都会正确输出
- 嵌套 `lang` 属性是合法 HTML，屏幕阅读器读的是实时 DOM，因此无障碍层面是完整的
- 妥协点：SSR 首帧 HTML 的 `<html lang>` 对 `/zh` 页面仍是 `en`

已评估并否决的两个替代方案：
- **proxy 注入 `x-locale` 头** —— 与选择 B 的初衷（proxy 零改动）相悖；且 `proxy.ts` 现有注释记载 NextAuth 包装器会用 `new Response(body, response)` 重建响应、丢弃 rewrite 附带的上游请求头覆盖，该路径有历史坑
- **多根布局（route group 各出一个 `<html>`）** —— 需把 `/admin`、`/p`、`/preview`、`/super-admin` 等全部迁入 group，且 `not-found` / `global-error` / providers / 字体 / Analytics 都要复制一份，为一个属性付出的重构面过大

若后续判断 `<html lang>` 精确性必须拿下，逃生通道是一行 proxy 头注入，届时可单独评估。

## 6. 共用代码切分（工作量最容易被低估的一块）

公开面与 `/admin` 后台共用三处，只改公开面会把刀切在中间：

### 6.1 `lib/plans.ts` + `PlanComparison`（~580 中文字）—— 归入 PR 1

套餐权益文案，定价区与后台计费页共用。改法：`plans.ts` 只留结构化数据（id / 价格 / 额度 / 布尔权益），展示文案全量搬进字典；后台侧取 `zh` 字典，行为不变。

需要一并处理的还有：`PLAN_FEATURE_ROWS` 的 `valueFor` 返回值内嵌中文量词（`"张"` / `"个"` / `"次/月"`），以及 `PlanComparison` 组件里内联的「功能 / 说明 / 最受欢迎 / 免费 / 月 / 立即升级」。

**排期修正**：本项原计划放 PR 3，现前移至 PR 1。原因是首页内嵌 `#pricing` 区块直接渲染 `PlanComparison`——不一起做，PR 1 交付的「英文首页」会中间夹一张中文套餐表，不是一个自洽的交付物。

### 6.2 `landing-editor/samples/registry.ts`（~5,000 中文字，33 套）

`name` / `industry` / `tagline` / `seoIntro` 与 `lib/seo/template-content.ts` 同为公开画廊与后台模板选择器共用。改为内联本地化：

```ts
type LocalizedText = Record<Locale, string>;
// name: { en: "...", zh: "..." }
```

内联而非另建映射表：registry 本就是「登记模板的唯一入口」，TS 会强制两种语言都填。

### 6.3 `TemplateArchetype` 中文字面量联合类型

```ts
export type TemplateArchetype = "种草留资" | "预约咨询" | "比价线索" | "demo预约";
```

**它是数据键，不是文案**，但目前被直接当展示文本用了。必须改成英文 slug（`"seeding" | "consult" | "compare" | "demo"`）+ 字典映射显示名，否则英文站无法出。这是独立小重构，单独 commit，并以测试保证模板画廊筛选行为不变。

## 7. 鉴权面（B 方案的安全优势）

`proxy.ts` **零改动**。

`lib/proxy/auth-proxy.ts` 的受保护前缀判定（`/admin`、`/super-admin`、`/api`）完全不动——因为 B 不引入「剥除 locale 前缀后再匹配」这一步，也就不存在 `/zh/...` 绕过守卫的新增暴露面。`/zh/admin` 不是已注册路由，直接 404。

唯一需要补的是一个体验缺口：

```ts
// 已登录用户访问 /zh/login、/zh/register 时同样跳转 /admin
```

改动 2 行，配一个 proxy 单测（先写失败用例）。

`/zh/*` 各营销页命中 `handleAuth` 末尾的默认 `return null`（放行），无需登记进 `PUBLIC_PATHS`。

## 8. 已知代价（如实记录）

**现有中文页的 SEO 收录会被重置。** 现站 `/`、`/pricing` 等已被 GSC 收录的是中文内容；改造后这些 URL 原地变英文，中文版迁往全新的 `/zh/*`。按已确认的决策不做重定向（URL 未变，仅内容语言变更），因此：

- 英文版继承现有 URL 的权重，但内容语言变更后需要重新评估排名
- 中文版作为新 URL 从零开始收录，需要通过 sitemap + hreflang 引导

这是选择「英文占据根路径」的必然代价，已与用户确认。

**`/zh/*` 下的未知路由只会得到英文 404。** `app/not-found.tsx` 是全局唯一兜底页，B 方案下无法按子树区分语言。判断为可接受：404 页几乎不产生用户价值损失，且不影响 SEO。若要修，需要 `app/zh/not-found.tsx`（Next 支持子树 not-found，但仅对该子树内 `notFound()` 显式抛出生效，对未匹配路由不生效），因此不列入本次范围。

## 9. 交付分期

| PR | 内容 | 中文量 |
| --- | --- | --- |
| 1 | i18n 基建 + `app/zh/` 骨架 + `LOCALIZED_ROUTES` 清单 + 切换器 + SEO 全套（hreflang / sitemap / JSON-LD / lang）+ 首页与 nav/footer + **`plans.ts` 文案外提** | ~1,880 |
| 2 | pricing、anti-ban、login/register、404/error | ~1,120 |
| 3 | **`registry.ts` 切分**（archetype slug 化 + 模板文案双语）+ 模板画廊 + 33 个详情页 | ~5,600 |
| 4 | guides 列表/详情 + 3 篇长文英文版 + llms.txt | ~2,900 |
| 5 | privacy + terms 英译 + 语言差异条款（以英文版为准） | ~2,610 |

分期依据是**风险与共用面**，不是文件数：PR 3 单独成批，因为它要动后台也在用的 `plans.ts` 与 `registry.ts`。

## 10. 验证策略

每个 PR 的门槛：`tsc` + `vitest run` + `eslint` + `next build` 全绿。

分层补充：

- **单元（vitest）**
  - `localePath()` / `stripLocale()` 往返，含 `/admin` 等非营销路由不加前缀的守卫
  - 路由镜像对等性：遍历 `LOCALIZED_ROUTES`，断言 `app/zh/**` 存在对应文件（B 方案的核心兜底）
  - `auth-proxy` 对 `/zh/login`、`/zh/register` 的已登录跳转（先写失败用例）
  - sitemap 双语条目与 hreflang 完整性
  - PR 3 追加：模板筛选在 archetype slug 化后行为不变
- **E2E（Playwright）**
  - `/` 出英文、`/zh` 出中文
  - 切换器往返保持当前路径（`/pricing` ↔ `/zh/pricing`）
  - 页面 head 含 en / zh-Hans / x-default 三条 hreflang
  - 回归：`/admin` 与 `/p/[slug]` 不受影响
  - 选择器遵循项目约定，优先 `getByRole` / `getByLabel`

字典 key 一致性由 TS 编译期保证，不再重复写运行时测试。

## 11. 待办 / 后续

- 英文文案定位：按**国际 SaaS 客户**的本地化改写来写，产品主张、数字、套餐权益严格不动
- 法务页英文版补语言差异条款：两版歧义时以英文版为准
- 第三语言若将来要加，B 方案需再复制一棵树——届时可重新评估是否切到 `app/[locale]/` 单树
