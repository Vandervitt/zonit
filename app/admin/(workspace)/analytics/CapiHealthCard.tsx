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

interface HealthResponse {
  providers: CapiProviderHealth[];
  summary: CapiHealthSummary;
}

const PROVIDER_LABEL: Record<string, string> = { meta: "Meta", tiktok: "TikTok" };

const VERDICT: Record<CapiVerdict, { color: string; text: string }> = {
  idle: { color: "default", text: "无回传" },
  healthy: { color: "green", text: "正常" },
  degraded: { color: "orange", text: "有失败" },
  failing: { color: "red", text: "大量失败" },
};

export function CapiHealthCard({ days }: { days: number }) {
  const { data } = useSWR<HealthResponse>(`${ApiRoutes.CapiHealth}?days=${days}`);
  const summary = data?.summary;
  const providers = data?.providers ?? [];
  const verdict = summary?.verdict ?? "idle";

  // 最近一条可解释的失败原因——比「失败 12 次」更能让人动手修。
  const explained = providers
    .map((p) => ({ provider: p.provider, hint: explainCapiError(p.lastError), raw: p.lastError }))
    .find((p) => p.raw);

  return (
    <Card
      title="服务端回传（CAPI）"
      extra={<Tag color={VERDICT[verdict].color}>{VERDICT[verdict].text}</Tag>}
    >
      {verdict === "idle" ? (
        <Typography.Text type="secondary">
          该区间没有服务端回传记录。在<Link href={Routes.Settings}>设置</Link>里配置账号级凭据后，
          表单转化会从服务端直接送回平台，补上被拦截插件吃掉的那部分。
        </Typography.Text>
      ) : (
        <Space direction="vertical" size={14} style={{ width: "100%" }}>
          <Row gutter={16}>
            <Col xs={12} sm={6}><Statistic title="已送达" value={summary!.sent} /></Col>
            <Col xs={12} sm={6}><Statistic title="重试中" value={summary!.pending} /></Col>
            <Col xs={12} sm={6}><Statistic title="失败" value={summary!.failed} valueStyle={summary!.failed > 0 ? { color: "#cf1322" } : undefined} /></Col>
            <Col xs={12} sm={6}><Statistic title="送达率" value={summary!.deliveryRate * 100} precision={1} suffix="%" /></Col>
          </Row>

          {explained?.raw && (
            <Alert
              type={verdict === "failing" ? "error" : "warning"}
              showIcon
              message={`${PROVIDER_LABEL[explained.provider] ?? explained.provider} 最近一次失败`}
              description={
                <Space direction="vertical" size={2}>
                  {explained.hint && <span>{explained.hint}</span>}
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    平台返回：<Typography.Text code>{explained.raw}</Typography.Text>
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
              { title: "平台", dataIndex: "provider", width: 120, render: (p: string) => PROVIDER_LABEL[p] ?? p },
              { title: "已送达", dataIndex: "sent", width: 100 },
              { title: "重试中", dataIndex: "pending", width: 100 },
              { title: "失败", dataIndex: "failed", width: 90 },
              {
                title: "最近失败时间", dataIndex: "lastErrorAt",
                render: (t: string | null) => (t ? new Date(t).toLocaleString() : "—"),
              },
            ]}
          />

          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            送达率 = 已送达 /（已送达 + 失败）。重试中的事件尚未定局，不计入分母；
            连续失败到上限（5 次）才计为失败。
          </Typography.Text>
        </Space>
      )}
    </Card>
  );
}
