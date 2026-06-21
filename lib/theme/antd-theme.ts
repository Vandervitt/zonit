// lib/theme/antd-theme.ts
// admin / super-admin 的 antd 主题（深青·明亮），与官网 --primary (#0d9488) 对齐。
// 单一来源：改这里即可全后台换肤。
import type { ThemeConfig } from "antd";
import { theme as antdTheme } from "antd";

const BRAND = "#0d9488"; // 深青，与官网 styles/theme.css 的 --primary 一致

export const adminTheme: ThemeConfig = {
  cssVar: true,
  hashed: false,
  token: {
    colorPrimary: BRAND,
    colorInfo: BRAND,
    colorSuccess: "#18c98c",
    colorWarning: "#f59e0b",
    colorError: "#ef4444",
    borderRadius: 10,
    fontFamily:
      'var(--font-body), ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    colorBgLayout: "#f6fafb",
    colorTextBase: "#334155",
  },
  components: {
    Layout: {
      siderBg: "#ffffff",
      headerBg: "#ffffff",
      bodyBg: "#f6fafb",
    },
    Menu: {
      itemSelectedBg: "#effefb",
      itemSelectedColor: BRAND,
      itemBorderRadius: 10,
    },
  },
};

// super-admin：深色 Sider 变体，复用同色系。
export const superAdminSiderTheme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: { colorPrimary: BRAND, borderRadius: 10 },
};
