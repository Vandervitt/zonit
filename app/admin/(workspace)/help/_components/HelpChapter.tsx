"use client";

import Link from "next/link";
import { Typography, Table, Alert, Collapse, Steps, Card, Space, Button } from "antd";
import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { Routes } from "@/lib/constants";
import type { HelpBlock, HelpChapterData, HelpSection } from "../_content/types";
import { getAdjacentChapters } from "../_content";

function BlockView({ block }: { block: HelpBlock }) {
  switch (block.t) {
    case "p":
      return <Typography.Paragraph>{block.text}</Typography.Paragraph>;
    case "list":
      return (
        <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
          {block.items.map((item, i) => (
            <li key={i} style={{ marginBottom: 6, lineHeight: 1.7 }}>{item}</li>
          ))}
        </ul>
      );
    case "steps":
      return (
        <Steps
          direction="vertical"
          size="small"
          current={-1}
          style={{ margin: "8px 0" }}
          items={block.items.map((s) => ({ title: s.title, description: s.desc }))}
        />
      );
    case "table":
      return (
        <Table
          size="small"
          pagination={false}
          style={{ margin: "8px 0" }}
          scroll={{ x: true }}
          columns={block.head.map((h, i) => ({
            title: h,
            dataIndex: `c${i}`,
            key: `c${i}`,
            // 首列常为名词短语，避免换行；其余列自适应
            width: i === 0 ? 160 : undefined,
          }))}
          dataSource={block.rows.map((row, ri) => ({
            key: ri,
            ...Object.fromEntries(row.map((cell, ci) => [`c${ci}`, cell])),
          }))}
        />
      );
    case "callout":
      return (
        <Alert
          type={block.tone === "warning" ? "warning" : block.tone === "success" ? "success" : "info"}
          showIcon
          message={block.text}
          style={{ margin: "8px 0" }}
        />
      );
    case "faq":
      return (
        <Collapse
          ghost
          style={{ margin: "8px 0" }}
          items={block.items.map((item, i) => ({
            key: String(i),
            label: item.q,
            children: <Typography.Paragraph style={{ marginBottom: 0 }}>{item.a}</Typography.Paragraph>,
          }))}
        />
      );
  }
}

function SectionView({ section }: { section: HelpSection }) {
  return (
    <section id={section.id}>
      <Typography.Title level={4} style={{ marginTop: 8 }}>{section.heading}</Typography.Title>
      {section.blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
    </section>
  );
}

export function HelpChapter({ chapter }: { chapter: HelpChapterData }) {
  const { prev, next } = getAdjacentChapters(chapter.slug);
  return (
    <Space direction="vertical" size={16} style={{ width: "100%", maxWidth: 860 }}>
      <Card>
        <Typography.Title level={3} style={{ marginTop: 0 }}>{chapter.title}</Typography.Title>
        {chapter.intro && <Typography.Paragraph type="secondary">{chapter.intro}</Typography.Paragraph>}
        {chapter.sections.map((s) => (
          <SectionView key={s.id} section={s} />
        ))}
      </Card>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        {prev ? (
          <Link href={`${Routes.Help}/${prev.slug}`}>
            <Button icon={<ArrowLeftOutlined />}>{prev.title}</Button>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`${Routes.Help}/${next.slug}`}>
            <Button iconPosition="end" icon={<ArrowRightOutlined />}>{next.title}</Button>
          </Link>
        ) : (
          <span />
        )}
      </Space>
    </Space>
  );
}
