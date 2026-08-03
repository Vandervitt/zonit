// lib/tools/report.ts
//
// 报告组装：把抓取结果与各项检查汇成 findings 列表。
//
// ⚠️ 两条贯穿设计的约束（设计文档第二节红线）：
//   ① **不给评分、不给总评**。没有 score、没有 pass/fail、没有红绿灯汇总。
//      findings 是并列的观察项，排序只按「值得先看」而非「严重程度分数」。
//   ② **只产出 id + 结构化事实**，文案在 lib/i18n/dictionaries 按 id 取。
//      任何一句面向用户的话都不应出现在本文件里。
//
// level 的含义刻意不叫 error/warning：
//   attention —— 审核常盯、且这页确实缺了或有问题，值得先看
//   info      —— 中性事实（跳转链、页面体积），供判断但不暗示对错
//   unknown   —— 静态检查能力边界内看不到的（见 11.8），必须如实说不知道

import type { FetchResult } from "./fetch-page";
import {
  findPolicyLinks,
  detectContact,
  detectTrackers,
  countBlockingScripts,
  findCopyrightYear,
} from "./checks";

export type FindingLevel = "attention" | "info" | "unknown";

export interface Finding {
  /** 稳定 id，同时是 i18n 文案键。改名会静默击穿文案，勿轻改。 */
  id: string;
  level: FindingLevel;
  /** 供文案插值的事实；值必须是可核实的客观数据，不含判断。 */
  data?: Record<string, string | number>;
}

export interface PageCheckReport {
  finalUrl: string;
  status: number;
  bytes: number;
  hops: number;
  findings: Finding[];
  /** 是否经过浏览器实测（登录用户走 Sandbox 时为 true）。 */
  browserVerified: boolean;
}

/** 页面体积的提示阈值（字节）。超过只作为 info 呈现，不判对错。 */
const HEAVY_PAGE_BYTES = 1_500_000;
/** 阻塞脚本数量的提示阈值。 */
const MANY_BLOCKING_SCRIPTS = 4;

export interface AssembleInput {
  fetched: Extract<FetchResult, { ok: true }>;
  /** 隐私 / 条款链接的可达性探测结果；undefined 表示未探测。 */
  linkStatus?: { privacy?: number; terms?: number };
  /** robots 是否允许抓取；false 时页面本身不会被抓，另走 buildBlockedReport。 */
  robotsAllowed?: boolean;
  now?: Date;
}

/**
 * 组装报告。输入是已抓取成功的页面——抓取失败与 robots 拦截各有独立入口，
 * 不在这里用分支混着处理。
 */
export function assembleReport(input: AssembleInput): PageCheckReport {
  const { fetched } = input;
  const base = new URL(fetched.finalUrl);
  const html = fetched.html;
  const findings: Finding[] = [];

  // —— 隐私政策 / 服务条款 ——
  const links = findPolicyLinks(html, base);
  for (const kind of ["privacy", "terms"] as const) {
    const href = links[kind];
    const status = input.linkStatus?.[kind];
    if (!href) {
      findings.push({ id: `${kind}_missing`, level: "attention" });
    } else if (status !== undefined && (status < 200 || status >= 400)) {
      findings.push({ id: `${kind}_broken`, level: "attention", data: { href, status } });
    } else {
      findings.push({ id: `${kind}_ok`, level: "info", data: { href } });
    }
  }

  // —— 跳转链 ——
  if (fetched.chain.length > 1) {
    findings.push({
      id: "redirect_chain",
      level: "info",
      data: { hops: fetched.chain.length, final: fetched.finalUrl },
    });
  }

  // —— 最终响应状态 ——
  if (fetched.status >= 400) {
    findings.push({ id: "final_status_error", level: "attention", data: { status: fetched.status } });
  }

  // —— 联系方式 ——
  const contact = detectContact(html);
  if (!contact.email && !contact.phone) {
    findings.push({ id: "contact_missing", level: "attention" });
  } else {
    findings.push({
      id: "contact_ok",
      level: "info",
      data: { email: contact.email ? 1 : 0, phone: contact.phone ? 1 : 0 },
    });
  }

  // —— 追踪与同意 ——
  // 静态检查看不到 JS 动态注入的像素（设计文档 11.8），故「没找到」必须
  // 表述为 unknown 而不是「你没装」。
  const trackers = detectTrackers(html);
  if (trackers.suspectedBeforeConsent) {
    findings.push({
      id: "pixel_before_consent_suspected",
      level: "attention",
      data: { pixels: trackers.pixels.join(", ") },
    });
  } else if (trackers.pixels.length && trackers.cmp) {
    findings.push({
      id: "pixel_with_cmp",
      level: "unknown",
      data: { pixels: trackers.pixels.join(", "), cmp: trackers.cmp },
    });
  } else if (!trackers.pixels.length) {
    findings.push({ id: "pixel_not_found_in_html", level: "unknown" });
  }

  // —— 体积与阻塞资源 ——
  if (fetched.bytes > HEAVY_PAGE_BYTES) {
    findings.push({ id: "page_heavy", level: "info", data: { bytes: fetched.bytes } });
  }
  const blocking = countBlockingScripts(html);
  if (blocking >= MANY_BLOCKING_SCRIPTS) {
    findings.push({ id: "blocking_scripts", level: "info", data: { count: blocking } });
  }

  // —— 版权年份 ——
  const year = findCopyrightYear(html);
  const thisYear = (input.now ?? new Date()).getUTCFullYear();
  if (year !== null && year < thisYear - 1) {
    findings.push({ id: "copyright_stale", level: "info", data: { year, thisYear } });
  }

  return {
    finalUrl: fetched.finalUrl,
    status: fetched.status,
    bytes: fetched.bytes,
    hops: fetched.chain.length,
    findings: sortFindings(findings),
    browserVerified: false,
  };
}

/** robots 不允许抓取时的报告——限制本身就是一条发现项。 */
export function buildRobotsBlockedReport(url: string): PageCheckReport {
  return {
    finalUrl: url,
    status: 0,
    bytes: 0,
    hops: 0,
    findings: [{ id: "robots_disallows_check", level: "attention" }],
    browserVerified: false,
  };
}

/** 抓取失败时的报告——把失败原因如实作为发现项，不假装检查过了。 */
export function buildFetchFailedReport(
  url: string,
  reason: string,
  chain: { url: string; status: number }[],
): PageCheckReport {
  return {
    finalUrl: url,
    status: 0,
    bytes: 0,
    hops: chain.length,
    // ⚠️ id 稳定为 fetch_failed，具体原因走 data。id 同时是 i18n 键，
    // 用 `fetch_failed_${reason}` 拼出来会让字典键随代码分支静默漂移。
    findings: [{ id: "fetch_failed", level: "attention", data: { reason } }],
    browserVerified: false,
  };
}

/** attention 在前、unknown 次之、info 最后；同级保持插入顺序。 */
function sortFindings(findings: Finding[]): Finding[] {
  const rank: Record<FindingLevel, number> = { attention: 0, unknown: 1, info: 2 };
  return [...findings].sort((a, b) => rank[a.level] - rank[b.level]);
}
