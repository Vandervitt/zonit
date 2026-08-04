import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveTenantRoute } from "@/lib/domains-db";
import { isReservedRoutePath, normalizeRoutePath } from "@/lib/domains/route-path";
import { splitPolicyPath } from "@/lib/landing-pages/policy-paths";
import { hostnameOf, isCustomDomain, TENANT_HOST_HEADER, TENANT_PATH_HEADER } from "@/lib/host";

// 这些公开元数据路由按 host 自行生成（app/robots.ts、app/sitemap.ts、
// app/llms.txt），不能被改写到 /p/{slug}，否则会返回落地页 HTML 而非
// robots/sitemap/llms.txt。租户域上 /llms.txt 由路由处理器自行返回 404（Phase B 再做租户版）。
const METADATA_PATHS = new Set(["/robots.txt", "/sitemap.xml", "/llms.txt"]);

// 访客在租户域名上第一方调用的公开 API（留资/埋点）。改写会把 POST 吞成
// 落地页 HTML 200，客户端 res.ok 误判成功而数据静默丢失，故必须放行；
// 仅列访客端点，其余 /api 维持改写，暴露面保持最小。
const PUBLIC_TENANT_API_PATHS = new Set(["/api/leads", "/api/track"]);

// 定时任务：一律不按租户改写。根因已在 isAppHost 修掉（Vercel 部署域名不再被
// 误判为租户域名），这层是纵深防御 —— cron 路由自身用 CRON_SECRET 鉴权，从任何
// host 进来都安全，如此 Vercel 日后再改触发 host 也不会重演「整条编排器静默停摆」。
const CRON_PATH_PREFIX = "/api/cron/";

export async function handleTenancy(req: NextRequest) {
  const hostname = hostnameOf(req.headers.get("host"));

  // Next 内部资源（客户端运行时 chunk、HMR、RSC 数据流等）一律不按租户改写，
  // 否则会把 /_next/webpack-hmr 等改写成 /p/{slug} 页面，导致客户端运行时无法启动、页面不水合。
  if (req.nextUrl.pathname.startsWith("/_next/")) return null;
  if (METADATA_PATHS.has(req.nextUrl.pathname)) return null;
  if (PUBLIC_TENANT_API_PATHS.has(req.nextUrl.pathname)) return null;
  if (req.nextUrl.pathname.startsWith(CRON_PATH_PREFIX)) return null;

  // 子域池的 apex（如 zapbridge.site）不属于任何用户，它只是平台分配子域的根
  // （isPlatformSubdomainHost 对 apex 返回 false）。历史上它曾被当作客户自有域名
  // 绑过一张模板样例页，不拦截的话访客访问根域会看到那张页面，误以为这是某个
  // 品牌的独立站。这里在租户解析之前重定向到平台主域，也顺带保证日后任何遗留
  // 绑定都不会露出来。子域本身不受影响。
  const subdomainRoot = (process.env.PLATFORM_SUBDOMAIN_ROOT ?? "").trim().toLowerCase();
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL;
  if (subdomainRoot && appOrigin && hostname === subdomainRoot) {
    return NextResponse.redirect(new URL("/", appOrigin), 308);
  }

  if (isCustomDomain(hostname)) {
    const path = normalizeRoutePath(req.nextUrl.pathname);

    // 形状不合法（超长、非法字符、超过 2 段）的路径不可能有绑定，直接 404，不查库。
    // 保留路径同理：即使客户绕过发布校验写进了库，也不允许它遮蔽平台自有路由。
    if (!path || isReservedRoutePath(path)) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // 自定义域名 + 路径 → 已发布落地页。未绑定的路径 404（不 fallback 到根页，
    // 见设计决策 D6：静默 fallback 会让每个错误路径都变成一份重复内容）。
    const landingSlug = await resolveTenantRoute(hostname, path);
    if (!landingSlug) {
      // 政策子页（/privacy、/terms）不是独立发布位置，它挂在落地页路径下：
      // /privacy → 根页的政策页，/invisalign/terms → /invisalign 那张页的。
      // 顺序有意 —— 先试精确绑定，客户真把某张页发布在 /privacy 时那张页优先，
      // 政策子页只在该路径没有绑定时才接手。
      const policy = splitPolicyPath(path);
      if (policy) {
        const parentSlug = await resolveTenantRoute(hostname, policy.parentPath);
        if (parentSlug) {
          return rewriteToTenantPage(req, `/p/${parentSlug}/${policy.kind}`, hostname, policy.parentPath);
        }
      }
      return new NextResponse("Not Found", { status: 404 });
    }
    return rewriteToTenantPage(req, `/p/${landingSlug}`, hostname, path);
  }

  return null;
}

/**
 * 改写到内部落地页路由，并透传租户上下文。
 *
 * 改写后下游的 host 会变成 app 主域、pathname 会变成 /p/{slug}，故这里把真实
 * 客户域名与**落地页所在路径**透传给页面/metadata，使租户判定与 canonical 不依赖
 * 被改写污染的 host / path。政策子页透传的同样是落地页路径（不含 /privacy 段）
 * ——它需要据此生成「返回落地页」的链接。
 */
function rewriteToTenantPage(req: NextRequest, target: string, hostname: string, landingPath: string) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(TENANT_HOST_HEADER, hostname);
  requestHeaders.set(TENANT_PATH_HEADER, landingPath);
  return NextResponse.rewrite(new URL(target, req.url), {
    request: { headers: requestHeaders },
  });
}
