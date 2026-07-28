// 首页按访客 IP 分流语言：中国大陆 → 中文镜像 /zh，其余地区留在英文默认页。
//
// 这条规则推翻了 i18n 设计文档 §4.5 原本「不做任何自动重定向」的决定，但保留了那条
// 决定的实质目的（不污染 canonical / hreflang）——靠下面三道闸：
//   ① 爬虫 UA 一律豁免，搜索与 AI 抓取始终拿到 URL 本身对应的语言版本；
//   ② 只作用于首页文档请求，站内客户端导航（RSC）与其余营销页不受影响；
//   ③ 用户手动切换写下的 cookie 优先于 IP，选择不会被地理位置反复推翻。
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";
import { ZH_PREFIX } from "@/lib/i18n/routes";

export { LOCALE_COOKIE };

/** 判定为「默认中文」的地区。仅大陆：港澳台目前只有简体词典，跳过去并非更好的体验。 */
const ZH_COUNTRIES = new Set(["CN"]);

// 覆盖搜索引擎与 AI 抓取的主流 UA 关键字（小写匹配）。宁可漏判一个小众爬虫
// （它至多拿到一次中文首页），也不能误判真实用户为爬虫而丢掉分流。
const CRAWLER_UA = [
  "googlebot",
  "bingbot",
  "baiduspider",
  "yandexbot",
  "duckduckbot",
  "slurp",
  "applebot",
  "sogou",
  "gptbot",
  "oai-searchbot",
  "chatgpt-user",
  "claudebot",
  "claude-web",
  "anthropic-ai",
  "perplexitybot",
  "ccbot",
  "facebookexternalhit",
  "twitterbot",
  "linkedinbot",
  "whatsapp",
  "telegrambot",
  "bot", // 兜底：未列举的 *bot/*Bot 类 UA
  "spider",
  "crawler",
];

function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) return true; // 无 UA 的多为脚本/探针，按爬虫处理，不参与分流
  const ua = userAgent.toLowerCase();
  return CRAWLER_UA.some((needle) => ua.includes(needle));
}

/**
 * 是否为浏览器发起的顶层文档请求。
 * 必须排除 RSC 请求（`sec-fetch-dest: empty` + `Accept: text/x-component`）：
 * 客户端从 /zh 点「English」链接到 `/` 时，Next 走的是 RSC 取数与预取，
 * 若一并重定向，语言切换器就会被中间件劫回中文，成为死按钮。
 */
function isDocumentRequest(req: NextRequest): boolean {
  const dest = req.headers.get("sec-fetch-dest");
  if (dest) return dest === "document";
  // 老浏览器/被代理剥头时按 Accept 兜底：只有明确要 HTML 才算文档请求。
  return (req.headers.get("accept") ?? "").includes("text/html");
}

/** 读取用户手动选择的语言；未设置或值非法时返回 null，交回 IP 判定。 */
function preferredLocale(req: NextRequest): Locale | null {
  const value = req.cookies.get(LOCALE_COOKIE)?.value;
  return value && isLocale(value) ? value : null;
}

/**
 * 首页语言分流。返回 null 表示不干预，交给后续中间件段。
 * 命中时返回 307（临时跳转，不让浏览器与中间盒把「/ → /zh」永久固化）。
 */
export function handleLocaleGeo(req: NextRequest): NextResponse | null {
  if (req.nextUrl.pathname !== "/") return null;
  if (req.method !== "GET" && req.method !== "HEAD") return null;
  if (!isDocumentRequest(req)) return null;
  if (isCrawler(req.headers.get("user-agent"))) return null;

  const preferred = preferredLocale(req);
  if (preferred === "en") return null;

  const country = req.headers.get("x-vercel-ip-country");
  const wantsZh = preferred === "zh" || (country !== null && ZH_COUNTRIES.has(country));
  if (!wantsZh) return null;

  const res = NextResponse.redirect(new URL(ZH_PREFIX, req.url), 307);
  // 同一 URL 的响应随 IP / cookie 而变，一旦被 CDN 或浏览器缓存，
  // 中文跳转就会被发给全球访客。
  res.headers.set("cache-control", "no-store");
  res.headers.set("vary", "cookie, user-agent");
  return res;
}
