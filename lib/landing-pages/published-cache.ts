import { unstable_cache, revalidateTag } from "next/cache";
import { getPublishedBySlug } from "./store";
import type { LandingPageRow } from "./store";
import { getUserPlan } from "@/lib/plans-db";
import type { PlanId } from "@/lib/plans";

/**
 * 已发布落地页的读缓存。
 *
 * # 为什么需要
 *
 * `app/p/[slug]` 用 `headers()` 读租户域名，因此整页强制动态渲染，每次访问都要查库。
 * 2026-08-20 这条路径把 Neon 计算配额烧穿导致全站 500：一个每 60 秒一次打在遗留域
 * 的探测就足以让计算永不挂起。详见 docs/incident-neon-compute-quota-20260820.md。
 *
 * # 为什么是 unstable_cache 而不是 `use cache`
 *
 * Next 16 推荐 `use cache`，但它需要全局开启 `cacheComponents`，那会改变整个应用的
 * 渲染模型。**修一次线上故障不该顺带动全局渲染行为**，故沿用当前版本仍支持的
 * `unstable_cache`。日后整体迁移 Cache Components 时，这里是明确的替换点。
 *
 * # 为什么缓存数据层而不是整页
 *
 * 整页 ISR 会丢掉按租户域名分流的逻辑（同一 slug 在不同域名下有不同的 host 上下文）。
 * 缓存这一层则与 host 无关：`published_data` 只由 slug 决定。
 *
 * # ⚠️ 失效是这里最容易出错的地方
 *
 * 加缓存前，全项目零处 revalidate —— 因为从来没有缓存。所以**每一个会改变
 * 「这个 slug 对公众是否可见、看到什么」的写入点，都必须调用 invalidatePublishedPage**。
 * 漏一个的后果不是变慢，是内容该消失却还在：
 *
 * - 发布            → 内容要换成新快照
 * - 取消发布        → 页面要下线
 * - 配额自动下线    → 同上
 * - **账号被禁用**  → 该用户所有页面必须立刻从公网消失（超管封禁能力，
 *                     `getPublishedBySlug` 里的 `u.disabled_at IS NULL` 就是为它写的）
 *
 * 禁用账号时不知道要失效哪些 slug，故提供 `invalidateAllPublishedPages()` 走共享 tag。
 */

/** 所有已发布页共享的 tag，用于「不知道具体是哪些 slug」的批量失效（如禁用账号）。 */
const ALL_TAG = "published-pages";

/**
 * 失效档位：**立即过期，不用 stale-while-revalidate**。
 *
 * Next 16 推荐 `revalidateTag(tag, "max")`，语义是「标记为陈旧，下次访问先供旧内容、
 * 后台再取新的」。**那个语义在这里是错的**：本模块的失效点包含「禁用账号」与
 * 「取消发布」，它们要求内容立刻从公网消失，多供一次旧内容就是一次真实的合规事故。
 *
 * 文档为「立即生效」指向 `updateTag`，但它只能在 Server Actions 里调用，
 * 而我们的失效点都在 Route Handler 与 cron 里，用不了。
 * 故显式传 `{ expire: 0 }`：牺牲一点首次访问延迟，换取失效的确定性。
 */
const IMMEDIATE = { expire: 0 } as const;

/** 单个 slug 的 tag。 */
function slugTag(slug: string): string {
  return `published-page:${slug}`;
}

/**
 * 按 slug 读已发布页面（带缓存）。
 *
 * revalidate 设 300 秒是兜底而非主要手段：正常情况下由 tag 精确失效，
 * 这个时间只用于兜住「漏调了某个失效点」的情况——把一次静默的内容不一致
 * 限制在 5 分钟内，而不是永久。
 */
export function getPublishedBySlugCached(slug: string): Promise<LandingPageRow | null> {
  return unstable_cache(() => getPublishedBySlug(slug), ["published-by-slug", slug], {
    tags: [ALL_TAG, slugTag(slug)],
    revalidate: 300,
  })();
}

/** 单个 slug 的可见性或内容发生变化后调用。slug 为空时退化为全量失效。 */
export function invalidatePublishedPage(slug: string | null | undefined): void {
  if (!slug) {
    invalidateAllPublishedPages();
    return;
  }
  revalidateTag(slugTag(slug), IMMEDIATE);
}

/**
 * 失效全部已发布页。
 *
 * 用于影响面无法按 slug 枚举的操作——典型是禁用账号：封禁必须立刻生效，
 * 宁可多失效一些缓存，也不能让被禁账号的页面继续对公众可见。
 */
export function invalidateAllPublishedPages(): void {
  revalidateTag(ALL_TAG, IMMEDIATE);
}

/** 套餐缓存的 tag：套餐变化影响水印与埋点门控，与页面内容各自独立失效。 */
function planTag(userId: string): string {
  return `user-plan:${userId}`;
}

/**
 * 取 owner 生效套餐（带缓存）。渲染已发布页时用于门控水印与埋点。
 *
 * ⚠️ **这个值带时间依赖**：`getUserPlan` 内部用 `new Date()` 判断赠送套餐
 * （comp_plan）是否过期。缓存意味着赠送套餐到期后，最长 300 秒内仍按旧档渲染
 * （典型表现：水印该出现而没出现）。
 *
 * 接受这个偏差，理由是代价不对称：过期瞬间的几分钟宽限对客户无害，
 * 而不缓存就等于每次访问都查 users 表——正是烧穿配额的那条路径之一。
 * 付费降档等主动变更仍应显式调用 `invalidateUserPlan` 立即生效。
 */
export function getUserPlanCached(userId: string): Promise<PlanId> {
  return unstable_cache(() => getUserPlan(userId), ["user-plan", userId], {
    tags: [ALL_TAG, planTag(userId)],
    revalidate: 300,
  })();
}

/** 套餐发生变化（升级、降档、赠送、禁用）后调用。 */
export function invalidateUserPlan(userId: string): void {
  revalidateTag(planTag(userId), IMMEDIATE);
}

/**
 * ⚠️ 有一个数据**刻意不缓存**：`resolveCompanyInfo`（页脚经营主体）。
 *
 * 它按 `footer.companyProfileId` 现查现渲染，是为了让客户改一次主体信息，
 * 所有引用它的已发布页立即跟上、无需逐页重发（见 app/p/[slug]/page.tsx 的注释）。
 * 缓存它会破坏这个语义。**别顺手把它也加进来。**
 */
