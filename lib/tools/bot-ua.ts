// lib/tools/bot-ua.ts
//
// 报告浏览记录的机器人识别。
//
// ⚠️ 这份名单**注定是不完整的**，而且会随着各家网关改 UA 而过时。它的定位不是
// 「准确判定」，而是「把最大的一块噪音标出来」——邮件安全网关抓取占外发链接
// 访问量的大头，不标出来的话打开率会被系统性高估。
//
// 正因为它会错，浏览记录表里**同时存原始 UA**：判断错了可以重新算，
// 丢掉了就永远补不回来。任何时候都不要在写入侧丢弃可疑访问。
//
// 判定偏向：宁可把真人误判成机器人，也不要把机器人算成真人。
// 打开率被低估只是保守，被高估则会直接导出错误的结论（「文案有效」）。

/** UA 中出现即判定为非真人访问的片段，全部小写比对。 */
const BOT_MARKERS = [
  // —— 通用爬虫 ——
  "bot",
  "crawl",
  "spider",
  "slurp",
  "scan",
  // —— 抓取库与无头浏览器 ——
  "curl",
  "wget",
  "python-requests",
  "go-http-client",
  "okhttp",
  "libwww",
  "httpclient",
  "java/",
  "headless",
  "phantomjs",
  // —— 邮件安全网关 / 链接扫描（外发链接噪音的主要来源）——
  "proofpoint",
  "urldefense",
  "mimecast",
  "barracuda",
  "symantec",
  "forcepoint",
  "microsoft office",
  // —— 聊天与社交的链接预览抓取 ——
  "facebookexternalhit",
  "whatsapp",
  "uripreview",
  "preview/",
  "googleimageproxy",
] as const;

/**
 * 判断一次访问是否来自非真人。
 *
 * 缺失 UA 一律判为机器人：真实浏览器一定会带 UA，不带的要么是脚本、
 * 要么是刻意隐藏，两种都不该计入「对方打开了报告」。
 */
export function isLikelyBot(userAgent: string | null | undefined): boolean {
  const ua = (userAgent ?? "").trim().toLowerCase();
  if (!ua) return true;
  return BOT_MARKERS.some((marker) => ua.includes(marker));
}
