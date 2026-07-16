import {
  AppstoreOutlined, FileTextOutlined, GlobalOutlined, PictureOutlined,
  LineChartOutlined, CreditCardOutlined, SettingOutlined, QuestionCircleOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { Routes } from "@/lib/constants";

export interface AdminNavItem {
  key: string;
  label: string;
  icon: React.ComponentType;
  href?: string;
  disabled?: boolean;
  badge?: string;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { key: "overview", label: "概览", icon: AppstoreOutlined, href: Routes.Dashboard },
  { key: "pages", label: "落地页", icon: FileTextOutlined, href: Routes.LandingPages },
  { key: "leads", label: "线索", icon: InboxOutlined, href: Routes.Leads },
  { key: "domains", label: "域名", icon: GlobalOutlined, href: Routes.Domains },
  { key: "media", label: "素材库", icon: PictureOutlined, href: Routes.Media },
  { key: "analytics", label: "投放分析", icon: LineChartOutlined, href: Routes.Analytics },
  { key: "billing", label: "账户与计费", icon: CreditCardOutlined, href: Routes.Billing },
  { key: "settings", label: "设置", icon: SettingOutlined, href: Routes.Settings },
  { key: "help", label: "帮助", icon: QuestionCircleOutlined, href: Routes.Help },
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
