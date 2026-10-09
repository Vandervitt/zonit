"use client";

import { Card, Col, Row, Space, Statistic, Table, Tag, Tooltip, Typography, Empty } from "antd";
import { RobotOutlined, ScheduleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { AiJobHealth, CronStatus } from "@/lib/super-admin/ops-health";

export interface CronRunRow { ranAt: string; failedTasks: string[] }
export interface AiFailureRow { id: string; email: string | null; status: string; reason: string | null; createdAt: string }

export interface OpsHealthData {
  cronStatus: CronStatus;
  cronRuns: CronRunRow[];
  ai: AiJobHealth;
  aiTopReasons: { reason: string; n: number }[];
  aiRecentFailures: AiFailureRow[];
}

const CRON_STATUS_META: Record<CronStatus, { color: string; label: string; hint: string }> = {
  ok: { color: "success", label: "正常", hint: "最近一次全部子任务成功" },
  partial: { color: "warning", label: "部分失败", hint: "最近一次有子任务失败（整体仍返回 200），详见 Vercel 日志" },
  stale: { color: "error", label: "超过 26 小时未运行", hint: "每日任务漏跑：检查 Vercel Cron 配置与租户路由" },
  never: { color: "default", label: "暂无记录", hint: "执行记录随本次上线开始写入，首次运行在每天 09:00（北京时间）" },
};

// 与 app/api/cron/daily/route.ts 的 `<task>Error` 键对应；未登记的键原样显示，不吞信息。
const CRON_TASK_LABEL: Record<string, string> = {
  leadSpool: "线索兜底重投", capi: "CAPI 重发", webhook: "Webhook 重投", leadNudge: "未读线索提醒",
  publishQuota: "发布配额对账", trialEmails: "试用到期邮件", rateLimitPrune: "过期数据清理",
  snapshotTouch: "自检器快照保活", digest: "周报",
};

const fmt = (iso: string) => dayjs(iso).format("MM-DD HH:mm");

export function OpsHealth({ data }: { data: OpsHealthData }) {
  const cron = CRON_STATUS_META[data.cronStatus];
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} lg={10}>
        <Card title={<Space><ScheduleOutlined />每日定时任务</Space>} extra={<Tooltip title={cron.hint}><Tag color={cron.color}>{cron.label}</Tag></Tooltip>} style={{ height: "100%" }}>
          {data.cronRuns.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={cron.hint} />
          ) : (
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              {data.cronRuns.map((r) => (
                <div key={r.ranAt} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <Typography.Text style={{ fontSize: 13 }}>{fmt(r.ranAt)}</Typography.Text>
                  {r.failedTasks.length === 0 ? (
                    <Tag color="success">全部成功</Tag>
                  ) : (
                    <Tooltip title={r.failedTasks.map((t) => CRON_TASK_LABEL[t] ?? t).join("、")}>
                      <Tag color="error">{r.failedTasks.length} 个子任务失败</Tag>
                    </Tooltip>
                  )}
                </div>
              ))}
            </Space>
          )}
        </Card>
      </Col>
      <Col xs={24} lg={14}>
        <Card title={<Space><RobotOutlined />AI 一键成页（近 7 天）</Space>} style={{ height: "100%" }}>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}><Statistic title="任务数" value={data.ai.total} /></Col>
            <Col span={6}><Statistic title="失败" value={data.ai.failed} /></Col>
            <Col span={6}>
              <Tooltip title="超过 10 分钟仍未结束，多为后台任务被中断">
                <Statistic title="卡死" value={data.ai.stuck} />
              </Tooltip>
            </Col>
            <Col span={6}>
              <Statistic
                title="失败率"
                value={data.ai.failureRate ?? "—"}
                suffix={data.ai.failureRate == null ? undefined : "%"}
                valueStyle={data.ai.failureRate != null && data.ai.failureRate >= 20 ? { color: "#cf1322" } : undefined}
              />
            </Col>
          </Row>
          {data.aiTopReasons.length > 0 && (
            <Space size={4} wrap style={{ marginBottom: 12 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>失败原因：</Typography.Text>
              {data.aiTopReasons.map((r) => <Tag key={r.reason}>{r.reason} × {r.n}</Tag>)}
            </Space>
          )}
          <Table<AiFailureRow>
            size="small"
            rowKey="id"
            pagination={false}
            dataSource={data.aiRecentFailures}
            locale={{ emptyText: "近 7 天没有失败或卡死的任务" }}
            columns={[
              { title: "时间", dataIndex: "createdAt", width: 110, render: (v: string) => fmt(v) },
              { title: "用户", dataIndex: "email", render: (v: string | null) => v ?? "—" },
              {
                title: "结果", key: "result",
                render: (_, r) => <Tag color="error">{r.status === "pending" ? "卡死" : r.reason ?? "failed"}</Tag>,
              },
            ]}
          />
        </Card>
      </Col>
    </Row>
  );
}
