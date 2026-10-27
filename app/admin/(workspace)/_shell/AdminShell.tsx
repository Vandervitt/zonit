"use client";

import { useState, createElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Layout, Menu, Tag, Dropdown, Avatar, Typography } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { BrandMark } from "@/components/brand/BrandMark";
import { ADMIN_NAV, resolveActiveNavKey } from "./nav";
import { FounderContact } from "./FounderContact";
import type { FounderContact as FounderContactData } from "@/lib/platform-settings";
import { PLANS, PLAN_ORDER } from "@/lib/plans";
import { Routes } from "@/lib/constants";
import { BRAND } from "@/lib/theme/brand";
import { useAdminT, useAdminLocale } from "@/lib/i18n/admin/context";
import { formatMonthDay } from "@/lib/i18n/admin";

const { Sider, Header, Content } = Layout;

export function AdminShell({
  children,
  founderContact,
}: {
  children: React.ReactNode;
  founderContact: FounderContactData;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const t = useAdminT();
  const locale = useAdminLocale();
  const { data: session } = useSession();
  const plan = session?.user?.plan ?? "free";
  // 赠送/试用档高于付费档时，标签明示来源与到期时间（点击进 billing 查看/升级）。
  const compPlan = session?.user?.compPlan ?? null;
  const paidPlan = session?.user?.paidPlan ?? "free";
  const compAbovePaid = compPlan !== null && PLAN_ORDER.indexOf(compPlan) > PLAN_ORDER.indexOf(paidPlan);
  const compExpiresAt = session?.user?.compPlanExpiresAt ?? null;

  const selectedKey = resolveActiveNavKey(pathname);

  // 菜单链接做完整预取（prefetch）：布局是 force-dynamic，默认 <Link> 对动态路由不预取，
  // 点击后要先等一次服务端往返（海外机房约 0.9s）画面才动，随后页面挂载再发 SWR 又一次往返。
  // 这些页面都是客户端组件，RSC 载荷只是组件引用、不含数据，预取后点击即切页，只剩取数那一次往返。
  const menuItems = ADMIN_NAV.map((i) => {
    const label = t.shell.nav[i.key];
    return {
      key: i.key,
      icon: createElement(i.icon),
      disabled: i.disabled,
      label: i.disabled
        ? <span>{label} <Tag color="blue" style={{ marginInlineStart: 6 }}>{i.badge}</Tag></span>
        : <Link href={i.href!} prefetch>{label}</Link>,
    };
  });

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light" width={224}
        style={{ borderInlineEnd: "1px solid #eef3f9" }}>
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 20px" }}>
            <BrandMark className="h-[30px] w-[30px] rounded-lg" />
            {!collapsed && <Typography.Text strong>Urgizat</Typography.Text>}
          </div>
          <Menu mode="inline" selectedKeys={[selectedKey]} items={menuItems}
            style={{ borderInlineEnd: 0, flex: 1 }} />
        </div>
      </Sider>
      <Layout>
        <Header style={{ display: "flex", alignItems: "center", justifyContent: "flex-end",
          gap: 12, paddingInline: 20, borderBlockEnd: "1px solid #eef3f9" }}>
          <FounderContact contact={founderContact} />
          {compAbovePaid ? (
            <Link href={Routes.Billing}>
              <Tag color="purple" style={{ cursor: "pointer" }}>
                {t.shell.trialTag(PLANS[plan].label)}
                {compExpiresAt ? t.shell.trialUntil(formatMonthDay(compExpiresAt, locale)) : ""}
              </Tag>
            </Link>
          ) : (
            <Tag color={plan === "free" ? "default" : "blue"}>{PLANS[plan].label}</Tag>
          )}
          <Dropdown menu={{ items: [
            { key: "out", icon: <LogoutOutlined />, label: t.shell.signOut,
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
