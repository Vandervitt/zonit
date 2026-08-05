"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "../config";
import { getAdminDictionary, type AdminDictionary } from ".";

// 后台 9 个业务页里 8 个是整页 `"use client"`，且 layout.tsx 拿不到 children 的 props
// 通道（children 由 Next 路由系统注入）。逐页传 locale 不可行，Context 是唯一现实路线。
const AdminLocaleContext = createContext<{ locale: Locale; t: AdminDictionary } | null>(null);

/**
 * 后台语言上下文。`locale` 由服务端（layout）解析后以 prop 注入——
 * 客户端不自己判断语言，避免 SSR 与水合两侧算出不同结果导致闪烁。
 */
export function AdminLocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ locale, t: getAdminDictionary(locale) }), [locale]);
  return <AdminLocaleContext.Provider value={value}>{children}</AdminLocaleContext.Provider>;
}

function useAdminLocaleContext() {
  const ctx = useContext(AdminLocaleContext);
  // 不静默回退到默认语言：漏包 Provider 的页面会整页退回英文，而这在中文用户那里
  // 表现为"偶尔有一页是英文"，极难定位。直接抛错让它在开发期就暴露。
  if (!ctx) throw new Error("useAdminT/useAdminLocale 必须在 AdminLocaleProvider 内使用");
  return ctx;
}

/** 取后台字典。用法：`const t = useAdminT(); t.shell.signOut` */
export function useAdminT(): AdminDictionary {
  return useAdminLocaleContext().t;
}

/** 取当前语言。仅在需要把 locale 传给格式化函数或接口时用。 */
export function useAdminLocale(): Locale {
  return useAdminLocaleContext().locale;
}
