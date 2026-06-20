import {
  AppstoreOutlined, FileTextOutlined, GlobalOutlined, PictureOutlined,
  LineChartOutlined, CreditCardOutlined, SettingOutlined, QuestionCircleOutlined,
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
  { key: "domains", label: "域名", icon: GlobalOutlined, href: Routes.Domains },
  { key: "media", label: "素材库", icon: PictureOutlined, href: Routes.Media },
  { key: "analytics", label: "投放分析", icon: LineChartOutlined, disabled: true, badge: "即将上线" },
  { key: "billing", label: "账户与计费", icon: CreditCardOutlined, href: Routes.Billing },
  { key: "settings", label: "设置", icon: SettingOutlined, href: Routes.Settings },
  { key: "help", label: "帮助", icon: QuestionCircleOutlined, href: Routes.Help },
];
