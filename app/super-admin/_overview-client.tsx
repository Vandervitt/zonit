"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Row, Col, Card, Statistic, Typography, Space, Progress, Segmented, Tooltip } from "antd";
import { SEMANTIC } from "@/lib/theme/antd-theme";
import { PLAN_ORDER, PLANS, type PlanId } from "@/lib/plans";
import type { DailyPoint } from "@/lib/super-admin/trend";
import type { FunnelStats, MilestoneEvent } from "@/lib/platform-milestones";
import { ratePercent, type StatsRange } from "@/lib/super-admin/metrics";
import type { OpsView } from "@/lib/super-admin/user-ops";
import { TrendCharts } from "./TrendCharts";
import { OpsHealth, type OpsHealthData } from "./OpsHealth";
import { FunnelPlotOutlined, InfoCircleOutlined } from "@ant-design/icons";

export interface OverviewKpi {
  newThis: number;
  /** 新注册周环比（%）；上周为 0 时 null。 */
  newWow: number | null;
  /** 7 天激活率（%）：7–14 天前注册的人里，注册后 7 天内首次发布的占比。 */
  activationThis: number | null;
  activationBase: number;
  /** 激活率较上一批的百分点差。 */
  activationDelta: number | null;
  wau: number;
  /** 首线索到达率（%）：已发布用户中收到过线索的占比。 */
  firstLeadRate: number | null;
  published: number;
  withLead: number;
}

export interface OverviewStats {
  range: StatsRange;
  totalUsers: number;
  internalUsers: number;
  paidUsers: number;
  compUsers: number;
  /** 付费转化率（%，向下截断）；无外部用户时为 null。 */
  paidRate: number | null;
  totalLeads: number;
  kpi: OverviewKpi;
  planDist: Record<PlanId, number>;
  userTrend: DailyPoint[];
  leadTrend: DailyPoint[];
  funnel: FunnelStats;
  opsHealth: OpsHealthData;
}

// from：转化率的分母阶段。域名验证不是必经步骤（平台子域可直接发布），
// 所以「发布上线」要和「创建落地页」比，不能和排在它前面的「域名验证」比。
// dropView：没走到这一步的人对应用户页的哪个待办视图；没有对应视图的阶段不可点。
const FUNNEL_STAGES: { event: MilestoneEvent; label: string; from?: MilestoneEvent; dropView?: OpsView; dropHint?: string }[] = [
  { event: "signup", label: "注册" },
  { event: "page_created", label: "创建落地页", from: "signup", dropView: "stuck_no_page", dropHint: "查看注册 3 天仍未建页的用户" },
  { event: "domain_verified", label: "域名验证（可选）", from: "page_created" },
  { event: "page_published", label: "发布上线", from: "page_created" },
  { event: "first_lead", label: "收到首条线索", from: "page_published", dropView: "published_no_lead", dropHint: "查看发布 7 天仍无线索的用户" },
];

const RANGE_OPTIONS: { label: string; value: StatsRange }[] = [
  { label: "近 30 天注册", value: "30" },
  { label: "近 90 天注册", value: "90" },
  { label: "全部", value: "all" },
];

function formatMedianHours(h: number | null): string {
  if (h == null) return "—";
  if (h < 1) return `${Math.floor(h * 60)} 分钟`;
  if (h < 48) return `${Math.floor(h * 10) / 10} 小时`;
  return `${Math.floor((h / 24) * 10) / 10} 天`;
}

function Delta({ value, unit }: { value: number | null; unit: string }) {
  if (value == null) return <Typography.Text type="secondary" style={{ fontSize: 12 }}>上期无数据</Typography.Text>;
  const color = value > 0 ? SEMANTIC.success : value < 0 ? SEMANTIC.error : undefined;
  return (
    <Typography.Text style={{ fontSize: 12, color }}>
      {value > 0 ? "↑" : value < 0 ? "↓" : "持平"} {value !== 0 && `${Math.abs(value)}${unit}`}
    </Typography.Text>
  );
}

function KpiCard({ title, hint, value, suffix, footer }: {
  title: string; hint: string; value: number | string; suffix?: string; footer: React.ReactNode;
}) {
  return (
    <Card style={{ height: "100%" }}>
      <Statistic
        title={<Space size={4}>{title}<Tooltip title={hint}><InfoCircleOutlined /></Tooltip></Space>}
        value={value}
        suffix={suffix}
      />
      <div style={{ marginTop: 4 }}>{footer}</div>
    </Card>
  );
}

function ActivationFunnel({ funnel, range }: { funnel: FunnelStats; range: StatsRange }) {
  const router = useRouter();
  const signupCount = funnel.counts.signup;
  return (
    <Card
      title={<Space><FunnelPlotOutlined />激活漏斗（按注册批次）</Space>}
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
          const stepRate = stage.from ? ratePercent(count, funnel.counts[stage.from], 0) : null;
          const overallPct = ratePercent(count, signupCount, 0) ?? 0;
          return (
            <Col key={stage.event} xs={12} md={8} lg={Math.floor(24 / FUNNEL_STAGES.length)}>
              <Statistic
                title={stage.label}
                value={count}
                suffix={
                  stepRate != null ? (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      · 占{FUNNEL_STAGES.find((x) => x.event === stage.from)?.label} {stepRate}%
                    </Typography.Text>
                  ) : undefined
                }
              />
              <Progress percent={i === 0 ? 100 : overallPct} size="small" showInfo={false} style={{ marginTop: 4 }} />
              {stage.dropView && (
                <Link href={`/super-admin/users?view=${stage.dropView}`} style={{ fontSize: 12 }}>
                  {stage.dropHint} →
                </Link>
              )}
            </Col>
          );
        })}
      </Row>
    </Card>
  );
}

export function SuperAdminOverview({ stats }: { stats: OverviewStats }) {
  const { kpi } = stats;
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={2} style={{ margin: 0 }}>平台概览</Typography.Title>
        <Typography.Text type="secondary">
          以下统计均已排除 {stats.internalUsers} 个内部账号（超管与标记为内部的测试号）
        </Typography.Text>
      </div>

      {/* 本周关键指标：都是「比上周好还是差」的问题，累计总量放到下面的小字里 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="近 7 天新注册"
            hint="与再往前 7 天对比"
            value={kpi.newThis}
            footer={<Delta value={kpi.newWow} unit="%" />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="7 天激活率"
            hint="7–14 天前注册的用户中，注册后 7 天内首次发布的占比；与再早一周注册的那批对比"
            value={kpi.activationThis ?? "—"}
            suffix={kpi.activationThis == null ? undefined : "%"}
            footer={
              <Space size={8}>
                <Delta value={kpi.activationDelta} unit=" 个百分点" />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>样本 {kpi.activationBase} 人</Typography.Text>
              </Space>
            }
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="近 7 天活跃用户"
            hint="近 7 天内打开过后台的用户。活跃记录 2026-10-08 起才有，暂无环比"
            value={kpi.wau}
            footer={<Typography.Text type="secondary" style={{ fontSize: 12 }}>共 {stats.totalUsers} 个用户</Typography.Text>}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="首线索到达率"
            hint="已发布过落地页的用户中，收到过至少一条表单线索的占比。用户收到线索才会愿意付费"
            value={kpi.firstLeadRate ?? "—"}
            suffix={kpi.firstLeadRate == null ? undefined : "%"}
            footer={
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {kpi.withLead} / {kpi.published} 个已发布用户 · 线索累计 {stats.totalLeads}
              </Typography.Text>
            }
          />
        </Col>
      </Row>

      {/* 运行健康：故障类信号放在业务数字之前，坏了要第一眼看到 */}
      <OpsHealth data={stats.opsHealth} />

      <ActivationFunnel funnel={stats.funnel} range={stats.range} />

      <TrendCharts userTrend={stats.userTrend} leadTrend={stats.leadTrend} />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="付费">
            <Row gutter={16}>
              <Col span={8}><Statistic title="付费用户" value={stats.paidUsers} /></Col>
              <Col span={8}><Statistic title="赠送中（未付费）" value={stats.compUsers} /></Col>
              <Col span={8}>
                <Statistic
                  title="付费转化率"
                  value={stats.paidRate ?? "—"}
                  suffix={stats.paidRate == null ? undefined : "%"}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={12}>
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
