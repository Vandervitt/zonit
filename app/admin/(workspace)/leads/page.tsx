"use client";

import useSWR from "swr";
import { Table, Typography, Tag, Space, Button, Popconfirm, App } from "antd";
import { ApiRoutes, apiLeadPath, apiLeadsExportPath } from "@/lib/constants";

interface LeadRow {
  id: string;
  page_name: string;
  payload: { name?: string; email?: string; phone?: string; whatsapp?: string; telegram?: string; message?: string };
  channel: string | null;
  utm_source: string | null;
  is_read: boolean;
  created_at: string;
}

const contactSummary = (p: LeadRow["payload"]) =>
  [p.email, p.phone, p.whatsapp && `wa:${p.whatsapp}`, p.telegram && `tg:${p.telegram}`].filter(Boolean).join(" · ") || "—";

export default function LeadsPage() {
  const { message } = App.useApp();
  const { data, mutate, isLoading } = useSWR<LeadRow[]>(ApiRoutes.Leads);

  async function setRead(id: string, isRead: boolean) {
    await fetch(apiLeadPath(id), { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isRead }) });
    void mutate();
  }
  async function remove(id: string) {
    await fetch(apiLeadPath(id), { method: "DELETE" });
    message.success("已删除");
    void mutate();
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography.Title level={3} style={{ margin: 0 }}>线索</Typography.Title>
        <Button href={apiLeadsExportPath()} target="_blank">导出 CSV</Button>
      </div>
      <Table<LeadRow>
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        locale={{ emptyText: "还没有线索。访客通过落地页表单留资后会显示在这里" }}
        expandable={{
          expandedRowRender: (r) => (
            <Space direction="vertical" size={4}>
              {(["name", "email", "phone", "whatsapp", "telegram", "message"] as const).map((k) =>
                r.payload[k] ? <span key={k}><b>{k}:</b> {r.payload[k]}</span> : null,
              )}
            </Space>
          ),
        }}
        columns={[
          { title: "页面", dataIndex: "page_name", ellipsis: true },
          { title: "联系方式", render: (_: unknown, r: LeadRow) => contactSummary(r.payload), ellipsis: true },
          { title: "来源", render: (_: unknown, r: LeadRow) => [r.channel, r.utm_source].filter(Boolean).join(" / ") || "—", width: 140 },
          { title: "时间", dataIndex: "created_at", width: 180, render: (t: string) => new Date(t).toLocaleString() },
          { title: "状态", dataIndex: "is_read", width: 90, render: (v: boolean) => <Tag color={v ? "default" : "blue"}>{v ? "已读" : "未读"}</Tag> },
          { title: "操作", width: 180, render: (_: unknown, r: LeadRow) => (
            <Space size="middle">
              <a onClick={() => setRead(r.id, !r.is_read)}>{r.is_read ? "标未读" : "标已读"}</a>
              <Popconfirm title="确定删除该线索？" okText="删除" okButtonProps={{ danger: true }} onConfirm={() => remove(r.id)}>
                <a style={{ color: "#ef4444" }}>删除</a>
              </Popconfirm>
            </Space>
          ) },
        ]}
      />
    </Space>
  );
}
