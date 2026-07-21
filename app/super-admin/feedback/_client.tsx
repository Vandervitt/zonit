"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Card, Table, Tag, Typography, Button, Space, App, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { FeedbackRow, FeedbackSource } from "@/lib/feedback";

// 水合安全的「已挂载」判定：服务端与首帧客户端为 false，挂载后为 true。
const noopSubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

// 本地时区渲染时间：首帧用 ISO 派生的确定性字符串（服务端/客户端一致），挂载后再切本地时间，避免水合不匹配。
function LocalTime({ iso }: { iso: string }) {
  const mounted = useMounted();
  const text = mounted ? new Date(iso).toLocaleString() : iso.slice(0, 16).replace("T", " ");
  return <Typography.Text style={{ fontSize: 12 }}>{text}</Typography.Text>;
}

const SOURCE_META: Record<FeedbackSource, { label: string; color: string }> = {
  unpublish: { label: "取消发布", color: "orange" },
  delete: { label: "删除", color: "red" },
  publish_success: { label: "发布成功", color: "green" },
  error: { label: "报错", color: "volcano" },
  general: { label: "其他", color: "default" },
};

export function FeedbackInboxClient({ initial }: { initial: FeedbackRow[] }) {
  const router = useRouter();
  const { message } = App.useApp();

  async function toggleRead(row: FeedbackRow) {
    const res = await fetch("/api/super-admin/feedback", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: row.id, isRead: !row.isRead }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      message.error("操作失败，请重试");
    }
  }

  const unreadCount = initial.filter((f) => !f.isRead).length;

  const columns: ColumnsType<FeedbackRow> = [
    {
      title: "时间",
      dataIndex: "createdAt",
      width: 170,
      render: (t: string) => <LocalTime iso={t} />,
    },
    {
      title: "来源",
      dataIndex: "source",
      width: 100,
      filters: Object.entries(SOURCE_META).map(([k, v]) => ({ text: v.label, value: k })),
      onFilter: (value, row) => row.source === value,
      render: (s: FeedbackSource) => <Tag color={SOURCE_META[s]?.color}>{SOURCE_META[s]?.label ?? s}</Tag>,
    },
    {
      title: "内容",
      dataIndex: "message",
      render: (msg: string, row) => (
        <div>
          <Typography.Text style={{ whiteSpace: "pre-wrap" }}>{msg}</Typography.Text>
          {row.context?.pageName && (
            <Typography.Text type="secondary" style={{ display: "block", fontSize: 11 }}>
              页面：{row.context.pageName}
            </Typography.Text>
          )}
        </div>
      ),
    },
    {
      title: "用户",
      dataIndex: "email",
      width: 200,
      render: (email: string | null, row) => (
        <div>
          <Typography.Text style={{ fontSize: 12 }}>{email ?? "—"}</Typography.Text>
          {row.context?.plan && (
            <Tag style={{ marginInlineStart: 6 }}>{row.context.plan}</Tag>
          )}
        </div>
      ),
    },
    {
      title: "状态",
      dataIndex: "isRead",
      width: 140,
      render: (isRead: boolean, row) => (
        <Space size={8}>
          {isRead ? <Tag>已读</Tag> : <Tag color="blue">未读</Tag>}
          <Button size="small" type="link" onClick={() => toggleRead(row)}>
            {isRead ? "标为未读" : "标为已读"}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          用户反馈
          {unreadCount > 0 && <Tag color="blue" style={{ marginInlineStart: 12 }}>{unreadCount} 条未读</Tag>}
        </Typography.Title>
        <Typography.Text type="secondary">埋在情绪高点（取消发布 / 删除等）收集的用户反馈</Typography.Text>
      </div>

      <Card>
        <Table<FeedbackRow>
          columns={columns}
          dataSource={initial}
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 20, hideOnSinglePage: true }}
          locale={{ emptyText: <Empty description="还没有收到反馈" /> }}
        />
      </Card>
    </div>
  );
}
