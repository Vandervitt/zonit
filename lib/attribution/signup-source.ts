import { isOperatorPath } from "@/lib/analytics/web-analytics-filter";

// 注册首触来源：访客第一次落在平台营销站时由浏览器记下，注册后由后台补报一次。
// 不在建号回调里读：Google 回调可能落在别的域名（NEXTAUTH_URL），cookie 带不过去。

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
type UtmKey = (typeof UTM_KEYS)[number];

export type SignupSource = {
  /** 首次落地的站内路径（不含查询串）。 */
  landing: string;
  /** 外站来源的 host + path；站内跳转或直接访问为 null。 */
  referrer: string | null;
  utm: Partial<Record<UtmKey, string>>;
  /** 首次落地时间（ISO）。 */
  at: string;
};

/** localStorage 键：首触记录 / 已补报标记。 */
export const FIRST_TOUCH_KEY = "zb_first_touch";
export const FIRST_TOUCH_REPORTED_KEY = "zb_first_touch_reported";

const MAX_PATH = 200;
const MAX_UTM = 100;

const clip = (s: string, max: number) => s.slice(0, max);

/** 平台托管的客户落地页（/p/<slug>）不是营销站，访客是客户的访客，不采集。 */
function isHostedLandingPage(pathname: string): boolean {
  return pathname === "/p" || pathname.startsWith("/p/");
}

export function buildFirstTouch(input: {
  href: string;
  referrer: string;
  siteOrigin: string;
  now: Date;
}): SignupSource | null {
  let url: URL;
  try {
    url = new URL(input.href);
  } catch {
    return null;
  }
  if (url.origin !== input.siteOrigin) return null;
  if (isOperatorPath(url.pathname) || isHostedLandingPage(url.pathname)) return null;

  let referrer: string | null = null;
  if (input.referrer) {
    try {
      const ref = new URL(input.referrer);
      if (ref.origin !== input.siteOrigin) referrer = clip(`${ref.host}${ref.pathname}`, MAX_PATH);
    } catch {
      referrer = null;
    }
  }

  const utm: SignupSource["utm"] = {};
  for (const key of UTM_KEYS) {
    const value = url.searchParams.get(key);
    if (value) utm[key] = clip(value, MAX_UTM);
  }

  return { landing: clip(url.pathname, MAX_PATH), referrer, utm, at: input.now.toISOString() };
}

/** 服务端校验浏览器自报的来源：只认白名单字段，超长截断，形状不对整体拒绝。 */
export function sanitizeSignupSource(input: unknown): SignupSource | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;

  if (typeof raw.landing !== "string" || !raw.landing.startsWith("/") || raw.landing.startsWith("//")) return null;
  if (raw.referrer !== null && raw.referrer !== undefined && typeof raw.referrer !== "string") return null;
  if (typeof raw.at !== "string" || Number.isNaN(Date.parse(raw.at))) return null;

  const utm: SignupSource["utm"] = {};
  if (raw.utm !== undefined) {
    if (!raw.utm || typeof raw.utm !== "object") return null;
    const rawUtm = raw.utm as Record<string, unknown>;
    for (const key of UTM_KEYS) {
      const value = rawUtm[key];
      if (value === undefined) continue;
      if (typeof value !== "string") return null;
      if (value) utm[key] = clip(value, MAX_UTM);
    }
  }

  return {
    landing: clip(raw.landing, MAX_PATH),
    referrer: typeof raw.referrer === "string" && raw.referrer ? clip(raw.referrer, MAX_PATH) : null,
    utm,
    at: new Date(raw.at).toISOString(),
  };
}
