import { headers } from "next/headers";
import { hostnameOf, isCustomDomain } from "@/lib/host";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";

// 平台主站 llms.txt（GEO）：给生成式引擎/LLM 一份可读的站点摘要与关键链接，
// 便于被 AI 摘要准确理解与引用。
// 租户自有域名不在本期范围（Phase B 再做租户版），返回 404。
// tenant-proxy 已将 /llms.txt 列入 METADATA_PATHS，故自有域名请求会抵达此处。
export async function GET() {
  const hostname = hostnameOf((await headers()).get("host"));
  if (isCustomDomain(hostname)) {
    return new Response("Not Found", { status: 404 });
  }

  const body = `# ${SITE_NAME}

> 面向中国出海广告主的投放级海外获客落地页平台：30+ 行业模板 + AI 整页成稿，几分钟做出第一版，发布到自有品牌域名，内建像素/UTM/服务端转化回传与反同质化风控。

## 核心能力
- 30+ 行业获客落地页模板（美妆、服饰、3C、家居、保健、母婴等），WhatsApp / 表单留资范式
- AI 整页成稿：按行业与投放目标一键生成第一版，再在可视化编辑器微调
- 自有品牌域名一键发布，自动配置 DNS 与证书
- 投放归因：Meta / TikTok / Google 像素、UTM 与服务端转化回传（CAPI）按套餐开放
- 反同质化风控：内容一致、结构指纹打散，降低同模板页面被投放平台判重的概率
- 合规：隐私政策 / 服务条款 / Cookie 同意（EEA 门控）开箱即用；生成页保持非交易属性

## 关键页面
- 首页: ${SITE_URL}/
- 套餐与定价: ${SITE_URL}/pricing
- 模板库: ${SITE_URL}/templates
- 反同质化风控: ${SITE_URL}/anti-ban

## 说明
- 定位：营销获客落地页，用于线索收集（咨询 / 留资），不涉及电商交易、购物车或支付结算。
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
