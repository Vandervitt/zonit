/**
 * App Router 的 RSC 预取 URL 屏蔽规则。
 *
 * `<Link>` 预取会给每个页面派生一个带 `?_rsc=<hash>` 的孪生 URL，用来区分
 * HTML 与 RSC 响应变体（见 Next 文档 01-app/02-guides/cdn-caching.md）。该 hash
 * 随构建变化，因此每次部署都会再生一整批新 URL——爬虫把抓取预算耗在这些
 * payload 上，真正的新页面就排不上队（2026-08-11 实测：其他文件类型占 75%，
 * HTML 仅 9%，「发现」目的仅 4%，78 个页面从未被抓取）。
 *
 * 屏蔽是安全的：`_rsc` 只服务客户端导航预取，爬虫抓 HTML 从不需要它。
 */
export const RSC_PREFETCH_DISALLOW = "/*?_rsc=";
