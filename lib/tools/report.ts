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
  detectLeadForm,
  hasConversionEarly,
  detectTrustSignals,
  detectTrackers,
  detectViewport,
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
/**
 * 单个留资表单字段数的提示阈值。
 * 取 5：本产品自己的表单是 6 个字段全开、常态开 2-3 个，阈值定在 5 才不会
 * 对正常配置刷屏；同时能接住市场反复吐槽的「填一堆信息」那种十几个字段的表单。
 */
const FORM_FIELDS_MANY = 5;

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
  // 表单也是联系方式，且往往是唯一的那个（广告落地页的主转化）。只认 mailto/tel
  // 会把「表单为唯一转化」的页面误判成没有联系方式。
  const contact = detectContact(html);
  const leadForm = detectLeadForm(html);
  if (!contact.email && !contact.phone && !leadForm.present) {
    findings.push({ id: "contact_missing", level: "attention" });
  } else {
    findings.push({
      id: "contact_ok",
      level: "info",
      data: {
        email: contact.email ? 1 : 0,
        phone: contact.phone ? 1 : 0,
        form: leadForm.present ? 1 : 0,
      },
    });
  }

  // —— 转化承接 ——
  // 这三条回答的是市场反复问的「有流量为什么没询盘」，而不是合规问题。
  // 与本模块其余检查同一红线：只陈述页面上有什么，不打分、不下「会不会转化」的结论。
  if (leadForm.present && leadForm.maxFields > FORM_FIELDS_MANY) {
    findings.push({
      id: "form_fields_many",
      level: "info",
      data: { fields: leadForm.maxFields, threshold: FORM_FIELDS_MANY },
    });
  }
  // 首屏位置静态判不了（没有几何信息），用文档序近似：转化控件是否出现在
  // HTML 前 FOLD_RATIO 部分。近似的代价是长页面会偏严，故只给 info 不给 attention。
  if (leadForm.present || contact.email || contact.phone) {
    const early = hasConversionEarly(html);
    findings.push(
      early
        ? { id: "conversion_reachable_early", level: "info" }
        : { id: "conversion_late_only", level: "info" },
    );
  }
  // 信任元素同样受静态检查的能力边界约束（可能由 JS 渲染），故「没找到」走
  // unknown 而不是断言「你没有」——与像素那条同一条红线。
  const trust = detectTrustSignals(html);
  findings.push(
    trust.length > 0
      ? { id: "trust_signals_present", level: "info", data: { kinds: trust.join(", ") } }
      : { id: "trust_signals_not_found", level: "unknown" },
  );

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

  // —— 移动端可读性 ——
  // 只报 viewport 这一项客观事实，不猜字号（见 detectViewport 注释）。
  const viewport = detectViewport(html);
  if (!viewport.present) {
    findings.push({ id: "viewport_missing", level: "attention" });
  } else if (viewport.zoomBlocked) {
    findings.push({ id: "viewport_zoom_blocked", level: "attention" });
  } else {
    findings.push({ id: "viewport_ok", level: "info" });
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

/**
 * 把 B 档实测结果并入报告：移除静态阶段的「疑似 / 判断不了」条目，
 * 换成实测结论。实测过的报告 browserVerified=true，报告页据此改变措辞。
 */
export function applyBrowserVerification(
  report: PageCheckReport,
  fired: string[],
): PageCheckReport {
  // 静态阶段关于像素的三条结论全部作废——实测优先，且不能与实测结论并列展示，
  // 否则用户会同时看到「疑似」和「实测」两种说法。
  const STATIC_PIXEL_IDS = new Set([
    "pixel_before_consent_suspected",
    "pixel_with_cmp",
    "pixel_not_found_in_html",
  ]);
  const kept = report.findings.filter((f) => !STATIC_PIXEL_IDS.has(f.id));
  const verdict: Finding = fired.length
    ? {
        id: "pixel_before_consent_verified",
        level: "attention",
        data: { pixels: fired.join(", ") },
      }
    : { id: "pixel_no_fire_before_consent_verified", level: "info" };
  return {
    ...report,
    findings: sortFindings([...kept, verdict]),
    browserVerified: true,
  };
}

/** attention 在前、unknown 次之、info 最后；同级保持插入顺序。 */
function sortFindings(findings: Finding[]): Finding[] {
  const rank: Record<FindingLevel, number> = { attention: 0, unknown: 1, info: 2 };
  return [...findings].sort((a, b) => rank[a.level] - rank[b.level]);
}

/**
 * 对比维度：多页横向对比表的列。
 *
 * ⚠️ **这是一处「按名字工作」的逻辑**——键是 finding id，改 id 会静默让某一列
 * 全变空白（表还是渲染出来，只是那一格永远没数据），测试不会自己报错。
 * 故意放在本文件、紧挨 finding id 的产生处，改 id 时能一眼看到要同步改这里；
 * `compare.test.ts` 断言「每个 finding id 都必须在这张表里或在显式豁免名单里」，
 * 新增 finding 而忘了归类会当场变红。
 */
export const FINDING_DIMENSION: Record<string, string> = {
  privacy_missing: "privacy",
  privacy_broken: "privacy",
  privacy_ok: "privacy",
  terms_missing: "terms",
  terms_broken: "terms",
  terms_ok: "terms",
  contact_missing: "contact",
  contact_ok: "contact",
  form_fields_many: "form_fields",
  conversion_reachable_early: "conversion_position",
  conversion_late_only: "conversion_position",
  trust_signals_present: "trust",
  trust_signals_not_found: "trust",
  viewport_missing: "viewport",
  viewport_zoom_blocked: "viewport",
  viewport_ok: "viewport",
  pixel_before_consent_suspected: "consent",
  pixel_before_consent_verified: "consent",
  pixel_no_fire_before_consent_verified: "consent",
  pixel_with_cmp: "consent",
  pixel_not_found_in_html: "consent",
  redirect_chain: "hops",
  page_heavy: "weight",
  blocking_scripts: "scripts",
  copyright_stale: "copyright",
};

/**
 * 不进对比表的 finding。
 * 这三条是「这一页整体没检查成」的状态，不是某个可横向比较的维度——
 * 塞进表里会让那一行的其余格子显示成「正常」，读者会以为检查过了。
 */
export const UNCOMPARABLE_FINDINGS = new Set([
  "fetch_failed",
  "robots_disallows_check",
  "final_status_error",
]);
