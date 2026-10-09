"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs, { type Dayjs } from "dayjs";
import type { PlanId } from "@/lib/plans";
import { PLAN_ORDER, PLANS } from "@/lib/plans";
import { UserRole } from "@/lib/constants";
import { PlanBadge } from "@/components/billing/PlanBadge";
import {
  Table, Tag, Typography, Space, Input, Dropdown, Button, Modal, Select,
  Segmented, DatePicker, message, Tooltip,
} from "antd";
import { MoreOutlined, SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { InviteUserDialog } from "@/components/admin/InviteUserDialog";
import { UserDetailDrawer } from "./UserDetailDrawer";
import {
  activationStage, daysUntil, matchesView, OPS_VIEWS,
  type ActivationStage, type OpsFacts, type OpsView,
} from "@/lib/super-admin/user-ops";

const STAGE_META: Record<ActivationStage, { label: string; color: string }> = {
  signup: { label: "仅注册", color: "default" },
  page_created: { label: "已建页", color: "blue" },
  page_published: { label: "已发布", color: "cyan" },
  first_lead: { label: "已收线索", color: "green" },
};

const VIEW_LABEL: Record<OpsView, string> = {
  all: "全部",
  stuck_no_page: "注册 3 天未建页",
  published_no_lead: "发布 7 天无线索",
  trial_ending: "赠送 3 天内到期",
  dormant: "14 天未活跃",
};

const DAY_MS = 86400_000;

/** 相对时间。以服务端渲染时刻为基准，避免水合不匹配。 */
function relativeDays(iso: string, nowMs: number): string {
  const d = Math.floor((nowMs - new Date(iso).getTime()) / DAY_MS);
  return d <= 0 ? "今天" : `${d} 天前`;
}

export interface UserRow {
  key: string; id: string; name: string; email: string;
  plan: PlanId; compPlan: PlanId | null;
  compPlanExpiresAt: string | null; compExpired: boolean;
  effective: PlanId;
  role: string; disabled: boolean; pageCount: number;
  createdAt: string; lastSeenAt: string | null;
  milestones: OpsFacts["milestones"]; publishedAt: string | null; lastLeadAt: string | null;
  paid: boolean;
  latestNote: { body: string; at: string } | null;
  /** 内部账号：不计入运营统计。超管恒为内部（internalLocked），不可取消。 */
  internal: boolean; internalLocked: boolean;
}

// 快捷时长预设（天，字符串值）；"custom" 走日期选择器。
type CompDuration = "7" | "15" | "30" | "90" | "custom";

/** 由预设/自定义算出赠送到期 ISO（目标日的当天结束）。 */
function resolveExpiryIso(duration: CompDuration, customDate: Dayjs | null): string | null {
  const target = duration === "custom" ? customDate : dayjs().add(Number(duration), "day");
  return target ? target.endOf("day").toISOString() : null;
}

async function patchUser(id: string, body: Record<string, unknown>): Promise<boolean> {
  const res = await fetch(`/api/super-admin/users/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.ok;
}

function toFacts(r: UserRow): OpsFacts {
  return {
    createdAt: r.createdAt, lastSeenAt: r.lastSeenAt, milestones: r.milestones,
    publishedAt: r.publishedAt, lastLeadAt: r.lastLeadAt,
    compExpiresAt: r.compExpired ? null : r.compPlanExpiresAt,
    paid: r.paid, disabled: r.disabled, internal: r.internal,
  };
}

export function SuperAdminUsersClient({
  rows, nowIso, initialView = "all",
}: { rows: UserRow[]; nowIso: string; initialView?: OpsView }) {
  const router = useRouter();
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const nowMs = now.getTime();
  const [view, setView] = useState<OpsView>(initialView);
  const [keyword, setKeyword] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [compTarget, setCompTarget] = useState<UserRow | null>(null);
  const [compValue, setCompValue] = useState<PlanId | "none">("none");
  const [compDuration, setCompDuration] = useState<CompDuration>("30");
  const [compCustomDate, setCompCustomDate] = useState<Dayjs | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const compExpiryIso = resolveExpiryIso(compDuration, compCustomDate);

  function openGift(row: UserRow) {
    setCompTarget(row);
    setCompValue(row.compPlan && !row.compExpired ? row.compPlan : "none");
    // 编辑仍有效的赠送：默认落到「自定义」并回显当前到期日；否则默认 30 天。
    if (row.compPlan && !row.compExpired && row.compPlanExpiresAt) {
      setCompDuration("custom");
      setCompCustomDate(dayjs(row.compPlanExpiresAt));
    } else {
      setCompDuration("30");
      setCompCustomDate(null);
    }
  }

  const viewCounts = useMemo(
    () => Object.fromEntries(OPS_VIEWS.map((v) => [v, rows.filter((r) => matchesView(toFacts(r), v, now)).length])) as Record<OpsView, number>,
    [rows, now],
  );

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return rows.filter((r) =>
      matchesView(toFacts(r), view, now) &&
      (!kw || r.email.toLowerCase().includes(kw) || r.name.toLowerCase().includes(kw)));
  }, [rows, keyword, view, now]);

  async function apply(id: string, body: Record<string, unknown>, okMsg: string) {
    setSavingId(id);
    try {
      const ok = await patchUser(id, body);
      if (ok) { message.success(okMsg); router.refresh(); }
      else message.error("操作失败，请重试");
    } catch {
      message.error("操作失败，请检查网络后重试");
    } finally {
      setSavingId(null);
    }
  }

  const columns: ColumnsType<UserRow> = [
    { title: "邮箱", key: "email",
      render: (_, row) => (
        <div>
          <Typography.Text strong style={{ display: "block", fontSize: 13 }}>{row.name || "—"}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{row.email}</Typography.Text>
        </div>
      ),
    },
    { title: "角色", dataIndex: "role", key: "role",
      filters: [
        { text: "超管", value: UserRole.SUPER_ADMIN },
        { text: "普通用户", value: UserRole.USER },
      ],
      onFilter: (v, row) => row.role === v,
      render: (role: string) => (
        <Tag color={role === UserRole.SUPER_ADMIN ? "blue" : "default"}>
          {role === UserRole.SUPER_ADMIN ? "超管" : "用户"}
        </Tag>
      ),
    },
    { title: "生效套餐", key: "effective",
      filters: PLAN_ORDER.map((p) => ({ text: PLANS[p].label, value: p })),
      onFilter: (v, row) => row.effective === v,
      render: (_, row) => (
        <Space size={4}>
          <PlanBadge plan={row.effective} />
          {row.compPlan && !row.compExpired && row.effective === row.compPlan && (
            <Tooltip
              title={`付费档 ${PLANS[row.plan].label}，超管赠送 ${PLANS[row.compPlan].label}${
                row.compPlanExpiresAt ? `，${dayjs(row.compPlanExpiresAt).format("YYYY-MM-DD")} 到期` : "（永久）"
              }`}
            >
              <Tag color="gold">赠送</Tag>
            </Tooltip>
          )}
          {row.compPlan && !row.compExpired && !row.paid && (() => {
            const d = daysUntil(row.compPlanExpiresAt, now);
            return d === null ? null : <Tag color={d <= 3 ? "error" : "default"}>剩 {d} 天</Tag>;
          })()}
          {row.compPlan && row.compExpired && (
            <Tooltip title={`赠送 ${PLANS[row.compPlan].label} 已于 ${row.compPlanExpiresAt ? dayjs(row.compPlanExpiresAt).format("YYYY-MM-DD") : ""} 到期`}>
              <Tag>已过期</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    { title: "统计", dataIndex: "internal", key: "internal",
      filters: [
        { text: "计入统计", value: false },
        { text: "内部账号", value: true },
      ],
      onFilter: (v, row) => row.internal === v,
      render: (internal: boolean, row) =>
        internal ? (
          <Tooltip title={row.internalLocked ? "超管恒视为内部账号" : "已标记为内部账号，不计入概览统计"}>
            <Tag color="purple">内部</Tag>
          </Tooltip>
        ) : null,
    },
    { title: "状态", dataIndex: "disabled", key: "disabled",
      filters: [
        { text: "正常", value: false },
        { text: "已禁用", value: true },
      ],
      onFilter: (v, row) => row.disabled === v,
      render: (disabled: boolean) =>
        disabled ? <Tag color="error">已禁用</Tag> : <Tag color="success">正常</Tag>,
    },
    { title: "激活阶段", key: "stage",
      filters: Object.entries(STAGE_META).map(([k, v]) => ({ text: v.label, value: k })),
      onFilter: (v, row) => activationStage(row.milestones) === v,
      render: (_, row) => {
        const m = STAGE_META[activationStage(row.milestones)];
        return <Tag color={m.color}>{m.label}</Tag>;
      },
    },
    { title: "注册时间", dataIndex: "createdAt", key: "createdAt",
      sorter: (a, b) => a.createdAt.localeCompare(b.createdAt),
      render: (v: string) => (
        <Tooltip title={dayjs(v).format("YYYY-MM-DD HH:mm")}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{relativeDays(v, nowMs)}</Typography.Text>
        </Tooltip>
      ),
    },
    { title: "最后活跃", dataIndex: "lastSeenAt", key: "lastSeenAt",
      sorter: (a, b) => (a.lastSeenAt ?? "").localeCompare(b.lastSeenAt ?? ""),
      render: (v: string | null) =>
        v ? (
          <Tooltip title={dayjs(v).format("YYYY-MM-DD HH:mm")}>
            <Typography.Text style={{ fontSize: 12 }}>{relativeDays(v, nowMs)}</Typography.Text>
          </Tooltip>
        ) : (
          <Tooltip title="活跃记录于 2026-10-08 上线，此后未出现过">
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>—</Typography.Text>
          </Tooltip>
        ),
    },
    { title: "跟进", key: "note", width: 200,
      render: (_, row) =>
        row.latestNote ? (
          <Tooltip title={row.latestNote.body}>
            <Typography.Text ellipsis style={{ fontSize: 12, maxWidth: 190, display: "block" }}>
              {dayjs(row.latestNote.at).format("MM-DD")} {row.latestNote.body}
            </Typography.Text>
          </Tooltip>
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>—</Typography.Text>
        ),
    },
    { title: "落地页数", dataIndex: "pageCount", key: "pageCount", align: "center",
      render: (count: number) => <Tag color="default">{count}</Tag>,
    },
    { title: "操作", key: "actions", align: "right",
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => setDetailId(row.id)}>详情</Button>
          <Dropdown
            menu={{
              items: [
                { key: "comp", label: "赠送套餐" },
                row.role === UserRole.SUPER_ADMIN
                  ? { key: "demote", label: "取消超管" }
                  : { key: "promote", label: "设为超管" },
                ...(row.internalLocked
                  ? []
                  : [row.internal
                      ? { key: "external", label: "取消内部标记" }
                      : { key: "internal", label: "标记为内部账号" }]),
                { type: "divider" as const },
                row.disabled
                  ? { key: "enable", label: "启用账号" }
                  : { key: "disable", label: "禁用账号", danger: true },
              ],
              onClick: ({ key }) => {
                if (key === "comp") openGift(row);
                if (key === "promote" || key === "demote") {
                  Modal.confirm({
                    title: key === "promote" ? "设为超管？" : "取消超管？",
                    content: `${row.email} 的角色将变更为${key === "promote" ? "超级管理员" : "普通用户"}。`,
                    onOk: () => apply(row.id, { role: key === "promote" ? UserRole.SUPER_ADMIN : UserRole.USER }, "角色已更新"),
                  });
                }
                if (key === "disable") {
                  Modal.confirm({
                    title: "禁用该账号？",
                    content: "将禁止其登录，并下线其全部已发布落地页（公网访问 404）。可随时重新启用。",
                    okButtonProps: { danger: true },
                    onOk: () => apply(row.id, { disabled: true }, "已禁用"),
                  });
                }
                if (key === "internal") void apply(row.id, { isInternal: true }, "已标记为内部账号");
                if (key === "external") void apply(row.id, { isInternal: false }, "已取消内部标记");
                if (key === "enable") void apply(row.id, { disabled: false }, "已启用");
              },
            }}
          >
            <Button size="small" icon={<MoreOutlined />} loading={savingId === row.id} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <Typography.Title level={2} style={{ margin: 0 }}>用户管理</Typography.Title>
          <Typography.Text type="secondary">管理平台用户、套餐赠送与账号状态</Typography.Text>
        </div>
        <Space>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索邮箱 / 名称"
            style={{ width: 240 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <InviteUserDialog />
        </Space>
      </div>

      <Segmented
        style={{ marginBottom: 16 }}
        value={view}
        onChange={(v) => setView(v as OpsView)}
        options={OPS_VIEWS.map((v) => ({ value: v, label: `${VIEW_LABEL[v]} (${viewCounts[v]})` }))}
      />

      <Table columns={columns} dataSource={filtered} rowKey="key"
        pagination={{ pageSize: 20, showSizeChanger: false }} size="middle" />

      <Modal
        title={compTarget ? `赠送套餐 — ${compTarget.email}` : "赠送套餐"}
        open={!!compTarget}
        confirmLoading={savingId === compTarget?.id}
        okButtonProps={{ disabled: compValue !== "none" && compDuration === "custom" && !compCustomDate }}
        onCancel={() => setCompTarget(null)}
        onOk={async () => {
          if (!compTarget) return;
          const body =
            compValue === "none"
              ? { compPlan: null }
              : { compPlan: compValue, compPlanExpiresAt: compExpiryIso };
          await apply(compTarget.id, body, "赠送套餐已更新");
          setCompTarget(null);
        }}
      >
        <Typography.Paragraph type="secondary">
          生效套餐取「付费套餐」与「赠送套餐」中的较高档；收款渠道的订阅事件只覆写付费套餐，不影响赠送。
        </Typography.Paragraph>
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>套餐</Typography.Text>
            <Select
              style={{ width: "100%" }}
              value={compValue}
              onChange={setCompValue}
              options={[
                { value: "none", label: "无赠送" },
                // 赠送只对付费档有意义；跟随 PLAN_ORDER，套餐增减时不必再改这里。
                ...PLAN_ORDER.filter((p) => p !== "free").map((p) => ({ value: p, label: PLANS[p].label })),
              ]}
            />
          </div>

          {compValue !== "none" && (
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>有效期</Typography.Text>
              {compTarget?.compPlan && !compTarget.compExpired && !compTarget.compPlanExpiresAt && (
                <Typography.Text type="warning" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
                  当前为永久赠送；保存将改为下面选定的有效期。
                </Typography.Text>
              )}
              <Segmented
                value={compDuration}
                onChange={(v) => setCompDuration(v as CompDuration)}
                options={[
                  { label: "7 天", value: "7" },
                  { label: "15 天", value: "15" },
                  { label: "30 天", value: "30" },
                  { label: "90 天", value: "90" },
                  { label: "自定义", value: "custom" },
                ]}
              />
              {compDuration === "custom" && (
                <DatePicker
                  style={{ display: "block", marginTop: 10 }}
                  value={compCustomDate}
                  onChange={setCompCustomDate}
                  disabledDate={(d) => d.isBefore(dayjs().startOf("day"))}
                  placeholder="选择到期日期"
                />
              )}
              <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8 }}>
                {compExpiryIso
                  ? `到期：${dayjs(compExpiryIso).format("YYYY-MM-DD")}（含当天）`
                  : "请选择到期日期"}
              </Typography.Text>
            </div>
          )}
        </Space>
      </Modal>

      <UserDetailDrawer userId={detailId} onClose={() => setDetailId(null)} onNoteAdded={() => router.refresh()} />
    </div>
  );
}
