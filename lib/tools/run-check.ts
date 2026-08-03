// lib/tools/run-check.ts
//
// 一次完整检查的编排：robots → 抓取 → 政策链接可达性 → 组装报告。
// 与 HTTP 层分离，便于测试与将来复用（登录侧的实测确认会在这之上追加 B 档）。
//
// 对被检查站点的礼貌与自我约束：
//   · 先读 robots，命中 Disallow 即不抓取（设计文档决议 1）
//   · 政策链接最多额外探测 2 次，且只发 GET 后立即丢弃正文
//   · 全程走同一个 SSRF 闸门，包括 robots 与政策链接——它们同样是用户可控的 URL

import { fetchPageSafely } from "./fetch-page";
import { isAllowed } from "./robots";
import { findPolicyLinks } from "./checks";
import {
  assembleReport,
  buildRobotsBlockedReport,
  buildFetchFailedReport,
  type PageCheckReport,
} from "./report";

export const CHECKER_UA = "ZapBridgeLandingPageCheck";

/** 读取 robots.txt；拿不到一律视为允许（「读不到」不等于「被禁止」）。 */
async function loadRobots(target: URL): Promise<string> {
  try {
    const r = await fetchPageSafely(new URL("/robots.txt", target).toString());
    return r.ok && r.status === 200 ? r.html : "";
  } catch {
    return "";
  }
}

/** 探测政策链接可达性；只关心状态码，不保留正文。 */
async function probeStatus(url: string): Promise<number | undefined> {
  try {
    const r = await fetchPageSafely(url);
    if (r.ok) return r.status;
    // 抓取失败（含被闸门拒绝）时不谎报为 200，返回 undefined 让报告层按「未探测」处理
    return undefined;
  } catch {
    return undefined;
  }
}

export async function runPageCheck(inputUrl: string): Promise<PageCheckReport> {
  let target: URL;
  try {
    target = new URL(inputUrl);
  } catch {
    return buildFetchFailedReport(inputUrl, "invalid_url", []);
  }

  const robotsTxt = await loadRobots(target);
  if (!isAllowed(robotsTxt, target.pathname, CHECKER_UA)) {
    return buildRobotsBlockedReport(inputUrl);
  }

  const fetched = await fetchPageSafely(inputUrl);
  if (!fetched.ok) {
    return buildFetchFailedReport(inputUrl, fetched.reason, fetched.chain);
  }

  // 政策链接可达性：最多两次额外请求，并发执行。
  const links = findPolicyLinks(fetched.html, new URL(fetched.finalUrl));
  const [privacy, terms] = await Promise.all([
    links.privacy ? probeStatus(links.privacy) : Promise.resolve(undefined),
    links.terms ? probeStatus(links.terms) : Promise.resolve(undefined),
  ]);

  return assembleReport({ fetched, linkStatus: { privacy, terms } });
}
