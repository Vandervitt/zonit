"use client";

import { ReactNode } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "./button";
import { ApiError } from "@/lib/api/fetcher";

export interface QueryLike<T> {
  data: T | undefined;
  error: ApiError | Error | undefined;
  isLoading: boolean;
  mutate: () => void;
}

export interface QueryStateProps<T> {
  query: QueryLike<T>;
  /** 子节点：data 一定非 undefined（已通过 loading/error/empty 过滤） */
  children: (data: T) => ReactNode;
  /** 自定义空判定。返回 true 渲染 empty 节点 */
  isEmpty?: (data: T) => boolean;
  /** 自定义 loading；默认居中 spinner */
  loading?: ReactNode;
  /** 自定义错误；默认行内错误 + 重试 */
  error?: (err: ApiError | Error, retry: () => void) => ReactNode;
  /** 自定义空态；isEmpty 命中时渲染 */
  empty?: ReactNode;
}

/**
 * SWR query 三态渲染封装：loading / error / empty / data。
 * 错误统一用行内 UI + 重试按钮（调用 mutate()）。
 */
export function QueryState<T>({
  query,
  children,
  isEmpty,
  loading,
  error,
  empty,
}: QueryStateProps<T>) {
  if (query.error && query.data === undefined) {
    return error ? <>{error(query.error, query.mutate)}</> : <DefaultError error={query.error} retry={query.mutate} />;
  }
  if (query.isLoading && query.data === undefined) {
    return <>{loading ?? <DefaultLoading />}</>;
  }
  if (query.data === undefined) {
    return <>{loading ?? <DefaultLoading />}</>;
  }
  if (isEmpty?.(query.data) && empty !== undefined) {
    return <>{empty}</>;
  }
  return <>{children(query.data)}</>;
}

function DefaultLoading() {
  return (
    <div className="flex items-center justify-center py-16 text-slate-400">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
  );
}

function DefaultError({ error, retry }: { error: ApiError | Error; retry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="w-8 h-8 text-rose-400 mb-3" />
      <p className="text-sm text-slate-700">加载失败</p>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">{error.message}</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={retry}>
        重试
      </Button>
    </div>
  );
}
