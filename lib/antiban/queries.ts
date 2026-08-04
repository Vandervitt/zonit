// 反同质化风险读数的数据源。
import pool from "@/lib/db";
import type { LandingPageDraft } from "@/types/schema.draft";
import { extractStructure, buildSimilarityReport, type SimilarityReport } from "./similarity";

/**
 * 名下已发布页的骨架重复情况。
 *
 * ⚠️ 读 published_data 而不是 data：已发布页对外渲染的是发布快照，
 * 草稿里改了但没发布的结构，平台根本看不到。用草稿算等于算了一个
 * 还不存在于线上的风险。published_data 为空（老数据）时退回 data。
 *
 * 只算已发布页：草稿不会被任何平台抓到，把它算进「重复」只会制造假警报。
 */
export async function getSimilarityReport(userId: string): Promise<SimilarityReport> {
  const res = await pool.query(
    `SELECT id, name, status, COALESCE(published_data, data) AS draft
       FROM landing_pages
      WHERE user_id = $1 AND status = 'published'`,
    [userId],
  );
  return buildSimilarityReport(
    res.rows.map((r) => ({
      pageId: r.id as string,
      name: r.name as string,
      status: r.status as string,
      structure: extractStructure((r.draft ?? {}) as LandingPageDraft),
    })),
  );
}
