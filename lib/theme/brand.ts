// lib/theme/brand.ts
// 品牌主色的 TS 侧单一来源。运行时真正的令牌源是 styles/theme.css 的 :root --primary；
// 这里的常量供无法消费 CSS 变量的场景使用（antd ConfigProvider 的算法派生色、内联渐变等）。
// 两者由 lib/theme/__tests__/brand.test.ts 断言严格一致，漂移即 CI 红。
export const BRAND = "#0e9fe4";
