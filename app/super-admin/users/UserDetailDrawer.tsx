"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Drawer, Descriptions, Table, Tag, Typography, Spin, Alert, Space, Timeline, Input, Button, App, Empty } from "antd";
import type { PlanId } from "@/lib/plans";
import { PlanBadge } from "@/components/billing/PlanBadge";

interface DetailPage { id: string; name: string; status: string; slug: string | null; bound_domain: string | null }
interface Detail {
  id: string; name: string | null; email: string;
  plan: PlanId; comp_plan: PlanId | null; comp_plan_expires_at: string | null; role: string;
  disabled_at: string | null; created_at: string; billing_provider: string | null; billing_customer_id: string | null;
  leads_count: number; pages: DetailPage[];
  last_seen_at: string | null;
  milestones: { event: string; created_at: string }[];
  ai_jobs: { status: string; reason: string | null; created_at: string }[];
  trial_emails: { stage: string; sent_at: string }[];
  feedback: { source: string; message: string; created_at: string }[];
  notes: { id: string; body: string; author_email: string | null; created_at: string }[];
}

const MILESTONE_LABEL: Record<string, string> = {
  signup: "注册", page_created: "创建落地页", domain_verified: "域名验证",
  page_published: "首次发布", first_lead: "收到首条线索",
};
const TRIAL_STAGE_LABEL: Record<string, string> = {
  t_minus_3: "到期前 3 天提醒", expiry_day: "到期当天", win_back: "到期次日挽回",
};
const AI_STATUS_COLOR: Record<string, string> = { succeeded: "success", failed: "error", pending: "processing" };

const fmt = (iso: string) => dayjs(iso).format("YYYY-MM-DD HH:mm");

// 运营时间线：里程碑、试用邮件、AI 生成、反馈按时间合并成一条线，一眼看出用户走到哪、我们做了什么。
function buildTimeline(d: Detail) {
  const items: { at: string; color: string; label: React.ReactNode }[] = [
    ...d.milestones.map((m) => ({ at: m.created_at, color: "blue", label: MILESTONE_LABEL[m.event] ?? m.event })),
    ...d.trial_emails.map((t) => ({ at: t.sent_at, color: "gray", label: `邮件 · ${TRIAL_STAGE_LABEL[t.stage] ?? t.stage}` })),
    ...d.ai_jobs.map((j) => ({
      at: j.created_at,
      color: j.status === "failed" ? "red" : "green",
      label: <>AI 一键成页 <Tag color={AI_STATUS_COLOR[j.status]}>{j.status}{j.reason ? ` · ${j.reason}` : ""}</Tag></>,
    })),
    ...d.feedback.map((f) => ({ at: f.created_at, color: "orange", label: `反馈（${f.source}）：${f.message}` })),
  ];
  return items.sort((a, b) => a.at.localeCompare(b.at));
}

function NotesSection({ userId, notes, onAdded }: { userId: string; notes: Detail["notes"]; onAdded: () => void }) {
  const { message } = App.useApp();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/super-admin/users/${userId}/notes`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: draft }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setDraft("");
      onAdded();
    } catch {
      message.error("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Space.Compact style={{ width: "100%", marginBottom: 12 }}>
        <Input.TextArea
          aria-label="跟进备注"
          placeholder="记录跟进，如：10-08 已发回访邮件"
          autoSize={{ minRows: 1, maxRows: 4 }}
          maxLength={2000}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="primary" loading={saving} disabled={!draft.trim()} onClick={() => void submit()}>添加</Button>
      </Space.Compact>
      {notes.length === 0 ? (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>暂无跟进记录</Typography.Text>
      ) : (
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          {notes.map((n) => (
            <div key={n.id}>
              <Typography.Text style={{ whiteSpace: "pre-wrap" }}>{n.body}</Typography.Text>
              <Typography.Text type="secondary" style={{ display: "block", fontSize: 11 }}>
                {fmt(n.created_at)} · {n.author_email ?? "已删除的管理员"}
              </Typography.Text>
            </div>
          ))}
        </Space>
      )}
    </>
  );
}

function GiftValue({ plan, expiresAt, nowMs }: { plan: PlanId | null; expiresAt: string | null; nowMs: number }) {
  if (!plan) return <>—</>;
  const expired = Boolean(expiresAt) && dayjs(expiresAt).valueOf() <= nowMs;
  return (
    <Space size={6}>
      <PlanBadge plan={plan} />
      {expired ? (
        <Tag>已过期 · {dayjs(expiresAt).format("YYYY-MM-DD")}</Tag>
      ) : expiresAt ? (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{dayjs(expiresAt).format("YYYY-MM-DD")} 到期</Typography.Text>
      ) : (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>永久</Typography.Text>
      )}
    </Space>
  );
}

export function UserDetailDrawer({
  userId, onClose, onNoteAdded,
}: { userId: string | null; onClose: () => void; onNoteAdded?: () => void }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  // 每次打开（userId 变化）刷新，避免长会话下沿用过时的时间戳误判「已过期」。
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setNowMs(Date.now());
    async function load(id: string) {
      setDetail(null); setError(false); setLoading(true);
      try {
        const res = await fetch(`/api/super-admin/users/${id}`);
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()).user;
        if (active) setDetail(data);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load(userId);
    return () => { active = false; };
  }, [userId, reloadKey]);

  return (
    <Drawer title="用户详情" width={560} open={!!userId} onClose={onClose}>
      {loading && <Spin />}
      {error && <Alert type="error" message="加载失败，请关闭后重试" />}
      {detail && (
        <>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="邮箱">{detail.email}</Descriptions.Item>
            <Descriptions.Item label="名称">{detail.name || "—"}</Descriptions.Item>
            <Descriptions.Item label="付费套餐"><PlanBadge plan={detail.plan} /></Descriptions.Item>
            <Descriptions.Item label="赠送套餐">
              <GiftValue plan={detail.comp_plan} expiresAt={detail.comp_plan_expires_at} nowMs={nowMs} />
            </Descriptions.Item>
            <Descriptions.Item label="收款渠道 / Customer">
              {detail.billing_customer_id ? `${detail.billing_provider ?? "—"} / ${detail.billing_customer_id}` : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {detail.disabled_at ? <Tag color="error">已禁用</Tag> : <Tag color="success">正常</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="注册时间">
              {new Date(detail.created_at).toLocaleString("zh-CN")}
            </Descriptions.Item>
            <Descriptions.Item label="最后活跃">
              {detail.last_seen_at ? fmt(detail.last_seen_at) : "—（活跃记录 2026-10-08 上线后未出现）"}
            </Descriptions.Item>
            <Descriptions.Item label="线索总数">{detail.leads_count}</Descriptions.Item>
          </Descriptions>

          <Typography.Title level={5} style={{ marginTop: 24 }}>跟进备注</Typography.Title>
          <NotesSection
            userId={detail.id}
            notes={detail.notes}
            onAdded={() => { setReloadKey((k) => k + 1); onNoteAdded?.(); }}
          />

          <Typography.Title level={5} style={{ marginTop: 24 }}>运营时间线</Typography.Title>
          {(() => {
            const items = buildTimeline(detail);
            return items.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无记录" />
            ) : (
              <Timeline
                items={items.map((it) => ({
                  color: it.color,
                  children: (
                    <>
                      <Typography.Text type="secondary" style={{ fontSize: 11, display: "block" }}>{fmt(it.at)}</Typography.Text>
                      {it.label}
                    </>
                  ),
                }))}
              />
            );
          })()}

          <Typography.Title level={5} style={{ marginTop: 24 }}>落地页（{detail.pages.length}）</Typography.Title>
          <Table
            size="small" rowKey="id" pagination={false} dataSource={detail.pages}
            columns={[
              { title: "名称", dataIndex: "name" },
              { title: "状态", dataIndex: "status",
                render: (s: string) => <Tag color={s === "published" ? "success" : "default"}>{s}</Tag> },
              { title: "绑定域名", dataIndex: "bound_domain", render: (d: string | null) => d || "—" },
            ]}
          />
        </>
      )}
    </Drawer>
  );
}
