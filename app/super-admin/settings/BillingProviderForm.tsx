"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Radio, Button, App, Typography, Space, Tag, Alert } from "antd";
import type { BillingProviderId } from "@/lib/billing/types";

export interface BillingProviderState {
  active: BillingProviderId;
  dodoConfigured: boolean;
  creemConfigured: boolean;
}

export function BillingProviderForm({ initial }: { initial: BillingProviderState }) {
  const router = useRouter();
  const { message } = App.useApp();
  const [value, setValue] = useState<BillingProviderId>(initial.active);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/super-admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ billingProvider: value }),
      });
      if (res.ok) {
        message.success("收款渠道已切换，新结账即刻生效");
        router.refresh();
      } else {
        message.error("切换失败，请重试");
      }
    } catch {
      message.error("切换失败，请检查网络后重试");
    } finally {
      setSaving(false);
    }
  }

  const statusTag = (configured: boolean) =>
    configured ? <Tag color="success">已配置</Tag> : <Tag color="default">未配置</Tag>;

  const dirty = value !== initial.active;
  const selectedUnconfigured =
    (value === "dodo" && !initial.dodoConfigured) || (value === "creem" && !initial.creemConfigured);

  return (
    <Card
      title="收款渠道"
      extra={<Typography.Text type="secondary">控制新结账走哪个 MoR；存量订阅的 webhook 各渠道独立处理</Typography.Text>}
    >
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Radio.Group value={value} onChange={(e) => setValue(e.target.value)}>
          <Space direction="vertical" size={8}>
            <Radio value="dodo">
              <Space>Dodo Payments {statusTag(initial.dodoConfigured)}</Space>
            </Radio>
            <Radio value="creem">
              <Space>Creem {statusTag(initial.creemConfigured)}<Typography.Text type="secondary">（备份，占位）</Typography.Text></Space>
            </Radio>
          </Space>
        </Radio.Group>

        {selectedUnconfigured && (
          <Alert
            type="warning"
            showIcon
            message="所选渠道尚未配置"
            description="切换后用户结账会收到「收款渠道未配置」错误，直到该渠道的环境变量/产品就绪。"
          />
        )}

        <div>
          <Button type="primary" loading={saving} disabled={!dirty} onClick={onSave}>
            保存切换
          </Button>
        </div>
      </Space>
    </Card>
  );
}
