"use client";

import { useState } from "react";
import useSWR from "swr";
import { Table, Typography, Tag, Space, Button, Popconfirm, App, Tooltip, Select, Segmented, Input } from "antd";
import { WhatsAppOutlined, PhoneOutlined, MailOutlined, SendOutlined } from "@ant-design/icons";
import { ApiRoutes, apiLeadPath, apiLeadsExportPath } from "@/lib/constants";
// 从 follow-up.ts 引，不能从 store.ts——后者 import 了 pg 连接池。
import { MAX_NOTE_LENGTH, MAX_TAGS } from "@/lib/leads/follow-up";
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
  note: string | null;
  tags: string[];
  archived_at: string | null;
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

/** 列表里的跟进摘要：有标签给标签，没标签但有备注给一行截断的备注。 */
function FollowUpCell({ row }: { row: LeadRow }) {
  if (row.tags.length === 0 && !row.note) return <Typography.Text type="secondary">—</Typography.Text>;
  return (
    <Space size={4} wrap>
      {row.tags.map((t) => <Tag key={t}>{t}</Tag>)}
      {row.note && (
        <Tooltip title={row.note}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }} ellipsis>
            {row.note}
          </Typography.Text>
        </Tooltip>
      )}
    </Space>
  );
}

/**
 * 展开行里的跟进编辑器。
 *
 * 刻意不做「线索状态机」：平台拿不到任何能自动推进状态的信号，逼客户手工维护
 * 一块不准的看板比没有更糟（此前已否决过）。备注与标签不依赖任何自动信号——
 * 就是客户自己写下的那句话，写与不写都成立。
 */
function FollowUpEditor({
  row, tagOptions, onSave,
}: {
  row: LeadRow;
  tagOptions: string[];
  onSave: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [note, setNote] = useState(row.note ?? "");
  const [tags, setTags] = useState<string[]>(row.tags);
  const [saving, setSaving] = useState(false);
  // 标签比较按「顺序敏感的逐项相等」，不要 join 成一个字符串再比——
  // 分隔符选谁都可能出现在标签里，而标签是用户自由输入的。
  const tagsChanged = tags.length !== row.tags.length || tags.some((t, i) => t !== row.tags[i]);
  const dirty = note !== (row.note ?? "") || tagsChanged;

  async function save() {
    setSaving(true);
    try {
      await onSave({ note, tags });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Space direction="vertical" size={6} style={{ width: "100%", maxWidth: 560 }}>
      <Select
        mode="tags"
        value={tags}
        onChange={setTags}
        options={tagOptions.map((t) => ({ value: t, label: t }))}
        placeholder="加标签（回车新建，如「已报价」「下周再聊」）"
        aria-label="线索标签"
        style={{ width: "100%" }}
        maxTagCount={MAX_TAGS}
      />
      <Input.TextArea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="跟进备注：这次沟通说了什么、下一步做什么"
        aria-label="跟进备注"
        maxLength={MAX_NOTE_LENGTH}
        autoSize={{ minRows: 2, maxRows: 6 }}
        showCount
      />
      <Button type="primary" size="small" disabled={!dirty} loading={saving} onClick={save}>
        保存跟进
      </Button>
    </Space>
  );
}

/** 分页与筛选走服务端：线索只增不减，一次全量拉取跑久了必然拖垮列表。 */
const PAGE_SIZE = 50;

interface LeadsResponse { rows: LeadRow[]; total: number }

export default function LeadsPage() {
  const { message } = App.useApp();
  const [pageId, setPageId] = useState<string>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [tag, setTag] = useState<string | undefined>();
  const [archived, setArchived] = useState(false);
  const [page, setPage] = useState(1);

  const pages = useSWR<{ id: string; name: string }[]>(ApiRoutes.LandingPages);
  const tags = useSWR<string[]>(ApiRoutes.LeadTags);
  const query = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String((page - 1) * PAGE_SIZE),
    ...(pageId !== "all" ? { pageId } : {}),
    ...(unreadOnly ? { unreadOnly: "1" } : {}),
    ...(tag ? { tag } : {}),
    ...(archived ? { archived: "1" } : {}),
  });
  const { data, error, mutate, isLoading } = useSWR<LeadsResponse>(`${ApiRoutes.Leads}?${query}`);
  const rows = data?.rows ?? [];

  const pageOptions = [
    { value: "all", label: "全部落地页" },
    ...(pages.data ?? []).map((p) => ({ value: p.id, label: p.name })),
  ];

  /** 换筛选条件必须回到第一页，否则会停在一个新结果集里不存在的页码上。 */
  function changeFilter(fn: () => void) {
    fn();
    setPage(1);
  }

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

  /** 备注 / 标签 / 归档统一走同一个 PATCH；未传的字段不动。 */
  async function patchFollowUp(id: string, body: Record<string, unknown>) {
    const res = await fetch(apiLeadPath(id), {
      method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
    });
    if (!res.ok) { message.error("保存失败，请重试"); return; }
    void mutate();
    // 标签集合可能因此新增或消失，筛选器候选跟着刷新
    if ("tags" in body) void tags.mutate();
  }

  async function setArchivedFor(r: LeadRow, next: boolean) {
    await patchFollowUp(r.id, { archived: next });
    message.success(next ? "已归档" : "已取消归档");
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>线索</Typography.Title>
        <Space wrap>
          <Select
            value={pageId}
            onChange={(v) => changeFilter(() => setPageId(v))}
            options={pageOptions}
            style={{ minWidth: 180 }}
            aria-label="按落地页筛选"
          />
          <Segmented
            value={unreadOnly ? "unread" : "all"}
            onChange={(v) => changeFilter(() => setUnreadOnly(v === "unread"))}
            options={[{ label: "全部", value: "all" }, { label: "只看未读", value: "unread" }]}
          />
          <Select
            value={tag}
            onChange={(v) => changeFilter(() => setTag(v))}
            options={(tags.data ?? []).map((t) => ({ value: t, label: t }))}
            placeholder="按标签筛选"
            allowClear
            style={{ minWidth: 150 }}
            aria-label="按标签筛选"
          />
          {/* 归档区是独立视图：把已处理的线索混进默认列表，归档这个动作就没意义了 */}
          <Segmented
            value={archived ? "archived" : "active"}
            onChange={(v) => changeFilter(() => setArchived(v === "archived"))}
            options={[{ label: "进行中", value: "active" }, { label: "已归档", value: "archived" }]}
          />
          <Button
            href={apiLeadsExportPath({ pageId: pageId === "all" ? undefined : pageId, unreadOnly, tag, archived })}
            target="_blank"
          >
            导出 CSV
          </Button>
        </Space>
      </div>
      <LoadErrorAlert error={error} onRetry={() => void mutate()} label="线索列表" />
      <Table<LeadRow>
        rowKey="id"
        loading={isLoading}
        dataSource={rows}
        // 列已经排到「标签 / 备注」这一层，窄屏下不给横向滚动会让单元格互相重叠，
        // 一键联系的按钮会被相邻单元格盖住点不动。
        // x 必须 ≥ 各列 width 之和，否则 antd 会把没设 width 的列压到几十像素：
        // 「页面」曾被压成「A...」（看不出线索来自哪张页），联系按钮被截成「W」「邮」。
        scroll={{ x: 1500 }}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total: data?.total ?? 0,
          showSizeChanger: false,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条`,
        }}
        locale={{ emptyText: unreadOnly || pageId !== "all"
          ? "当前筛选条件下没有线索"
          : "还没有线索。访客通过落地页表单留资后会显示在这里" }}
        expandable={{
          expandedRowRender: (r) => (
            <Space direction="vertical" size={10}>
              <Space direction="vertical" size={4}>
                {(["name", "email", "phone", "whatsapp", "telegram", "message"] as const).map((k) =>
                  r.payload[k] ? <span key={k}><b>{k}:</b> {r.payload[k]}</span> : null,
                )}
              </Space>
              <AttributionDetail row={r} />
              <FollowUpEditor
                row={r}
                tagOptions={tags.data ?? []}
                onSave={(body) => patchFollowUp(r.id, body)}
              />
            </Space>
          ),
        }}
        columns={[
          // 这两列必须给显式宽度：页面名是「这条线索来自哪」的唯一线索，
          // 联系方式列要放得下两三个渠道按钮。
          { title: "页面", dataIndex: "page_name", width: 180, ellipsis: true },
          { title: "联系方式", width: 240, render: (_: unknown, r: LeadRow) => <ContactCell row={r} onContacted={() => void markContacted(r)} /> },
          // 列表只给渠道 / 来源 / 广告系列三层；创意、关键词与点击 ID 在展开行里。
          { title: "来源", width: 200, ellipsis: true,
            render: (_: unknown, r: LeadRow) => [r.channel, r.utm_source, r.utm_campaign].filter(Boolean).join(" / ") || "—" },
          { title: "标签 / 备注", width: 220, render: (_: unknown, r: LeadRow) => <FollowUpCell row={r} /> },
          { title: "通知", width: 160, render: (_: unknown, r: LeadRow) => <NotifyCell row={r} /> },
          { title: "时间", dataIndex: "created_at", width: 180, render: (t: string) => new Date(t).toLocaleString() },
          { title: "状态", dataIndex: "is_read", width: 90, render: (v: boolean) => <Tag color={v ? "default" : "blue"}>{v ? "已读" : "未读"}</Tag> },
          { title: "操作", width: 180, render: (_: unknown, r: LeadRow) => (
            <Space size="middle">
              <a onClick={() => setRead(r.id, !r.is_read)}>{r.is_read ? "标未读" : "标已读"}</a>
              <a onClick={() => setArchivedFor(r, !r.archived_at)}>{r.archived_at ? "取消归档" : "归档"}</a>
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
