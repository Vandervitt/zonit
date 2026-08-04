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

/** upsert 账号级凭据（同一广告主的多张页共用）。 */
export async function upsertAccountCredential(userId: string, provider: CapiProviderId, accessToken: string, externalId: string): Promise<void> {
  await pool.query(
    `INSERT INTO user_capi_credentials (user_id, provider, access_token, external_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, provider)
     DO UPDATE SET access_token = EXCLUDED.access_token, external_id = EXCLUDED.external_id, updated_at = NOW()`,
    [userId, provider, accessToken, externalId],
  );
}

export async function deleteAccountCredential(userId: string, provider: CapiProviderId): Promise<void> {
  await pool.query(`DELETE FROM user_capi_credentials WHERE user_id = $1 AND provider = $2`, [userId, provider]);
}

/**
 * 取该 page 实际生效的凭据明文（服务端发送用）。
 *
 * 解析顺序：**页级优先，页级没配的 provider 落到账号级**。账号级是「这个广告主的
 * 默认 Dataset」，页级是「这一张页要覆盖成别的 Dataset」——代投给不同客户建页时
 * 用得上。两级都没有则该 provider 不回传。
 */
export async function getCredentials(pageId: string): Promise<CapiCredential[]> {
  const res = await pool.query(
    `SELECT provider, access_token, external_id FROM page_capi_credentials WHERE page_id = $1
     UNION ALL
     SELECT u.provider, u.access_token, u.external_id
       FROM user_capi_credentials u
       JOIN landing_pages p ON p.user_id = u.user_id
      WHERE p.id = $1
        AND u.provider NOT IN (SELECT provider FROM page_capi_credentials WHERE page_id = $1)`,
    [pageId],
  );
  return res.rows.map((r) => ({ provider: r.provider, accessToken: r.access_token, externalId: r.external_id }));
}

/** 一个 provider 在某张页上的生效来源：页级覆盖 / 继承账号级 / 未配置。 */
export type CredentialScope = "page" | "account";

export interface ConfiguredProvider {
  provider: CapiProviderId;
  scope: CredentialScope;
}

/**
 * 取该 page 已配置的 provider 及其来源（前端用，不含 token）。
 * 必须带 scope：否则用户看到「已配置 ✓」却分不清是这张页自己配的还是继承来的，
 * 删除时也就不知道会影响一张页还是全部页。
 */
export async function listConfiguredProviders(pageId: string): Promise<ConfiguredProvider[]> {
  const res = await pool.query(
    `SELECT provider, 'page' AS scope FROM page_capi_credentials WHERE page_id = $1
     UNION ALL
     SELECT u.provider, 'account' AS scope
       FROM user_capi_credentials u
       JOIN landing_pages p ON p.user_id = u.user_id
      WHERE p.id = $1
        AND u.provider NOT IN (SELECT provider FROM page_capi_credentials WHERE page_id = $1)`,
    [pageId],
  );
  return res.rows.map((r) => ({ provider: r.provider, scope: r.scope as CredentialScope }));
}

/** 账号级已配置的 provider（设置页用，不含 token）。 */
export async function listAccountProviders(userId: string): Promise<{ provider: CapiProviderId; externalId: string }[]> {
  const res = await pool.query(
    `SELECT provider, external_id FROM user_capi_credentials WHERE user_id = $1 ORDER BY provider`,
    [userId],
  );
  return res.rows.map((r) => ({ provider: r.provider, externalId: r.external_id }));
}

/** 校验 page 归属（凭据写接口鉴权用）。 */
export async function pageOwnedBy(pageId: string, userId: string): Promise<boolean> {
  const res = await pool.query(`SELECT 1 FROM landing_pages WHERE id = $1 AND user_id = $2`, [pageId, userId]);
  return res.rows.length > 0;
}
