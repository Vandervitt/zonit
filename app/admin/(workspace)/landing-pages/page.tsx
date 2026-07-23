"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Button, Tag, Space, Popconfirm, Typography, App } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { SEMANTIC } from "@/lib/theme/antd-theme";
import { FeedbackModal } from "@/components/admin/FeedbackModal";
import type { FeedbackSource } from "@/lib/feedback";
import {
  landingEditorPath,
  apiLandingUnpublishPath,
  apiLandingPagePath,
  apiLandingDuplicatePath,
  ApiRoutes,
  Routes,
} from "@/lib/constants";
import { TemplatePickerDialog } from "@/landing-editor/components/TemplatePickerDialog";
import { LoadErrorAlert } from "../_shell/LoadErrorAlert";

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

// 流失点反馈的快捷原因（取消发布 / 删除共用）。
const CHURN_REASONS = ["太复杂 / 不好用", "效果不好 / 没收到线索", "改用其他工具了", "只是先试试 / 暂时不用", "其他原因"];

interface FeedbackState {
  source: FeedbackSource;
  title: string;
  pageId: string;
  pageName: string;
}

/**
 * 公开模板画廊深链：/admin/landing-pages?template=<id> 直接按该模板建草稿并进编辑器。
 * useSearchParams 需要 Suspense 边界，故独立成子组件挂载。
 */
function TemplateDeepLink() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { message } = App.useApp();
  const fired = useRef(false);

  useEffect(() => {
    const templateId = searchParams.get("template");
    if (!templateId || fired.current) return;
    fired.current = true;
    void (async () => {
      const res = await fetch(ApiRoutes.LandingPages, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      if (res.status === 403) {
        message.error("已达当前套餐的落地页上限，请升级后再创建");
        router.replace(Routes.Billing);
        return;
      }
      if (!res.ok) {
        message.error("从模板创建失败，请重试");
        router.replace(Routes.LandingPages);
        return;
      }
      const row: PageRow = await res.json();
      message.success("已从模板创建草稿");
      router.replace(landingEditorPath(row.id));
    })();
  }, [searchParams, router, message]);

  return null;
}

export default function LandingPagesPage() {
  const { message } = App.useApp();
  const { data, error, mutate, isLoading } = useSWR<PageRow[]>(ApiRoutes.LandingPages);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  async function unpublish(id: string, name: string) {
    const res = await fetch(apiLandingUnpublishPath(id), { method: "POST" });
    if (!res.ok) { message.error("取消发布失败"); return; }
    message.success("已取消发布");
    void mutate();
    setFeedback({ source: "unpublish", title: "为什么取消发布？", pageId: id, pageName: name });
  }
  async function remove(id: string, name: string) {
    const res = await fetch(apiLandingPagePath(id), { method: "DELETE" });
    if (!res.ok) { message.error("删除失败"); return; }
    message.success("已删除");
    void mutate();
    setFeedback({ source: "delete", title: "为什么删除这个页面？", pageId: id, pageName: name });
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
    if (res.status === 409) { message.error("该名称已被其他落地页使用"); void mutate(); return; }
    if (!res.ok) { message.error("重命名失败"); void mutate(); return; }
    message.success("已重命名");
    void mutate();
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Suspense fallback={null}>
        <TemplateDeepLink />
      </Suspense>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography.Title level={3} style={{ margin: 0 }}>落地页</Typography.Title>
        <TemplatePickerDialog><Button type="primary" icon={<PlusOutlined />}>新建</Button></TemplatePickerDialog>
      </div>
      <LoadErrorAlert error={error} onRetry={() => void mutate()} label="落地页列表" />
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
              {r.status === "published" && (
                <Popconfirm
                  title="确定取消发布？"
                  description={r.bound_domain ? `线上页面将立即从 ${r.bound_domain} 下线，若有广告在投请先确认。` : "线上页面将立即下线。"}
                  okText="取消发布"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => unpublish(r.id, r.name)}
                >
                  <a>取消发布</a>
                </Popconfirm>
              )}
              <Popconfirm title="确定删除该落地页？" okText="删除" okButtonProps={{ danger: true }} onConfirm={() => remove(r.id, r.name)}>
                <a style={{ color: SEMANTIC.error }}>删除</a>
              </Popconfirm>
            </Space>
          ) },
        ]} />
      <FeedbackModal
        open={feedback !== null}
        onClose={() => setFeedback(null)}
        source={feedback?.source ?? "general"}
        title={feedback?.title ?? ""}
        prompt="一句话帮我们改进，只有创始人会看到（选填）。"
        quickReasons={CHURN_REASONS}
        context={{ pageId: feedback?.pageId, pageName: feedback?.pageName }}
      />
    </Space>
  );
}
