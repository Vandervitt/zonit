export const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

/**
 * Normalize user-entered domain input into a bare hostname.
 * Strips scheme, path, query, port, surrounding whitespace and a trailing dot.
 * Returns the lowercased hostname, or null when it is not a valid domain.
 */
export function normalizeDomain(input: string): string | null {
  const host = input
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, "") // scheme
    .replace(/[/?#].*$/, "") // path / query / fragment
    .replace(/:\d+$/, "") // port
    .replace(/\.$/, ""); // trailing dot

  return DOMAIN_RE.test(host) ? host : null;
}

// Mainland-administered IDN TLDs (punycode): 中国 / 中國 / 公司 / 网络
const MAINLAND_IDN_TLDS = new Set(["xn--fiqs8s", "xn--fiqz9s", "xn--55qx5d", "xn--io0a7i"]);

/**
 * Whether a hostname falls under a mainland-China-administered TLD
 * (.cn and its registry zones, or mainland IDN TLDs). Such domains are
 * subject to ICP-filing / registry suspension risk and cannot be used
 * for publishing landing pages.
 */
export function isMainlandChinaDomain(host: string): boolean {
  const tld = host.toLowerCase().split(".").pop() ?? "";
  return tld === "cn" || MAINLAND_IDN_TLDS.has(tld);
}
