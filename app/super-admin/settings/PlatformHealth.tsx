"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Button, Badge, Typography, Space } from "antd";
import { ReloadOutlined, DatabaseOutlined, CloudServerOutlined, GlobalOutlined, RobotOutlined } from "@ant-design/icons";
import { healthStatusView, type HealthTone } from "@/lib/super-admin/health-status";

export interface PlatformEnv {
  nodeEnv: string;
  region: string;
  appHost: string;
  aiProvider: string;
}

interface Probe {
  status?: string;
  db?: string;
  latencyMs?: number;
}

const BADGE_STATUS: Record<HealthTone, "success" | "error" | "default"> = {
  success: "success",
  error: "error",
  default: "default",
};

export function PlatformHealth({ env }: { env: PlatformEnv }) {
  const [probe, setProbe] = useState<Probe | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const check = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      setProbe((await res.json()) as Probe);
    } catch {
      setProbe(null);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  const view = healthStatusView(failed ? null : probe);
  const latency = probe?.latencyMs;

  return (
    <Card
      title={
        <Space>
          <Badge status={BADGE_STATUS[view.tone]} />
          <span>平台运行状态</span>
        </Space>
      }
      extra={
        <Button size="small" icon={<ReloadOutlined />} loading={loading} onClick={() => void check()}>
          刷新
        </Button>
      }
    >
      <div style={{ marginBottom: 20 }}>
        <Space size={12} align="center">
          <Badge status={BADGE_STATUS[view.tone]} />
          <Typography.Text strong style={{ fontSize: 18 }}>
            {loading ? "检测中…" : view.label}
          </Typography.Text>
          {!loading && typeof latency === "number" && (
            <Typography.Text type="secondary">数据库响应 {latency}ms</Typography.Text>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <Statistic
            title="数据库"
            value={failed ? "未知" : probe?.db === "up" ? "连通" : loading ? "…" : "断开"}
            prefix={<DatabaseOutlined />}
          />
        </Col>
        <Col xs={12} lg={6}>
          <Statistic title="运行环境" value={env.nodeEnv} prefix={<CloudServerOutlined />} />
        </Col>
        <Col xs={12} lg={6}>
          <Statistic title="区域" value={env.region} />
        </Col>
        <Col xs={12} lg={6}>
          <Statistic title="AI 供应商" value={env.aiProvider} prefix={<RobotOutlined />} />
        </Col>
        <Col xs={24}>
          <Statistic title="App 域名" value={env.appHost} prefix={<GlobalOutlined />} />
        </Col>
      </Row>
    </Card>
  );
}
