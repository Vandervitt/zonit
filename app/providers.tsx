"use client";

import { ReactNode } from "react";
import { SWRConfig } from "swr";
import { Toaster } from "@/components/ui/sonner";
import { fetcher } from "@/lib/api/fetcher";

// 说明：SessionProvider 不在此处（根 layout 包裹所有页面，含公开落地页 /p）。
// 它会在挂载时拉 /api/auth/session；公开落地页无需 session，且在租户域名下该请求
// 被改写返回 HTML 触发 next-auth 的 JSON 解析报错。useSession 仅用于 admin/
// super-admin，故 SessionProvider 下沉到 AdminProviders / SuperAdminProviders。
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}
    >
      {children}
      <Toaster />
    </SWRConfig>
  );
}
