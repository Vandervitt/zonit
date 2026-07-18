// 统一的多租户 host 判定：app 自身域名 vs 租户自有域名。
// 口径与 NEXT_PUBLIC_APP_URL 对齐；未配置时一律按 app 域处理（不识别为租户域）。

export const appHostname = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : null;

/**
 * 以 app 主域为 base 拼接绝对 URL。base 尾部斜杠一律剥掉，
 * 避免环境变量带尾斜杠时产生 `//path`（Next 会 308 重定向，beacon 场景有丢数据风险）。
 */
export function appUrl(path: string, base: string = process.env.NEXT_PUBLIC_APP_URL ?? ""): string {
  return `${base.replace(/\/+$/, "")}${path}`;
}

// 中间件改写租户请求到 /p/{slug} 时，把原始客户域名盖进这个请求头。
// 因为改写后下游读到的 `host` 会变成 app 主域，无法再据此判定租户，故显式透传。
export const TENANT_HOST_HEADER = "x-tenant-host";

/** host 头（可能带端口）→ 纯主机名。 */
export function hostnameOf(host: string | null | undefined): string {
  return (host ?? "").split(":")[0];
}

/**
 * 解析有效租户主机名：改写后的请求优先读中间件盖的 x-tenant-host，
 * 其余情况回退到 host。中间件已保证非改写请求不带该头，故可信。
 */
export function resolveTenantHostname(headers: Headers): string {
  return hostnameOf(headers.get(TENANT_HOST_HEADER) ?? headers.get("host"));
}

/** 是否为 app 自身域名（含其子域名）。未配置 appHostname 时返回 false。 */
export function isAppHost(hostname: string): boolean {
  return (
    appHostname !== null &&
    (hostname === appHostname || hostname.endsWith(`.${appHostname}`))
  );
}

/** 是否为租户自有域名（已配置 appHostname 且非 app 域）。 */
export function isCustomDomain(hostname: string): boolean {
  return appHostname !== null && !isAppHost(hostname);
}
