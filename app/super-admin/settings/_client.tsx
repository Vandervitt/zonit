"use client";

import Link from "next/link";
import { Card, Table, Tag, Typography, Space, Alert } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { PlanId } from "@/lib/plans";
import { PlanBadge } from "@/components/billing/PlanBadge";
import { PlanComparison } from "@/components/billing/PlanComparison";
import type { FounderContact } from "@/lib/platform-settings";
import { PlatformHealth, type PlatformEnv } from "./PlatformHealth";
import { FounderContactForm } from "./FounderContactForm";
import { BillingProviderForm, type BillingProviderState } from "./BillingProviderForm";

export interface SuperAdminRow {
  id: string;
  email: string;
  effectivePlan: PlanId;
  disabled: boolean;
}

export interface SettingsData {
  env: PlatformEnv;
  admins: SuperAdminRow[];
  adminWhitelistCount: number;
  founderContact: FounderContact;
  billingProvider: BillingProviderState;
}

const adminColumns: ColumnsType<SuperAdminRow> = [
  {
    title: "邮箱",
    dataIndex: "email",
    key: "email",
    render: (email: string) => <Typography.Text strong style={{ fontSize: 13 }}>{email}</Typography.Text>,
  },
  {
    title: "生效套餐",
    dataIndex: "effectivePlan",
    key: "effectivePlan",
    render: (plan: PlanId) => <PlanBadge plan={plan} />,
  },
  {
    title: "状态",
    dataIndex: "disabled",
    key: "disabled",
    render: (disabled: boolean) =>
      disabled ? <Tag color="error">已禁用</Tag> : <Tag color="success">正常</Tag>,
  },
];

export function SuperAdminSettingsClient({ data }: { data: SettingsData }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={2} style={{ margin: 0 }}>平台设置</Typography.Title>
        <Typography.Text type="secondary">运营者的平台总览与配置参考</Typography.Text>
      </div>

      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <PlatformHealth env={data.env} />

        <BillingProviderForm initial={data.billingProvider} />

        <FounderContactForm initial={data.founderContact} />

        <Card title="超管成员">
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="超级管理员白名单由环境变量 ADMIN_EMAILS 控制"
            description={
              <Space direction="vertical" size={4}>
                <span>
                  白名单当前配置 {data.adminWhitelistCount} 个邮箱；匹配的账号登录时自动同步为超管角色。
                  增删超管请修改环境变量，不在此页面编辑。
                </span>
                <Link href="/super-admin/users">前往用户管理 →</Link>
              </Space>
            }
          />
          <Table
            columns={adminColumns}
            dataSource={data.admins}
            rowKey="id"
            pagination={false}
            size="middle"
          />
        </Card>

        <Card title="套餐与限额总览" extra={<Typography.Text type="secondary">只读参考 · 源自 lib/plans</Typography.Text>}>
          {/* 与营销站定价页同一个组件：运营看到的就是客户看到的。平台后台固定中文。 */}
          <PlanComparison locale="zh" />
        </Card>
      </Space>
    </div>
  );
}
