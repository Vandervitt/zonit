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
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  gclid: string | null;
  fbclid: string | null;
  ttclid: string | null;
  is_read: boolean;
  created_at: string;
  notify_email: "off" | "sent" | "failed" | null;
  notify_email_error: string | null;
  notify_webhook_status: "pending" | "sent" | "failed" | null;
  notify_webhook_error: string | null;
}

/**
 * 通知送达状态。「关」与「—」必须能区分：前者是租户自己关了通知，
 * 后者是这条线索早于本功能上线，都不等于「发失败了」。
 */
const NOTIFY_TAG: Record<string, { color: string; text: string }> = {
  sent: { color: "green", text: "已发送" },
  failed: { color: "red", text: "失败" },
  pending: { color: "blue", text: "投递中" },
  off: { color: "default", text: "关" },
};

function NotifyTag({ label, status, error }: { label: string; status: string | null; error?: string | null }) {
  if (!status) return null;
  const meta = NOTIFY_TAG[status] ?? { color: "default", text: status };
  const tag = <Tag color={meta.color}>{label} {meta.text}</Tag>;
  return error ? <Tooltip title={error}>{tag}</Tooltip> : tag;
}

function NotifyCell({ row }: { row: LeadRow }) {
  const hasAny = row.notify_email || row.notify_webhook_status;
  if (!hasAny) return <Typography.Text type="secondary">—</Typography.Text>;
  return (
    <Space size={4} wrap>
      <NotifyTag label="邮件" status={row.notify_email} error={row.notify_email_error} />
      <NotifyTag label="Webhook" status={row.notify_webhook_status} error={row.notify_webhook_error} />
    </Space>
  );
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

/** 展开行里的完整归因：列表列只放得下渠道与广告系列，对账要的粒度在这里。 */
const ATTRIBUTION_FIELDS: { key: keyof LeadRow; label: string }[] = [
  { key: "utm_source", label: "来源 utm_source" },
  { key: "utm_medium", label: "媒介 utm_medium" },
  { key: "utm_campaign", label: "广告系列 utm_campaign" },
  { key: "utm_content", label: "广告 / 创意 utm_content" },
  { key: "utm_term", label: "关键词 utm_term" },
  { key: "gclid", label: "Google 点击 ID" },
  { key: "fbclid", label: "Meta 点击 ID" },
  { key: "ttclid", label: "TikTok 点击 ID" },
];

function AttributionDetail({ row }: { row: LeadRow }) {
  const present = ATTRIBUTION_FIELDS.filter((f) => row[f.key]);
  if (present.length === 0) {
    return (
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        这条线索没带任何 UTM 或点击 ID——广告链接上没加参数时就会这样。
      </Typography.Text>
    );
  }
  return (
    <Space direction="vertical" size={2}>
      {present.map((f) => (
        <span key={f.key} style={{ fontSize: 12 }}>
          <Typography.Text type="secondary">{f.label}：</Typography.Text>
          <Typography.Text copyable={{ text: String(row[f.key]) }}>{String(row[f.key])}</Typography.Text>
        </span>
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
            <Space direction="vertical" size={10}>
              <Space direction="vertical" size={4}>
                {(["name", "email", "phone", "whatsapp", "telegram", "message"] as const).map((k) =>
                  r.payload[k] ? <span key={k}><b>{k}:</b> {r.payload[k]}</span> : null,
                )}
              </Space>
              <AttributionDetail row={r} />
            </Space>
          ),
        }}
        columns={[
          { title: "页面", dataIndex: "page_name", ellipsis: true },
          { title: "联系方式", render: (_: unknown, r: LeadRow) => <ContactCell row={r} onContacted={() => void markContacted(r)} />, ellipsis: true },
          // 列表只给渠道 / 来源 / 广告系列三层；创意、关键词与点击 ID 在展开行里。
          { title: "来源", width: 200, ellipsis: true,
            render: (_: unknown, r: LeadRow) => [r.channel, r.utm_source, r.utm_campaign].filter(Boolean).join(" / ") || "—" },
          { title: "通知", width: 160, render: (_: unknown, r: LeadRow) => <NotifyCell row={r} /> },
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
