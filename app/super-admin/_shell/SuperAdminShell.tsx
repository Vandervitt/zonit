"use client";

import { createElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Layout, Menu, Typography, Button, ConfigProvider } from "antd";
import {
  DashboardOutlined,
  TeamOutlined,
  SettingOutlined,
  SafetyOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { superAdminSiderTheme } from "@/lib/theme/antd-theme";
import { BRAND } from "@/lib/theme/brand";

const { Sider, Header, Content } = Layout;

const NAV = [
  { key: "/super-admin", icon: DashboardOutlined, label: "概览" },
  { key: "/super-admin/users", icon: TeamOutlined, label: "用户" },
  { key: "/super-admin/settings", icon: SettingOutlined, label: "平台设置" },
] as const;

export function SuperAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const selectedKey =
    NAV.slice()
      .reverse()
      .find((i) => pathname === i.key || pathname.startsWith(i.key + "/"))?.key ?? "/super-admin";

  const menuItems = NAV.map((i) => ({
    key: i.key,
    icon: createElement(i.icon),
    label: <Link href={i.key}>{i.label}</Link>,
  }));

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* 深色 Sider：用独立 dark theme 包裹 */}
      <ConfigProvider theme={superAdminSiderTheme}>
        <Sider
          theme="dark"
          width={220}
          style={{ position: "sticky", top: 0, height: "100vh", overflow: "auto" }}
        >
          {/* Logo 区 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "18px 20px 14px",
            }}
          >
            <span
              style={{
                display: "grid",
                placeItems: "center",
                width: 32,
                height: 32,
                borderRadius: 8,
                background: BRAND,
                color: "#fff",
                fontSize: 16,
              }}
            >
              <SafetyOutlined />
            </span>
            <div style={{ lineHeight: 1.2 }}>
              <Typography.Text
                strong
                style={{ color: "#fff", display: "block", fontSize: 13, letterSpacing: "0.04em" }}
              >
                ZAP BRIDGE ADMIN
              </Typography.Text>
              <Typography.Text
                style={{
                  color: BRAND,
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Management
              </Typography.Text>
            </div>
          </div>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            style={{ borderInlineEnd: 0, marginTop: 4 }}
          />
        </Sider>
      </ConfigProvider>

      {/* 右侧主区域：使用外层浅色主题 */}
      <Layout>
        <Header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 12,
            paddingInline: 24,
            background: "#fff",
            borderBlockEnd: "1px solid #eef3f9",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <Typography.Text type="secondary" style={{ fontSize: 10, lineHeight: 1.2 }}>
              Operator
            </Typography.Text>
            <Typography.Text style={{ fontSize: 12 }}>
              {session?.user?.email ?? "—"}
            </Typography.Text>
          </div>
          <Button
            icon={<LogoutOutlined />}
            onClick={() => void signOut({ callbackUrl: "/" })}
            size="small"
          >
            退出
          </Button>
        </Header>
        <Content style={{ padding: 24 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
