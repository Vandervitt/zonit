// lib/capi/credentials.ts
// CAPI 凭据读写：upsert / 删除 / 取明文（服务端发送用）/ 取已配置 provider（前端用，不含 token）。
import pool from "@/lib/db";
import type { CapiCredential, CapiProviderId } from "./types";

/** upsert 凭据（按 page+provider 覆盖）。需先校验 page 属于该 user（调用方负责）。 */
export async function upsertCredential(pageId: string, provider: CapiProviderId, accessToken: string, externalId: string): Promise<void> {
  await pool.query(
    `INSERT INTO page_capi_credentials (page_id, provider, access_token, external_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (page_id, provider)
     DO UPDATE SET access_token = EXCLUDED.access_token, external_id = EXCLUDED.external_id, updated_at = NOW()`,
    [pageId, provider, accessToken, externalId],
  );
}

export async function deleteCredential(pageId: string, provider: CapiProviderId): Promise<void> {
  await pool.query(`DELETE FROM page_capi_credentials WHERE page_id = $1 AND provider = $2`, [pageId, provider]);
}

/** 取该 page 的全部凭据明文（服务端发送用）。 */
export async function getCredentials(pageId: string): Promise<CapiCredential[]> {
  const res = await pool.query(
    `SELECT provider, access_token, external_id FROM page_capi_credentials WHERE page_id = $1`,
    [pageId],
  );
  return res.rows.map((r) => ({ provider: r.provider, accessToken: r.access_token, externalId: r.external_id }));
}

/** 取已配置的 provider 列表（前端用，不含 token）。 */
export async function listConfiguredProviders(pageId: string): Promise<{ provider: CapiProviderId; configured: true }[]> {
  const res = await pool.query(`SELECT provider FROM page_capi_credentials WHERE page_id = $1`, [pageId]);
  return res.rows.map((r) => ({ provider: r.provider, configured: true as const }));
}

/** 校验 page 归属（凭据写接口鉴权用）。 */
export async function pageOwnedBy(pageId: string, userId: string): Promise<boolean> {
  const res = await pool.query(`SELECT 1 FROM landing_pages WHERE id = $1 AND user_id = $2`, [pageId, userId]);
  return res.rows.length > 0;
}
