// lib/leads/origin-guard.ts
// 公开访客接口（/api/leads、/api/track）的来源校验。
//
// 背景：两个接口都是 `Access-Control-Allow-Origin: *`，而 pageId 完全取自请求体，
// 于是任何人都能往任意页面灌线索/灌埋点——受害者是掏钱投广告的客户，噪音混进
// 收件箱和漏斗数据里还很难分辨。
//
// 口径：浏览器发跨源 POST 必带 Origin，所以「Origin 存在但不属于这个页面」是可以
// 硬拦的；而没有 Origin 的请求（curl、服务端）本来就伪造得了，拦它只是把成本转嫁给
// 正常调用方，故放行——那条路由靠限频与 honeypot 兜。
import pool from "@/lib/db";
import { isAppHost } from "@/lib/host";

/** 域名解析结果的实例内缓存。/api/track 是每次 page_view 都打的热路径，不能逐次查库。 */
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { hosts: Set<string>; expires: number }>();

/** 仅供测试重置缓存。 */
export function __resetOriginCache(): void {
  cache.clear();
}

async function allowedHostsFor(pageId: string): Promise<Set<string>> {
  const hit = cache.get(pageId);
  if (hit && hit.expires > Date.now()) return hit.hosts;

  const res = await pool.query(
    `SELECT domain FROM domains WHERE landing_page_id = $1 AND enabled = true AND verified = true`,
    [pageId],
  );
  const hosts = new Set<string>(res.rows.map((r: { domain: string }) => r.domain.toLowerCase()));
  cache.set(pageId, { hosts, expires: Date.now() + CACHE_TTL_MS });
  return hosts;
}

export interface OriginCheck {
  allowed: boolean;
  /** 通过校验时回显给 ACAO 的来源；null 表示不下发 CORS 头（同源或非浏览器请求）。 */
  echo: string | null;
}

/**
 * 校验请求来源是否属于该落地页。
 * 查库失败一律放行——来源校验是防滥用的，不是防故障的，
 * 让它在库抖动时拦下真实留资等于亲手制造 PR #124 修掉的那类损失。
 */
export async function checkPublicOrigin(pageId: string, origin: string | null): Promise<OriginCheck> {
  if (!origin) return { allowed: true, echo: null };

  let hostname: string;
  try {
    hostname = new URL(origin).hostname.toLowerCase();
  } catch {
    return { allowed: false, echo: null };
  }

  // 平台主域与其子域：预览页、编辑器预览、本地开发都从这里发起
  if (isAppHost(hostname)) return { allowed: true, echo: origin };

  try {
    const hosts = await allowedHostsFor(pageId);
    return hosts.has(hostname) ? { allowed: true, echo: origin } : { allowed: false, echo: null };
  } catch (err) {
    console.error("[origin-guard] 解析页面域名失败，放行本次请求:", err);
    return { allowed: true, echo: origin };
  }
}
