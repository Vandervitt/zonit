import { notFound } from "next/navigation";
import pool from "@/lib/db";
import { PreviewRenderer } from "@/components/sites/PreviewRenderer";
import type { LandingPageTemplate } from "@/types/schema";
import { SiteStatus } from "@/lib/constants";
import { hasWatermark } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import { deriveJsonLd } from "@/lib/jsonLd";

// JSON-LD 节点序列化时转义闭合标签，杜绝 </script> 注入
function serializeJsonLd(node: unknown): string {
  return JSON.stringify(node).replace(/</g, '\\u003c');
}

export default async function PublicSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await pool.query(
    `SELECT s.data, u.plan
     FROM sites s
     JOIN users u ON u.id = s.user_id
     WHERE s.slug = $1 AND s.status = $2`,
    [slug, SiteStatus.Published],
  );

  if (!result.rows[0]) notFound();

  const { data, plan } = result.rows[0];
  const template = data as LandingPageTemplate;
  const showWatermark = hasWatermark((plan ?? "free") as PlanId);
  const jsonLdNodes = deriveJsonLd(template);

  return (
    <>
      {jsonLdNodes.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          // JSON-LD 标准做法：服务端注入结构化数据；输出经 serializeJsonLd 转义 < 防止脚本闭合注入
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(node) }}
        />
      ))}
      <PreviewRenderer template={template} showWatermark={showWatermark} />
    </>
  );
}
