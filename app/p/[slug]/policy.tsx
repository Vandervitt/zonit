// app/p/[slug]/policy.tsx
// 租户政策子页（/privacy、/terms）的共同实现。两个 page.tsx 只是薄壳，
// 因为 Next 的路由段必须由目录表达，而这两张页除 kind 外逐行相同。
//
// 访客看到的地址是客户域名下的 `/privacy` 或 `/invisalign/privacy`；
// 中间件把它改写到这里，并把落地页所在路径透传为 x-tenant-path（见 tenant-proxy）。
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PolicyDocument } from "@/landing-renderer/PolicyDocument";
import { getPublishedBySlug } from "@/lib/landing-pages/store";
import { resolveCompanyInfo } from "@/lib/company-profiles/resolve";
import { isAppHost, resolveTenantHostname, resolveTenantPath } from "@/lib/host";
import type { PolicyKind } from "@/lib/landing-pages/policy-paths";

const TITLES: Record<PolicyKind, string> = {
  privacy: "Privacy Policy",
  terms: "Terms of Service",
};

async function loadTenantPage(params: Promise<{ slug: string }>) {
  const h = await headers();
  // 与落地页同一条守卫：app 主域直连不提供页面托管。
  if (isAppHost(resolveTenantHostname(h))) return null;
  const { slug } = await params;
  return (await getPublishedBySlug(slug)) ?? null;
}

/**
 * 政策页恒 noindex：正文与落地页页脚同源，被索引就是一份跨租户的薄重复内容。
 * 平台要求的是「访客与审核能打开」，从不要求它被搜索引擎收录。
 */
export async function tenantPolicyMetadata(
  params: Promise<{ slug: string }>,
  kind: PolicyKind,
): Promise<Metadata> {
  const page = await loadTenantPage(params);
  if (!page) return { robots: { index: false, follow: false } };
  return {
    title: `${TITLES[kind]} · ${page.data.footer.brandName}`,
    robots: { index: false, follow: false },
  };
}

export async function renderTenantPolicyPage(
  params: Promise<{ slug: string }>,
  kind: PolicyKind,
) {
  const page = await loadTenantPage(params);
  if (!page) notFound();

  const homeHref = resolveTenantPath(await headers());
  const companyInfo = await resolveCompanyInfo(page.data.footer.companyProfileId, page.user_id);

  return (
    <PolicyDocument
      footer={page.data.footer}
      kind={kind}
      homeHref={homeHref}
      companyInfo={companyInfo}
    />
  );
}
