import { stripLocale } from "./routes";
import { Routes } from "@/lib/constants/routes";

/**
 * 判断当前 URL 路径是否落在某个导航路由下。
 * 先剥掉 /zh 前缀，中英文页共用同一份判定；子路径（如 /templates/<id>）算命中父级导航，
 * 但首页只在精确等于 "/" 时命中，否则任意路径都会把首页点亮。
 */
export function isActiveNavRoute(pathname: string, route: string): boolean {
  const current = stripLocale(pathname).pathname;
  if (route === Routes.Home) return current === Routes.Home;
  return current === route || current.startsWith(`${route}/`);
}
