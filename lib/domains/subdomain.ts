// 平台子域（试用期零门槛发布）的纯逻辑：slug 规范化、保留字、host 判定。
//
// 背景：发布的前提本来是「自己有域名 + 会改 DNS」，这一步把没有域名的新用户
// 挡在了「收到第一条线索」之前。平台子域让试用期用户不碰 DNS 就能走完全链路。
//
// 关键：平台子域**就是一条 domains 记录**（verified/enabled 由平台直接置 true），
// 因此 `acme.zapbridge.site` 会被 isCustomDomain 当作租户域，直接走现有解析链路
// ——租户解析、发布、多路径、配额对账全都不需要改。
//
// 本模块刻意不读环境变量、不碰 IO：root 一律由调用方传入，便于穷举边界。

import { customAlphabet } from "nanoid";

/** DNS label 长度上限。 */
const MAX_LABEL_LENGTH = 63;

/**
 * 子域随机串的字母表。
 *
 * 刻意不用 nanoid 默认字母表：它含 `_` 与 `-`，实测约 13% 的 4 位结果会带上，
 * 而 `_` 不是合法的 DNS label 字符、`-` 还可能落在首尾。限定小写字母数字，
 * 从源头保证拼出来的 host 一定合法。
 */
const SUBDOMAIN_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

/** 冲突重试时追加的短后缀（如 acme-x7k2）。 */
export const subdomainSuffix = customAlphabet(SUBDOMAIN_ALPHABET, 4);

/** 标题转不出 slug 时的兜底随机串（如 page-a1b2c3）。 */
export const subdomainFallbackId = customAlphabet(SUBDOMAIN_ALPHABET, 6);

/**
 * 不允许分配给用户的子域名。
 *
 * 前两组是平台自用与将来可能自用的（www / api / admin…），后一组是基础设施惯例名
 * （ns1 / smtp / cdn…）——被占走会挡住以后加邮件、CDN 等能力。
 */
export const RESERVED_SUBDOMAINS: readonly string[] = [
  "www", "api", "admin", "app", "dashboard", "account", "billing", "auth", "login",
  "mail", "smtp", "imap", "pop", "webmail", "email",
  "ns1", "ns2", "dns", "cdn", "static", "assets", "img", "media",
  "blog", "docs", "help", "support", "status", "about",
  "dev", "test", "staging", "preview", "demo", "sandbox",
];

const RESERVED_SET = new Set(RESERVED_SUBDOMAINS);

/**
 * 页面标题 → 子域 slug。转不出合法 slug 时返回 null，由调用方回退到随机名。
 *
 * 只保留 [a-z0-9-]：DNS label 的合法字符集。非 ASCII（如中文标题）会被清空，
 * 这是预期行为——模板文案是英文，但用户可以把标题改成任何语言。
 */
export function slugifyForSubdomain(input: string): string | null {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LABEL_LENGTH)
    // 截断点可能正好落在连字符上，需要再裁一次
    .replace(/-+$/g, "");
  return slug === "" ? null : slug;
}

/** 是否为保留子域名（大小写不敏感）。 */
export function isReservedSubdomain(slug: string): boolean {
  return RESERVED_SET.has(slug.trim().toLowerCase());
}

/**
 * 是否为平台子域 host。
 *
 * 刻意不用 `endsWith(root)`——那会把 `evilzapbridge.site` 与
 * `zapbridge.site.evil.com` 一并放进来。必须匹配 `.{root}` 且 root 在末尾。
 * apex（root 本身）不算子域：它是平台演示位，不属于任何用户。
 * root 为空时一律 false，否则空串会把所有 host 判成子域。
 */
export function isPlatformSubdomainHost(hostname: string, root: string): boolean {
  if (!root) return false;
  const host = hostname.trim().toLowerCase();
  const suffix = `.${root.trim().toLowerCase()}`;
  return host.length > suffix.length && host.endsWith(suffix);
}

/** slug + root → 完整 host。root 未配置时返回 null。 */
export function buildPlatformSubdomain(slug: string, root: string): string | null {
  if (!root) return null;
  return `${slug}.${root.trim().toLowerCase()}`;
}
