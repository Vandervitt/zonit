"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { Table, Button, Tag, Switch, Popconfirm, Typography, Empty, Space, App } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { AddDomainDialog } from "@/components/domains/AddDomainDialog";
import { UpgradeDialog } from "@/components/billing/UpgradeDialog";
import { ApiRoutes, apiDomainPath, apiDomainStatusPath } from "@/lib/constants";
import { jsonRequest, fetcher } from "@/lib/api/fetcher";
import { useMutation } from "@/lib/api/use-mutation";
import { PLANS } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import type { TableColumnsType } from "antd";

interface Domain {
  id: string;
  domain: string;
  landing_page_name?: string;
  enabled: boolean;
  verified: boolean;
  created_at: string;
}

export default function DomainsPage() {
  const { data: session } = useSession();
  const [addOpen, setAddOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const currentPlan = (session?.user?.plan ?? "free") as PlanId;
  const domainsLimit = PLANS[currentPlan].domainsLimit;

  const domainsQuery = useSWR<Domain[]>(ApiRoutes.Domains);
  const domains = domainsQuery.data ?? [];
  const enabledCount = domains.filter(d => d.enabled).length;

  // 后台轮询所有未验证的域名（每 5s）；命中已验证后立刻刷新整张列表
  const hasUnverified = domains.some(d => !d.verified);
  useSWR(
    hasUnverified ? [ApiRoutes.Domains, "poll"] : null,
    async () => {
      const unverified = domains.filter(d => !d.verified);
      const results = await Promise.all(
        unverified.map(async (d) => {
          const { status } = await fetcher<{ status: string }>(apiDomainStatusPath(d.id));
          return { id: d.id, verified: status === "verified" };
        }),
      );
      if (results.some(r => r.verified)) void domainsQuery.mutate();
    },
    { refreshInterval: 5000 },
  );

  const toggleMutation = useMutation(
    (d: Domain) => jsonRequest(apiDomainPath(d.id), "PATCH", { enabled: !d.enabled }),
    { onSuccess: () => { void domainsQuery.mutate(); } },
  );

  const deleteMutation = useMutation(
    (d: Domain) => jsonRequest(apiDomainPath(d.id), "DELETE"),
    { onSuccess: () => { void domainsQuery.mutate(); } },
  );

  const checkStatusMutation = useMutation(
    (d: Domain) => fetcher<{ status: string }>(apiDomainStatusPath(d.id)),
    { onSuccess: (res) => { if (res.status === "verified") { void domainsQuery.mutate(); } } },
  );

  const [pendingCheckId, setPendingCheckId] = useState<string | null>(null);

  function handleToggle(domain: Domain) {
    if (!domain.enabled && domainsLimit !== Infinity && enabledCount >= domainsLimit) {
      setUpgradeOpen(true);
      return;
    }
    void toggleMutation.trigger(domain);
  }

  async function handleCheckStatus(domain: Domain) {
    setPendingCheckId(domain.id);
    await checkStatusMutation.trigger(domain);
    setPendingCheckId(null);
  }

  const columns: TableColumnsType<Domain> = [
    {
      title: "域名",
      dataIndex: "domain",
      key: "domain",
      render: (_: unknown, record: Domain) => (
        <div>
          <Typography.Text>{record.domain}</Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.landing_page_name ?? "未绑定落地页"}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "验证状态",
      key: "verified",
      width: 160,
      render: (_: unknown, record: Domain) =>
        record.verified ? (
          <Tag color="green">已验证</Tag>
        ) : (
          <Space size={4}>
            <Tag>待验证</Tag>
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined spin={pendingCheckId === record.id} />}
              title="刷新验证状态"
              onClick={() => handleCheckStatus(record)}
            />
          </Space>
        ),
    },
    {
      title: "启用",
      key: "enabled",
      width: 80,
      render: (_: unknown, record: Domain) => (
        <Switch
          checked={record.enabled}
          onChange={() => handleToggle(record)}
          loading={toggleMutation.isMutating}
        />
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 80,
      render: (_: unknown, record: Domain) => (
        <Popconfirm
          title="确认删除该域名？"
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
          onConfirm={() => deleteMutation.trigger(record)}
        >
          <a style={{ color: "#ef4444" }}>删除</a>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%", padding: "16px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>域名</Typography.Title>
          <Typography.Text type="secondary">
            已启用 {enabledCount}{domainsLimit === Infinity ? "" : `/${domainsLimit}`} 个域名
          </Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
          添加域名
        </Button>
      </div>

      <Table<Domain>
        rowKey="id"
        dataSource={domains}
        columns={columns}
        loading={domainsQuery.isLoading}
        pagination={false}
        locale={{
          emptyText: (
            <Empty description="还没有绑定任何域名" style={{ margin: "48px 0" }} />
          ),
        }}
      />

      <AddDomainDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdded={() => domainsQuery.mutate()}
      />
      <UpgradeDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        currentPlan={currentPlan}
      />
    </Space>
  );
}
