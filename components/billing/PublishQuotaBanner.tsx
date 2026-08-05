"use client";
import { Alert, Button, Space } from "antd";
import Link from "next/link";
import { Routes } from "@/lib/constants";
import { useAdminT } from "@/lib/i18n/admin/context";

/**
 * 发布配额超额横幅。
 *
 * 这是主通道，不是补充：平台只知道通知邮件是否交给 Resend，无法确认客户是否收到
 * （docs/lead-capture-channels.md）。自动下线线上页是不可逆的对外影响，只靠邮件
 * 等于可能静默下线。故进后台就必须看得见。
 */
export function PublishQuotaBanner({
  publishedCount,
  limit,
  daysLeft,
}: {
  publishedCount: number;
  limit: number;
  daysLeft: number;
}) {
  const t = useAdminT().domains.quotaBanner;
  const excess = publishedCount - limit;
  const deadline = daysLeft > 0 ? t.deadlineWithin(daysLeft) : t.deadlinePassed;
  return (
    <Alert
      type={daysLeft <= 2 ? "error" : "warning"}
      showIcon
      style={{ marginBottom: 16 }}
      message={daysLeft <= 0 ? t.expiredTitle : t.countdownTitle(daysLeft)}
      description={
        <span>
          {t.body(publishedCount, limit, excess, deadline)}
          <strong>{t.contentSafe}</strong>{t.contentSafeSuffix}
        </span>
      }
      action={
        <Space direction="vertical">
          <Link href={Routes.Billing}>
            <Button size="small" type="primary">{t.upgrade}</Button>
          </Link>
          <Link href={Routes.LandingPages}>
            <Button size="small">{t.managePages}</Button>
          </Link>
        </Space>
      }
    />
  );
}
