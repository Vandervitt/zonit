// lib/tools/fetch-page.ts
//
// 自检器的抓取层。分两部分：
//   · **策略**（本文件主体）——逐跳跟随重定向，每一跳重新过 SSRF 闸门，施加跳数、
//     体积、内容类型上限。纯逻辑，传输层可注入，由 fetch-page.test.ts 覆盖。
//   · **传输**（`nodeTransport`）——真正发请求。它必须**连到闸门已校验的那个 IP**，
//     而不是让底层重新解析域名，否则 guardUrl 的校验与实际连接之间存在
//     DNS rebinding 的时间差窗口（设计文档 6.3）。
//
// ⚠️ 不使用 fetch 的自动重定向（`redirect: "follow"`）。自动跟随会在库内部完成跳转，
// 我们既看不到中间跳，也无法对每一跳做闸门校验——那等于只校验了第一个 URL。

import { Agent, request as undiciRequest } from "undici";
import { guardUrl as defaultGuard, type GuardResult, type UrlRejection } from "./url-guard";

export type FetchRejection =
  | UrlRejection
  | "too_many_redirects"
  | "bad_redirect"
  | "response_too_large"
  | "unsupported_content_type"
  | "fetch_failed";

/** 传输层返回的原始响应（已读入内存，体积由策略层限制）。 */
export interface RawResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  bytes: number;
}

export interface FetchHop {
  url: string;
  status: number;
}

export type FetchResult =
  | {
      ok: true;
      finalUrl: string;
      status: number;
      html: string;
      bytes: number;
      headers: Record<string, string>;
      chain: FetchHop[];
    }
  | { ok: false; reason: FetchRejection; detail?: string; chain: FetchHop[] };

export type Transport = (url: URL, addresses: string[]) => Promise<RawResponse>;

const DEFAULT_MAX_REDIRECTS = 5;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const HTML_TYPES = ["text/html", "application/xhtml+xml", "text/plain"];

function isRedirect(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

/**
 * 安全抓取：逐跳跟随重定向，每一跳都重新执行完整 SSRF 校验。
 * 返回的 chain 包含每一跳的 URL 与状态码，供报告直接展示——「跳转链」本身
 * 就是一条检查项，中间环节挂掉是隐形杀手。
 */
export async function fetchPageSafely(
  raw: string,
  opts?: {
    guard?: (raw: string) => Promise<GuardResult>;
    transport?: Transport;
    maxRedirects?: number;
    maxBytes?: number;
  },
): Promise<FetchResult> {
  const guard = opts?.guard ?? defaultGuard;
  const transport = opts?.transport ?? nodeTransport;
  const maxRedirects = opts?.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const maxBytes = opts?.maxBytes ?? DEFAULT_MAX_BYTES;

  const chain: FetchHop[] = [];
  let current = raw;

  // 跳数上限同时兜住了「重定向成环」——不需要另外维护 visited 集合。
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const gate = await guard(current);
    if (!gate.ok) return { ok: false, reason: gate.reason, detail: gate.detail, chain };

    let response: RawResponse;
    try {
      response = await transport(gate.url, gate.addresses);
    } catch (e) {
      return { ok: false, reason: "fetch_failed", detail: (e as Error).message, chain };
    }

    chain.push({ url: gate.url.toString(), status: response.status });

    if (isRedirect(response.status)) {
      const location = response.headers["location"] ?? response.headers["Location"];
      if (!location) {
        return { ok: false, reason: "bad_redirect", detail: "3xx 缺少 Location", chain };
      }
      let next: URL;
      try {
        next = new URL(location, gate.url); // 相对 Location 按当前 URL 解析
      } catch {
        return { ok: false, reason: "bad_redirect", detail: location, chain };
      }
      // 非 https 的下一跳直接中止：闸门也会拒，但这里先给出更准确的原因。
      if (next.protocol !== "https:") {
        return { ok: false, reason: "scheme_not_https", detail: next.protocol, chain };
      }
      current = next.toString();
      continue;
    }

    if (response.bytes > maxBytes) {
      return { ok: false, reason: "response_too_large", detail: String(response.bytes), chain };
    }

    const ct = (response.headers["content-type"] ?? response.headers["Content-Type"] ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    // 缺 content-type 时按 HTML 宽容处理：真实站点常见，且我们本就只做文本解析。
    if (ct && !HTML_TYPES.includes(ct)) {
      return { ok: false, reason: "unsupported_content_type", detail: ct, chain };
    }

    return {
      ok: true,
      finalUrl: gate.url.toString(),
      status: response.status,
      html: response.body,
      bytes: response.bytes,
      headers: response.headers,
      chain,
    };
  }

  return { ok: false, reason: "too_many_redirects", chain };
}

/**
 * 真实传输层。
 *
 * 关键点：把已校验的 IP 通过自定义 `lookup` 固定给底层连接，**不重写 URL**。
 * 重写成 `https://<ip>/` 会破坏 SNI 与证书校验；覆盖 lookup 则保持 servername
 * 仍是原主机名，既能正确校验证书，又保证连的是闸门放行过的那个地址。
 */
export const nodeTransport: Transport = async (url, addresses) => {
  const pinned = addresses[0];
  const family = pinned.includes(":") ? 6 : 4;

  const agent = new Agent({
    connect: {
      timeout: 5_000,
      lookup: (_hostname, _options, callback) => {
        // 忽略传入的 hostname，只连闸门校验过的地址（防 DNS rebinding）。
        callback(null, [{ address: pinned, family }]);
      },
    },
  });

  try {
    const res = await undiciRequest(url.toString(), {
      dispatcher: agent,
      method: "GET",
      // undici 的 request 默认就不跟随重定向（maxRedirections 缺省为 0），
      // 重定向一律由上面的策略层逐跳处理，见文件头注释。
      headersTimeout: 10_000,
      bodyTimeout: 10_000,
      headers: {
        // 明确身份，便于被检查方识别与联系（设计文档风险表）
        "user-agent":
          "ZapBridgeLandingPageCheck/1.0 (+https://zapbridge.tech/tools/landing-page-check)",
        accept: "text/html,application/xhtml+xml",
      },
    });

    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(res.headers)) {
      headers[k.toLowerCase()] = Array.isArray(v) ? v.join(", ") : String(v ?? "");
    }

    // 流式读取并在超限时立即中断——不能先读完再判断体积。
    let bytes = 0;
    const chunks: Buffer[] = [];
    for await (const chunk of res.body) {
      const buf = Buffer.from(chunk);
      bytes += buf.length;
      if (bytes > DEFAULT_MAX_BYTES) {
        res.body.destroy();
        return { status: res.statusCode, headers, body: "", bytes };
      }
      chunks.push(buf);
    }

    return {
      status: res.statusCode,
      headers,
      body: Buffer.concat(chunks).toString("utf8"),
      bytes,
    };
  } finally {
    await agent.close().catch(() => {});
  }
};
