"use client";

import { useState } from "react";
import useSWR from "swr";
import { Row, Col, Card, Statistic, Segmented, Select, Table, Tag, Typography, Space, Empty, Spin, DatePicker } from "antd";
import {
  EyeOutlined, AimOutlined, PercentageOutlined, ContactsOutlined, ArrowUpOutlined, ArrowDownOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ApiRoutes } from "@/lib/constants";
import type { AnalyticsResult } from "@/lib/analytics/queries";
// 常量从 dimensions.ts 引，不能从 queries.ts——后者 import 了 pg 连接池。
import {
  DEFAULT_DIMENSION, UNLABELED,
  type AttributionDimension, type AttributionRow,
} from "@/lib/analytics/dimensions";
import { LoadErrorAlert } from "../_shell/LoadErrorAlert";
import { useAdminT } from "@/lib/i18n/admin/context";
import { CapiHealthCard } from "./CapiHealthCard";
import { PageComparison } from "./PageComparison";

interface PageRow { id: string; name: string; }

/** 维度对应的链接参数——报表里必须让人一眼知道该往广告链接上加什么。展示名在字典里。 */
const DIMENSION_PARAM: Record<AttributionDimension, string> = {
  source: "utm_source", medium: "utm_medium", campaign: "utm_campaign", content: "utm_content", term: "utm_term",
};

/** 环比角标：涨绿跌红，上一段为 0 时给「新增」而不是编一个百分比。 */
function ChangeBadge({ change }: { change: number | null }) {
  const t = useAdminT().analytics.change;
  if (change === null) {
    return <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t.new}</Typography.Text>;
  }
  if (change === 0) {
    return <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t.flat}</Typography.Text>;
  }
  const up = change > 0;
  return (
    <Typography.Text style={{ fontSize: 12, color: up ? "#3f8600" : "#cf1322" }}>
      {up ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(change * 100).toFixed(1)}%
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t.suffix}</Typography.Text>
    </Typography.Text>
  );
}

export default function AnalyticsPage() {
  const t = useAdminT().analytics;
  const [pageId, setPageId] = useState("all");
  const [days, setDays] = useState(30);
  const [dimension, setDimension] = useState<AttributionDimension>(DEFAULT_DIMENSION);
  /** 自定义区间；为 null 时用上面的 days 预设。 */
  const [custom, setCustom] = useState<[Dayjs, Dayjs] | null>(null);

  // 自定义区间与预设互斥：同时生效时用户无从判断当前看的是哪一段。
  const rangeQuery = custom
    ? `from=${custom[0].format("YYYY-MM-DD")}&to=${custom[1].format("YYYY-MM-DD")}`
    : `days=${days}`;

  const pages = useSWR<PageRow[]>(ApiRoutes.LandingPages);
  const data = useSWR<AnalyticsResult>(`${ApiRoutes.Analytics}?pageId=${pageId}&${rangeQuery}&dimension=${dimension}`);
  const a = data.data;
  const cmp = a?.comparison;

  const dimensionOptions = (Object.keys(DIMENSION_PARAM) as AttributionDimension[])
    .map((k) => ({ label: t.attribution.dimensions[k], value: k }));

  const pageOptions = [
    { value: "all", label: t.allPages },
    ...(pages.data ?? []).map((p) => ({ value: p.id, label: p.name })),
  ];

  const hasData = a && (a.totals.views > 0 || a.totals.clicks > 0 || a.totals.leads > 0);
  const pctText = (n: number) => `${(n * 100).toFixed(1)}%`;
  /** 归因取值是数据本身，只有「未标注」这个哨兵值需要按界面语言替换。 */
  const attributionValue = (v: string) => (v === UNLABELED ? t.attribution.unlabeled : v);

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>{t.title}</Typography.Title>
        <Space wrap>
          <Select value={pageId} onChange={setPageId} options={pageOptions} style={{ minWidth: 180 }} />
          <Segmented
            value={custom ? "" : days}
            onChange={(v) => { setDays(v as number); setCustom(null); }}
            options={[{ label: t.range.d7, value: 7 }, { label: t.range.d30, value: 30 }, { label: t.range.d90, value: 90 }]}
          />
          <DatePicker.RangePicker
            value={custom}
            onChange={(v) => setCustom(v && v[0] && v[1] ? [v[0], v[1]] : null)}
            allowClear
            // 未来没有数据，选了只会得到空报表
            disabledDate={(d) => d.isAfter(dayjs(), "day")}
            placeholder={[t.range.from, t.range.to]}
          />
        </Space>
      </div>

      <LoadErrorAlert error={data.error} onRetry={() => void data.mutate()} label={t.loadError.data} />
      <LoadErrorAlert error={pages.error} onRetry={() => void pages.mutate()} label={t.loadError.pages} />

      <Row gutter={16}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title={t.totals.views} value={a?.totals.views ?? 0} prefix={<EyeOutlined />} />
            {cmp && <ChangeBadge change={cmp.change.views} />}
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title={t.totals.clicks} value={a?.totals.clicks ?? 0} prefix={<AimOutlined />} />
            {cmp && <ChangeBadge change={cmp.change.clicks} />}
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title={t.totals.leads} value={a?.totals.leads ?? 0} prefix={<ContactsOutlined />} />
            {cmp && <ChangeBadge change={cmp.change.leads} />}
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title={t.totals.ctr} value={((a?.totals.ctr ?? 0) * 100)} precision={2} suffix="%" prefix={<PercentageOutlined />} />
          </Card>
        </Col>
      </Row>

      {cmp && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {t.comparisonNote(cmp.previous.views, cmp.previous.clicks, cmp.previous.leads)}
        </Typography.Text>
      )}

      {/* 先给「哪张页在跑」，再往下钻单页细节——多客户场景的第一眼 */}
      <PageComparison rangeQuery={rangeQuery} selectedPageId={pageId} onSelect={setPageId} />

      <Card title={t.funnel.title}>
        {data.isLoading ? <div style={{ height: 180, display: "grid", placeItems: "center" }}><Spin /></div>
          : !hasData ? <Empty description={t.funnel.empty} />
          : (
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            {(a?.funnel ?? []).map((step) => (
              <div key={step.key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: "#475569" }}>{t.funnel.steps[step.key]}</span>
                  <span style={{ color: "#0f172a" }}>
                    <strong>{step.count.toLocaleString()}</strong>
                    {step.key !== "views" && <span style={{ color: "#94a3b8", marginLeft: 8 }}>{t.funnel.fromPrevious(pctText(step.rate))}</span>}
                  </span>
                </div>
                <div style={{ height: 12, borderRadius: 6, background: "#eef3f9", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.max(step.pct * 100, step.count > 0 ? 2 : 0)}%`, background: "linear-gradient(90deg,#28b6f8,#6fd0fc)", borderRadius: 6 }} />
                </div>
              </div>
            ))}
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t.funnel.cvr(pctText(a?.totals.cvr ?? 0))}
            </Typography.Text>
          </Space>
        )}
      </Card>

      <Card title={t.formFunnel.title} extra={<Typography.Text type="secondary" style={{ fontSize: 12 }}>{t.formFunnel.note}</Typography.Text>}>
        {data.isLoading ? <div style={{ height: 120, display: "grid", placeItems: "center" }}><Spin /></div>
          : (a?.formFunnel.starts ?? 0) === 0 ? <Empty description={t.formFunnel.empty} />
          : (
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            <Row gutter={16}>
              <Col xs={8}><Statistic title={t.formFunnel.starts} value={a!.formFunnel.starts} /></Col>
              <Col xs={8}><Statistic title={t.formFunnel.submits} value={a!.formFunnel.submits} /></Col>
              <Col xs={8}><Statistic title={t.formFunnel.completion} value={a!.formFunnel.completion * 100} precision={1} suffix="%" /></Col>
            </Row>
            {a!.formFunnel.errors > 0 && (
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {t.formFunnel.rejected(a!.formFunnel.errors)}
                </Typography.Text>
                <div style={{ marginTop: 8 }}>
                  {a!.formFunnel.errorBreakdown.map((e) => (
                    <Tag key={e.detail} style={{ marginBottom: 4 }}>{e.detail} × {e.count}</Tag>
                  ))}
                </div>
              </div>
            )}
          </Space>
        )}
      </Card>

      <Card title={t.trend.title}>
        {data.isLoading ? <div style={{ height: 260, display: "grid", placeItems: "center" }}><Spin /></div>
          : !hasData ? <Empty description={t.trend.empty} />
          : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={a!.series} margin={{ left: -16, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#28b6f8" stopOpacity={0.25} /><stop offset="100%" stopColor="#28b6f8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6fd0fc" stopOpacity={0.25} /><stop offset="100%" stopColor="#6fd0fc" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef3f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} minTickGap={24} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="views" name={t.trend.views} stroke="#28b6f8" fill="url(#gv)" strokeWidth={2} />
              <Area type="monotone" dataKey="clicks" name={t.trend.clicks} stroke="#6fd0fc" fill="url(#gc)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card
        title={t.attribution.title}
        extra={
          <Segmented
            value={dimension}
            onChange={(v) => setDimension(v as AttributionDimension)}
            options={dimensionOptions}
          />
        }
      >
        <Table<AttributionRow>
          rowKey="value"
          size="small"
          pagination={false}
          dataSource={a?.attribution ?? []}
          locale={{ emptyText: t.attribution.empty(DIMENSION_PARAM[dimension]) }}
          columns={[
            { title: t.attribution.dimensions[dimension], dataIndex: "value", ellipsis: true,
              render: (v: string) => attributionValue(v) },
            { title: t.attribution.columns.views, dataIndex: "views", width: 100, sorter: (x, y) => x.views - y.views },
            { title: t.attribution.columns.clicks, dataIndex: "clicks", width: 110, sorter: (x, y) => x.clicks - y.clicks },
            { title: t.attribution.columns.leads, dataIndex: "leads", width: 90, sorter: (x, y) => x.leads - y.leads },
            {
              title: t.attribution.columns.cvr, dataIndex: "cvr", width: 120,
              sorter: (x, y) => x.cvr - y.cvr,
              render: (v: number) => pctText(v),
            },
          ]}
        />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {t.attribution.note(DIMENSION_PARAM[dimension], t.attribution.unlabeled)}
        </Typography.Text>
      </Card>

      {/* 回传健康度按账号统计，不随落地页筛选变化（凭据本身可能是账号级的）。 */}
      <CapiHealthCard rangeQuery={rangeQuery} />

      <Card title={t.channels.title}>
        <Table rowKey="channel" size="small" pagination={false} dataSource={a?.channels ?? []}
          locale={{ emptyText: t.channels.empty }}
          columns={[{ title: t.channels.columns.channel, dataIndex: "channel" }, { title: t.channels.columns.clicks, dataIndex: "clicks", width: 120 }]} />
      </Card>
    </Space>
  );
}
