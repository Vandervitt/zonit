// landing-editor/lib/validate.ts
// 字段级格式校验。空值一律视为「未填」不报错；仅对已填内容校验格式。
// 单字段错误在表单行内展示；collectFieldIssues 聚合整页错误，供发布门槛（前端拦截 + 后端兜底）使用。
// 合规拦截呼应 CLAUDE.md 硬规则：落地页链接不得指向支付/结账/购物车/订单/订阅/退款等交易页。

import { SECTION_REGISTRY, type LandingPageDraft } from "@/types/schema.draft";

/** 校验项的跳转落点：编辑器固定面板（hero/footer/floatingButton…）或 sections 中的序号。 */
export type IssueTarget = { kind: "fixed"; id: string } | { kind: "section"; index: number };

/** 结构化校验项：message 为展示文案，target 缺省表示无明确落点（不可点击跳转）。 */
export interface PublishIssue {
  message: string;
  target?: IssueTarget;
}

// 允许的非 http 链接协议（私域 / 通话 / 邮件）
const ALLOWED_SCHEMES = ["tel:", "mailto:", "whatsapp:", "sms:"];

// 交易语义关键词（用词边界匹配，降低 border/cartoon 等误报）
const TRANSACTION_PATTERN =
  /\b(checkout|cart|payments?|orders?|subscriptions?|subscribe|refunds?|cash-on-delivery|add-to-cart)\b/i;

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** 页内锚点：`#` 开头且带片段名。孤立的 `#` 不是落点，不放行。 */
export function isPageAnchor(value: string): boolean {
  return /^#\S+$/.test(value.trim());
}

/**
 * 链接字段：允许 http(s) 绝对地址、tel:/mailto:/whatsapp:/sms: 协议，或页内锚点；
 * 拦截交易类链接。放行锚点是为了让 CTA 能指向页内留资表单（表单作为主转化路径），
 * 锚点同样过交易语义检查，不留后门。
 */
export function validateLink(value: string): string | undefined {
  const v = value.trim();
  if (!v) return undefined;

  const isScheme = ALLOWED_SCHEMES.some((s) => v.toLowerCase().startsWith(s));
  if (!isScheme && !isPageAnchor(v) && !isHttpUrl(v)) {
    return "请输入合法链接（https://…、tel:/mailto:/whatsapp:，或 #lead-form 这样的页内锚点）";
  }
  if (TRANSACTION_PATTERN.test(v)) {
    return "链接疑似交易页（结账/购物车/支付/订单/订阅/退款），落地页不允许";
  }
  return undefined;
}

/** 媒体 / 图片资源 URL：允许 http(s) 绝对地址或站内相对路径（/ 开头）。 */
export function validateMediaUrl(value: string): string | undefined {
  const v = value.trim();
  if (!v) return undefined;
  if (v.startsWith("/")) return undefined;
  if (!isHttpUrl(v)) return "请输入合法资源 URL（https://… 或 / 开头的站内路径）";
  return undefined;
}

/** 邮箱格式。 */
export function validateEmail(value: string): string | undefined {
  const v = value.trim();
  if (!v) return undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "请输入合法邮箱地址";
  return undefined;
}

// 字段键名 → 校验器映射，与各表单的行内校验保持一致：
// url（CtaTarget 的二级外链）、src（ImageRef / Media）、email（PageContact）。
//
// ⚠️ 键名就是这份校验的全部依据：CTA 的 link 改名成 target.url 之后，若不同步改这里，
// validateLink 会静默地什么都不再校验——连「交易语义链接」这条硬红线也一起失效。
const FIELD_VALIDATORS: Record<string, (v: string) => string | undefined> = {
  url: validateLink,
  src: validateMediaUrl,
  email: validateEmail,
};

/**
 * 这些容器里的键是**渠道名**而不是字段名，整棵子树跳过。
 * 典型的 `textByChannel: { email: "Email Us" }`——那是按钮文案，不是邮箱地址，
 * 按键名校验会把它当邮箱拦下来。
 */
const CHANNEL_KEYED_CONTAINERS = new Set(["textByChannel"]);

/** 递归收集 node 内所有字段格式错误，统一冠以区块标签前缀并挂上跳转落点。 */
function walkFieldIssues(node: unknown, label: string, target: IssueTarget, out: PublishIssue[]): void {
  if (Array.isArray(node)) {
    for (const item of node) walkFieldIssues(item, label, target, out);
    return;
  }
  if (!node || typeof node !== "object") return;
  for (const [key, val] of Object.entries(node)) {
    if (CHANNEL_KEYED_CONTAINERS.has(key)) continue;
    if (typeof val === "string") {
      const msg = FIELD_VALIDATORS[key]?.(val);
      if (msg) out.push({ message: `${label}：${msg}`, target });
    } else {
      walkFieldIssues(val, label, target, out);
    }
  }
}

/** 聚合整页字段级格式错误（按文案去重），每项带编辑器跳转落点。 */
export function collectFieldIssueItems(draft: LandingPageDraft): PublishIssue[] {
  const out: PublishIssue[] = [];
  walkFieldIssues(draft.contact, "联系方式", { kind: "fixed", id: "contact" }, out);
  walkFieldIssues(draft.hero, "首屏", { kind: "fixed", id: "hero" }, out);
  draft.sections.forEach((s, index) =>
    walkFieldIssues(s.data, SECTION_REGISTRY[s.type]?.label ?? s.type, { kind: "section", index }, out),
  );
  walkFieldIssues(draft.footer, "页脚", { kind: "fixed", id: "footer" }, out);
  if (draft.floatingButton) {
    walkFieldIssues(draft.floatingButton, "悬浮按钮", { kind: "fixed", id: "floatingButton" }, out);
  }
  const seen = new Set<string>();
  return out.filter((i) => (seen.has(i.message) ? false : (seen.add(i.message), true)));
}

/** 聚合整页字段级格式错误（去重）。空数组表示全部字段格式合法。 */
export function collectFieldIssues(draft: LandingPageDraft): string[] {
  return collectFieldIssueItems(draft).map((i) => i.message);
}
