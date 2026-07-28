import { headers } from "next/headers";
import { hostnameOf, isCustomDomain } from "@/lib/host";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";

// 平台主站 llms.txt（GEO）：给生成式引擎/LLM 一份可读的站点摘要与关键链接，
// 便于被 AI 摘要准确理解与引用。
// 站点默认语言为英文，故正文用英文；关键页面同时列出中英两版 URL，
// 使 LLM 知道两种语言各自的规范地址。不做 /zh/llms.txt（一份足够，属过度设计）。
// 租户自有域名不在本期范围（Phase B 再做租户版），返回 404。
// tenant-proxy 已将 /llms.txt 列入 METADATA_PATHS，故自有域名请求会抵达此处。
export async function GET() {
  const hostname = hostnameOf((await headers()).get("host"));
  if (isCustomDomain(hostname)) {
    return new Response("Not Found", { status: 404 });
  }

  const body = `# ${SITE_NAME}

> An ad-ready landing page platform for overseas lead generation: 30+ industry templates plus AI full-page drafting get a first version out in minutes, published to your own brand domain, with pixels, UTMs, server-side conversion forwarding, and anti-duplication built in.

## Core capabilities
- 30+ industry lead-gen landing page templates (beauty, apparel, consumer tech, home, supplements, toys & baby), built around WhatsApp and form capture patterns
- AI full-page drafting: generate a first version from your industry and campaign goal, then refine it in the visual editor
- One-click publishing to your own brand domain, with DNS and certificates configured automatically
- Attribution: Meta / TikTok / Google pixels, UTMs, and server-side conversion forwarding (CAPI), unlocked by plan
- Anti-duplication: content stays identical while the structural fingerprint is scattered, lowering the odds that same-template pages are judged duplicates by ad platforms
- Compliance: privacy policy, terms, and cookie consent (EEA-gated) out of the box; generated pages stay non-transactional

## Languages
The site is available in English (default, no prefix) and Simplified Chinese (under /zh).

## Key pages
- Home: ${SITE_URL}/ · ${SITE_URL}/zh
- Plans & pricing: ${SITE_URL}/pricing · ${SITE_URL}/zh/pricing
- Template library: ${SITE_URL}/templates · ${SITE_URL}/zh/templates
- Anti-duplication: ${SITE_URL}/anti-ban · ${SITE_URL}/zh/anti-ban
- Guides: ${SITE_URL}/guides · ${SITE_URL}/zh/guides

## Notes
- Positioning: marketing lead-capture landing pages for collecting inquiries and contact details. No ecommerce transactions, carts, or payment checkout are involved.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
