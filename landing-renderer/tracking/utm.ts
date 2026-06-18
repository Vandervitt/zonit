// landing-renderer/tracking/utm.ts
// UTM / 点击 id 的捕获与合并（纯函数，可服务端/客户端复用）。

const UTM_KEYS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "gclid", "fbclid", "ttclid",
] as const;

/** 从 location.search 提取 UTM/点击 id（只保留白名单键、非空值）。 */
export function parseUtm(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const out: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const v = params.get(key);
    if (v) out[key] = v;
  }
  return out;
}

/** 仅对 http(s) 链接合并 UTM；已存在的同名参数不覆盖；其它协议/深链原样返回。 */
export function mergeUtmIntoUrl(url: string, utm: Record<string, string>): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return url;
  // wa.me 等虽是 https，但作为聊天深链不追加（无意义且污染分享文案）
  if (parsed.hostname === "wa.me" || parsed.hostname === "t.me") return url;
  for (const [k, v] of Object.entries(utm)) {
    if (!parsed.searchParams.has(k)) parsed.searchParams.set(k, v);
  }
  return parsed.toString();
}
