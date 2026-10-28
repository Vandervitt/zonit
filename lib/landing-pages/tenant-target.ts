// lib/landing-pages/tenant-target.ts
//
// 客户域名上的一次请求 → 该渲染哪张已发布页、渲染成落地页还是政策子页。
//
// 这段解析原先在 proxy 里同步查库。proxy 在访客就近区域执行，库在新加坡，
// 欧美访客每次都要为这一次查库付 1.1–1.6 秒；现在由与库同区的页面函数带缓存解析。
import { resolveTenantRouteCached } from "./published-cache";
import { splitPolicyPath, type PolicyKind } from "./policy-paths";

export type TenantTarget = {
  slug: string;
  kind: "landing" | PolicyKind;
  /** 落地页所在路径：canonical、页脚政策链接、政策页「返回」链接都以它为准。 */
  landingPath: string;
};

/** path 须为 normalizeRoutePath 的输出（proxy 已校验形状并透传）。未绑定返回 null。 */
export async function resolveTenantTarget(host: string, path: string): Promise<TenantTarget | null> {
  const slug = await resolveTenantRouteCached(host, path);
  if (slug) return { slug, kind: "landing", landingPath: path };

  // 政策子页（/privacy、/terms）不是独立发布位置，它挂在落地页路径下：
  // /privacy → 根页的政策页，/invisalign/terms → /invisalign 那张页的。
  // 顺序有意 —— 先试精确绑定，客户真把某张页发布在 /privacy 时那张页优先，
  // 政策子页只在该路径没有绑定时才接手。
  const policy = splitPolicyPath(path);
  if (!policy) return null;
  const parentSlug = await resolveTenantRouteCached(host, policy.parentPath);
  if (!parentSlug) return null;
  return { slug: parentSlug, kind: policy.kind, landingPath: policy.parentPath };
}
