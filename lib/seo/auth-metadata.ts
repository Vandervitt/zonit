// 登录/注册页的营销 metadata。
// 独立于 components/auth/*View.tsx——那两个是 "use client" 模块，从中导出 metadata
// 构造器会把整棵客户端组件树拖进 server 侧的 metadata 求值路径。
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Routes } from "@/lib/constants";
import { marketingMetadata } from "./site";

export function loginMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale).auth.login;
  return marketingMetadata({
    locale,
    title: t.metaTitle,
    description: t.metaDescription,
    path: Routes.Login,
  });
}

export function registerMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale).auth.register;
  return marketingMetadata({
    locale,
    title: t.metaTitle,
    description: t.metaDescription,
    path: Routes.Register,
  });
}
