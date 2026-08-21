// lib/tools/rerun-link.ts
//
// 「重新检查这个页面」的链接构造。
//
// 过期报告页要把访客送回自检器**并且带上当初查的那个 URL**——不带的话
// 对方得自己回去复制粘贴，而这恰好是他回头来看的那一刻，摩擦最不该出现的地方。
import { Routes } from "@/lib/constants";

/** URL 长度上限：只是防止畸形超长参数，正常落地页 URL 远达不到。 */
const MAX_URL_LENGTH = 2000;

/**
 * 自检器入口 + 预填 URL。
 *
 * 返回的是**不带语言前缀**的路径，调用方自行套 localePath——
 * 与站内其它 Routes 用法保持一致。
 */
export function pageCheckWithUrl(url: string): string {
  const trimmed = url.trim().slice(0, MAX_URL_LENGTH);
  if (!trimmed) return Routes.PageCheck;
  return `${Routes.PageCheck}?url=${encodeURIComponent(trimmed)}`;
}
