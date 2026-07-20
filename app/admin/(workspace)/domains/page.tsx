"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { Table, Button, Tag, Switch, Popconfirm, Typography, Empty, Space, Tooltip } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { AddDomainDialog } from "@/components/domains/AddDomainDialog";
import { UpgradeDialog } from "@/components/billing/UpgradeDialog";
import { ApiRoutes, apiDomainPath, apiDomainStatusPath } from "@/lib/constants";
import { jsonRequest, fetcher } from "@/lib/api/fetcher";
import { useMutation } from "@/lib/api/use-mutation";
import { SEMANTIC } from "@/lib/theme/antd-theme";
import { PLANS } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import type { TableColumnsType } from "antd";
import { LoadErrorAlert } from "../_shell/LoadErrorAlert";

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

  // 已验证域名的 DNS 配置健康（所有权验证通过 ≠ A/CNAME 已指向本平台）：
  // 列表加载后拉取一次，misconfigured 时在验证状态列亮橙标。
  const verifiedIds = domains.filter(d => d.verified).map(d => d.id);
  const healthQuery = useSWR<Record<string, string>>(
    verifiedIds.length > 0 ? [ApiRoutes.Domains, "health", verifiedIds.join(",")] : null,
    async () => {
      const entries = await Promise.all(
        verifiedIds.map(async (id) => {
          try {
            const { health } = await fetcher<{ health?: string }>(apiDomainStatusPath(id));
            return [id, health ?? "unknown"] as const;
          } catch {
            return [id, "unknown"] as const;
          }
        }),
      );
      return Object.fromEntries(entries);
    },
    { revalidateOnFocus: false },
  );
  const healthMap = healthQuery.data ?? {};

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
      width: 220,
      render: (_: unknown, record: Domain) =>
        record.verified ? (
          healthMap[record.id] === "misconfigured" ? (
            <Space size={4}>
              <Tag color="green">已验证</Tag>
              <Tooltip title="域名所有权已验证，但 DNS 记录配置不正确，访客访问该域名看不到你的落地页。请到 DNS 服务商检查 A/CNAME 记录。">
                <Tag color="orange">DNS 未正确配置</Tag>
              </Tooltip>
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined spin={healthQuery.isValidating} />}
                title="重新检测 DNS 配置"
                onClick={() => void healthQuery.mutate()}
              />
            </Space>
          ) : (
            <Space size={4}>
              <Tag color="green">已验证</Tag>
              {/* 健康检查 fail-open：unknown（接口异常）时不给「已正确配置」的虚假承诺 */}
              {healthMap[record.id] === "ok" ? (
                <Tooltip title="域名所有权已验证，且 DNS 记录已正确指向，访客可以正常访问你的落地页。">
                  <Tag color="green">DNS 已正确配置</Tag>
                </Tooltip>
              ) : null}
            </Space>
          )
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
          <a style={{ color: SEMANTIC.error }}>删除</a>
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

      <LoadErrorAlert error={domainsQuery.error} onRetry={() => void domainsQuery.mutate()} label="域名列表" />
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
