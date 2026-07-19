"use client";

import { Card, Row, Col } from "antd";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BRAND } from "@/lib/theme/brand";
import { SEMANTIC } from "@/lib/theme/antd-theme";
import type { DailyPoint } from "@/lib/super-admin/trend";

function Trend({ title, data, color }: { title: string; data: DailyPoint[]; color: string }) {
  return (
    <Card title={title} size="small">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} minTickGap={24} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Area type="monotone" dataKey="count" stroke={color} fill={color} fillOpacity={0.12} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function TrendCharts({ userTrend, leadTrend }: { userTrend: DailyPoint[]; leadTrend: DailyPoint[] }) {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} md={12}><Trend title="近 30 天新增用户" data={userTrend} color={BRAND} /></Col>
      <Col xs={24} md={12}><Trend title="近 30 天新增线索" data={leadTrend} color={SEMANTIC.success} /></Col>
    </Row>
  );
}
