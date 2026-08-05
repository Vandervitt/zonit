"use client";

import Link from "next/link";
import { Card, Typography, Space, Row, Col } from "antd";
import { Routes } from "@/lib/constants";
import { getHelpChapters } from "./_content";
import { useAdminT, useAdminLocale } from "@/lib/i18n/admin/context";

export default function HelpPage() {
  const t = useAdminT().shell.help;
  const chapters = getHelpChapters(useAdminLocale());
  return (
    <Space direction="vertical" size={20} style={{ width: "100%", maxWidth: 960 }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>{t.title}</Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
          {t.intro}
        </Typography.Paragraph>
      </div>
      <Row gutter={[16, 16]}>
        {chapters.map((c, i) => (
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
          {t.noAnswer}
        </Typography.Paragraph>
      </Card>
    </Space>
  );
}
