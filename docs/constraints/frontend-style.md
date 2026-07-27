# Frontend Style

- Tailwind only.
- Do not write custom CSS.
- Do not use inline styles.
- Always use Tailwind utility classes.
- Refer to `styles/theme.css` for color definitions (Tailwind v4 `@theme`; there is no `tailwind.config.js`).
- MVP pages should be simple, direct, and conversion-focused.
- Avoid ecommerce or product-transaction assumptions in copy, components, SEO metadata, analytics events, and templates.

## UI 一致性(设计系统分区)

本项目按区域使用两套设计系统,不得混用:

- **前台**(官网 `app`、落地页 `app/p`、`landing-renderer`、营销组件):**Tailwind 直写**,成套样式走 `lib/theme.ts` 预设(`ctaPrimary`/`glassCard`/`pill` 等),不依赖组件库。
  - `components/ui/*` 仅保留 4 个 Radix 基元:`dialog`、`popover`、`sonner`(toast)、`utils`(`cn`)。**需要新的交互基元时优先用 Tailwind 手写**;确有无障碍/焦点管理刚需(如新的浮层类组件)才按 shadcn 约定补入,并在此列出。
  - 历史上曾整套引入 shadcn/ui,但 49 个组件里 45 个从未被使用,已于 2026-07-27 移除。**不要因为「项目用 shadcn」就直接 `npx shadcn add`**。
- **后台**(`app/admin`、`app/super-admin`):Ant Design v5,主题经 `lib/theme/antd-theme.ts` 的 ConfigProvider 注入。
- 禁止引入第三套 UI 库(MUI/emotion 等);ESLint 已通过 `no-restricted-imports` 阻断。

## Ant Design 必须在 Client Component 里渲染(后台）

- 任何渲染 antd 组件(`Row`/`Col`/`Card`/`Statistic`/`Menu`/`Button`… 及 `@ant-design/icons`)的文件，**首行必须是 `"use client"`**。
- 原因:Next App Router + React 19 + antd 5 下，**Server Component 直接渲染 antd 会得到 `undefined` 元素 → 运行时 500**（`Error: Element type is invalid ... got: undefined`）。此错**构建不报**，只在访问该页时暴露，极易漏。
- 正确模式:Server Component 只做数据获取，把数据经 props 传给 `"use client"` 子组件渲染 antd。参考 `app/super-admin/page.tsx` → `_overview-client.tsx`、`app/super-admin/users/page.tsx` → `_client.tsx`。
- 跨 server→client 边界的 props 必须可序列化（如 `Date` 先转 ISO 字符串再传）。
- 例外:`import type { … } from "antd"`（仅类型，编译期擦除）可在 Server 文件使用，如 `lib/theme/antd-theme.ts`。

## 品牌色 · 令牌单一源

- 运行时令牌唯一源:`styles/theme.css` 的 `:root --primary`。前台一律走语义 token(如 `bg-primary`、`text-primary`)或 `lib/theme.ts` 预设,不写颜色字面量。
- TS 侧(antd 算法派生色、无法消费 CSS 变量的内联渐变等)统一从 `@/lib/theme/brand` 导入 `BRAND`,**禁止硬编码品牌主色 `#0e9fe4`**;ESLint `no-restricted-syntax` 已阻断,`lib/theme/__tests__/brand.test.ts` 断言两侧一致。
