"use client";

import { SessionProvider } from "next-auth/react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import "@ant-design/v5-patch-for-react-19";
import { adminTheme } from "@/lib/theme/antd-theme";

// SessionProvider 在此（super-admin 子树需要 useSession）；同 AdminProviders。
export function SuperAdminProviders({ children }: { children: React.ReactNode }) {
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
