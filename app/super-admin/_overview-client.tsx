"use client";

import { Row, Col, Card, Statistic, Tag, Typography, Space } from "antd";
import { BRAND } from "@/lib/theme/brand";
import { SEMANTIC } from "@/lib/theme/antd-theme";
import { PLAN_ORDER, PLANS, type PlanId } from "@/lib/plans";
import type { DailyPoint } from "@/lib/super-admin/trend";
import { TrendCharts } from "./TrendCharts";
import {
  UserOutlined,
  GlobalOutlined,
  CreditCardOutlined,
  RiseOutlined,
  FileTextOutlined,
  ContactsOutlined,
} from "@ant-design/icons";

export interface LatestPage {
  id: string;
  name: string;
  status: string;
  created_at: string;
  user_email: string;
}

export interface OverviewStats {
  totalUsers: number;
  totalPages: number;
  activeSubs: number;
  totalLeads: number;
  planDist: Record<PlanId, number>;
  userTrend: DailyPoint[];
  leadTrend: DailyPoint[];
  latestPages: LatestPage[];
}

export function SuperAdminOverview({ stats }: { stats: OverviewStats }) {
  const conversionRate = ((stats.activeSubs / (stats.totalUsers || 1)) * 100).toFixed(1);

  const statCards = [
    {
      title: "总用户数",
      value: stats.totalUsers,
      prefix: <UserOutlined style={{ color: BRAND }} />,
      suffix: undefined as string | undefined,
    },
    {
      title: "落地页总数",
      value: stats.totalPages,
      prefix: <GlobalOutlined style={{ color: SEMANTIC.success }} />,
      suffix: undefined as string | undefined,
    },
    {
      title: "付费订阅",
      value: stats.activeSubs,
      prefix: <CreditCardOutlined style={{ color: BRAND }} />,
      suffix: undefined as string | undefined,
    },
    {
      title: "转化率",
      value: parseFloat(conversionRate),
      prefix: <RiseOutlined style={{ color: SEMANTIC.warning }} />,
      suffix: "%",
    },
    {
      title: "线索总量",
      value: stats.totalLeads,
      prefix: <ContactsOutlined style={{ color: SEMANTIC.success }} />,
      suffix: undefined as string | undefined,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          平台概览
        </Typography.Title>
        <Typography.Text type="secondary">实时平台运营指标与最新动态</Typography.Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card) => (
          <Col key={card.title} xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={card.title}
                value={card.value}
                prefix={card.prefix}
                suffix={card.suffix}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 近 30 天趋势图 */}
      <TrendCharts userTrend={stats.userTrend} leadTrend={stats.leadTrend} />

      {/* 下半区：最新落地页 + 套餐分布 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Card
            title={
              <Space>
                <FileTextOutlined />
                最新创建的落地页
              </Space>
            }
          >
            {stats.latestPages.length === 0 ? (
              <Typography.Text type="secondary">暂无数据</Typography.Text>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {stats.latestPages.map((site) => (
                  <div
                    key={site.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "#f6fafb",
                      border: "1px solid #e6f7f5",
                    }}
                  >
                    <div>
                      <Typography.Text strong style={{ display: "block", fontSize: 13 }}>
                        {site.name}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {site.user_email}
                      </Typography.Text>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Tag color={site.status === "published" ? "success" : "default"}>
                        {site.status}
                      </Tag>
                      <Typography.Text
                        type="secondary"
                        style={{ display: "block", fontSize: 11, marginTop: 4 }}
                      >
                        {new Date(site.created_at).toLocaleDateString("zh-CN")}
                      </Typography.Text>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card title="套餐分布（生效口径）">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {PLAN_ORDER.map((p) => (
                <div key={p} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography.Text>{PLANS[p].label}</Typography.Text>
                  <Typography.Text strong>{stats.planDist[p]}</Typography.Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
