"use client";

import { Row, Col, Card, Statistic, Button, Tag, Typography, Space } from "antd";
import { BRAND } from "@/lib/theme/brand";
import { SEMANTIC } from "@/lib/theme/antd-theme";
import {
  UserOutlined,
  GlobalOutlined,
  CreditCardOutlined,
  RiseOutlined,
  FileTextOutlined,
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

      {/* 下半区：最新落地页 + CTA */}
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
          <Card
            style={{
              background: `linear-gradient(135deg, ${BRAND} 0%, #0c83bf 100%)`,
              border: "none",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            styles={{ body: { textAlign: "center", width: "100%" } }}
          >
            <Typography.Title level={4} style={{ color: "#fff", margin: "0 0 8px" }}>
              需要新的平台功能？
            </Typography.Title>
            <Typography.Paragraph style={{ color: "rgba(255,255,255,0.8)", marginBottom: 20 }}>
              可在此扩展管理模板、区块或全局系统设置。
            </Typography.Paragraph>
            <Button type="primary" ghost>
              查看文档
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
