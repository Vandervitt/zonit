"use client";

import { useSyncExternalStore } from "react";
import { Card, Table, Tag, Typography, Alert, Space, Statistic, Row, Col, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { OutreachLinkRow, OutreachSummary } from "@/lib/super-admin/page-check-views";

// 水合安全的「已挂载」判定：服务端与首帧客户端为 false，挂载后为 true。
const noopSubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

// 本地时区渲染时间：首帧用 ISO 派生的确定性字符串，挂载后再切本地时间，避免水合不匹配。
function LocalTime({ iso }: { iso: string | null }) {
  const mounted = useMounted();
  if (!iso) return <Typography.Text type="secondary">—</Typography.Text>;
  const text = mounted ? new Date(iso).toLocaleString() : iso.slice(0, 16).replace("T", " ");
  return <Typography.Text style={{ fontSize: 12 }}>{text}</Typography.Text>;
}

function reportHref(row: OutreachLinkRow): string {
  return row.kind === "report"
    ? `/tools/landing-page-check/r/${row.id}`
    : `/tools/landing-page-check/b/${row.id}`;
}

export function OutreachClient({
  rows,
  summary,
}: {
  rows: OutreachLinkRow[];
  summary: OutreachSummary;
}) {
  const columns: ColumnsType<OutreachLinkRow> = [
    {
      title: "链接",
      dataIndex: "label",
      width: 320,
      render: (label: string, row) => (
        <Space direction="vertical" size={0}>
          <a href={reportHref(row)} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
            {label || row.id}
          </a>
          {row.kind === "batch" && (
            <Tag color="blue" style={{ marginTop: 4 }}>
              对比 · {row.pageCount} 张页
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "真人打开",
      dataIndex: "humanViews",
      width: 110,
      sorter: (a, b) => a.humanViews - b.humanViews,
      render: (n: number, row) => (
        <Space size={4}>
          <Typography.Text strong>{n}</Typography.Text>
          {row.uniqueHumans > 1 && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              / {row.uniqueHumans} 人
            </Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: "机器人抓取",
      dataIndex: "botViews",
      width: 110,
      // 单列出来才知道「打开」里混了多少噪音——邮件安全网关会主动抓链接。
      render: (n: number) => (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {n}
        </Typography.Text>
      ),
    },
    {
      title: "首次打开",
      dataIndex: "firstHumanAt",
      width: 170,
      render: (v: string | null) => <LocalTime iso={v} />,
    },
    {
      title: "最近打开",
      dataIndex: "lastHumanAt",
      width: 170,
      defaultSortOrder: "descend",
      sorter: (a, b) => (a.lastHumanAt ?? "").localeCompare(b.lastHumanAt ?? ""),
      render: (v: string | null) => <LocalTime iso={v} />,
    },
    {
      title: "结果到期",
      dataIndex: "expiresAt",
      width: 170,
      render: (v: string) => {
        const expired = new Date(v).getTime() <= Date.now();
        return (
          <Space size={4}>
            <LocalTime iso={v} />
            {expired && <Tag color="default">已过期</Tag>}
          </Space>
        );
      },
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        报告触达
      </Typography.Title>

      {/* 不写清楚这三条，表里的数字会被读成「打开率」，而它不是。 */}
      <Alert
        type="info"
        showIcon
        message="这张表统计的是「报告链接被创建者以外的人打开过」"
        description={
          <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13 }}>
            <li>
              <strong>只统计浏览记录上线之后的访问。</strong>
              此前发出去的链接在被再次打开前一律显示 0，那是「没有数据」，不是「没人看过」。
            </li>
            <li>
              <strong>创建者按 IP 哈希识别。</strong>
              自己换了网络再回看自己的报告，会被算成一次真人打开。
            </li>
            <li>
              <strong>机器人计数单列。</strong>
              邮件安全网关会主动抓取邮件里的每条链接，这类抓取与真人打开在服务端完全同形；
              识别名单注定不完整，所以原始 UA 一直留库，口径可以随时重算。
            </li>
          </ul>
        }
      />

      <Row gutter={16}>
        <Col span={8}>
          <Card size="small">
            <Statistic title="有访问记录的链接" value={summary.trackedLinks} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic title="被真人打开过" value={summary.openedLinks} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="机器人抓取次数"
              value={summary.botViews}
              valueStyle={{ color: "#8c8c8c" }}
            />
          </Card>
        </Col>
      </Row>

      <Card size="small">
        <Table<OutreachLinkRow>
          columns={columns}
          dataSource={rows}
          rowKey="key"
          size="small"
          scroll={{ x: 1060 }}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          locale={{
            emptyText: (
              <Empty
                description="还没有链接被别人打开过"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>
    </Space>
  );
}
