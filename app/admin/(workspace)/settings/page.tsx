"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, Descriptions, Typography, Space, Tag, Button } from "antd";
import { Routes } from "@/lib/constants";
import { PLANS, type PlanId } from "@/lib/plans";

export default function SettingsPage() {
  const { data: session } = useSession();
  const plan = (session?.user?.plan ?? "free") as PlanId;
  return (
    <Space direction="vertical" size={20} style={{ width: "100%", maxWidth: 720 }}>
      <Typography.Title level={3} style={{ margin: 0 }}>设置</Typography.Title>
      <Card title="个人资料">
        <Descriptions column={1}>
          <Descriptions.Item label="昵称">{session?.user?.name ?? "—"}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{session?.user?.email ?? "—"}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="账户" extra={<Link href={Routes.Billing}><Button type="link">管理</Button></Link>}>
        <Space><span>当前套餐</span><Tag color={plan === "free" ? "default" : "blue"}>{PLANS[plan].label}</Tag></Space>
      </Card>
    </Space>
  );
}
