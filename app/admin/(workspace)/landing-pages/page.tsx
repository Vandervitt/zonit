"use client";

import useSWR from "swr";
import Link from "next/link";
import { Table, Button, Tag, Space, Popconfirm, Typography, App } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { landingEditorPath, apiLandingUnpublishPath, apiLandingPagePath, ApiRoutes } from "@/lib/constants";

interface PageRow { id: string; name: string; slug: string | null; status: "draft" | "published"; updated_at: string; }

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

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography.Title level={3} style={{ margin: 0 }}>落地页</Typography.Title>
        <Link href="/admin/editor"><Button type="primary" icon={<PlusOutlined />}>新建</Button></Link>
      </div>
      <Table<PageRow> rowKey="id" loading={isLoading} dataSource={data ?? []}
        locale={{ emptyText: "还没有落地页，点「新建」从模板开始" }}
        columns={[
          { title: "名称", dataIndex: "name", ellipsis: true },
          { title: "状态", dataIndex: "status", width: 110,
            render: (s: PageRow["status"]) => <Tag color={s === "published" ? "green" : "default"}>{s === "published" ? "已发布" : "草稿"}</Tag> },
          { title: "更新时间", dataIndex: "updated_at", width: 200, render: (t: string) => new Date(t).toLocaleString() },
          { title: "操作", width: 240, render: (_: unknown, r: PageRow) => (
            <Space size="middle">
              <Link href={landingEditorPath(r.id)}>编辑</Link>
              {r.status === "published" && r.slug && <a href={`/p/${r.slug}`} target="_blank" rel="noreferrer">预览</a>}
              {r.status === "published" && <a onClick={() => unpublish(r.id)}>取消发布</a>}
              <Popconfirm title="确定删除该落地页？" okText="删除" okButtonProps={{ danger: true }} onConfirm={() => remove(r.id)}>
                <a style={{ color: "#ef4444" }}>删除</a>
              </Popconfirm>
            </Space>
          ) },
        ]} />
    </Space>
  );
}
