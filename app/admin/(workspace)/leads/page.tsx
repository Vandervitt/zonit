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
import { useAdminT, useAdminLocale } from "@/lib/i18n/admin/context";
import { formatDateTime } from "@/lib/i18n/admin";
import type { AdminDictionary } from "@/lib/i18n/admin";

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
 * 通知送达状态的颜色。文案在字典的 leads.notify——「关」与「—」必须能区分：
 * 前者是租户自己关了通知，后者是这条线索早于本功能上线，都不等于「发失败了」。
 */
const NOTIFY_COLOR: Record<string, string> = {
  sent: "green",
  failed: "red",
  pending: "blue",
  off: "default",
};

type NotifyStatusKey = keyof AdminDictionary["leads"]["notify"];

function NotifyTag({ label, status, error }: { label: string; status: string | null; error?: string | null }) {
  const t = useAdminT().leads.notify;
  if (!status) return null;
  // 未知状态原样显示状态码：与其编一个可能不准的说法，不如让用户看见真实取值。
  const text = t[status as NotifyStatusKey] ?? status;
  const tag = <Tag color={NOTIFY_COLOR[status] ?? "default"}>{label} {text}</Tag>;
  return error ? <Tooltip title={error}>{tag}</Tooltip> : tag;
}

function NotifyCell({ row }: { row: LeadRow }) {
  const t = useAdminT().leads.notify;
  const hasAny = row.notify_email || row.notify_webhook_status;
  if (!hasAny) return <Typography.Text type="secondary">—</Typography.Text>;
  return (
    <Space size={4} wrap>
      <NotifyTag label={t.email} status={row.notify_email} error={row.notify_email_error} />
      <NotifyTag label={t.webhook} status={row.notify_webhook_status} error={row.notify_webhook_error} />
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

/**
 * 展开行里的完整归因：列表列只放得下渠道与广告系列，对账要的粒度在这里。
 * 本数组只定字段与展示顺序，标签文案在字典的 leads.attribution（同名 key）。
 */
const ATTRIBUTION_FIELDS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content",
  "utm_term", "gclid", "fbclid", "ttclid",
] as const satisfies readonly (keyof LeadRow)[];

function AttributionDetail({ row }: { row: LeadRow }) {
  const t = useAdminT().leads.attribution;
  const present = ATTRIBUTION_FIELDS.filter((key) => row[key]);
  if (present.length === 0) {
    return (
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {t.none}
      </Typography.Text>
    );
  }
  return (
    <Space direction="vertical" size={2}>
      {present.map((key) => (
        <span key={key} style={{ fontSize: 12 }}>
          <Typography.Text type="secondary">{t[key]}：</Typography.Text>
          <Typography.Text copyable={{ text: String(row[key]) }}>{String(row[key])}</Typography.Text>
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
  const t = useAdminT().leads.followUp;
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
        placeholder={t.tagsPlaceholder}
        aria-label={t.tagsAria}
        style={{ width: "100%" }}
        maxTagCount={MAX_TAGS}
      />
      <Input.TextArea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t.notePlaceholder}
        aria-label={t.noteAria}
        maxLength={MAX_NOTE_LENGTH}
        autoSize={{ minRows: 2, maxRows: 6 }}
        showCount
      />
      <Button type="primary" size="small" disabled={!dirty} loading={saving} onClick={save}>
        {t.save}
      </Button>
    </Space>
  );
}

/** 分页与筛选走服务端：线索只增不减，一次全量拉取跑久了必然拖垮列表。 */
const PAGE_SIZE = 50;

interface LeadsResponse { rows: LeadRow[]; total: number }

export default function LeadsPage() {
  const { message } = App.useApp();
  const t = useAdminT().leads;
  const locale = useAdminLocale();
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
    { value: "all", label: t.filters.allPages },
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
    message.success(t.toast.deleted);
    void mutate();
  }

  /** 备注 / 标签 / 归档统一走同一个 PATCH；未传的字段不动。 */
  async function patchFollowUp(id: string, body: Record<string, unknown>) {
    const res = await fetch(apiLeadPath(id), {
      method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
    });
    if (!res.ok) { message.error(t.toast.saveFailed); return; }
    void mutate();
    // 标签集合可能因此新增或消失，筛选器候选跟着刷新
    if ("tags" in body) void tags.mutate();
  }

  async function setArchivedFor(r: LeadRow, next: boolean) {
    await patchFollowUp(r.id, { archived: next });
    message.success(next ? t.toast.archived : t.toast.unarchived);
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>{t.title}</Typography.Title>
        <Space wrap>
          <Select
            value={pageId}
            onChange={(v) => changeFilter(() => setPageId(v))}
            options={pageOptions}
            style={{ minWidth: 180 }}
            aria-label={t.filters.byPageAria}
          />
          <Segmented
            value={unreadOnly ? "unread" : "all"}
            onChange={(v) => changeFilter(() => setUnreadOnly(v === "unread"))}
            options={[{ label: t.filters.all, value: "all" }, { label: t.filters.unreadOnly, value: "unread" }]}
          />
          <Select
            value={tag}
            onChange={(v) => changeFilter(() => setTag(v))}
            options={(tags.data ?? []).map((t) => ({ value: t, label: t }))}
            placeholder={t.filters.byTagPlaceholder}
            allowClear
            style={{ minWidth: 150 }}
            aria-label={t.filters.byTagAria}
          />
          {/* 归档区是独立视图：把已处理的线索混进默认列表，归档这个动作就没意义了 */}
          <Segmented
            value={archived ? "archived" : "active"}
            onChange={(v) => changeFilter(() => setArchived(v === "archived"))}
            options={[{ label: t.filters.active, value: "active" }, { label: t.filters.archived, value: "archived" }]}
          />
          <Button
            href={apiLeadsExportPath({ pageId: pageId === "all" ? undefined : pageId, unreadOnly, tag, archived })}
            target="_blank"
          >
            {t.exportCsv}
          </Button>
        </Space>
      </div>
      <LoadErrorAlert error={error} onRetry={() => void mutate()} label={t.loadErrorLabel} />
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
          showTotal: (n) => t.total(n),
        }}
        locale={{ emptyText: unreadOnly || pageId !== "all" ? t.empty.filtered : t.empty.none }}
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
          { title: t.columns.page, dataIndex: "page_name", width: 180, ellipsis: true },
          { title: t.columns.contact, width: 240, render: (_: unknown, r: LeadRow) => <ContactCell row={r} onContacted={() => void markContacted(r)} /> },
          // 列表只给渠道 / 来源 / 广告系列三层；创意、关键词与点击 ID 在展开行里。
          { title: t.columns.source, width: 200, ellipsis: true,
            render: (_: unknown, r: LeadRow) => [r.channel, r.utm_source, r.utm_campaign].filter(Boolean).join(" / ") || "—" },
          { title: t.columns.followUp, width: 220, render: (_: unknown, r: LeadRow) => <FollowUpCell row={r} /> },
          { title: t.columns.notify, width: 160, render: (_: unknown, r: LeadRow) => <NotifyCell row={r} /> },
          { title: t.columns.time, dataIndex: "created_at", width: 180,
            render: (value: string) => formatDateTime(value, locale) },
          { title: t.columns.status, dataIndex: "is_read", width: 90,
            render: (v: boolean) => <Tag color={v ? "default" : "blue"}>{v ? t.read.read : t.read.unread}</Tag> },
          { title: t.columns.actions, width: 180, render: (_: unknown, r: LeadRow) => (
            <Space size="middle">
              <a onClick={() => setRead(r.id, !r.is_read)}>{r.is_read ? t.actions.markUnread : t.actions.markRead}</a>
              <a onClick={() => setArchivedFor(r, !r.archived_at)}>{r.archived_at ? t.actions.unarchive : t.actions.archive}</a>
              <Popconfirm title={t.deleteConfirm.title} okText={t.deleteConfirm.ok} okButtonProps={{ danger: true }} onConfirm={() => remove(r.id)}>
                <a style={{ color: SEMANTIC.error }}>{t.actions.delete}</a>
              </Popconfirm>
            </Space>
          ) },
        ]}
      />
    </Space>
  );
}
