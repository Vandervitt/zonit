import pool from "@/lib/db";
import { ROOT_PATH } from "@/lib/domains/route-path";

/** 域名下的一个已占用路径（含未发布的：route 行在取消发布后保留）。 */
export interface DomainRouteInfo {
  path: string;
  landingPageId: string;
  landingPageName: string;
  published: boolean;
}

export interface DomainRow {
  id: string;
  user_id: string;
  routes?: DomainRouteInfo[];
  landing_page_id?: string | null;
  domain: string;
  enabled: boolean;
  verified: boolean;
  created_at: string;
  landing_page_name?: string;
}

export async function getUserDomains(userId: string): Promise<DomainRow[]> {
  // routes 聚合该域名下每个已占用路径及其页面，供发布弹窗按 (域名, 路径) 提示占位，
  // 以及域名列表显示「根路径尚未发布」（设计决策 D6）。
  // 无路由的域名 json_agg 会得到 [null]，用 FILTER 排除，保证空域名拿到空数组。
  const result = await pool.query(
    `SELECT d.*,
            lp.name AS landing_page_name,
            COALESCE(r.routes, '[]'::json) AS routes
     FROM domains d
     LEFT JOIN landing_pages lp ON lp.id = d.landing_page_id
     LEFT JOIN LATERAL (
       SELECT json_agg(
                json_build_object(
                  'path', dr.path,
                  'landingPageId', dr.landing_page_id,
                  'landingPageName', rp.name,
                  'published', rp.status = 'published'
                ) ORDER BY dr.path
              ) FILTER (WHERE dr.id IS NOT NULL) AS routes
         FROM domain_routes dr
         JOIN landing_pages rp ON rp.id = dr.landing_page_id
        WHERE dr.domain_id = d.id
     ) r ON true
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
  landingPageId?: string | null;
  domain: string;
}): Promise<DomainRow> {
  const result = await pool.query(
    `INSERT INTO domains (id, user_id, landing_page_id, domain)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [params.id, params.userId, params.landingPageId ?? null, params.domain],
  );
  return result.rows[0];
}

export async function updateDomain(
  id: string,
  userId: string,
  fields: Partial<{ enabled: boolean; verified: boolean }>
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

/**
 * 把一个已验证启用的域名绑定到落地页的某个路径。
 *
 * 双写期（P1）：同时写 domain_routes（新解析依据）与 domains.landing_page_id（旧列）。
 * 旧列是全部客户页面此前的解析依据，保留双写才有回滚路径——只写新表的话，
 * 一旦新链路出问题回滚代码，期间新发布的页在旧列里没有记录，会直接下线。
 * P2 开放多路径后旧列语义不再成立（一域名多页无法用单列表达），届时停止双写并删列。
 *
 * 语义沿用「覆盖式替换」：同一域名同一路径重复发布即替换；同一张页改发到别处时，
 * 先清掉它原来的位置（domain_routes.landing_page_id 唯一，见设计决策 D7）。
 */
export async function bindDomainToLandingPage(
  domainId: string,
  userId: string,
  landingPageId: string,
  path: string = ROOT_PATH,
): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 归属校验与旧列写入合并为一步：命中 0 行即域名不属于该用户或未验证启用。
    const owned = await client.query(
      `UPDATE domains SET landing_page_id = $1
        WHERE id = $2 AND user_id = $3 AND enabled = true AND verified = true RETURNING id`,
      [landingPageId, domainId, userId],
    );
    if (owned.rows.length === 0) {
      await client.query("ROLLBACK");
      return false;
    }

    // 该页若已发布在别处，先释放原位置（一页一位置）。
    await client.query("DELETE FROM domain_routes WHERE landing_page_id = $1", [landingPageId]);
    await client.query(
      `INSERT INTO domain_routes (domain_id, path, landing_page_id)
            VALUES ($1, $2, $3)
       ON CONFLICT (domain_id, path)
       DO UPDATE SET landing_page_id = EXCLUDED.landing_page_id`,
      [domainId, path, landingPageId],
    );

    await client.query("COMMIT");
    return true;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export interface PublishedRoute {
  path: string;
  slug: string;
  updated_at: string;
  noindex: boolean;
}

/**
 * 某自定义域名下全部已发布路径（供租户 sitemap / robots）。
 * noindex 取自发布快照 published_data，与公开渲染读的是同一份内容——
 * 读草稿会让「改了草稿但没更新发布」的页在 sitemap 里按未上线的设置输出。
 */
export async function listPublishedRoutes(domain: string): Promise<PublishedRoute[]> {
  const result = await pool.query(
    `SELECT r.path,
            lp.slug,
            lp.updated_at,
            COALESCE((COALESCE(lp.published_data, lp.data) -> 'seo' ->> 'noindex') = 'true', false) AS noindex
       FROM domain_routes r
       JOIN domains d        ON d.id = r.domain_id
       JOIN landing_pages lp ON lp.id = r.landing_page_id
       JOIN users u          ON u.id = lp.user_id
      WHERE d.domain = $1
        AND d.enabled = true AND d.verified = true
        AND lp.status = 'published' AND u.disabled_at IS NULL
      ORDER BY r.path`,
    [domain],
  );
  return result.rows;
}

/**
 * 公开渲染解析：自定义域名 + 路径 → 已发布落地页 slug。
 * 未命中返回 null（调用方 404）。域名未验证/未启用、页面非 published 均视为未命中。
 */
export async function resolveTenantRoute(domain: string, path: string): Promise<string | null> {
  const result = await pool.query(
    `SELECT lp.slug
       FROM domain_routes r
       JOIN domains d        ON d.id = r.domain_id
       JOIN landing_pages lp ON lp.id = r.landing_page_id
      WHERE d.domain = $1 AND r.path = $2
        AND d.enabled = true AND d.verified = true AND lp.status = 'published'`,
    [domain, path],
  );
  return result.rows[0]?.slug ?? null;
}
