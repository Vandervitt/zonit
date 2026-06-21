"use client";

import { useState } from "react";
import useSWR from "swr";
import { Row, Col, Card, Statistic, Segmented, Select, Table, Typography, Space, Empty, Spin } from "antd";
import { EyeOutlined, AimOutlined, PercentageOutlined } from "@ant-design/icons";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ApiRoutes } from "@/lib/constants";
import type { AnalyticsResult } from "@/lib/analytics/queries";

interface PageRow { id: string; name: string; }

export default function AnalyticsPage() {
  const [pageId, setPageId] = useState("all");
  const [days, setDays] = useState(30);

  const pages = useSWR<PageRow[]>(ApiRoutes.LandingPages);
  const data = useSWR<AnalyticsResult>(`${ApiRoutes.Analytics}?pageId=${pageId}&days=${days}`);
  const a = data.data;

  const pageOptions = [
    { value: "all", label: "全部落地页" },
    ...(pages.data ?? []).map((p) => ({ value: p.id, label: p.name })),
  ];

  const hasData = a && (a.totals.views > 0 || a.totals.clicks > 0);

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>投放分析</Typography.Title>
        <Space>
          <Select value={pageId} onChange={setPageId} options={pageOptions} style={{ minWidth: 180 }} />
          <Segmented value={days} onChange={(v) => setDays(v as number)}
            options={[{ label: "近 7 天", value: 7 }, { label: "近 30 天", value: 30 }, { label: "近 90 天", value: 90 }]} />
        </Space>
      </div>

      <Row gutter={16}>
        <Col xs={24} sm={8}><Card><Statistic title="访问量 (PV)" value={a?.totals.views ?? 0} prefix={<EyeOutlined />} /></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title="CTA 点击" value={a?.totals.clicks ?? 0} prefix={<AimOutlined />} /></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title="点击率" value={((a?.totals.ctr ?? 0) * 100)} precision={2} suffix="%" prefix={<PercentageOutlined />} /></Card></Col>
      </Row>

      <Card title="趋势">
        {data.isLoading ? <div style={{ height: 260, display: "grid", placeItems: "center" }}><Spin /></div>
          : !hasData ? <Empty description="该区间还没有数据" />
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
              <Area type="monotone" dataKey="views" name="访问量" stroke="#28b6f8" fill="url(#gv)" strokeWidth={2} />
              <Area type="monotone" dataKey="clicks" name="CTA 点击" stroke="#6fd0fc" fill="url(#gc)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="CTA 渠道分布">
            <Table rowKey="channel" size="small" pagination={false} dataSource={a?.channels ?? []}
              locale={{ emptyText: "暂无点击" }}
              columns={[{ title: "渠道", dataIndex: "channel" }, { title: "点击数", dataIndex: "clicks", width: 120 }]} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="UTM 来源">
            <Table rowKey="utm_source" size="small" pagination={false} dataSource={a?.sources ?? []}
              locale={{ emptyText: "暂无来源数据" }}
              columns={[{ title: "来源", dataIndex: "utm_source" }, { title: "访问量", dataIndex: "views", width: 120 }]} />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
