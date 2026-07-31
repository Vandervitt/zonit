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
 * 幂等：每用户至多一个子域（DB 唯一索引兜底），重复调用返回已有的那个。
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

  // 已有则直接返回，不再分配第二个
  const existing = await getPlatformSubdomain(session.user.id);
  if (existing) return NextResponse.json(existing);

  let fromTitle = "";
  try {
    fromTitle = (await request.json())?.fromTitle ?? "";
  } catch {
    /* 空 body：走随机兜底 */
  }

  const base = (typeof fromTitle === "string" ? slugifyForSubdomain(fromTitle) : null);
  // 保留字不是错误，静默回退到兜底名即可——用户并没有主动选它
  const seed = base && !isReservedSubdomain(base) ? base : null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // 首次用干净的 slug；冲突后追加短随机后缀
    const slug = seed
      ? (attempt === 0 ? seed : `${seed}-${nanoid(4).toLowerCase()}`)
      : `${FALLBACK_PREFIX}-${nanoid(6).toLowerCase()}`;

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
      // 并发下唯一索引可能刚被别人占走：本用户已有子域则返回它，否则换个 slug 重试
      const mine = await getPlatformSubdomain(session.user.id);
      if (mine) return NextResponse.json(mine);
    }
  }

  return NextResponse.json({ error: ApiErrors.SUBDOMAIN_UNAVAILABLE }, { status: 503 });
}

/** 查询当前用户的平台子域；未分配返回 null。 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  return NextResponse.json(await getPlatformSubdomain(session.user.id));
}
