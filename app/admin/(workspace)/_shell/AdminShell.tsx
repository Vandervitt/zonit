"use client";

import { useState, createElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Layout, Menu, Tag, Dropdown, Avatar, Typography } from "antd";
import { ThunderboltFilled, LogoutOutlined } from "@ant-design/icons";
import { ADMIN_NAV, resolveActiveNavKey } from "./nav";
import { PLANS } from "@/lib/plans";
import { BRAND } from "@/lib/theme/brand";

const { Sider, Header, Content } = Layout;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const plan = session?.user?.plan ?? "free";

  const selectedKey = resolveActiveNavKey(pathname);

  const menuItems = ADMIN_NAV.map((i) => ({
    key: i.key,
    icon: createElement(i.icon),
    disabled: i.disabled,
    label: i.disabled
      ? <span>{i.label} <Tag color="blue" style={{ marginInlineStart: 6 }}>{i.badge}</Tag></span>
      : <Link href={i.href!}>{i.label}</Link>,
  }));

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light" width={224}
        style={{ borderInlineEnd: "1px solid #eef3f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 20px" }}>
          <span style={{ display: "grid", placeItems: "center", width: 30, height: 30,
            borderRadius: 8, background: BRAND, color: "#fff" }}>
            <ThunderboltFilled />
          </span>
          {!collapsed && <Typography.Text strong>Zap Bridge</Typography.Text>}
        </div>
        <Menu mode="inline" selectedKeys={[selectedKey]} items={menuItems} style={{ borderInlineEnd: 0 }} />
      </Sider>
      <Layout>
        <Header style={{ display: "flex", alignItems: "center", justifyContent: "flex-end",
          gap: 12, paddingInline: 20, borderBlockEnd: "1px solid #eef3f9" }}>
          <Tag color={plan === "free" ? "default" : "blue"}>{PLANS[plan].label}</Tag>
          <Dropdown menu={{ items: [
            { key: "out", icon: <LogoutOutlined />, label: "退出登录",
              onClick: () => signOut({ callbackUrl: "/login" }) },
          ]}}>
            <Avatar src={session?.user?.image ?? undefined} style={{ background: BRAND, cursor: "pointer" }}>
              {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
            </Avatar>
          </Dropdown>
        </Header>
        <Content style={{ padding: 24 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
