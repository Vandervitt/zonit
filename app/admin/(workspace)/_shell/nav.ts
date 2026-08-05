import {
  AppstoreOutlined, FileTextOutlined, GlobalOutlined, PictureOutlined,
  LineChartOutlined, CreditCardOutlined, SettingOutlined, QuestionCircleOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { Routes } from "@/lib/constants";

import type { AdminDictionary } from "@/lib/i18n/admin";

/** 导航项的 key。作为字典 `shell.nav` 的索引，两边由 nav.test.ts 机械核对。 */
export type AdminNavKey = keyof AdminDictionary["shell"]["nav"];

export interface AdminNavItem {
  key: AdminNavKey;
  icon: React.ComponentType;
  href?: string;
  disabled?: boolean;
  badge?: string;
}

// 本数组只留**结构**（顺序、图标、路由），文案在 lib/i18n/admin/dictionaries/*/shell.ts。
// key 用 AdminNavKey 约束，写错或字典漏了对应条目直接编译报错。
export const ADMIN_NAV: AdminNavItem[] = [
  { key: "overview", icon: AppstoreOutlined, href: Routes.Dashboard },
  { key: "pages", icon: FileTextOutlined, href: Routes.LandingPages },
  { key: "leads", icon: InboxOutlined, href: Routes.Leads },
  { key: "domains", icon: GlobalOutlined, href: Routes.Domains },
  { key: "media", icon: PictureOutlined, href: Routes.Media },
  { key: "analytics", icon: LineChartOutlined, href: Routes.Analytics },
  { key: "billing", icon: CreditCardOutlined, href: Routes.Billing },
  { key: "settings", icon: SettingOutlined, href: Routes.Settings },
  { key: "help", icon: QuestionCircleOutlined, href: Routes.Help },
];

// 当前页高亮判定：取「最长匹配」的 href，最具体者胜。
// 概览的 href 是 /admin，会被所有 /admin/* 子路由前缀命中，故不能用「首个匹配」，
// 否则每个子页面都会错误高亮概览。最长匹配下：
//   /admin        → overview（仅精确命中概览）
//   /admin/media  → media（同时命中 /admin 前缀与 /admin/media 精确，取更长者）
export function resolveActiveNavKey(pathname: string): string {
  const match = ADMIN_NAV
    .filter((i): i is AdminNavItem & { href: string } =>
      Boolean(i.href) && (pathname === i.href || pathname.startsWith(i.href + "/")),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.key ?? "overview";
}
