import pool from "@/lib/db";
import type { PresetTemplate } from "@/lib/templates";

interface Row {
  id: string;
  name: string;
  description: string;
  category: string;
  accent_color: string;
  gradient: string;
  data: unknown;
  sort_order: number;
}

function rowToTemplate(row: Row): PresetTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    accentColor: row.accent_color,
    gradient: row.gradient,
    data: row.data as PresetTemplate["data"],
  };
}

export async function listPresetTemplates(): Promise<PresetTemplate[]> {
  const result = await pool.query<Row>(
    `SELECT id, name, description, category, accent_color, gradient, data, sort_order
     FROM preset_templates
     ORDER BY sort_order ASC, created_at ASC`
  );
  return result.rows.map(rowToTemplate);
}

export async function upsertPresetTemplate(
  t: PresetTemplate,
  userId: string,
): Promise<PresetTemplate> {
  const result = await pool.query<Row>(
    `INSERT INTO preset_templates
       (id, name, description, category, accent_color, gradient, data, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       category = EXCLUDED.category,
       accent_color = EXCLUDED.accent_color,
       gradient = EXCLUDED.gradient,
       data = EXCLUDED.data,
       updated_at = NOW()
     RETURNING id, name, description, category, accent_color, gradient, data, sort_order`,
    [t.id, t.name, t.description, t.category, t.accentColor, t.gradient, JSON.stringify(t.data), userId],
  );
  return rowToTemplate(result.rows[0]);
}

export async function deletePresetTemplate(id: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM preset_templates WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}
