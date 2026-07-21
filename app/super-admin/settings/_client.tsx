"use client";

import Link from "next/link";
import { Card, Table, Tag, Typography, Space, Alert, Button } from "antd";
import { CheckCircleTwoTone, CloseOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { PLANS, PLAN_ORDER, PLAN_FEATURE_ROWS, type PlanId } from "@/lib/plans";
import { SEMANTIC } from "@/lib/theme/antd-theme";
import { PlanBadge } from "@/components/billing/PlanBadge";
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

function FeatureCell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <CheckCircleTwoTone twoToneColor={SEMANTIC.success} />
    ) : (
      <CloseOutlined style={{ color: "rgba(0,0,0,0.22)" }} />
    );
  }
  return <Typography.Text style={{ fontSize: 13 }}>{value}</Typography.Text>;
}

interface PlanTableRow {
  key: string;
  label: string;
  desc: string;
  values: Record<PlanId, string | boolean>;
}

const planRows: PlanTableRow[] = PLAN_FEATURE_ROWS.map((row) => ({
  key: row.label,
  label: row.label,
  desc: row.desc,
  values: Object.fromEntries(
    PLAN_ORDER.map((p) => [p, row.valueFor(PLANS[p])]),
  ) as Record<PlanId, string | boolean>,
}));

const planColumns: ColumnsType<PlanTableRow> = [
  {
    title: "权益",
    dataIndex: "label",
    key: "label",
    fixed: "left",
    width: 180,
    render: (label: string, row) => (
      <div>
        <Typography.Text strong style={{ display: "block", fontSize: 13 }}>{label}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>{row.desc}</Typography.Text>
      </div>
    ),
  },
  ...PLAN_ORDER.map((p) => ({
    key: p,
    align: "center" as const,
    onCell: () => (PLANS[p].highlight ? { style: { background: "#f0f9ff" } } : {}),
    title: (
      <Space direction="vertical" size={0}>
        <span>{PLANS[p].label}</span>
        <Typography.Text type="secondary" style={{ fontSize: 11, fontWeight: 400 }}>
          {PLANS[p].priceText}
        </Typography.Text>
      </Space>
    ),
    render: (_: unknown, row: PlanTableRow) => <FeatureCell value={row.values[p]} />,
  })),
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
          <Table
            columns={planColumns}
            dataSource={planRows}
            rowKey="key"
            pagination={false}
            size="small"
            scroll={{ x: 720 }}
          />
        </Card>
      </Space>
    </div>
  );
}
