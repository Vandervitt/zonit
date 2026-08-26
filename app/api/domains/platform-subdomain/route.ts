import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { nanoid } from "nanoid";
import { ApiErrors } from "@/lib/constants";
import {
  getDomainByName,
  getPlatformSubdomain,
  insertDomain,
} from "@/lib/domains-db";
import {
  buildPlatformSubdomain,
  isReservedSubdomain,
  slugifyForSubdomain,
  subdomainFallbackId,
  subdomainSuffix,
} from "@/lib/domains/subdomain";

/** 平台子域根域（如 zapbridge.site）。未配置则该功能整体关闭。 */
const SUBDOMAIN_ROOT = process.env.PLATFORM_SUBDOMAIN_ROOT ?? "";

/** slug 冲突时的重试次数；每次追加一段短随机后缀。 */
const MAX_ATTEMPTS = 5;

/** 无法从标题转出 slug 时的兜底前缀（如 page-x7k2）。 */
const FALLBACK_PREFIX = "page";

/**
 * 分配平台子域（试用期零门槛发布）。
 *
 * 无需调用 Vercel API 逐个注册子域：项目上挂的是通配符域名 `*.{root}`，
 * 所有子域自动路由进来并共用通配符证书。这里只需写一条 domains 记录——
 * 它会被 isCustomDomain 当作租户域，直接走现有解析链路。
 *
 * 幂等：每用户至多一个子域（DB 唯一索引兜底），重复调用返回已有的那个——
 * 这也是「子域名只能设置一次」的实际落地方式：不是另开一个「已锁定」标志位，
 * 而是复用这条本来就有的幂等检查，第二次请求（不管带不带 slug）都会短路返回旧的。
 *
 * 刻意不记 `domain_verified` 里程碑：该事件的语义是「自有域名验证成功」，
 * 掺进平台分配的子域会让上线前后的漏斗不可比。本功能的效果应体现在
 * page_published / first_lead 的抬升上。
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  if (!SUBDOMAIN_ROOT) {
    return NextResponse.json({ error: ApiErrors.SUBDOMAIN_UNAVAILABLE }, { status: 503 });
  }

  // 已有则直接返回，不再分配第二个——见上方函数注释
  const existing = await getPlatformSubdomain(session.user.id);
  if (existing) return NextResponse.json(existing);

  let body: { slug?: unknown; fromTitle?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    /* 空 body：走随机兜底 */
  }

  // 用户自己填的子域名：严格校验，撞名/撞保留字直接报错，不静默换名——
  // 用户是奔着这个具体名字来的，换成 acme-x7k2 不叫「分配成功」，叫把他的选择吃掉了。
  if (typeof body.slug === "string" && body.slug.trim() !== "") {
    const slug = body.slug.trim().toLowerCase();
    if (slug !== slugifyForSubdomain(slug)) {
      return NextResponse.json({ error: ApiErrors.SLUG_INVALID }, { status: 400 });
    }
    if (isReservedSubdomain(slug)) {
      return NextResponse.json({ error: ApiErrors.SLUG_RESERVED }, { status: 400 });
    }
    const host = buildPlatformSubdomain(slug, SUBDOMAIN_ROOT);
    if (!host) {
      return NextResponse.json({ error: ApiErrors.SUBDOMAIN_UNAVAILABLE }, { status: 503 });
    }
    if (await getDomainByName(host)) {
      return NextResponse.json({ error: ApiErrors.SLUG_TAKEN }, { status: 409 });
    }
    try {
      const row = await insertDomain({
        id: nanoid(),
        userId: session.user.id,
        domain: host,
        isPlatformSubdomain: true,
      });
      return NextResponse.json(row, { status: 201 });
    } catch {
      // 并发：两个请求前后脚都通过了上面的查重。此时唯一索引会拒掉后来者，
      // 但拒掉的不一定是本用户这次的请求——查一遍「我现在有没有子域」，
      // 有就是刚才赢了（返回它），没有就是撞给了别人（这个名字真的没了）。
      const mine = await getPlatformSubdomain(session.user.id);
      if (mine) return NextResponse.json(mine);
      return NextResponse.json({ error: ApiErrors.SLUG_TAKEN }, { status: 409 });
    }
  }

  // 未传 slug：保留旧的「按页面标题自动取名」路径，供没有走新版表单的调用方兼容。
  const fromTitle = typeof body.fromTitle === "string" ? body.fromTitle : "";
  const base = slugifyForSubdomain(fromTitle);
  const seed = base && !isReservedSubdomain(base) ? base : null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const slug = seed
      ? (attempt === 0 ? seed : `${seed}-${subdomainSuffix()}`)
      : `${FALLBACK_PREFIX}-${subdomainFallbackId()}`;

    const host = buildPlatformSubdomain(slug, SUBDOMAIN_ROOT);
    if (!host || isReservedSubdomain(slug)) continue;
    if (await getDomainByName(host)) continue;

    try {
      const row = await insertDomain({
        id: nanoid(),
        userId: session.user.id,
        domain: host,
        isPlatformSubdomain: true,
      });
      return NextResponse.json(row, { status: 201 });
    } catch {
      const mine = await getPlatformSubdomain(session.user.id);
      if (mine) return NextResponse.json(mine);
    }
  }

  return NextResponse.json({ error: ApiErrors.SUBDOMAIN_UNAVAILABLE }, { status: 503 });
}

/** 查询当前用户的平台子域（未分配为 null）+ 根域，供前端拼「xxx.{root}」实时预览。 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  const domain = await getPlatformSubdomain(session.user.id);
  return NextResponse.json({ domain, root: SUBDOMAIN_ROOT || null });
}
