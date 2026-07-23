"use client";

import { useEffect, useState } from "react";
import { Card, Switch, Input, Button, Space, Typography, message, Tag } from "antd";
import { useSession } from "next-auth/react";
import { hasLeadWebhook } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

interface Settings {
  email_enabled: boolean;
  webhook_enabled: boolean;
  webhook_url: string | null;
  hasSecret: boolean;
  weekly_digest_enabled: boolean;
}

export function LeadNotificationSettings() {
  const { data: session } = useSession();
  const plan = (session?.user?.plan ?? "free") as PlanId;
  const webhookAllowed = hasLeadWebhook(plan);
  const [s, setS] = useState<Settings | null>(null);
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [secretOnce, setSecretOnce] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/lead-notifications")
      .then((r) => r.json())
      .then((d) => {
        setS(d);
        setUrl(d.webhook_url ?? "");
      })
      .catch(() => {});
  }, []);

  async function save(next: Partial<Settings>) {
    if (!s) return;
    setSaving(true);
    try {
      const res = await fetch("/api/lead-notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_enabled: next.email_enabled ?? s.email_enabled,
          webhook_enabled: next.webhook_enabled ?? s.webhook_enabled,
          webhook_url: next.webhook_url !== undefined ? next.webhook_url : url,
          weekly_digest_enabled: next.weekly_digest_enabled ?? s.weekly_digest_enabled,
        }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setS(d);
      setUrl(d.webhook_url ?? "");
      if (d.secret) setSecretOnce(d.secret);
      message.success("已保存");
    } catch {
      message.error("保存失败");
    } finally {
      setSaving(false);
    }
  }

  if (!s) return null;

  return (
    <Card title="线索通知">
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Space>
          <Switch checked={s.email_enabled} loading={saving} onChange={(v) => save({ email_enabled: v })} />
          <span>新线索邮件通知（发送到 {session?.user?.email}）</span>
        </Space>

        <Space>
          <Switch checked={s.weekly_digest_enabled} loading={saving} onChange={(v) => save({ weekly_digest_enabled: v })} />
          <span>每周获客周报（每周一汇总各页曝光 / CTA 点击 / 线索）</span>
        </Space>

        <div>
          <Space>
            <span>Webhook 推送到 CRM / Zapier</span>
            {!webhookAllowed && <Tag color="gold">Pro 及以上</Tag>}
          </Space>
          {webhookAllowed ? (
            <Space direction="vertical" size={8} style={{ width: "100%", marginTop: 8 }}>
              <Input
                placeholder="https://your-crm.com/webhook"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={saving}
              />
              <Space>
                <Switch checked={s.webhook_enabled} loading={saving} onChange={(v) => save({ webhook_enabled: v })} />
                <span>启用推送</span>
                <Button type="primary" size="small" loading={saving} onClick={() => save({ webhook_url: url })}>
                  保存 URL
                </Button>
              </Space>
              {s.hasSecret && (
                <Typography.Text type="secondary">
                  签名密钥已配置，请求头 <code>X-Zap-Bridge-Signature: sha256=…</code>
                </Typography.Text>
              )}
              {secretOnce && (
                <Typography.Text type="warning">
                  签名密钥（仅显示一次，请复制）：<code>{secretOnce}</code>
                </Typography.Text>
              )}
            </Space>
          ) : (
            <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
              升级到 Pro 后可把新线索实时推送到你的 CRM / Zapier / Make。
            </Typography.Paragraph>
          )}
        </div>
      </Space>
    </Card>
  );
}
