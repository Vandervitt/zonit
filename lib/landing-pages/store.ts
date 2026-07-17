import pool from "@/lib/db";
import type { LandingPageDraft } from "@/types/schema.draft";

export interface LandingPageRow {
  id: string;
  user_id: string;
  name: string;
  slug: string | null;
  status: "draft" | "published";
  data: LandingPageDraft;
  published_at: string | null;
  created_at: string;
  updated_at: string;
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
): Promise<LandingPageRow> {
  const result = await pool.query(
    `INSERT INTO landing_pages (user_id, name, data) VALUES ($1, $2, $3) RETURNING *`,
    [userId, name, JSON.stringify(data)],
  );
  return result.rows[0];
}

export async function listLandingPages(userId: string): Promise<LandingPageRow[]> {
  const result = await pool.query(
    `SELECT * FROM landing_pages WHERE user_id = $1 ORDER BY updated_at DESC`,
    [userId],
  );
  return result.rows;
}

export async function getLandingPage(id: string, userId: string): Promise<LandingPageRow | null> {
  const result = await pool.query(
    `SELECT * FROM landing_pages WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return result.rows[0] ?? null;
}

export async function updateLandingPageDraft(
  id: string,
  userId: string,
  fields: { name?: string; data?: LandingPageDraft },
): Promise<LandingPageRow | null> {
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
  return result.rows[0] ?? null;
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
): Promise<LandingPageRow | null> {
  const result = await pool.query(
    `UPDATE landing_pages
       SET status = 'published', slug = $1, published_at = COALESCE(published_at, NOW()), updated_at = NOW()
     WHERE id = $2 AND user_id = $3 RETURNING *`,
    [slug, id, userId],
  );
  return result.rows[0] ?? null;
}

export async function unpublishLandingPage(id: string, userId: string): Promise<LandingPageRow | null> {
  const result = await pool.query(
    `UPDATE landing_pages SET status = 'draft', updated_at = NOW()
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId],
  );
  return result.rows[0] ?? null;
}

/** 公开渲染用：按 slug 取已发布页面。 */
export async function getPublishedBySlug(slug: string): Promise<LandingPageRow | null> {
  const result = await pool.query(
    `SELECT * FROM landing_pages WHERE slug = $1 AND status = 'published'`,
    [slug],
  );
  return result.rows[0] ?? null;
}

/** 复制为新草稿：name 加「副本」，status/slug 走默认（draft / null），data 整体拷贝。 */
export async function duplicateLandingPage(id: string, userId: string): Promise<LandingPageRow | null> {
  const src = await getLandingPage(id, userId);
  if (!src) return null;
  const result = await pool.query(
    `INSERT INTO landing_pages (user_id, name, data) VALUES ($1, $2, $3) RETURNING *`,
    [userId, `${src.name} 副本`, JSON.stringify(src.data)],
  );
  return result.rows[0];
}

/** 仅改名（不触碰 data）。 */
export async function renameLandingPage(id: string, userId: string, name: string): Promise<LandingPageRow | null> {
  const result = await pool.query(
    `UPDATE landing_pages SET name = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *`,
    [name, id, userId],
  );
  return result.rows[0] ?? null;
}
