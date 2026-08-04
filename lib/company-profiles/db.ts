// lib/company-profiles/db.ts
// 账号级经营主体的读写。所有查询都带 user_id 条件：这是账号级资源，
// 越权读到别家的法律实体信息属于严重泄漏，故不提供「按 id 单查」的无主版本。
import pool from "@/lib/db";
import type { CompanyProfileFields } from "./format";

export interface CompanyProfileRow extends CompanyProfileFields {
  id: string;
  user_id: string;
  label: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyProfileInput {
  label: string;
  legal_name: string;
  address: string;
  registration_no: string;
  license: string;
  is_default: boolean;
}

export async function listCompanyProfiles(userId: string): Promise<CompanyProfileRow[]> {
  const r = await pool.query(
    `SELECT * FROM company_profiles WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
    [userId],
  );
  return r.rows;
}

export async function getCompanyProfile(id: string, userId: string): Promise<CompanyProfileRow | null> {
  const r = await pool.query(`SELECT * FROM company_profiles WHERE id = $1 AND user_id = $2`, [id, userId]);
  return r.rows[0] ?? null;
}

/**
 * 落地页渲染用的单查：只给出成文所需字段，且必须同时匹配页面 owner。
 * 公开页是匿名可访问的，这里的 userId 来自页面记录而非会话。
 */
export async function getCompanyProfileForOwner(
  id: string,
  ownerId: string,
): Promise<CompanyProfileRow | null> {
  return getCompanyProfile(id, ownerId);
}

/** 置为默认：同一账号内互斥，故先清掉旧的默认再置新的（单事务）。 */
async function clearDefault(userId: string, exceptId: string): Promise<void> {
  await pool.query(
    `UPDATE company_profiles SET is_default = false, updated_at = now()
      WHERE user_id = $1 AND id <> $2 AND is_default`,
    [userId, exceptId],
  );
}

export async function insertCompanyProfile(
  id: string,
  userId: string,
  input: CompanyProfileInput,
): Promise<CompanyProfileRow> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (input.is_default) {
      await client.query(
        `UPDATE company_profiles SET is_default = false, updated_at = now() WHERE user_id = $1 AND is_default`,
        [userId],
      );
    }
    const r = await client.query(
      `INSERT INTO company_profiles (id, user_id, label, legal_name, address, registration_no, license, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, userId, input.label, input.legal_name, input.address, input.registration_no, input.license, input.is_default],
    );
    await client.query("COMMIT");
    return r.rows[0];
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function updateCompanyProfile(
  id: string,
  userId: string,
  input: CompanyProfileInput,
): Promise<CompanyProfileRow | null> {
  if (input.is_default) await clearDefault(userId, id);
  const r = await pool.query(
    `UPDATE company_profiles
        SET label = $3, legal_name = $4, address = $5, registration_no = $6, license = $7,
            is_default = $8, updated_at = now()
      WHERE id = $1 AND user_id = $2
      RETURNING *`,
    [id, userId, input.label, input.legal_name, input.address, input.registration_no, input.license, input.is_default],
  );
  return r.rows[0] ?? null;
}

/**
 * 仍在被落地页引用的张数。
 *
 * 删除前必须问一句：主体信息是引用而非快照，删掉会让所有引用它的页面页脚
 * 当场少掉公司信息那一行 —— 而这些页可能正在投放。
 */
export async function countPagesUsingProfile(id: string, userId: string): Promise<number> {
  const r = await pool.query(
    `SELECT count(*)::int AS n FROM landing_pages
      WHERE user_id = $2 AND data->'footer'->>'companyProfileId' = $1`,
    [id, userId],
  );
  return r.rows[0]?.n ?? 0;
}

export async function deleteCompanyProfile(id: string, userId: string): Promise<boolean> {
  const r = await pool.query(`DELETE FROM company_profiles WHERE id = $1 AND user_id = $2`, [id, userId]);
  return (r.rowCount ?? 0) > 0;
}
