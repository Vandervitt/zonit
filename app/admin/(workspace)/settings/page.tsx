"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, Descriptions, Typography, Space, Tag, Button } from "antd";
import { Routes } from "@/lib/constants";
import { PLANS, type PlanId } from "@/lib/plans";
import { LeadNotificationSettings } from "./LeadNotificationSettings";
import { CompanyProfiles } from "./CompanyProfiles";
import { CapiCredentials } from "./CapiCredentials";
import { LanguageSettings } from "./LanguageSettings";
import { useAdminT } from "@/lib/i18n/admin/context";

export default function SettingsPage() {
  const { data: session } = useSession();
  const t = useAdminT();
  const plan = (session?.user?.plan ?? "free") as PlanId;
  return (
    <Space direction="vertical" size={20} style={{ width: "100%", maxWidth: 720 }}>
      <Typography.Title level={3} style={{ margin: 0 }}>{t.settings.title}</Typography.Title>
      <Card title={t.settings.profile.title}>
        <Descriptions column={1}>
          <Descriptions.Item label={t.settings.profile.name}>{session?.user?.name ?? "—"}</Descriptions.Item>
          <Descriptions.Item label={t.settings.profile.email}>{session?.user?.email ?? "—"}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card
        title={t.settings.account.title}
        extra={<Link href={Routes.Billing}><Button type="link">{t.settings.account.manage}</Button></Link>}
      >
        <Space>
          <span>{t.settings.account.currentPlan}</span>
          <Tag color={plan === "free" ? "default" : "blue"}>{PLANS[plan].label}</Tag>
        </Space>
      </Card>
      <LanguageSettings />
      <CompanyProfiles />
      <CapiCredentials />
      <LeadNotificationSettings />
    </Space>
  );
}
