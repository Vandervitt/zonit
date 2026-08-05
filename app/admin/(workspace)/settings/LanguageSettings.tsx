"use client";

import { useState } from "react";
import { App, Card, Radio, Typography } from "antd";
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
      {/*
        用 Radio.Group 而不是 Segmented：后者渲染出的 <input type="radio"> 没有可访问名
        （title 挂在兄弟 div 上），屏幕阅读器读不出这两个选项分别是什么，
        键盘与语音控制用户也无从选择。观感差异由 optionType="button" 抹平。
      */}
      <Radio.Group
        value={locale}
        disabled={saving}
        onChange={(e) => change(e.target.value as Locale)}
        optionType="button"
        buttonStyle="solid"
        aria-label={t.settings.language.label}
      >
        {/* 选项名恒为该语言的自称（English / 简体中文），不随当前界面语言翻译——
            看不懂当前界面的用户正是最需要这个控件的人。 */}
        {locales.map((l) => (
          <Radio.Button key={l} value={l} aria-label={t.settings.language.options[l]}>
            {t.settings.language.options[l]}
          </Radio.Button>
        ))}
      </Radio.Group>
    </Card>
  );
}
