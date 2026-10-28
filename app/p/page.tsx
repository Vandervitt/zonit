// app/p/page.tsx
// 客户域名（自有域名与平台子域）上所有页面的唯一入口。proxy 把租户请求改写到这里，
// 并透传客户域名（x-tenant-host）与规范化后的访客路径（x-tenant-path）。
//
// 「这个路径发布了哪张页」在这里解析而不在 proxy：本函数与库同在新加坡且带缓存，
// proxy 则在访客就近区域执行，欧美访客每次跨区查库要 1.1–1.6 秒（2026-10-28 实测）。
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isAppHost, resolveTenantHostname, resolveTenantPath } from "@/lib/host";
import { getPublishedBySlugCached } from "@/lib/landing-pages/published-cache";
import { resolveTenantTarget } from "@/lib/landing-pages/tenant-target";
import { landingMetadata, renderLandingPage } from "./landing";
import { renderTenantPolicyPage, tenantPolicyMetadata } from "./policy";

async function loadTarget() {
  const h = await headers();
  const host = resolveTenantHostname(h);
  // app 主域直连不提供页面托管：客户页面只经自有域名或平台子域访问（两者都不是 appHost）。
  // 非改写请求的 x-tenant-host 已被 proxy 剥除，故 host 在这里可信。
  if (isAppHost(host)) return null;

  const target = await resolveTenantTarget(host, resolveTenantPath(h));
  if (!target) return null;
  const page = await getPublishedBySlugCached(target.slug);
  return page ? { target, page } : null;
}

export async function generateMetadata(): Promise<Metadata> {
  const loaded = await loadTarget();
  if (!loaded) return { robots: { index: false, follow: false } };
  const { target, page } = loaded;
  return target.kind === "landing"
    ? landingMetadata(page, target.landingPath)
    : tenantPolicyMetadata(page, target.kind);
}

export default async function TenantPage() {
  const loaded = await loadTarget();
  if (!loaded) notFound();
  const { target, page } = loaded;
  return target.kind === "landing"
    ? renderLandingPage(page, target.landingPath)
    : renderTenantPolicyPage(page, target.kind, target.landingPath);
}
