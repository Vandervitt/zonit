"use client";

import useSWR from "swr";
import Link from "next/link";
import { Table, Button, Tag, Space, Popconfirm, Typography, App } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { SEMANTIC } from "@/lib/theme/antd-theme";
import {
  landingEditorPath,
  apiLandingUnpublishPath,
  apiLandingPagePath,
  apiLandingDuplicatePath,
  ApiRoutes,
  Routes,
} from "@/lib/constants";
import { TemplatePickerDialog } from "@/landing-editor/components/TemplatePickerDialog";

interface PageRow {
  id: string;
  name: string;
  slug: string | null;
  status: "draft" | "published";
  updated_at: string;
  published_at: string | null;
  bound_domain: string | null;
}

/** 已发布页的草稿是否领先线上快照（发布快照语义下的「有未发布修改」）。 */
function hasUnpublishedChanges(r: PageRow): boolean {
  return r.status === "published" && r.published_at !== null && new Date(r.updated_at) > new Date(r.published_at);
}

export default function LandingPagesPage() {
  const { message } = App.useApp();
  const { data, mutate, isLoading } = useSWR<PageRow[]>(ApiRoutes.LandingPages);

  async function unpublish(id: string) {
    await fetch(apiLandingUnpublishPath(id), { method: "POST" });
    message.success("已取消发布");
    void mutate();
  }
  async function remove(id: string) {
    await fetch(apiLandingPagePath(id), { method: "DELETE" });
    message.success("已删除");
    void mutate();
  }
  async function duplicate(id: string) {
    const res = await fetch(apiLandingDuplicatePath(id), { method: "POST" });
    if (res.status === 403) {
      message.error("已达当前套餐的落地页上限，请升级后再创建");
      window.location.href = Routes.Billing;
      return;
    }
    if (!res.ok) { message.error("复制失败"); return; }
    message.success("已复制为草稿");
    void mutate();
  }
  async function rename(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) { message.error("名称不能为空"); void mutate(); return; }
    const res = await fetch(apiLandingPagePath(id), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    if (!res.ok) { message.error("重命名失败"); void mutate(); return; }
    message.success("已重命名");
    void mutate();
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography.Title level={3} style={{ margin: 0 }}>落地页</Typography.Title>
        <TemplatePickerDialog><Button type="primary" icon={<PlusOutlined />}>新建</Button></TemplatePickerDialog>
      </div>
      <Table<PageRow> rowKey="id" loading={isLoading} dataSource={data ?? []}
        locale={{ emptyText: "还没有落地页，点「新建」从模板开始" }}
        columns={[
          { title: "名称", dataIndex: "name", ellipsis: true,
            render: (name: string, r: PageRow) => (
              <Typography.Text editable={{ onChange: (v) => rename(r.id, v), tooltip: "点击重命名" }} style={{ marginBottom: 0 }}>
                {name}
              </Typography.Text>
            ) },
          { title: "状态", dataIndex: "status", width: 190,
            render: (s: PageRow["status"], r: PageRow) => (
              <Space size={4}>
                <Tag color={s === "published" ? "green" : "default"}>{s === "published" ? "已发布" : "草稿"}</Tag>
                {hasUnpublishedChanges(r) && <Tag color="orange">有未发布修改</Tag>}
              </Space>
            ) },
          { title: "域名", dataIndex: "bound_domain", width: 180, ellipsis: true,
            render: (d: string | null) => d ?? <Typography.Text type="secondary">—</Typography.Text> },
          { title: "更新时间", dataIndex: "updated_at", width: 200, render: (t: string) => new Date(t).toLocaleString() },
          { title: "操作", width: 300, render: (_: unknown, r: PageRow) => (
            <Space size="middle">
              <Link href={landingEditorPath(r.id)}>编辑</Link>
              <a onClick={() => duplicate(r.id)}>复制</a>
              {r.status === "published" && r.bound_domain && (
                <a href={`https://${r.bound_domain}/`} target="_blank" rel="noreferrer">线上查看</a>
              )}
              {r.status === "published" && <a onClick={() => unpublish(r.id)}>取消发布</a>}
              <Popconfirm title="确定删除该落地页？" okText="删除" okButtonProps={{ danger: true }} onConfirm={() => remove(r.id)}>
                <a style={{ color: SEMANTIC.error }}>删除</a>
              </Popconfirm>
            </Space>
          ) },
        ]} />
    </Space>
  );
}
