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

export interface UserRow {
  key: string; id: string; name: string; email: string;
  plan: PlanId; compPlan: PlanId | null;
  compPlanExpiresAt: string | null; compExpired: boolean;
  effective: PlanId;
  role: string; disabled: boolean; pageCount: number; createdAt: string;
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

export function SuperAdminUsersClient({ rows }: { rows: UserRow[] }) {
  const router = useRouter();
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

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return rows;
    return rows.filter((r) => r.email.toLowerCase().includes(kw) || r.name.toLowerCase().includes(kw));
  }, [rows, keyword]);

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
          {row.compPlan && row.compExpired && (
            <Tooltip title={`赠送 ${PLANS[row.compPlan].label} 已于 ${row.compPlanExpiresAt ? dayjs(row.compPlanExpiresAt).format("YYYY-MM-DD") : ""} 到期`}>
              <Tag>已过期</Tag>
            </Tooltip>
          )}
        </Space>
      ),
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
    { title: "注册时间", dataIndex: "createdAt", key: "createdAt",
      render: (v: string) => <Typography.Text type="secondary" style={{ fontSize: 12 }}>{v}</Typography.Text>,
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
          生效套餐取「付费套餐」与「赠送套餐」中的较高档；Lemon Squeezy 订阅事件只覆写付费套餐，不影响赠送。
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
                { value: "starter", label: "Starter" },
                { value: "pro", label: "Pro" },
                { value: "agency", label: "Agency" },
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

      <UserDetailDrawer userId={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}
