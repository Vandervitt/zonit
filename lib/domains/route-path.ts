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
