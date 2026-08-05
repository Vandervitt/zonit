"use client";
// 数据接口失败的可见错误态。各列表页此前用 `data ?? []` 渲染，SWR error 被静默吞掉，
// 接口 401/500/断网时表格显示「还没有数据」空态，用户会误以为数据丢失；且全局
// SWRConfig 设 shouldRetryOnError: false，失败后不会自动重试，必须提供手动重试入口。
import { Alert, Button } from "antd";
import { ApiError } from "@/lib/api/fetcher";
import { useAdminT } from "@/lib/i18n/admin/context";

export function LoadErrorAlert({
  error,
  onRetry,
  label,
}: {
  error: unknown;
  onRetry: () => void;
  /** 出错的数据名（「落地页列表」等），已本地化。缺省时用字典的通用兜底词。 */
  label?: string;
}) {
  const t = useAdminT().common;
  if (!error) return null;
  const status = error instanceof ApiError ? error.status : null;
  return (
    <Alert
      type="error"
      showIcon
      message={t.loadError(label ?? t.loadErrorFallbackLabel, status)}
      action={<Button size="small" onClick={onRetry}>{t.retry}</Button>}
    />
  );
}
