"use client";

import { useEffect, useState } from "react";
import { Card, Switch, Input, Button, Space, Typography, message, Tag } from "antd";
import { useSession } from "next-auth/react";
import { hasLeadWebhook } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import { useAdminT } from "@/lib/i18n/admin/context";

interface Settings {
  email_enabled: boolean;
  webhook_enabled: boolean;
  webhook_url: string | null;
  hasSecret: boolean;
  weekly_digest_enabled: boolean;
}

export function LeadNotificationSettings() {
  const t = useAdminT().settings.leadNotifications;
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
      message.success(t.saved);
    } catch {
      message.error(t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  if (!s) return null;

  return (
    <Card title={t.title}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Space>
          <Switch checked={s.email_enabled} loading={saving} onChange={(v) => save({ email_enabled: v })} />
          <span>{t.emailToggle(session?.user?.email ?? "")}</span>
        </Space>

        <Space>
          <Switch checked={s.weekly_digest_enabled} loading={saving} onChange={(v) => save({ weekly_digest_enabled: v })} />
          <span>{t.weeklyDigest}</span>
        </Space>

        <div>
          <Space>
            <span>{t.webhookTitle}</span>
            {!webhookAllowed && <Tag color="gold">{t.proTag}</Tag>}
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
                <span>{t.enablePush}</span>
                <Button type="primary" size="small" loading={saving} onClick={() => save({ webhook_url: url })}>
                  {t.saveUrl}
                </Button>
              </Space>
              {s.hasSecret && (
                <Typography.Text type="secondary">
                  {t.secretConfigured[0]}<code>{t.secretConfigured[1]}</code>
                </Typography.Text>
              )}
              {secretOnce && (
                <Typography.Text type="warning">
                  {t.secretOnce}<code>{secretOnce}</code>
                </Typography.Text>
              )}
            </Space>
          ) : (
            <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
              {t.upsell}
            </Typography.Paragraph>
          )}
        </div>
      </Space>
    </Card>
  );
}
