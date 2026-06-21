"use client";

import type { PlanId } from "@/lib/plans";
import { UserRole } from "@/lib/constants";
import { PlanBadge } from "@/components/billing/PlanBadge";
import { Table, Tag, Typography, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import { InviteUserDialog } from "@/components/admin/InviteUserDialog";

interface UserRow {
  key: string;
  id: string;
  name: string;
  email: string;
  plan: PlanId;
  role: string;
  pageCount: number;
  invitedAt: string | null;
}

const columns: ColumnsType<UserRow> = [
  {
    title: "邮箱",
    key: "email",
    render: (_, row) => (
      <div>
        <Typography.Text strong style={{ display: "block", fontSize: 13 }}>
          {row.name || "—"}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {row.email}
        </Typography.Text>
      </div>
    ),
  },
  {
    title: "角色",
    dataIndex: "role",
    key: "role",
    render: (role: string) => (
      <Tag color={role === UserRole.SUPER_ADMIN ? "blue" : "default"}>
        {role === UserRole.SUPER_ADMIN ? "超管" : role}
      </Tag>
    ),
  },
  {
    title: "套餐",
    dataIndex: "plan",
    key: "plan",
    render: (plan: PlanId) => <PlanBadge plan={plan} />,
  },
  {
    title: "注册时间",
    dataIndex: "invitedAt",
    key: "invitedAt",
    render: (v: string | null) => (
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {v ?? "—"}
      </Typography.Text>
    ),
  },
  {
    title: "落地页数",
    dataIndex: "pageCount",
    key: "pageCount",
    align: "center" as const,
    render: (count: number) => (
      <Tag color="default">{count}</Tag>
    ),
  },
];

export function SuperAdminUsersClient({ rows }: { rows: UserRow[] }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <Typography.Title level={2} style={{ margin: 0 }}>
            用户管理
          </Typography.Title>
          <Typography.Text type="secondary">管理平台用户及其订阅套餐</Typography.Text>
        </div>
        <Space>
          <InviteUserDialog />
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={rows}
        rowKey="key"
        pagination={{ pageSize: 20, showSizeChanger: false }}
        size="middle"
      />
    </div>
  );
}
