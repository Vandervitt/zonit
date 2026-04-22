import { notFound } from "next/navigation";
import pool from "@/lib/db";
import { PreviewRenderer } from "@/components/sites/PreviewRenderer";
import type { LandingPageTemplate } from "@/types/schema";
import { SiteStatus } from "@/lib/constants";
import { hasWatermark } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

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
  const showWatermark = hasWatermark((plan ?? "free") as PlanId);

  return <PreviewRenderer template={data as LandingPageTemplate} showWatermark={showWatermark} />;
}
