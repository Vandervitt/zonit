"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "./fetcher";

export interface UseMutationOptions<TArgs, TData> {
  /** 成功回调（可用于 mutate(key) 刷新 SWR 缓存） */
  onSuccess?: (data: TData, args: TArgs) => void | Promise<void>;
  /** 错误回调；返回 false 则跳过默认 toast */
  onError?: (error: ApiError, args: TArgs) => void | false | Promise<void | false>;
  /**
   * 失败时弹 toast 行为：
   * - true（默认）→ 弹 error.message
   * - false → 不弹（调用方自行从返回值的 error 处理）
   * - (err) => string → 自定义文案
   */
  errorToast?: boolean | ((error: ApiError) => string);
  /** 是否在失败时让 trigger 抛错；默认 false（trigger 返 undefined） */
  throwOnError?: boolean;
}

export interface UseMutationResult<TArgs, TData> {
  trigger: (args: TArgs) => Promise<TData | undefined>;
  data: TData | undefined;
  error: ApiError | undefined;
  isMutating: boolean;
  reset: () => void;
}

/**
 * 通用 mutation hook：统一三态（idle / pending / success|error），统一错误 toast。
 *
 * - query 类用 SWR；mutation 类（按钮、表单提交）用本 hook
 * - 失败默认 toast.error(err.message)；如需行内显示可关 errorToast
 * - trigger 默认不抛错，失败返 undefined，避免每个 caller 都 try/catch
 */
export function useMutation<TArgs = void, TData = unknown>(
  fn: (args: TArgs) => Promise<TData>,
  options: UseMutationOptions<TArgs, TData> = {},
): UseMutationResult<TArgs, TData> {
  const [data, setData] = useState<TData | undefined>(undefined);
  const [error, setError] = useState<ApiError | undefined>(undefined);
  const [isMutating, setIsMutating] = useState(false);
  // 用 ref 锁住最新 options，避免组件每次 render 重建 trigger 的闭包导致 stale closure
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const trigger = useCallback(async (args: TArgs): Promise<TData | undefined> => {
    setIsMutating(true);
    setError(undefined);
    try {
      const result = await fnRef.current(args);
      setData(result);
      await optionsRef.current.onSuccess?.(result, args);
      return result;
    } catch (err) {
      const apiError = toApiError(err);
      setError(apiError);

      const skipToast = (await optionsRef.current.onError?.(apiError, args)) === false;
      if (!skipToast) {
        const toastOpt = optionsRef.current.errorToast ?? true;
        if (toastOpt !== false) {
          const msg = typeof toastOpt === "function" ? toastOpt(apiError) : apiError.message;
          toast.error(msg);
        }
      }

      if (optionsRef.current.throwOnError) throw apiError;
      return undefined;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(undefined);
    setError(undefined);
    setIsMutating(false);
  }, []);

  return { trigger, data, error, isMutating, reset };
}

function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (err instanceof Error) return new ApiError(0, err.message);
  return new ApiError(0, "未知错误");
}
