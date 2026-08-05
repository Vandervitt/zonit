"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Button, Tag, Space, Popconfirm, Typography, Tooltip, Input, Segmented, App } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { SEMANTIC } from "@/lib/theme/antd-theme";
import { FeedbackModal } from "@/components/admin/FeedbackModal";
import type { FeedbackSource } from "@/lib/feedback";
import {
  landingEditorPath,
  apiLandingUnpublishPath,
  apiLandingPagePath,
  apiLandingDuplicatePath,
  apiLandingCheckPath,
  pageCheckReportPath,
  ApiRoutes,
  Routes,
} from "@/lib/constants";
import { TemplatePickerDialog } from "@/landing-editor/components/TemplatePickerDialog";
import { LoadErrorAlert } from "../_shell/LoadErrorAlert";
import { useAdminT, useAdminLocale } from "@/lib/i18n/admin/context";
import { formatDateTime } from "@/lib/i18n/admin";

interface PageRow {
  id: string;
  name: string;
  slug: string | null;
  status: "draft" | "published";
  updated_at: string;
  published_at: string | null;
  bound_domain: string | null;
  bound_path: string | null;
}

/** 已发布页的草稿是否领先线上快照（发布快照语义下的「有未发布修改」）。 */
function hasUnpublishedChanges(r: PageRow): boolean {
  return r.status === "published" && r.published_at !== null && new Date(r.updated_at) > new Date(r.published_at);
}

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
  const t = useAdminT().pages;
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
        message.error(t.toast.quotaReached);
        router.replace(Routes.Billing);
        return;
      }
      if (!res.ok) {
        message.error(t.toast.fromTemplateFailed);
        router.replace(Routes.LandingPages);
        return;
      }
      const row: PageRow = await res.json();
      message.success(t.toast.fromTemplateOk);
      router.replace(landingEditorPath(row.id));
    })();
  }, [searchParams, router, message, t]);

  return null;
}

export default function LandingPagesPage() {
  const { message } = App.useApp();
  const t = useAdminT().pages;
  const locale = useAdminLocale();
  const { data, error, mutate, isLoading } = useSWR<PageRow[]>(ApiRoutes.LandingPages);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  /** 正在自检的页 id——自检要抓取外站，慢到必须给反馈。 */
  const [checking, setChecking] = useState<string | null>(null);
  // 一人管多客户时列表会长到几十行，靠肉眼滚是不可行的。
  // 数据量不大（受套餐额度约束），故筛选放在前端，切换零延迟。
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  const visibleRows = (data ?? []).filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!keyword.trim()) return true;
    const kw = keyword.trim().toLowerCase();
    // 域名也参与匹配：多客户场景下「这个客户的页」往往是按域名回忆的。
    return r.name.toLowerCase().includes(kw) || (r.bound_domain ?? "").toLowerCase().includes(kw);
  });

  async function unpublish(id: string, name: string) {
    const res = await fetch(apiLandingUnpublishPath(id), { method: "POST" });
    if (!res.ok) { message.error(t.toast.unpublishFailed); return; }
    message.success(t.toast.unpublished);
    void mutate();
    setFeedback({ source: "unpublish", title: t.feedback.unpublishTitle, pageId: id, pageName: name });
  }
  async function remove(id: string, name: string) {
    const res = await fetch(apiLandingPagePath(id), { method: "DELETE" });
    if (!res.ok) { message.error(t.toast.deleteFailed); return; }
    message.success(t.toast.deleted);
    void mutate();
    setFeedback({ source: "delete", title: t.feedback.deleteTitle, pageId: id, pageName: name });
  }
  async function duplicate(id: string) {
    const res = await fetch(apiLandingDuplicatePath(id), { method: "POST" });
    if (res.status === 403) {
      message.error(t.toast.quotaReached);
      window.location.href = Routes.Billing;
      return;
    }
    if (!res.ok) { message.error(t.toast.duplicateFailed); return; }
    message.success(t.toast.duplicated);
    void mutate();
  }
  /**
   * 对已发布页跑一次自检，结果直接打开公开报告页。
   *
   * 用同一套检查逻辑而不是另写一份后台版：两处结论必须一致，
   * 否则后台说没问题、营销站的自检器说有问题，用户谁也不信。
   */
  async function runCheck(id: string) {
    setChecking(id);
    try {
      const res = await fetch(apiLandingCheckPath(id), { method: "POST" });
      if (res.status === 429) { message.warning(t.toast.checkRateLimited); return; }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        message.error(body.error === "check_failed" ? t.toast.checkFetchFailed : t.toast.checkFailed);
        return;
      }
      const { id: reportId } = await res.json();
      window.open(pageCheckReportPath(reportId), "_blank", "noopener");
    } finally {
      setChecking(null);
    }
  }

  async function rename(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) { message.error(t.toast.nameEmpty); void mutate(); return; }
    const res = await fetch(apiLandingPagePath(id), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    if (res.status === 409) { message.error(t.toast.nameTaken); void mutate(); return; }
    if (!res.ok) { message.error(t.toast.renameFailed); void mutate(); return; }
    message.success(t.toast.renamed);
    void mutate();
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Suspense fallback={null}>
        <TemplateDeepLink />
      </Suspense>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>{t.title}</Typography.Title>
        <Space wrap>
          <Input.Search
            allowClear
            placeholder={t.search.placeholder}
            aria-label={t.search.ariaLabel}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 220 }}
          />
          <Segmented
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as typeof statusFilter)}
            options={[
              { label: t.filter.all, value: "all" },
              { label: t.filter.published, value: "published" },
              { label: t.filter.draft, value: "draft" },
            ]}
          />
          <TemplatePickerDialog><Button type="primary" icon={<PlusOutlined />}>{t.create}</Button></TemplatePickerDialog>
        </Space>
      </div>
      <LoadErrorAlert error={error} onRetry={() => void mutate()} label={t.loadErrorLabel} />
      <Table<PageRow> rowKey="id" loading={isLoading} dataSource={visibleRows}
        locale={{ emptyText: (data ?? []).length > 0 ? t.empty.filtered : t.empty.none }}
        columns={[
          { title: t.columns.name, dataIndex: "name", ellipsis: true,
            render: (name: string, r: PageRow) => (
              <Typography.Text editable={{ onChange: (v) => rename(r.id, v), tooltip: t.renameTooltip }} style={{ marginBottom: 0 }}>
                {name}
              </Typography.Text>
            ) },
          { title: t.columns.status, dataIndex: "status", width: 190,
            render: (s: PageRow["status"], r: PageRow) => (
              <Space size={4}>
                <Tag color={s === "published" ? "green" : "default"}>{s === "published" ? t.status.published : t.status.draft}</Tag>
                {hasUnpublishedChanges(r) && <Tag color="orange">{t.status.unpublishedChanges}</Tag>}
              </Space>
            ) },
          { title: t.columns.liveUrl, dataIndex: "bound_domain", width: 220, ellipsis: true,
            // 多路径发布后只显示域名会有歧义（同域名可能挂着好几张页），故连路径一起显示。
            render: (d: string | null, r: PageRow) =>
              d ? `${d}${r.bound_path && r.bound_path !== "/" ? r.bound_path : "/"}`
                : <Typography.Text type="secondary">—</Typography.Text> },
          // 时间格式跟随界面语言：此前是裸 toLocaleString()，格式随运行环境漂移。
          { title: t.columns.updatedAt, dataIndex: "updated_at", width: 200,
            render: (value: string) => formatDateTime(value, locale) },
          // 加了「自检」后是 6 个动作，300px 会把每个都折成两行竖排（「编/辑」「自/检」）。
          { title: t.columns.actions, width: 380, render: (_: unknown, r: PageRow) => (
            <Space size="middle">
              <Link href={landingEditorPath(r.id)}>{t.actions.edit}</Link>
              <a onClick={() => duplicate(r.id)}>{t.actions.duplicate}</a>
              {r.status === "published" && r.bound_domain && (
                <a href={`https://${r.bound_domain}${r.bound_path ?? "/"}`} target="_blank" rel="noreferrer">{t.actions.viewLive}</a>
              )}
              {/* 自检只对已发布页开放：检查的必须是访客真正看到的那张页 */}
              {r.status === "published" && r.bound_domain && (
                <Tooltip title={t.actions.checkTooltip}>
                  <a onClick={() => runCheck(r.id)}>{checking === r.id ? t.actions.checking : t.actions.check}</a>
                </Tooltip>
              )}
              {r.status === "published" && (
                <Popconfirm
                  title={t.unpublishConfirm.title}
                  description={r.bound_domain
                    ? t.unpublishConfirm.withDomain(`${r.bound_domain}${r.bound_path ?? "/"}`)
                    : t.unpublishConfirm.withoutDomain}
                  okText={t.unpublishConfirm.ok}
                  okButtonProps={{ danger: true }}
                  onConfirm={() => unpublish(r.id, r.name)}
                >
                  <a>{t.actions.unpublish}</a>
                </Popconfirm>
              )}
              <Popconfirm title={t.deleteConfirm.title} okText={t.deleteConfirm.ok} okButtonProps={{ danger: true }} onConfirm={() => remove(r.id, r.name)}>
                <a style={{ color: SEMANTIC.error }}>{t.actions.delete}</a>
              </Popconfirm>
            </Space>
          ) },
        ]} />
      <FeedbackModal
        open={feedback !== null}
        onClose={() => setFeedback(null)}
        source={feedback?.source ?? "general"}
        title={feedback?.title ?? ""}
        prompt={t.feedback.prompt}
        quickReasons={t.feedback.reasons}
        context={{ pageId: feedback?.pageId, pageName: feedback?.pageName }}
      />
    </Space>
  );
}
