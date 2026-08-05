"use client";
// 服务端回传（CAPI）健康度。
//
// 为什么这块必须可见：CAPI 配好之后是纯服务端行为，落地页上看不出任何迹象。
// 不给状态的话，token 过期、Dataset 填错会一直静默失败，而用户只能靠广告后台的
// 转化数变少才发现——那时预算已经按错误的信号烧了几周。

import useSWR from "swr";
import Link from "next/link";
import { Card, Table, Tag, Space, Typography, Alert, Statistic, Row, Col } from "antd";
import { ApiRoutes, Routes } from "@/lib/constants";
import type { CapiProviderHealth, CapiHealthSummary, CapiVerdict } from "@/lib/capi/health";
import { explainCapiError } from "@/lib/capi/health";
import { useAdminT, useAdminLocale } from "@/lib/i18n/admin/context";
import { formatDateTime } from "@/lib/i18n/admin";

interface HealthResponse {
  providers: CapiProviderHealth[];
  summary: CapiHealthSummary;
}

const PROVIDER_LABEL: Record<string, string> = { meta: "Meta", tiktok: "TikTok" };

/** 判定色。文案在字典的 analytics.capiHealth.verdict（同名 key）。 */
const VERDICT_COLOR: Record<CapiVerdict, string> = {
  idle: "default",
  healthy: "green",
  degraded: "orange",
  failing: "red",
};

export function CapiHealthCard({ rangeQuery }: { rangeQuery: string }) {
  const t = useAdminT().analytics.capiHealth;
  const locale = useAdminLocale();
  const { data } = useSWR<HealthResponse>(`${ApiRoutes.CapiHealth}?${rangeQuery}`);
  const summary = data?.summary;
  const providers = data?.providers ?? [];
  const verdict = summary?.verdict ?? "idle";

  // 最近一条可解释的失败原因——比「失败 12 次」更能让人动手修。
  const explained = providers
    .map((p) => ({ provider: p.provider, reason: explainCapiError(p.lastError), raw: p.lastError }))
    .find((p) => p.raw);

  return (
    <Card
      title={t.title}
      extra={<Tag color={VERDICT_COLOR[verdict]}>{t.verdict[verdict]}</Tag>}
    >
      {verdict === "idle" ? (
        <Typography.Text type="secondary">
          {t.idleHint[0]}<Link href={Routes.Settings}>{t.settingsLink}</Link>{t.idleHint[1]}
        </Typography.Text>
      ) : (
        <Space direction="vertical" size={14} style={{ width: "100%" }}>
          <Row gutter={16}>
            <Col xs={12} sm={6}><Statistic title={t.sent} value={summary!.sent} /></Col>
            <Col xs={12} sm={6}><Statistic title={t.pending} value={summary!.pending} /></Col>
            <Col xs={12} sm={6}><Statistic title={t.failed} value={summary!.failed} valueStyle={summary!.failed > 0 ? { color: "#cf1322" } : undefined} /></Col>
            <Col xs={12} sm={6}><Statistic title={t.deliveryRate} value={summary!.deliveryRate * 100} precision={1} suffix="%" /></Col>
          </Row>

          {explained?.raw && (
            <Alert
              type={verdict === "failing" ? "error" : "warning"}
              showIcon
              message={t.lastFailure(PROVIDER_LABEL[explained.provider] ?? explained.provider)}
              description={
                <Space direction="vertical" size={2}>
                  {explained.reason && <span>{t.reasons[explained.reason]}</span>}
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {t.platformReturned}<Typography.Text code>{explained.raw}</Typography.Text>
                  </Typography.Text>
                </Space>
              }
            />
          )}

          <Table<CapiProviderHealth>
            rowKey="provider"
            size="small"
            pagination={false}
            dataSource={providers}
            columns={[
              { title: t.columns.provider, dataIndex: "provider", width: 120, render: (p: string) => PROVIDER_LABEL[p] ?? p },
              { title: t.columns.sent, dataIndex: "sent", width: 100 },
              { title: t.columns.pending, dataIndex: "pending", width: 100 },
              { title: t.columns.failed, dataIndex: "failed", width: 90 },
              {
                title: t.columns.lastErrorAt, dataIndex: "lastErrorAt",
                render: (value: string | null) => (value ? formatDateTime(value, locale) : "—"),
              },
            ]}
          />

          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {t.note}
          </Typography.Text>
        </Space>
      )}
    </Card>
  );
}
