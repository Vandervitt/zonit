// 租户路由路径的规范化。
//
// 解析（proxy）与写入（发布接口）必须用同一份规则，否则会出现「发布成功但访问 404」
// 这类最难排查的不一致：库里存 /Services，访客请求 /services，两边都自认没错。
// 规则与 migrations/036 的 domain_routes_path_shape CHECK 约束保持一致。

/** 根路径。域名根即落地页所在位置。 */
export const ROOT_PATH = "/";

/** 与 DB CHECK 约束同源：根，或 1–2 段小写字母数字连字符。 */
const SHAPE = /^(\/[a-z0-9-]+){1,2}$/;

/**
 * 规范化租户路由路径：小写、补前导斜杠、去尾斜杠、折叠重复斜杠。
 * 返回 null 表示该路径不合法（调用方按 404 或校验失败处理）。
 */
export function normalizeRoutePath(input: string): string | null {
  if (!input) return null;

  // 折叠重复斜杠并统一小写；查询串与 hash 不属于 pathname，无需处理。
  let path = input.toLowerCase().replace(/\/{2,}/g, "/");
  if (!path.startsWith("/")) path = `/${path}`;
  // 去尾斜杠，但根路径本身要保留那一个斜杠。
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

  if (path === ROOT_PATH) return ROOT_PATH;
  return SHAPE.test(path) ? path : null;
}

// 平台自有路由，租户不得占用。
//
// 这些在 proxy 里先于租户解析返回（放行名单或 /api 收敛），客户即使发布成功
// 也永远打不开——必须在写入时挡掉，而不是留到运行期变成「发布了但 404」的悬案。
//
// 注意：除 /api 外，其余项的形状本就过不了 normalizeRoutePath（下划线、点号
// 都不在字符集内）。仍显式列出是纵深防御：日后若放宽字符集，这层不会跟着失守。
const RESERVED_PREFIXES = ["/api", "/_next", "/.well-known"];
const RESERVED_EXACT = new Set(["/robots.txt", "/sitemap.xml", "/llms.txt", "/favicon.ico"]);

/** 该路径是否为平台保留。入参应为 normalizeRoutePath 的输出或原始路径。 */
export function isReservedRoutePath(path: string): boolean {
  const p = path.toLowerCase();
  if (RESERVED_EXACT.has(p)) return true;
  return RESERVED_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}
