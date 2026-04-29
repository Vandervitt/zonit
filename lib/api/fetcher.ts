/**
 * 全局 fetch 封装。
 * - 非 2xx 抛 ApiError，body 内含后端 JSON（用于业务码映射）
 * - 用作 SWR 的 fetcher，也用作 useMutation 的底层 HTTP 工具
 */

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | undefined;

  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  /** 后端约定的业务错误码（如 "domain_taken"）。无则返 undefined。 */
  get code(): string | undefined {
    return this.body?.error;
  }
}

export interface ApiErrorBody {
  error?: string;
  [key: string]: unknown;
}

export async function fetcher<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, init);
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => undefined) : undefined;

  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "error" in body && typeof body.error === "string")
        ? body.error
        : `HTTP ${res.status}`;
    throw new ApiError(res.status, message, body as ApiErrorBody | undefined);
  }

  return body as T;
}

/** 便捷的 JSON POST/PUT/PATCH/DELETE，自动加 Content-Type。 */
export function jsonRequest<T = unknown>(
  input: RequestInfo | URL,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<T> {
  return fetcher<T>(input, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
