"use client";
import { Alert, Button, Space } from "antd";
import Link from "next/link";
import { Routes } from "@/lib/constants";

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
  const excess = publishedCount - limit;
  return (
    <Alert
      type={daysLeft <= 2 ? "error" : "warning"}
      showIcon
      style={{ marginBottom: 16 }}
      message={
        daysLeft <= 0
          ? "已发布页数超出套餐额度，超出部分即将被取消发布"
          : `已发布页数超出套餐额度，还有 ${daysLeft} 天`
      }
      description={
        <span>
          当前 {publishedCount} 张已发布，套餐额度 {limit} 张，超出 {excess} 张。
          已上线的页面暂不受影响，但无法再发布新页面。
          {daysLeft > 0 ? `若 ${daysLeft} 天内仍未处理，` : "宽限期已结束，"}
          我们会自动取消发布超出的部分，优先保留域名根路径与最早发布的页面。
          <strong>只是下线，页面内容不会被删除</strong>，升级套餐后可随时重新发布。
        </span>
      }
      action={
        <Space direction="vertical">
          <Link href={Routes.Billing}>
            <Button size="small" type="primary">升级套餐</Button>
          </Link>
          <Link href={Routes.LandingPages}>
            <Button size="small">管理落地页</Button>
          </Link>
        </Space>
      }
    />
  );
}
