import pool from "@/lib/db";

export interface DomainRow {
  id: string;
  user_id: string;
  site_id: string | null;
  landing_page_id?: string | null;
  domain: string;
  enabled: boolean;
  verified: boolean;
  created_at: string;
  site_name?: string;
}

export async function getUserDomains(userId: string): Promise<DomainRow[]> {
  const result = await pool.query(
    `SELECT d.*, s.name AS site_name
     FROM domains d
     LEFT JOIN sites s ON s.id = d.site_id
     WHERE d.user_id = $1
     ORDER BY d.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function getEnabledDomainCount(userId: string): Promise<number> {
  const result = await pool.query(
    "SELECT COUNT(*) FROM domains WHERE user_id = $1 AND enabled = true",
    [userId]
  );
  return Number(result.rows[0].count);
}

export async function getDomainById(id: string, userId: string): Promise<DomainRow | null> {
  const result = await pool.query(
    "SELECT * FROM domains WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
  return result.rows[0] ?? null;
}

export async function getDomainByName(domain: string): Promise<DomainRow | null> {
  const result = await pool.query(
    "SELECT * FROM domains WHERE domain = $1",
    [domain]
  );
  return result.rows[0] ?? null;
}

export async function insertDomain(params: {
  id: string;
  userId: string;
  siteId?: string | null;
  landingPageId?: string | null;
  domain: string;
}): Promise<DomainRow> {
  const result = await pool.query(
    `INSERT INTO domains (id, user_id, site_id, landing_page_id, domain)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [params.id, params.userId, params.siteId ?? null, params.landingPageId ?? null, params.domain],
  );
  return result.rows[0];
}

export async function updateDomain(
  id: string,
  userId: string,
  fields: Partial<{ enabled: boolean; verified: boolean; site_id: string }>
): Promise<DomainRow | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (fields.enabled !== undefined) {
    setClauses.push(`enabled = $${idx++}`);
    values.push(fields.enabled);
  }
  if (fields.verified !== undefined) {
    setClauses.push(`verified = $${idx++}`);
    values.push(fields.verified);
  }
  if (fields.site_id !== undefined) {
    setClauses.push(`site_id = $${idx++}`);
    values.push(fields.site_id);
  }

  if (setClauses.length === 0) return null;

  values.push(id, userId);
  const result = await pool.query(
    `UPDATE domains SET ${setClauses.join(", ")} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}

export async function deleteDomainById(id: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    "DELETE FROM domains WHERE id = $1 AND user_id = $2 RETURNING id",
    [id, userId]
  );
  return result.rows.length > 0;
}

export async function getSlugByCustomDomain(domain: string): Promise<string | null> {
  const result = await pool.query(
    `SELECT s.slug FROM domains d
     JOIN sites s ON s.id = d.site_id
     WHERE d.domain = $1 AND d.enabled = true AND d.verified = true
       AND s.status = 'published'`,
    [domain]
  );
  return result.rows[0]?.slug ?? null;
}

/** 把一个已验证启用的域名绑定到落地页（一域名一页：清掉它的旧绑定后绑新页）。 */
export async function bindDomainToLandingPage(
  domainId: string,
  userId: string,
  landingPageId: string,
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE domains SET landing_page_id = $1, site_id = NULL
     WHERE id = $2 AND user_id = $3 AND enabled = true AND verified = true RETURNING id`,
    [landingPageId, domainId, userId],
  );
  return result.rows.length > 0;
}

/** 公开渲染解析：自定义域名 → 已发布落地页 slug。 */
export async function getLandingSlugByCustomDomain(domain: string): Promise<string | null> {
  const result = await pool.query(
    `SELECT lp.slug FROM domains d
       JOIN landing_pages lp ON lp.id = d.landing_page_id
     WHERE d.domain = $1 AND d.enabled = true AND d.verified = true AND lp.status = 'published'`,
    [domain],
  );
  return result.rows[0]?.slug ?? null;
}
