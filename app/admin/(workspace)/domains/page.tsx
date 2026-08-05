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
import { useAdminT } from "@/lib/i18n/admin/context";

interface DomainRoute {
  path: string;
  landingPageId: string;
  landingPageName: string;
  published: boolean;
}

interface Domain {
  id: string;
  domain: string;
  landing_page_name?: string;
  enabled: boolean;
  verified: boolean;
  /** 平台分配的子域：免 DNS 配置，不占 domainsLimit。 */
  is_platform_subdomain?: boolean;
  created_at: string;
  routes?: DomainRoute[];
}

export default function DomainsPage() {
  const t = useAdminT().domains;
  const { data: session } = useSession();
  const [addOpen, setAddOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const currentPlan = (session?.user?.plan ?? "free") as PlanId;
  const domainsLimit = PLANS[currentPlan].domainsLimit;

  const domainsQuery = useSWR<Domain[]>(ApiRoutes.Domains);
  const domains = domainsQuery.data ?? [];
  // 与后端 getEnabledDomainCount 同口径：平台子域是平台资源，不占客户的域名槽位
  // （Free 的 domainsLimit 是 0，算进去会让刚领到子域的用户显示超限）。
  const enabledCount = domains.filter(d => d.enabled && !d.is_platform_subdomain).length;

  // 已验证域名的 DNS 配置健康（所有权验证通过 ≠ A/CNAME 已指向本平台）：
  // 列表加载后拉取一次，misconfigured 时在验证状态列亮橙标。
  // 排除平台子域：它们的 DNS 是平台自己的通配符记录，健康检查没有意义，
  // 查了反而会因为解析目标不是客户自有 A/CNAME 而误亮「未指向本平台」橙标。
  const verifiedIds = domains
    .filter(d => d.verified && !d.is_platform_subdomain)
    .map(d => d.id);
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
      title: t.columns.domain,
      dataIndex: "domain",
      key: "domain",
      render: (_: unknown, record: Domain) => {
        const live = (record.routes ?? []).filter((r) => r.published);
        // 根路径没有已发布页时，访客直接访问域名会 404（设计决策 D6：不回落到任意子页），
        // 这在多路径下很容易被忽略，故显式提示而不是留空。
        const rootMissing = live.length > 0 && !live.some((r) => r.path === "/");
        return (
          <div>
            <Typography.Text>{record.domain}</Typography.Text>
            <br />
            {live.length === 0 ? (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t.noPublishedPages}
              </Typography.Text>
            ) : (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {live.map((r) => r.path).join("、")}
              </Typography.Text>
            )}
            {rootMissing && (
              <>
                <br />
                <Typography.Text type="warning" style={{ fontSize: 12 }}>
                  {t.rootMissing(record.domain)}
                </Typography.Text>
              </>
            )}
          </div>
        );
      },
    },
    {
      title: t.columns.verification,
      key: "verified",
      width: 220,
      render: (_: unknown, record: Domain) =>
        record.verified ? (
          healthMap[record.id] === "misconfigured" ? (
            <Space size={4}>
              <Tag color="green">{t.verified}</Tag>
              <Tooltip title={t.dns.misconfiguredTooltip}>
                <Tag color="orange">{t.dns.misconfigured}</Tag>
              </Tooltip>
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined spin={healthQuery.isValidating} />}
                title={t.dns.recheck}
                onClick={() => void healthQuery.mutate()}
              />
            </Space>
          ) : (
            <Space size={4}>
              <Tag color="green">{t.verified}</Tag>
              {/* 健康检查 fail-open：unknown（接口异常）时不给「已正确配置」的虚假承诺 */}
              {healthMap[record.id] === "ok" ? (
                <Tooltip title={t.dns.okTooltip}>
                  <Tag color="green">{t.dns.ok}</Tag>
                </Tooltip>
              ) : null}
            </Space>
          )
        ) : (
          <Space size={4}>
            <Tag>{t.pending}</Tag>
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined spin={pendingCheckId === record.id} />}
              title={t.refreshVerification}
              onClick={() => handleCheckStatus(record)}
            />
          </Space>
        ),
    },
    {
      title: t.columns.enabled,
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
      title: t.columns.actions,
      key: "action",
      width: 80,
      render: (_: unknown, record: Domain) => (
        <Popconfirm
          title={t.deleteConfirm.title}
          okText={t.deleteConfirm.ok}
          cancelText={t.deleteConfirm.cancel}
          okButtonProps={{ danger: true }}
          onConfirm={() => deleteMutation.trigger(record)}
        >
          <a style={{ color: SEMANTIC.error }}>{t.delete}</a>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%", padding: "16px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>{t.title}</Typography.Title>
          <Typography.Text type="secondary">
            {t.enabledCount(enabledCount, domainsLimit === Infinity ? "" : `/${domainsLimit}`)}
          </Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
          {t.add}
        </Button>
      </div>

      <LoadErrorAlert error={domainsQuery.error} onRetry={() => void domainsQuery.mutate()} label={t.loadErrorLabel} />
      <Table<Domain>
        rowKey="id"
        dataSource={domains}
        columns={columns}
        loading={domainsQuery.isLoading}
        pagination={false}
        locale={{
          emptyText: (
            <Empty description={t.empty} style={{ margin: "48px 0" }} />
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
