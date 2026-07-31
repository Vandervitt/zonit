"use client";

import useSWR from "swr";
import { Table, Typography, Tag, Space, Button, Popconfirm, App, Tooltip } from "antd";
import { WhatsAppOutlined, PhoneOutlined, MailOutlined, SendOutlined } from "@ant-design/icons";
import { ApiRoutes, apiLeadPath, apiLeadsExportPath } from "@/lib/constants";
import { contactLinks, type ContactKind } from "@/lib/leads/contact-links";
import { SEMANTIC } from "@/lib/theme/antd-theme";
import { LoadErrorAlert } from "../_shell/LoadErrorAlert";

interface LeadRow {
  id: string;
  page_name: string;
  payload: { name?: string; email?: string; phone?: string; whatsapp?: string; telegram?: string; message?: string };
  channel: string | null;
  utm_source: string | null;
  is_read: boolean;
  created_at: string;
}

/** 渠道图标：一键联系按钮的视觉锚点（antd 图标库已在后台其它页使用）。 */
const KIND_ICON: Record<ContactKind, React.ReactNode> = {
  whatsapp: <WhatsAppOutlined />,
  phone: <PhoneOutlined />,
  email: <MailOutlined />,
  telegram: <SendOutlined />,
};

/**
 * 一键联系单元格。点开任一渠道即视为「已跟进」并自动标已读——
 * 点击本身就是信号，不需要客户再手动录一次状态。
 */
function ContactCell({ row, onContacted }: { row: LeadRow; onContacted: () => void }) {
  const { links, plain } = contactLinks(row.payload);
  if (links.length === 0 && plain.length === 0) return <>—</>;
  return (
    <Space size="small" wrap>
      {links.map((l) => (
        <Tooltip key={l.kind} title={l.href.replace(/^(mailto|tel):/, "")}>
          <Button
            size="small"
            icon={KIND_ICON[l.kind]}
            href={l.href}
            target={l.external ? "_blank" : undefined}
            rel={l.external ? "noopener noreferrer" : undefined}
            onClick={onContacted}
          >
            {l.label}
          </Button>
        </Tooltip>
      ))}
      {/* 格式不合法、拼不出可靠链接的联系方式原样展示，供客户自行复制 */}
      {plain.map((t) => (
        <Typography.Text key={t} type="secondary" copyable>{t}</Typography.Text>
      ))}
    </Space>
  );
}

export default function LeadsPage() {
  const { message } = App.useApp();
  const { data, error, mutate, isLoading } = useSWR<LeadRow[]>(ApiRoutes.Leads);

  async function setRead(id: string, isRead: boolean) {
    await fetch(apiLeadPath(id), { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isRead }) });
    void mutate();
  }
  /** 点开联系渠道即自动标已读；已读的不再重复请求。 */
  async function markContacted(r: LeadRow) {
    if (r.is_read) return;
    await setRead(r.id, true);
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
      <LoadErrorAlert error={error} onRetry={() => void mutate()} label="线索列表" />
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
          { title: "联系方式", render: (_: unknown, r: LeadRow) => <ContactCell row={r} onContacted={() => void markContacted(r)} />, ellipsis: true },
          { title: "来源", render: (_: unknown, r: LeadRow) => [r.channel, r.utm_source].filter(Boolean).join(" / ") || "—", width: 140 },
          { title: "时间", dataIndex: "created_at", width: 180, render: (t: string) => new Date(t).toLocaleString() },
          { title: "状态", dataIndex: "is_read", width: 90, render: (v: boolean) => <Tag color={v ? "default" : "blue"}>{v ? "已读" : "未读"}</Tag> },
          { title: "操作", width: 180, render: (_: unknown, r: LeadRow) => (
            <Space size="middle">
              <a onClick={() => setRead(r.id, !r.is_read)}>{r.is_read ? "标未读" : "标已读"}</a>
              <Popconfirm title="确定删除该线索？" okText="删除" okButtonProps={{ danger: true }} onConfirm={() => remove(r.id)}>
                <a style={{ color: SEMANTIC.error }}>删除</a>
              </Popconfirm>
            </Space>
          ) },
        ]}
      />
    </Space>
  );
}
