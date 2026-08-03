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

interface PageRow { id: string; name: string; slug: string | null; status: "draft" | "published"; updated_at: string; }
interface DomainRow { id: string; verified: boolean; is_platform_subdomain?: boolean; }

// 展示层：文案与落点。判定逻辑（含四步不同源的原因）在 lib/onboarding/checklist.ts。
const STEP_COPY: Record<OnboardingStepId, { title: string; desc: string; href: string }> = {
  page_created: { title: "创建落地页", desc: "选行业模板或 AI 一键生成", href: Routes.LandingPages },
  publish_address: { title: "拿到发布地址", desc: "领取免费平台子域，或绑定自有域名", href: Routes.Domains },
  page_published: { title: "发布上线", desc: "页面上线到该地址，即可开始投放", href: Routes.LandingPages },
  first_lead: { title: "收到首条线索", desc: "访客留资后在线索收件箱查看", href: Routes.Leads },
};

function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  if (isOnboardingComplete(steps)) return null;
  const current = steps.findIndex((s) => !s.done);
  return (
    <Card
      title={
        <Space>
          <RocketOutlined />
          4 步上线你的获客落地页
        </Space>
      }
    >
      <Steps
        size="small"
        current={current}
        items={steps.map((s, i) => ({
          title: s.done ? STEP_COPY[s.id].title : <Link href={STEP_COPY[s.id].href}>{STEP_COPY[s.id].title}</Link>,
          description: STEP_COPY[s.id].desc,
          status: s.done ? "finish" : i === current ? "process" : "wait",
        }))}
      />
    </Card>
  );
}

export default function OverviewPage() {
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
      <Typography.Title level={3} style={{ margin: 0 }}>概览</Typography.Title>

      <LoadErrorAlert error={pages.error} onRetry={() => void pages.mutate()} label="落地页数据" />
      <LoadErrorAlert error={domains.error} onRetry={() => void domains.mutate()} label="域名数据" />
      <LoadErrorAlert error={usage.error} onRetry={() => void usage.mutate()} label="AI 用量数据" />

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
          <Card><Statistic title="落地页" value={pageList.length} prefix={<FileTextOutlined />} />
            <Typography.Text type="secondary">已发布 {published} · 草稿 {drafts}</Typography.Text></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="绑定域名" value={domainList.length} prefix={<GlobalOutlined />} />
            <Typography.Text type="secondary">已验证 {verified}</Typography.Text></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="本月 AI 成页" value={aiUsedText} prefix={<RobotOutlined />} />
            <Typography.Text type="secondary">credit 余额 {u?.creditBalance ?? "—"}</Typography.Text></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="当前套餐" value={planCfg.label} prefix={<CrownOutlined />} />
            {pageLimit !== Infinity && <Progress percent={pagePct} size="small" showInfo={false} style={{ marginTop: 8 }} />}
            <Typography.Text type="secondary">
              落地页 {pageList.length}{pageLimit === Infinity ? "（不限）" : ` / ${pageLimit}`}
            </Typography.Text></Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="最近落地页" extra={<Link href={Routes.LandingPages}>全部</Link>}>
            <Table<PageRow> rowKey="id" size="small" pagination={false} loading={pages.isLoading}
              dataSource={pageList.slice(0, 5)}
              columns={[
                { title: "名称", dataIndex: "name", ellipsis: true },
                { title: "状态", dataIndex: "status", width: 100,
                  render: (s: PageRow["status"]) => <Tag color={s === "published" ? "green" : "default"}>{s === "published" ? "已发布" : "草稿"}</Tag> },
                { title: "更新时间", dataIndex: "updated_at", width: 180, render: (t: string) => new Date(t).toLocaleString() },
                { title: "操作", width: 160, render: (_: unknown, r: PageRow) => (
                  <Space size="small">
                    <Link href={landingEditorPath(r.id)}>编辑</Link>
                    {r.status === "published" && r.slug && <a href={`/p/${r.slug}`} target="_blank" rel="noreferrer">预览</a>}
                  </Space>
                ) },
              ]} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Card title="快捷操作">
              <Space direction="vertical" style={{ width: "100%" }}>
                <TemplatePickerDialog><Button type="primary" block icon={<ArrowRightOutlined />}>新建落地页</Button></TemplatePickerDialog>
                <Link href={Routes.Domains}><Button block>绑定域名</Button></Link>
                <Link href={Routes.Pricing}><Button block type="text">查看套餐</Button></Link>
              </Space>
            </Card>
            <Card title="投放分析">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Typography.Text type="secondary">访问量 / CTA 点击 / 来源归因，实时查看落地页表现。</Typography.Text>
                <Link href={Routes.Analytics}><Button block icon={<ArrowRightOutlined />}>查看投放分析</Button></Link>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
    </Space>
  );
}
