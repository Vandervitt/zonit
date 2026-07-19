"use client";
// 数据接口失败的可见错误态。各列表页此前用 `data ?? []` 渲染，SWR error 被静默吞掉，
// 接口 401/500/断网时表格显示「还没有数据」空态，用户会误以为数据丢失；且全局
// SWRConfig 设 shouldRetryOnError: false，失败后不会自动重试，必须提供手动重试入口。
import { Alert, Button } from "antd";
import { ApiError } from "@/lib/api/fetcher";

export function LoadErrorAlert({
  error,
  onRetry,
  label = "数据",
}: {
  error: unknown;
  onRetry: () => void;
  label?: string;
}) {
  if (!error) return null;
  const detail = error instanceof ApiError ? `（HTTP ${error.status}）` : "";
  return (
    <Alert
      type="error"
      showIcon
      message={`${label}加载失败${detail}，当前显示可能不完整`}
      action={<Button size="small" onClick={onRetry}>重试</Button>}
    />
  );
}
