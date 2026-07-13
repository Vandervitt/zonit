// lib/theme/antd-theme.ts
// admin / super-admin 的 antd 主题（清澈透亮蓝），与官网 --primary (#0e9fe4) 对齐。
// 单一来源：改这里即可全后台换肤。
import type { ThemeConfig } from "antd";
import { theme as antdTheme } from "antd";
import { BRAND } from "./brand"; // 单一来源，与 styles/theme.css 的 :root --primary 由单测断言一致

export const adminTheme: ThemeConfig = {
  cssVar: true,
  hashed: false,
  token: {
    colorPrimary: BRAND,
    colorInfo: BRAND,
    colorSuccess: "#16a34a",
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
      itemSelectedBg: "#ecf8ff",
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
