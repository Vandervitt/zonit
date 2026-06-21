"use client";

import Link from "next/link";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { Row, Col, Card, Statistic, Progress, Table, Button, Tag, Space, Typography } from "antd";
import { FileTextOutlined, GlobalOutlined, RobotOutlined, CrownOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { Routes, ApiRoutes, landingEditorPath } from "@/lib/constants";
import { PLANS, type PlanId } from "@/lib/plans";
import type { UsageSummary } from "@/lib/ai/usage-summary";

interface PageRow { id: string; name: string; slug: string | null; status: "draft" | "published"; updated_at: string; }
interface DomainRow { id: string; verified: boolean; }

export default function OverviewPage() {
  const { data: session } = useSession();
  const plan = (session?.user?.plan ?? "free") as PlanId;
  const planCfg = PLANS[plan];

  const pages = useSWR<PageRow[]>(ApiRoutes.LandingPages);
  const domains = useSWR<DomainRow[]>(ApiRoutes.Domains);
  const usage = useSWR<UsageSummary>(ApiRoutes.AiUsage);

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
                <Link href="/admin/editor"><Button type="primary" block icon={<ArrowRightOutlined />}>新建落地页</Button></Link>
                <Link href={Routes.Domains}><Button block>绑定域名</Button></Link>
                <Link href={Routes.Pricing}><Button block type="text">查看套餐</Button></Link>
              </Space>
            </Card>
            <Card><Space align="center"><Tag color="blue">即将上线</Tag>
              <Typography.Text type="secondary">投放分析（访问量 / CTA 点击 / 来源归因）正在路上。</Typography.Text></Space></Card>
          </Space>
        </Col>
      </Row>
    </Space>
  );
}
