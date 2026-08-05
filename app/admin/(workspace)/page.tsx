"use client";

import Link from "next/link";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { Row, Col, Card, Statistic, Progress, Table, Button, Tag, Space, Typography, Steps } from "antd";
import { FileTextOutlined, GlobalOutlined, RobotOutlined, CrownOutlined, ArrowRightOutlined, RocketOutlined } from "@ant-design/icons";
import { Routes, ApiRoutes, landingEditorPath } from "@/lib/constants";
import { PLANS, type PlanId } from "@/lib/plans";
import type { MilestoneEvent } from "@/lib/platform-milestones";
import {
  computeOnboardingSteps,
  isOnboardingComplete,
  type OnboardingStep,
  type OnboardingStepId,
} from "@/lib/onboarding/checklist";
import { TemplatePickerDialog } from "@/landing-editor/components/TemplatePickerDialog";
import type { UsageSummary } from "@/lib/ai/usage-summary";
import { LoadErrorAlert } from "./_shell/LoadErrorAlert";
import { useAdminT, useAdminLocale } from "@/lib/i18n/admin/context";
import { formatDateTime } from "@/lib/i18n/admin";

interface PageRow { id: string; name: string; slug: string | null; status: "draft" | "published"; updated_at: string; }
interface DomainRow { id: string; verified: boolean; is_platform_subdomain?: boolean; }

// 各步的落点。文案在字典的 overview.onboarding.steps（同名 key），
// 判定逻辑（含四步不同源的原因）在 lib/onboarding/checklist.ts。
const STEP_HREF: Record<OnboardingStepId, string> = {
  page_created: Routes.LandingPages,
  publish_address: Routes.Domains,
  page_published: Routes.LandingPages,
  first_lead: Routes.Leads,
};

function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const t = useAdminT().overview.onboarding;
  if (isOnboardingComplete(steps)) return null;
  const current = steps.findIndex((s) => !s.done);
  return (
    <Card
      title={
        <Space>
          <RocketOutlined />
          {t.title}
        </Space>
      }
    >
      <Steps
        size="small"
        current={current}
        items={steps.map((s, i) => ({
          title: s.done ? t.steps[s.id].title : <Link href={STEP_HREF[s.id]}>{t.steps[s.id].title}</Link>,
          description: t.steps[s.id].desc,
          status: s.done ? "finish" : i === current ? "process" : "wait",
        }))}
      />
    </Card>
  );
}

export default function OverviewPage() {
  const t = useAdminT().overview;
  const locale = useAdminLocale();
  const { data: session } = useSession();
  const plan = (session?.user?.plan ?? "free") as PlanId;
  const planCfg = PLANS[plan];

  const pages = useSWR<PageRow[]>(ApiRoutes.LandingPages);
  const domains = useSWR<DomainRow[]>(ApiRoutes.Domains);
  const usage = useSWR<UsageSummary>(ApiRoutes.AiUsage);
  const milestones = useSWR<{ events: MilestoneEvent[] }>(ApiRoutes.Milestones);

  const pageList = pages.data ?? [];
  const published = pageList.filter((p) => p.status === "published").length;
  const drafts = pageList.length - published;
  const domainList = domains.data ?? [];
  const verified = domainList.filter((d) => d.verified).length;
  const pageLimit = planCfg.landingPagesLimit;
  const pagePct = pageLimit === Infinity ? 0 : Math.min(100, Math.round((pageList.length / pageLimit) * 100));

  const u = usage.data;
  const aiUsedText = u ? `${u.page.used}${u.page.limit === null ? "" : ` / ${u.page.limit}`}` : "—";

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <Typography.Title level={3} style={{ margin: 0 }}>{t.title}</Typography.Title>

      <LoadErrorAlert error={pages.error} onRetry={() => void pages.mutate()} label={t.loadError.pages} />
      <LoadErrorAlert error={domains.error} onRetry={() => void domains.mutate()} label={t.loadError.domains} />
      <LoadErrorAlert error={usage.error} onRetry={() => void usage.mutate()} label={t.loadError.usage} />

      {milestones.data && domains.data && (
        <OnboardingChecklist
          steps={computeOnboardingSteps({
            milestones: milestones.data.events,
            domains: domainList.map((d) => ({
              verified: d.verified,
              isPlatformSubdomain: d.is_platform_subdomain === true,
            })),
          })}
        />
      )}

      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title={t.stats.pages} value={pageList.length} prefix={<FileTextOutlined />} />
            <Typography.Text type="secondary">{t.stats.pagesBreakdown(published, drafts)}</Typography.Text></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title={t.stats.domains} value={domainList.length} prefix={<GlobalOutlined />} />
            <Typography.Text type="secondary">{t.stats.domainsVerified(verified)}</Typography.Text></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title={t.stats.aiPages} value={aiUsedText} prefix={<RobotOutlined />} />
            <Typography.Text type="secondary">{t.stats.creditBalance(u?.creditBalance ?? "—")}</Typography.Text></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title={t.stats.plan} value={planCfg.label} prefix={<CrownOutlined />} />
            {pageLimit !== Infinity && <Progress percent={pagePct} size="small" showInfo={false} style={{ marginTop: 8 }} />}
            <Typography.Text type="secondary">
              {t.stats.pageQuota(pageList.length, pageLimit === Infinity ? t.stats.unlimitedSuffix : ` / ${pageLimit}`)}
            </Typography.Text></Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title={t.recent.title} extra={<Link href={Routes.LandingPages}>{t.recent.all}</Link>}>
            <Table<PageRow> rowKey="id" size="small" pagination={false} loading={pages.isLoading}
              dataSource={pageList.slice(0, 5)}
              columns={[
                { title: t.recent.columns.name, dataIndex: "name", ellipsis: true },
                { title: t.recent.columns.status, dataIndex: "status", width: 100,
                  render: (s: PageRow["status"]) => <Tag color={s === "published" ? "green" : "default"}>{s === "published" ? t.recent.published : t.recent.draft}</Tag> },
                { title: t.recent.columns.updatedAt, dataIndex: "updated_at", width: 180,
                  render: (value: string) => formatDateTime(value, locale) },
                { title: t.recent.columns.actions, width: 160, render: (_: unknown, r: PageRow) => (
                  <Space size="small">
                    <Link href={landingEditorPath(r.id)}>{t.recent.edit}</Link>
                    {r.status === "published" && r.slug && <a href={`/p/${r.slug}`} target="_blank" rel="noreferrer">{t.recent.preview}</a>}
                  </Space>
                ) },
              ]} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Card title={t.quickActions.title}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <TemplatePickerDialog><Button type="primary" block icon={<ArrowRightOutlined />}>{t.quickActions.newPage}</Button></TemplatePickerDialog>
                <Link href={Routes.Domains}><Button block>{t.quickActions.connectDomain}</Button></Link>
                <Link href={Routes.Pricing}><Button block type="text">{t.quickActions.viewPlans}</Button></Link>
              </Space>
            </Card>
            <Card title={t.analyticsCard.title}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Typography.Text type="secondary">{t.analyticsCard.description}</Typography.Text>
                <Link href={Routes.Analytics}><Button block icon={<ArrowRightOutlined />}>{t.analyticsCard.cta}</Button></Link>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
    </Space>
  );
}
