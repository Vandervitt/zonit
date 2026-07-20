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

// Major mainland-China DNS providers (NS hostname suffixes). Used only for a
// non-blocking advisory at domain-add time — the core audience legitimately
// registers domains at Aliyun/Tencent while hosting overseas, so this must
// never hard-block. Suffixes match on label boundaries.
const MAINLAND_NS_SUFFIXES = [
  "hichina.com", // Aliyun (万网)
  "alidns.com", // Aliyun cloud DNS
  "dnspod.net", // Tencent DNSPod
  "dnspod.cn",
  "dnsv2.com", // DNSPod enterprise zones
  "dnsv3.com",
  "dnsv4.com",
  "dnsv5.com",
  "dns.com", // 帝恩思
  "xinnet.cn", // 新网
  "xincache.com",
  "myhostadmin.net", // west.cn (西部数码)
  "west263.com",
  "dns.la",
  "22.cn", // 爱名网
  "huaweicloud-dns.com", // Huawei Cloud (含 .cn/.net/.org 变体)
  "huaweicloud-dns.cn",
  "huaweicloud-dns.net",
  "huaweicloud-dns.org",
  "baidubce.com", // Baidu Cloud
];

/**
 * Whether any of the domain's nameservers belongs to a mainland-China DNS
 * provider. Returns the matched provider domain for display, or null.
 */
export function mainlandNsProvider(nameservers: string[]): string | null {
  for (const ns of nameservers) {
    const host = ns.toLowerCase().replace(/\.$/, "");
    for (const suffix of MAINLAND_NS_SUFFIXES) {
      if (host === suffix || host.endsWith(`.${suffix}`)) return suffix;
    }
  }
  return null;
}
