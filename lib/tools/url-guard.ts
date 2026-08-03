// lib/tools/url-guard.ts
//
// SSRF 防护：自检器接受任意用户提交的 URL 并在服务端抓取，是教科书级 SSRF 入口。
// 本模块是该功能唯一的地址准入闸门，抓取路径上的每一跳（含重定向）都必须过一遍。
//
// 设计文档：docs/feat_20260802_落地页自检器/design.md 第六节。
// 测试即规格：url-guard.test.ts 按「必须被拒绝」的攻击路径清单编写，改这里先看那里。
//
// ⚠️ 三条最容易写漏、且写漏就等于没防的规则：
//   ① DNS 可返回多条记录 —— 必须**全部**校验，只看第一条等于留后门；
//   ② IPv4-mapped IPv6（`::ffff:127.0.0.1`）必须**解包后按 IPv4 规则判**，
//      只按 IPv6 规则判会直接放过内网地址；
//   ③ 校验通过的是「解析出的 IP」，实际连接必须连那个 IP（见 fetch 侧的 lookup 固定），
//      否则存在 DNS rebinding 的时间差窗口。

import { promises as dns } from "node:dns";
import net from "node:net";

export type UrlRejection =
  | "invalid_url"
  | "scheme_not_https"
  | "credentials_in_url"
  | "port_not_allowed"
  | "ip_literal_host"
  | "private_address"
  | "dns_failed";

export type ParseResult =
  | { ok: true; url: URL }
  | { ok: false; reason: UrlRejection; detail?: string };

export type GuardResult =
  | { ok: true; url: URL; addresses: string[] }
  | { ok: false; reason: UrlRejection; detail?: string };

/** 仅允许 https 的 443 端口。 */
const ALLOWED_PORTS = new Set(["", "443"]);

/**
 * 入口校验（同步，不触发 DNS）。
 * 放在 DNS 之前，避免为一个明显非法的输入去查询解析——既省资源，
 * 也避免把用户输入的任意主机名喂给解析器。
 */
export function parseTargetUrl(raw: string): ParseResult {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  if (url.protocol !== "https:") {
    // http 本身作为「发现项」呈现给用户，而不是去抓取它。
    return { ok: false, reason: "scheme_not_https", detail: url.protocol };
  }
  if (url.username || url.password) {
    return { ok: false, reason: "credentials_in_url" };
  }
  if (!ALLOWED_PORTS.has(url.port)) {
    return { ok: false, reason: "port_not_allowed", detail: url.port };
  }
  // 强制走域名：IP 字面量绕过了「域名 → 解析 → 校验」这条链路上的多数假设。
  // URL 会把 IPv6 主机名保留成 [..] 形式，需去掉方括号再判。
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host) !== 0) {
    return { ok: false, reason: "ip_literal_host", detail: host };
  }
  return { ok: true, url };
}

/** 把 a.b.c.d 转成 32 位无符号整数；非法输入返回 null。 */
function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const v = Number(p);
    if (v > 255) return null;
    n = n * 256 + v;
  }
  return n >>> 0;
}

/** IPv4 拒绝段，见设计文档 6.2。 */
const V4_BLOCKS: [string, number][] = [
  ["0.0.0.0", 8],       // 本网段
  ["10.0.0.0", 8],      // 私网 A
  ["100.64.0.0", 10],   // CGNAT
  ["127.0.0.0", 8],     // 回环
  ["169.254.0.0", 16],  // 链路本地（含云元数据 169.254.169.254）
  ["172.16.0.0", 12],   // 私网 B
  ["192.0.0.0", 24],    // IETF 协议分配
  ["192.168.0.0", 16],  // 私网 C
  ["198.18.0.0", 15],   // 基准测试
  ["224.0.0.0", 4],     // 组播
  ["240.0.0.0", 4],     // 保留（含 255.255.255.255 广播）
];

function isBlockedV4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  if (n === null) return true; // 解析不出来的一律当作不安全
  for (const [base, bits] of V4_BLOCKS) {
    const b = ipv4ToInt(base);
    if (b === null) continue;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    if ((n & mask) >>> 0 === (b & mask) >>> 0) return true;
  }
  return false;
}

/**
 * IPv4-mapped / IPv4-compatible IPv6 的解包。
 * `::ffff:127.0.0.1` 与 `::ffff:7f00:1` 都要能还原成点分十进制。
 */
function unwrapMappedV4(ip: string): string | null {
  const lower = ip.toLowerCase();
  const m = lower.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (m) return m[1];
  const hexForm = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hexForm) {
    const hi = parseInt(hexForm[1], 16);
    const lo = parseInt(hexForm[2], 16);
    return [hi >> 8, hi & 0xff, lo >> 8, lo & 0xff].join(".");
  }
  return null;
}

function isBlockedV6(ip: string): boolean {
  const lower = ip.toLowerCase().split("%")[0]; // 去掉 zone id
  if (lower === "::1" || lower === "::") return true;
  // fc00::/7 唯一本地地址：首字节 fc 或 fd
  if (/^f[cd][0-9a-f]{0,2}:/.test(lower)) return true;
  // fe80::/10 链路本地
  if (/^fe[89ab][0-9a-f]?:/.test(lower)) return true;
  return false;
}

/**
 * 该地址是否应被拦截。**默认拒绝**：任何判断不了的输入都返回 true。
 * 安全判定必须往保守一侧倒，宁可挡掉一个正常站点，不可放过一个内网地址。
 */
export function isBlockedAddress(ip: string): boolean {
  const kind = net.isIP(ip);
  if (kind === 4) return isBlockedV4(ip);
  if (kind === 6) {
    const mapped = unwrapMappedV4(ip);
    // ⚠️ 关键：mapped 形式必须按 IPv4 规则判，否则 ::ffff:127.0.0.1 会被放行
    if (mapped) return isBlockedV4(mapped);
    return isBlockedV6(ip);
  }
  return true;
}

/** 解析主机名的全部 A/AAAA 记录。可注入以便测试。 */
async function defaultResolve(hostname: string): Promise<string[]> {
  const records = await dns.lookup(hostname, { all: true, verbatim: true });
  return records.map((r) => r.address);
}

/**
 * 完整闸门：入口校验 + DNS 解析 + 全部地址校验。
 * 返回的 addresses 是**已校验通过的地址**，抓取时必须连它们，
 * 不得在连接阶段重新解析域名（DNS rebinding）。
 */
export async function guardUrl(
  raw: string,
  opts?: { resolve?: (hostname: string) => Promise<string[]> },
): Promise<GuardResult> {
  const parsed = parseTargetUrl(raw);
  if (!parsed.ok) return parsed;

  const resolve = opts?.resolve ?? defaultResolve;
  let addresses: string[];
  try {
    addresses = await resolve(parsed.url.hostname);
  } catch (e) {
    return { ok: false, reason: "dns_failed", detail: (e as Error).message };
  }
  if (!addresses.length) return { ok: false, reason: "dns_failed", detail: "no records" };

  // 全部记录都要过——只看第一条等于留后门。
  for (const addr of addresses) {
    if (isBlockedAddress(addr)) {
      return { ok: false, reason: "private_address", detail: addr };
    }
  }
  return { ok: true, url: parsed.url, addresses };
}
