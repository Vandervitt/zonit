# Frontend Style

- Tailwind only.
- Do not write custom CSS.
- Do not use inline styles.
- Always use Tailwind utility classes.
- Refer to `tailwind.config.js` for color definitions.
- MVP pages should be simple, direct, and conversion-focused.
- Avoid ecommerce or product-transaction assumptions in copy, components, SEO metadata, analytics events, and templates.

## UI 一致性(设计系统分区)

本项目按区域使用两套设计系统,不得混用:

- **前台**(官网 `app`、落地页 `app/p`、`landing-renderer`、营销组件):shadcn/ui(Radix + Tailwind),组件走 `components/ui/*`,成套样式走 `lib/theme.ts` 预设。
- **后台**(`app/admin`、`app/super-admin`):Ant Design v5,主题经 `lib/theme/antd-theme.ts` 的 ConfigProvider 注入。
- 禁止引入第三套 UI 库(MUI/emotion 等);ESLint 已通过 `no-restricted-imports` 阻断。

## 品牌色 · 令牌单一源

- 运行时令牌唯一源:`styles/theme.css` 的 `:root --primary`。前台一律走语义 token(如 `bg-primary`、`text-primary`)或 `lib/theme.ts` 预设,不写颜色字面量。
- TS 侧(antd 算法派生色、无法消费 CSS 变量的内联渐变等)统一从 `@/lib/theme/brand` 导入 `BRAND`,**禁止硬编码品牌主色 `#0e9fe4`**;ESLint `no-restricted-syntax` 已阻断,`lib/theme/__tests__/brand.test.ts` 断言两侧一致。
