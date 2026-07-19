import { randomBytes } from "node:crypto";
import pool from "@/lib/db";
import type { LandingPageDraft } from "@/types/schema.draft";

export interface LandingPageRow {
  id: string;
  user_id: string;
  name: string;
  slug: string | null;
  status: "draft" | "published";
  data: LandingPageDraft;
  published_data: LandingPageDraft | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  preview_secret: string | null;
}

/** 客户端可见的落地页行：剔除 preview_secret（撤销密钥）与 published_data（线上快照，客户端只编辑草稿）。 */
export type ClientLandingPageRow = Omit<LandingPageRow, "preview_secret" | "published_data">;

/** 列表行：额外带当前绑定的已验证域名（无绑定为 null），供列表展示与线上预览链接。 */
export type LandingPageListRow = ClientLandingPageRow & { bound_domain: string | null };

/** 从 DB 行剥离 preview_secret / published_data，用于任何要经 API 返回给客户端的落地页数据。 */
function toClient(row: LandingPageRow): ClientLandingPageRow {
  const rest = { ...row };
  delete (rest as Partial<LandingPageRow>).preview_secret;
  delete (rest as Partial<LandingPageRow>).published_data;
  return rest;
}

/** 把任意页面名转为 url-safe slug。 */
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "page";
}

export async function createLandingPage(
  userId: string,
  name: string,
  data: LandingPageDraft,
): Promise<ClientLandingPageRow> {
  const result = await pool.query(
    `INSERT INTO landing_pages (user_id, name, data) VALUES ($1, $2, $3) RETURNING *`,
    [userId, name, JSON.stringify(data)],
  );
  return toClient(result.rows[0]);
}

export async function listLandingPages(userId: string): Promise<LandingPageListRow[]> {
  const result = await pool.query(
    `SELECT lp.*, d.domain AS bound_domain
       FROM landing_pages lp
       LEFT JOIN LATERAL (
         SELECT domain FROM domains
          WHERE landing_page_id = lp.id AND enabled = true AND verified = true
          LIMIT 1
       ) d ON true
     WHERE lp.user_id = $1 ORDER BY lp.updated_at DESC`,
    [userId],
  );
  return result.rows.map((row) => ({ ...toClient(row), bound_domain: row.bound_domain ?? null }));
}

export async function getLandingPage(id: string, userId: string): Promise<ClientLandingPageRow | null> {
  const result = await pool.query(
    `SELECT * FROM landing_pages WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return result.rows[0] ? toClient(result.rows[0]) : null;
}

export async function updateLandingPageDraft(
  id: string,
  userId: string,
  fields: { name?: string; data?: LandingPageDraft },
): Promise<ClientLandingPageRow | null> {
  const set: string[] = ["updated_at = NOW()"];
  const values: unknown[] = [];
  let i = 1;
  if (fields.name !== undefined) { set.push(`name = $${i++}`); values.push(fields.name); }
  if (fields.data !== undefined) { set.push(`data = $${i++}`); values.push(JSON.stringify(fields.data)); }
  values.push(id, userId);
  const result = await pool.query(
    `UPDATE landing_pages SET ${set.join(", ")} WHERE id = $${i++} AND user_id = $${i} RETURNING *`,
    values,
  );
  return result.rows[0] ? toClient(result.rows[0]) : null;
}

export async function deleteLandingPage(id: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM landing_pages WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId],
  );
  return result.rows.length > 0;
}

/** slug 是否被别的页面占用。 */
export async function isSlugTaken(slug: string, exceptId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM landing_pages WHERE slug = $1 AND id != $2`,
    [slug, exceptId],
  );
  return result.rows.length > 0;
}

/** 生成同一用户下不重名的落地页名称（撞 idx_landing_pages_user_name 时追加「 2」「 3」…）。 */
export async function ensureUniqueName(userId: string, desired: string): Promise<string> {
  const base = desired.trim() || "未命名落地页";
  for (let n = 1; n < 200; n++) {
    const candidate = n === 1 ? base : `${base} ${n}`;
    const res = await pool.query(
      `SELECT 1 FROM landing_pages WHERE user_id = $1 AND name = $2`,
      [userId, candidate],
    );
    if (res.rows.length === 0) return candidate;
  }
  return `${base} ${Date.now().toString(36)}`;
}

/** 生成不与他人冲突的唯一 slug（必要时追加短后缀）。 */
export async function ensureUniqueSlug(desired: string, exceptId: string): Promise<string> {
  const base = slugify(desired);
  let candidate = base;
  for (let n = 0; n < 50; n++) {
    if (!(await isSlugTaken(candidate, exceptId))) return candidate;
    candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function publishLandingPage(
  id: string,
  userId: string,
  slug: string,
): Promise<ClientLandingPageRow | null> {
  // published_data 快照当前草稿：线上只读快照，后续编辑草稿不影响线上，直到再次发布。
  // published_at 每次发布刷新，updated_at > published_at 即「有未发布的修改」。
  const result = await pool.query(
    `UPDATE landing_pages
       SET status = 'published', slug = $1, published_data = data, published_at = NOW(), updated_at = NOW()
     WHERE id = $2 AND user_id = $3 RETURNING *`,
    [slug, id, userId],
  );
  return result.rows[0] ? toClient(result.rows[0]) : null;
}

export async function unpublishLandingPage(id: string, userId: string): Promise<ClientLandingPageRow | null> {
  const result = await pool.query(
    `UPDATE landing_pages SET status = 'draft', updated_at = NOW()
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId],
  );
  return result.rows[0] ? toClient(result.rows[0]) : null;
}

/** 公开渲染用：按 slug 取已发布页面（owner 被禁用时视同不存在）。data 为发布时快照。 */
export async function getPublishedBySlug(slug: string): Promise<LandingPageRow | null> {
  const result = await pool.query(
    `SELECT lp.* FROM landing_pages lp
       JOIN users u ON u.id = lp.user_id
     WHERE lp.slug = $1 AND lp.status = 'published' AND u.disabled_at IS NULL`,
    [slug],
  );
  const row = result.rows[0];
  if (!row) return null;
  return { ...row, data: row.published_data ?? row.data };
}

/** 复制为新草稿：name 加「副本」（撞名自动追加序号），status/slug 走默认（draft / null），data 整体拷贝。 */
export async function duplicateLandingPage(id: string, userId: string): Promise<ClientLandingPageRow | null> {
  const src = await getLandingPage(id, userId);
  if (!src) return null;
  const name = await ensureUniqueName(userId, `${src.name} 副本`);
  const result = await pool.query(
    `INSERT INTO landing_pages (user_id, name, data) VALUES ($1, $2, $3) RETURNING *`,
    [userId, name, JSON.stringify(src.data)],
  );
  return toClient(result.rows[0]);
}

/** 仅改名（不触碰 data）。 */
export async function renameLandingPage(id: string, userId: string, name: string): Promise<ClientLandingPageRow | null> {
  const result = await pool.query(
    `UPDATE landing_pages SET name = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *`,
    [name, id, userId],
  );
  return result.rows[0] ? toClient(result.rows[0]) : null;
}

/** 预览渲染用：按 id 取页面（草稿也可预览），附带 owner 是否被禁用。 */
export async function getPageForPreview(
  id: string,
): Promise<(LandingPageRow & { owner_disabled: boolean }) | null> {
  const result = await pool.query(
    `SELECT lp.*, (u.disabled_at IS NOT NULL) AS owner_disabled
       FROM landing_pages lp JOIN users u ON u.id = lp.user_id
     WHERE lp.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

/** 确保该页有 preview_secret：无则惰性生成并持久化，返回最终值。按 owner 隔离。 */
export async function ensurePreviewSecret(id: string, userId: string): Promise<string | null> {
  const secret = randomBytes(16).toString("hex");
  const result = await pool.query(
    `UPDATE landing_pages
       SET preview_secret = COALESCE(preview_secret, $1)
     WHERE id = $2 AND user_id = $3
     RETURNING preview_secret`,
    [secret, id, userId],
  );
  return result.rows[0]?.preview_secret ?? null;
}

/** 轮换 preview_secret（撤销所有旧链接）。按 owner 隔离，返回新值。 */
export async function rotatePreviewSecret(id: string, userId: string): Promise<string | null> {
  const secret = randomBytes(16).toString("hex");
  const result = await pool.query(
    `UPDATE landing_pages SET preview_secret = $1 WHERE id = $2 AND user_id = $3 RETURNING preview_secret`,
    [secret, id, userId],
  );
  return result.rows[0]?.preview_secret ?? null;
}

/** 把草稿恢复为线上快照（published_data）；未发布过（无快照）时不生效返回 null。 */
export async function restoreDraftFromLive(id: string, userId: string): Promise<ClientLandingPageRow | null> {
  const result = await pool.query(
    `UPDATE landing_pages SET data = published_data, updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND published_data IS NOT NULL RETURNING *`,
    [id, userId],
  );
  return result.rows[0] ? toClient(result.rows[0]) : null;
}
