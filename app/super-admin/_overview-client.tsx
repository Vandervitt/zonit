"use client";

import { useRouter } from "next/navigation";
import { Row, Col, Card, Statistic, Tag, Typography, Space, Progress, Segmented } from "antd";
import { BRAND } from "@/lib/theme/brand";
import { SEMANTIC } from "@/lib/theme/antd-theme";
import { PLAN_ORDER, PLANS, type PlanId } from "@/lib/plans";
import type { DailyPoint } from "@/lib/super-admin/trend";
import type { FunnelStats, MilestoneEvent } from "@/lib/platform-milestones";
import { ratePercent, type StatsRange } from "@/lib/super-admin/metrics";
import { TrendCharts } from "./TrendCharts";
import { OpsHealth, type OpsHealthData } from "./OpsHealth";
import {
  UserOutlined,
  GlobalOutlined,
  CreditCardOutlined,
  GiftOutlined,
  RiseOutlined,
  FileTextOutlined,
  ContactsOutlined,
  FunnelPlotOutlined,
} from "@ant-design/icons";

export interface LatestPage {
  id: string;
  name: string;
  status: string;
  created_at: string;
  user_email: string;
}

export interface OverviewStats {
  range: StatsRange;
  totalUsers: number;
  internalUsers: number;
  totalPages: number;
  paidUsers: number;
  compUsers: number;
  /** 付费转化率（%，向下截断）；无外部用户时为 null。 */
  paidRate: number | null;
  totalLeads: number;
  planDist: Record<PlanId, number>;
  userTrend: DailyPoint[];
  leadTrend: DailyPoint[];
  latestPages: LatestPage[];
  funnel: FunnelStats;
  opsHealth: OpsHealthData;
}

const FUNNEL_STAGES: { event: MilestoneEvent; label: string }[] = [
  { event: "signup", label: "注册" },
  { event: "page_created", label: "创建落地页" },
  { event: "domain_verified", label: "域名验证" },
  { event: "page_published", label: "发布上线" },
  { event: "first_lead", label: "收到首条线索" },
];

function formatMedianHours(h: number | null): string {
  if (h == null) return "—";
  if (h < 1) return `${Math.round(h * 60)} 分钟`;
  if (h < 48) return `${h.toFixed(1)} 小时`;
  return `${(h / 24).toFixed(1)} 天`;
}

const RANGE_OPTIONS: { label: string; value: StatsRange }[] = [
  { label: "近 30 天注册", value: "30" },
  { label: "近 90 天注册", value: "90" },
  { label: "全部", value: "all" },
];

function ActivationFunnel({ funnel, range }: { funnel: FunnelStats; range: StatsRange }) {
  const router = useRouter();
  const signupCount = funnel.counts.signup;
  return (
    <Card
      title={
        <Space>
          <FunnelPlotOutlined />
          激活漏斗（按注册批次）
        </Space>
      }
      extra={
        <Space size={16}>
          <Typography.Text type="secondary">
            注册 → 首次发布中位耗时：{formatMedianHours(funnel.medianHoursToPublish)}
          </Typography.Text>
          <Segmented
            size="small"
            value={range}
            options={RANGE_OPTIONS}
            onChange={(v) => router.push(v === "30" ? "/super-admin" : `/super-admin?range=${v}`)}
          />
        </Space>
      }
      style={{ marginBottom: 24 }}
    >
      <Row gutter={[16, 16]}>
        {FUNNEL_STAGES.map((stage, i) => {
          const count = funnel.counts[stage.event];
          const prev = i === 0 ? null : funnel.counts[FUNNEL_STAGES[i - 1].event];
          const stepRate = prev == null ? null : ratePercent(count, prev, 0);
          const overallPct = ratePercent(count, signupCount, 0) ?? 0;
          return (
            <Col key={stage.event} xs={12} md={8} lg={Math.floor(24 / FUNNEL_STAGES.length)}>
              <Statistic
                title={stage.label}
                value={count}
                suffix={
                  stepRate != null ? (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      · 上一步 {stepRate}%
                    </Typography.Text>
                  ) : undefined
                }
              />
              <Progress percent={i === 0 ? 100 : overallPct} size="small" showInfo={false} style={{ marginTop: 4 }} />
            </Col>
          );
        })}
      </Row>
    </Card>
  );
}

export function SuperAdminOverview({ stats }: { stats: OverviewStats }) {
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
      title: "付费用户",
      value: stats.paidUsers,
      prefix: <CreditCardOutlined style={{ color: BRAND }} />,
      suffix: undefined as string | undefined,
    },
    {
      title: "赠送中（未付费）",
      value: stats.compUsers,
      prefix: <GiftOutlined style={{ color: SEMANTIC.warning }} />,
      suffix: undefined as string | undefined,
    },
    {
      title: "付费转化率",
      value: stats.paidRate ?? "—",
      prefix: <RiseOutlined style={{ color: SEMANTIC.warning }} />,
      suffix: stats.paidRate == null ? undefined : "%",
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
        <Typography.Text type="secondary">
          以下统计均已排除 {stats.internalUsers} 个内部账号（超管与标记为内部的测试号）
        </Typography.Text>
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

      {/* 运行健康：故障类信号放在业务数字之前，坏了要第一眼看到 */}
      <OpsHealth data={stats.opsHealth} />

      {/* 激活漏斗 */}
      <ActivationFunnel funnel={stats.funnel} range={stats.range} />

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
