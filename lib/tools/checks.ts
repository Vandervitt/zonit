// lib/tools/checks.ts
//
// A 档检查：全部是「是非题」，每条都能追溯到一个可核实的客观事实。
// 这是报告敢于不给评分、不承诺过审的前提（设计文档第二节）——我们只陈述
// 「你这页上有什么 / 没有什么」，不替审核下结论。
//
// ⚠️ 本模块只返回**结构化事实与稳定 id**，不返回任何面向用户的文案。
// 文案在 lib/i18n/dictionaries 里按 id 取，否则双语无从落地。
//
// HTML 解析用的是有针对性的正则而非完整解析器：本仓库没有 HTML parser 依赖，
// 而这几项检查（找锚点、找脚本、找版权行）用非贪婪匹配 + 去标签已足够稳。
// 若将来检查项复杂到需要 DOM 遍历，届时再引入解析器，不要用正则硬撑。

export interface Anchor {
  href: string;
  /** 去掉嵌套标签、折叠空白、转小写后的可见文字 */
  text: string;
}

/** 去标签并折叠空白。 */
function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

const ANCHOR_RE = /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

/** 提取页面上的锚点；跳过 mailto / tel / javascript 等非导航链接。 */
export function extractAnchors(html: string): Anchor[] {
  const out: Anchor[] = [];
  for (const m of html.matchAll(ANCHOR_RE)) {
    const href = m[1].trim();
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) continue;
    out.push({ href, text: stripTags(m[2]).toLowerCase() });
  }
  return out;
}

const PRIVACY_TEXT = /(privacy|隐私|datenschutz|confidentialit|privacidad)/i;
const TERMS_TEXT = /(terms|条款|服务协议|conditions|términos|nutzungsbedingungen)/i;
const PRIVACY_PATH = /(privacy|policy\/privacy|隐私|datenschutz)/i;
const TERMS_PATH = /(terms|tos\b|conditions|条款)/i;

/**
 * 找隐私政策与服务条款链接。
 * 先按可见文字判（最可靠），文字无关时退而按 href 路径判——真实站点常见
 * 「了解更多 → /legal/privacy」这种写法。
 */
export function findPolicyLinks(
  html: string,
  base: URL,
): { privacy?: string; terms?: string } {
  const anchors = extractAnchors(html);
  const abs = (href: string): string | undefined => {
    try {
      return new URL(href, base).toString();
    } catch {
      return undefined;
    }
  };
  let privacy: string | undefined;
  let terms: string | undefined;
  for (const a of anchors) {
    if (!privacy && (PRIVACY_TEXT.test(a.text) || PRIVACY_PATH.test(a.href))) privacy = abs(a.href);
    if (!terms && (TERMS_TEXT.test(a.text) || TERMS_PATH.test(a.href))) terms = abs(a.href);
  }
  return { privacy, terms };
}

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
// 至少 7 位、允许常见分隔符；要求出现 + 或括号，避免把版本号、日期、
// 地址门牌里的数字串误判成电话。
const PHONE_RE = /(\+\d[\d\s().-]{6,}\d)|(\(\d{2,4}\)\s*\d[\d\s.-]{5,}\d)/;

/** 页面上是否给得出联系方式（着陆页体验的常见缺项）。 */
export function detectContact(html: string): { email: boolean; phone: boolean } {
  const text = stripTags(html);
  return {
    email: /mailto:/i.test(html) || EMAIL_RE.test(text),
    phone: /tel:/i.test(html) || PHONE_RE.test(text),
  };
}

/** 已知追踪代码的静态特征。 */
const PIXEL_SIGNATURES: { id: string; re: RegExp }[] = [
  { id: "meta", re: /\bfbq\s*\(|connect\.facebook\.net/i },
  { id: "google", re: /googletagmanager\.com|\bgtag\s*\(|google-analytics\.com/i },
  { id: "tiktok", re: /\bttq\.|analytics\.tiktok\.com/i },
  { id: "linkedin", re: /snap\.licdn\.com|_linkedin_partner_id/i },
  { id: "twitter", re: /static\.ads-twitter\.com|\btwq\s*\(/i },
];

/** 已知 CMP（同意管理平台）特征。 */
const CMP_SIGNATURES: { id: string; re: RegExp }[] = [
  { id: "cookiebot", re: /cookiebot\.com/i },
  { id: "onetrust", re: /cookielaw\.org|onetrust/i },
  { id: "usercentrics", re: /usercentrics/i },
  { id: "osano", re: /osano\.com/i },
  { id: "cookieyes", re: /cookieyes\.com/i },
  { id: "klaro", re: /klaro/i },
  { id: "termly", re: /termly\.io/i },
];

export interface TrackerDetection {
  pixels: string[];
  cmp: string | null;
  /**
   * 疑似在取得同意前触发。判据：**有像素 + 无任何同意门控迹象**。
   * 这是匿名侧的主路径结论，置信度中等——故报告措辞必须是「疑似」而非断言，
   * 「实测确认」留给登录用户走 Sandbox（设计文档 11.7）。
   */
  suspectedBeforeConsent: boolean;
}

export function detectTrackers(html: string): TrackerDetection {
  const pixels = PIXEL_SIGNATURES.filter((p) => p.re.test(html)).map((p) => p.id);
  const cmp = CMP_SIGNATURES.find((c) => c.re.test(html))?.id ?? null;
  // 被 CMP 挂起的脚本通常写成 type="text/plain" + data-* 标记，等同意后才激活。
  const gated =
    /<script[^>]+type=["']text\/plain["']/i.test(html) ||
    /data-cookieconsent=/i.test(html) ||
    /data-cookiecategory=/i.test(html);
  return {
    pixels,
    cmp,
    suspectedBeforeConsent: pixels.length > 0 && !cmp && !gated,
  };
}

/**
 * 移动端可读性：viewport 声明。
 *
 * 只判这一项，因为它是**静态 HTML 里唯一客观可核实**的移动端事实。字号要靠
 * 渲染后计算样式才算得准（外链 CSS、Tailwind 类名都在这一层之外），静态猜字号
 * 只会造出一条不可靠的检查项 —— 报告的全部价值在于每一条都追溯到可核实的事实。
 *
 * 判据来自平台明文：TikTok 要求页面在移动端不放大就能读；Google 的着陆页体验
 * 同样按移动端可用性判。没有 viewport 的页在手机上会以桌面宽度缩放渲染，
 * 正文小到必须双指放大；`user-scalable=no` / `maximum-scale=1` 则是反过来
 * 把放大这条退路也堵死（同时也是无障碍问题）。
 */
export interface ViewportDetection {
  /** 是否有 viewport meta。 */
  present: boolean;
  /** 是否禁止了缩放（user-scalable=no 或 maximum-scale<=1）。 */
  zoomBlocked: boolean;
}

const VIEWPORT_RE = /<meta\b[^>]*\bname=["']viewport["'][^>]*>/i;
const CONTENT_RE = /\bcontent=["']([^"']*)["']/i;

export function detectViewport(html: string): ViewportDetection {
  const tag = html.match(VIEWPORT_RE)?.[0];
  if (!tag) return { present: false, zoomBlocked: false };
  const content = (tag.match(CONTENT_RE)?.[1] ?? "").toLowerCase();
  const maxScale = Number(content.match(/maximum-scale\s*=\s*([\d.]+)/)?.[1]);
  const zoomBlocked =
    /user-scalable\s*=\s*(no|0)\b/.test(content) ||
    (Number.isFinite(maxScale) && maxScale <= 1);
  return { present: true, zoomBlocked };
}

const SCRIPT_SRC_RE = /<script\b([^>]*)\bsrc=["'][^"']+["']([^>]*)>/gi;

/** 会阻塞渲染的同步外链脚本数量（带 async / defer 的不算）。 */
export function countBlockingScripts(html: string): number {
  let n = 0;
  for (const m of html.matchAll(SCRIPT_SRC_RE)) {
    const attrs = `${m[1]} ${m[2]}`;
    if (!/\b(async|defer)\b/i.test(attrs)) n++;
  }
  return n;
}

/**
 * 版权年份。区间写法（2019-2025）取较大的一端。
 * 必须紧跟 © / Copyright，避免把地址门牌、房间号里的四位数当年份。
 */
export function findCopyrightYear(html: string): number | null {
  const text = stripTags(html);
  const m = text.match(/(?:©|&copy;|copyright)\s*([12]\d{3})(?:\s*[–—-]\s*([12]\d{3}))?/i);
  if (!m) return null;
  return Number(m[2] ?? m[1]);
}
