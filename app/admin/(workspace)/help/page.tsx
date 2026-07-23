"use client";

import Link from "next/link";
import { Card, Typography, Space, Row, Col } from "antd";
import { Routes } from "@/lib/constants";
import { HELP_CHAPTERS } from "./_content";

export default function HelpPage() {
  return (
    <Space direction="vertical" size={20} style={{ width: "100%", maxWidth: 960 }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>帮助中心</Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
          从建页到收线索的完整使用指南。新用户建议从「快速上手」开始，按目录顺序读完主链路（前六章）。
        </Typography.Paragraph>
      </div>
      <Row gutter={[16, 16]}>
        {HELP_CHAPTERS.map((c, i) => (
          <Col key={c.slug} xs={24} sm={12} lg={8}>
            <Link href={`${Routes.Help}/${c.slug}`}>
              <Card hoverable size="small" style={{ height: "100%" }}>
                <Typography.Text type="secondary">{String(i + 1).padStart(2, "0")}</Typography.Text>
                <Typography.Title level={5} style={{ marginTop: 4, marginBottom: 4 }}>{c.title}</Typography.Title>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 13 }}>
                  {c.summary}
                </Typography.Paragraph>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
      <Card size="small">
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          没找到答案？发邮件至 support@zapbridge.tech，附上页面链接与问题截图，我们会尽快回复。
        </Typography.Paragraph>
      </Card>
    </Space>
  );
}
