"use client";

import { useState } from "react";
import { App, Card, Segmented, Typography } from "antd";
import { useAdminT, useAdminLocale } from "@/lib/i18n/admin/context";
import { locales, type Locale } from "@/lib/i18n/config";

export function LanguageSettings() {
  const t = useAdminT();
  const locale = useAdminLocale();
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);

  async function change(next: Locale) {
    if (next === locale || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/locale", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      if (!res.ok) throw new Error(String(res.status));
      // 整页重载而非 router.refresh()：语言变了之后 antd 的 ConfigProvider、
      // dayjs 全局 locale 和整棵字典都要换掉，重载是唯一能保证三者一致的方式。
      // 切语言是低频操作，这点代价换确定性划算。
      window.location.reload();
    } catch {
      message.error(t.settings.language.saveFailed);
      setSaving(false);
    }
  }

  return (
    <Card title={t.settings.language.title}>
      <Typography.Paragraph type="secondary">{t.settings.language.description}</Typography.Paragraph>
      <Segmented<Locale>
        value={locale}
        disabled={saving}
        onChange={change}
        // 选项名恒为该语言的自称（English / 简体中文），不随当前界面语言翻译——
        // 看不懂当前界面的用户正是最需要这个控件的人。
        options={locales.map((l) => ({ label: t.settings.language.options[l], value: l }))}
        aria-label={t.settings.language.label}
      />
    </Card>
  );
}
