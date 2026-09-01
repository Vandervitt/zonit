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

/**
 * 品牌更名（Zap Bridge → Urgizat）遗留的**平台旧根域**，硬编码而非读环境变量。
 *
 * ⚠️ **这里只能放平台自己拥有的根域，当前只有 zapbridge.tech。**
 * 判据是「这个域名是不是平台的」，不是「名字里有没有 zapbridge」。
 *
 * 曾经误把 zapbridge.xyz 与 zapbridge.com 也列进来，2026-09-01 生产走查发现后果：
 * tenant-proxy 在租户解析**之前**只按 hostname 精确匹配就 308 到平台首页，于是
 * 这些域名下**所有已发布路径**（不只是 apex）全部打不开，而后台域名页仍显示
 * 「已验证 · DNS 已正确配置」、落地页仍显示「已发布」——故障完全静默。
 * 另外 isPlatformOwnedHost 还会因此阻止用户添加自己的域名。
 *
 * ⚠️ 当初加 .xyz 是为了挡机器人探测查库（2026-08-20 Neon 计算配额耗尽故障），
 * **不要再以这个理由把它加回来**：那份事故报告自己已经写了事后修正——真正烧掉
 * 配额的是 Neon 侧 `suspend_timeout_seconds: 0`（计算 24×7 常驻，与流量无关），
 * 且烧的是 preview 分支。见 docs/incident-neon-compute-quota-20260820.md。
 * 无缓存动态页的查库浪费是真的，但那要靠缓存解决，不能靠把别人的域名判给平台。
 *
 * 硬编码而非环境变量：这批域是历史事实、不随部署环境变化。配错或漏配的代价是
 * 静默的，而可配置的收益为零。环境变量仍支持，用于追加本清单之外的根。
 */
export const BRAND_LEGACY_ROOTS = ["zapbridge.tech"] as const;

/**
 * 平台自有根域全集 = 当前根 + 更名遗留根 + 环境变量追加的遗留根。
 *
 * 品牌更名后旧根（如 zapbridge.site）不再分配新子域，但存量子域仍在客户广告里
 * 跑，必须继续解析。遗留根因此只保留两项能力：apex 重定向、阻止用户手动认领。
 * **分配新子域一律只用当前根**，故分配路径不使用本函数。
 *
 * legacy 为逗号分隔，去空白与空项。
 */
export function platformSubdomainRoots(
  current: string | undefined,
  legacy: string | undefined,
): string[] {
  const roots = [current ?? "", ...BRAND_LEGACY_ROOTS, ...(legacy ?? "").split(",")]
    .map((root) => root.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(roots)];
}

/**
 * host 是否属于任一平台根 —— apex 本身或其下的子域。
 *
 * 用于阻止用户手动添加平台自有域名。不拦的话任何人都能占住别人的子域：
 * DNS 验证虽永远不会通过，但 domains.domain 的唯一约束会让真正的分配请求
 * 再也拿不到这个名字。遗留根同样要拦 —— 通配 DNS 仍指向平台，抢注是真风险。
 */
export function isPlatformOwnedHost(hostname: string, roots: readonly string[]): boolean {
  const host = hostname.trim().toLowerCase();
  return roots.some((root) => host === root || isPlatformSubdomainHost(host, root));
}
