# 落地页渲染器设计稿（从零重构）

- 日期：2026-06-16
- 范围：基于 `types/schema.draft.ts` 的 `LandingPageDraft`，从零构建一套落地页渲染器
- 硬约束：**不参考任何现有渲染代码**（`components/renderer/`、`components/template-extraction/`、`PreviewPage.tsx` 等一律不读不抄）

## 1. 目标与范围

- **C 起步**：先交付独立预览路由 `app/preview-next`，吃 `landing-editor/samples/skincareConsultDraft.ts` 样例，把渲染器完整跑起来看效果——不接编辑器实时预览、不接数据库。
- **按 D 复用性设计**：渲染器组件做成**纯展示组件**，输入只有 `LandingPageDraft`（+ 可选主题），无 client-only 依赖、可被 server 渲染；后续可零改动地接入 `/editor-next` 预览面板与 `app/site/[slug]` 已发布页。

### 非目标（YAGNI）

- 不做编辑器接线、不做持久化 / SSR 数据获取。
- 不引入 SEO / 结构化数据工程（属 Phase 3）。
- 不改动现有 `components/renderer/` 旧渲染器（与本方案并存，互不影响）。
- 不做换肤的 UI 选择器；仅提供「换肤机制」本身。

## 2. 视觉方向（已通过 mockup 验收）

- 骨架 **B 为主**：白底、高对比、粗无衬线标题、醒目 CTA、密集数据块。
- 融合 **C**：渐变标题 / CTA、玻璃拟态卡片、暗色区块纵深、柔光底纹。
- 强调色 **青→绿（teal→emerald）** 渐变，作为默认主题。

## 3. 主题系统（换肤机制 · 必须项）

`LandingPageDraft` **没有主题色字段**，强调色由渲染器内**单一 theme 常量**统一提供，整页一处切换即可换肤。

### 实现要点（Tailwind v4 + Tailwind-only 约束下的关键设计）

- Tailwind 的 JIT 只能扫描**源码中出现的完整 class 字面量**，无法识别运行期拼接的 `text-${c}-600`。因此主题**不能**用变量插值生成类名。
- 方案：主题 = 一个**对象字面量**，字段值全部是**写死的完整 Tailwind class 串**。换肤 = 再定义一个同形状对象，字段换成另一组写死的 class 串。

```ts
// landing-renderer/theme.ts
export interface RendererTheme {
  accentGradient: string;      // 例:"bg-gradient-to-r from-teal-500 to-emerald-600"
  accentText: string;          // 例:"text-teal-600"
  accentTextGradient: string;  // 标题渐变文字
  accentSoftBg: string;        // 例:"bg-teal-50"
  accentSoftBorder: string;    // 例:"border-teal-200"
  accentGlow: string;          // CTA 投影色
  darkBg: string;              // 暗色区块底（stats / footer）"bg-slate-900"
  // …按组件实际需要补字段，全部为完整字面量
}

export const tealEmerald: RendererTheme = { /* 写死的 class 串 */ };
export const defaultTheme = tealEmerald;
```

- **传递方式**：`LandingPage` 接收可选 `theme?: RendererTheme`（缺省 `defaultTheme`），以 **prop 向下传**给各 section。
  - 选 prop drilling 而非 React Context：保持组件可在 **server 端**渲染（Context.Provider 需 client）。
- 约束自检：所有强调色相关 class 必须是字面量字符串；评审 / 实现时严禁出现模板插值生成的 Tailwind 类名。

## 4. 目录结构与组件清单

新目录 `landing-renderer/`（与现有 `landing-editor/` 同级、风格一致），与旧 `components/renderer/` 完全隔离。

```
landing-renderer/
  LandingPage.tsx          组合器：Hero + sections.map(registry) + Footer + FloatingButton
  theme.ts                 RendererTheme 接口 + tealEmerald 预置 + defaultTheme
  registry.tsx             LandingSectionType -> Section 组件 的映射表
  primitives/
    Img.tsx                原生 <img loading="lazy">，统一 alt 兜底 / 圆角 / object-cover
    Media.tsx              Media 联合类型渲染（image | video[+poster]）
    Badge.tsx              Badge（emoji + text）渐变小标签
    Cta.tsx                CtaButton 主/次按钮（渐变实心 / 描边）
    SectionHeading.tsx     统一 title/subtitle（支持纯文本与 IconHeading）
    SectionShell.tsx       区块外壳：垂直间距 / 容器宽度 / 可选底色
  sections/
    Hero.tsx               顶层单例（含背景图 / 主题渐变兜底、badge、双 CTA、背书、showcase）
    StatsSection.tsx       暗色底 + 玻璃数据卡 + 渐变数字
    PlansSection.tsx       方案卡（name/desc/badge/label/valueProps/可选倒计时/CTA）——纯展示，无价格/结账
    ProductsSection.tsx    产品卡网格（name/desc/bgImg）
    BeforeAfterSection.tsx 左右对比 + BEFORE/AFTER 角标 + 案例信息 + disclaimer
    ProcessSection.tsx     渐变序号步骤条（可带图）
    TrustSection.tsx       背景图 + 信任徽章（icon/title/subtitle）
    FeaturesSection.tsx    特性卡网格 + 渐变图标底
    ReviewsSection.tsx     评价引用卡 + 头像 + location/channel + 可选配图
    StorySection.tsx       背景图叠暗 + 正文 + 署名 / 职位
    CountdownSection.tsx   "use client" —— 含活倒计时
    FaqSection.tsx         原生 <details>/<summary> 折叠（无需 JS，server 友好）
    GuaranteeSection.tsx   保障项图标网格
    Footer.tsx             顶层单例（品牌 / 版权 / 邮箱 / 隐私 / 条款）
    FloatingButton.tsx     右下渐变胶囊（纯 <a>）
  components/
    Countdown.tsx          "use client" 倒计时小岛（活计时），供 CountdownSection 与 PlansSection 复用
```

## 5. 数据流与组合

```
app/preview-next/page.tsx
  └─ <LandingPage page={skincareConsultDraft} />   // theme 缺省 = defaultTheme
        ├─ <Hero data={page.hero} theme={theme} />
        ├─ page.sections.map(s => {                 // 按数组顺序渲染（顺序即排序）
        │     const C = SECTION_REGISTRY[s.type];
        │     return C ? <C key={i} data={s.data} theme={theme} /> : null; // 未知类型防御性跳过
        │   })
        ├─ <Footer data={page.footer} theme={theme} />
        └─ page.floatingButton && <FloatingButton data={page.floatingButton} theme={theme} />
```

- **顺序即排序**：`sections[]` 数组顺序就是页面顺序，渲染器不做重排。
- **registry**：`Record<LandingSectionType, ComponentType<{ data; theme }>>`，类型与 `schema.draft.ts` 的 12 种 section 一一对应。

## 6. client / server 划分

- 默认**全部为 server 组件**（纯展示）。
- 唯一 client 小岛：`components/Countdown.tsx`（`"use client"`，`useEffect` + `setInterval` 活计时）。
  - `CountdownSection`、`PlansSection`（PlanItem.countdown）作为 server 组件，渲染该 client 子组件即可——不破坏整体 server 可渲染性。
- FAQ 折叠用原生 `<details>`，**不需要 client**。

## 7. 图片处理

- 统一用原生 `<img loading="lazy">`（封装在 `primitives/Img.tsx`）。
- 理由：schema 的 `src` 是用户提供的**任意 URL**，next/image 的 `remotePatterns` 无法预知；原生 img 零配置、解耦、对任意 URL 通用。已发布页若需优化，后续在 D 阶段单独处理（非本次范围）。

## 8. 各 section 版式要点

> 通用：每个 section 经 `SectionShell` 控制纵向间距与容器宽度；`SectionHeading` 统一 title/subtitle。`items/steps/badges` 为空数组时**跳过列表渲染**（避免空网格）。

- **Hero**：`backgroundImage` 存在则铺底叠暗，缺省时用主题渐变兜底（呼应 schema 注释）；badge → 渐变标题（title）→ subtitle → 主 CTA + 可选次 CTA → endorsementText → showcase（Media）。
- **Stats**：`darkBg` 区块；items 网格（2/4 列响应式），icon + 渐变 value + label。
- **Plans**：方案卡网格；展示 name/description/badge/label/valueProps（多行打勾列表）/可选 `Countdown`/CTA。**非交易**：label 与 valueProps 仅作展示文案，无价格 / 结账 / 订阅语义。
- **Products**：产品卡网格，bgImg 作卡面、name + description。
- **BeforeAfter**：每项左右两图 + BEFORE/AFTER 角标，下方 crmName/duration/caseDescription；section 底部 `disclaimer` 小字。
- **Process**：步骤条，渐变圆形序号 + title + description + 可选图。
- **Trust**：背景图 section，badges 横向排列（icon/title/subtitle）。
- **Features**：特性卡网格，渐变图标底 + title + description。
- **Reviews**：引用卡（content.text，可选 content.image）+ 头像 avatar + name/location/channel。
- **Story**：背景图叠暗 + body 正文 + signatureName/signatureRole。
- **Countdown**：`IconHeading` 标题 + subtitle + 活倒计时（`endsAt`）。
- **FAQ**：`IconHeading` 标题 + `<details>` 折叠问答。
- **Guarantee**：title/subtitle/description + 保障项图标网格。
- **Footer**：brandName + 版权年份 + 邮箱 + 隐私政策 / 服务条款（文本展示）。
- **FloatingButton**：固定右下渐变胶囊 `<a href=link>`。

## 9. 约束遵循

- **Tailwind only**：无自定义 CSS、无内联 style；强调色全部走主题对象里的完整 class 字面量。
- **非交易**：渲染器不得引入支付 / 结账 / 购物车 / 订单 / 订阅 / 退款等概念；Plans 等模块的 label / 价值点仅为展示文案。
- **proxy.ts** 中间件、路由约定遵循项目现状（本次仅新增一个展示路由，不涉及）。

## 10. 验证方式

- `app/preview-next` HTTP 200，整页可滚动渲染样例全部模块。
- `tsc` 无类型错误（registry 与 `LandingSectionType` 全覆盖、`data` 类型与各 section props 对齐）。
- `eslint` 通过。
- 人工对照本设计稿第 8 节逐模块核对版式与 mockup 一致。
- 换肤验证：临时传入第二个 `RendererTheme`（如紫色组）能整页变色，确认机制可用（验证后移除临时代码）。
```
