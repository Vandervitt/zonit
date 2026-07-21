"use client";

import { SessionProvider } from "next-auth/react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import "@ant-design/v5-patch-for-react-19";
import { adminTheme } from "@/lib/theme/antd-theme";

// SessionProvider 在此（admin 子树需要 useSession）；根 layout 不再全局提供，
// 避免公开落地页无谓拉取 /api/auth/session。
export function AdminProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AntdRegistry>
        <ConfigProvider theme={adminTheme} locale={zhCN}>
          <App>{children}</App>
        </ConfigProvider>
      </AntdRegistry>
    </SessionProvider>
  );
}
