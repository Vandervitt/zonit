"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Drawer, Descriptions, Table, Tag, Typography, Spin, Alert, Space } from "antd";
import type { PlanId } from "@/lib/plans";
import { PlanBadge } from "@/components/billing/PlanBadge";

interface DetailPage { id: string; name: string; status: string; slug: string | null; bound_domain: string | null }
interface Detail {
  id: string; name: string | null; email: string;
  plan: PlanId; comp_plan: PlanId | null; comp_plan_expires_at: string | null; role: string;
  disabled_at: string | null; created_at: string; ls_customer_id: string | null;
  leads_count: number; pages: DetailPage[];
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

export function UserDetailDrawer({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!userId) return;
    let active = true;
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
  }, [userId]);

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
            <Descriptions.Item label="LS Customer">{detail.ls_customer_id || "—"}</Descriptions.Item>
            <Descriptions.Item label="状态">
              {detail.disabled_at ? <Tag color="error">已禁用</Tag> : <Tag color="success">正常</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="注册时间">
              {new Date(detail.created_at).toLocaleString("zh-CN")}
            </Descriptions.Item>
            <Descriptions.Item label="线索总数">{detail.leads_count}</Descriptions.Item>
          </Descriptions>

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
