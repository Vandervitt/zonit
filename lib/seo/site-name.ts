// 品牌名常量，单独成一个零依赖模块：客户端组件（如超管侧边栏）要显示品牌名，
// 但 lib/seo/site.ts 经 fillCounts 依赖整个模板注册表，直接引它会把注册表打进客户端包。
export const SITE_NAME = "Urgizat";
