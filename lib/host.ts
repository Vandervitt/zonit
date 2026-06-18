// 统一的多租户 host 判定：app 自身域名 vs 租户自有域名。
// 口径与 NEXT_PUBLIC_APP_URL 对齐；未配置时一律按 app 域处理（不识别为租户域）。

export const appHostname = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : null;

/** host 头（可能带端口）→ 纯主机名。 */
export function hostnameOf(host: string | null | undefined): string {
  return (host ?? "").split(":")[0];
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
