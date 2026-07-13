// lib/theme/antd-theme.ts
// admin / super-admin 的 antd 主题（清澈透亮蓝），与官网 --primary (#0e9fe4) 对齐。
// 单一来源：改这里即可全后台换肤。
import type { ThemeConfig } from "antd";
import { theme as antdTheme } from "antd";
import { BRAND } from "./brand"; // 单一来源，与 styles/theme.css 的 :root --primary 由单测断言一致

// 后台语义状态色单一来源：adminTheme token 与页面内联（删除红/成功绿/预警橙）共用。
// 组件勿再硬编码这些十六进制，统一从此处导入。
export const SEMANTIC = {
  success: "#16a34a",
  warning: "#f59e0b",
  error: "#ef4444",
} as const;

export const adminTheme: ThemeConfig = {
  cssVar: true,
  hashed: false,
  token: {
    colorPrimary: BRAND,
    colorInfo: BRAND,
    colorSuccess: SEMANTIC.success,
    colorWarning: SEMANTIC.warning,
    colorError: SEMANTIC.error,
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
