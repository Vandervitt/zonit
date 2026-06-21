"use client";

import { Card, Collapse, Typography, Space } from "antd";

const FAQ = [
  { key: "1", label: "如何发布落地页到我的域名？", children: <p>在「域名」绑定并验证你的域名，然后在编辑器中点「发布」，选择已验证域名即可。</p> },
  { key: "2", label: "AI 成页额度如何计算？", children: <p>按自然月计算，每月重置；额外 credit 永不过期，月额度用尽后自动消耗 credit。</p> },
  { key: "3", label: "落地页支持哪些转化方式？", children: <p>支持引导访客通过 WhatsApp、电话、邮件、Telegram 等方式联系或留资，不含购物车/支付。</p> },
];

export default function HelpPage() {
  return (
    <Space direction="vertical" size={20} style={{ width: "100%", maxWidth: 760 }}>
      <Typography.Title level={3} style={{ margin: 0 }}>帮助</Typography.Title>
      <Card title="常见问题"><Collapse items={FAQ} defaultActiveKey={["1"]} ghost /></Card>
      <Card title="需要更多帮助？">
        <Typography.Paragraph type="secondary">遇到问题可发邮件至 support@zapbridge.com，我们会尽快回复。</Typography.Paragraph>
      </Card>
    </Space>
  );
}
