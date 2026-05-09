/* eslint-disable @typescript-eslint/no-require-imports */
const beautyTemplate = require("../lib/template-extraction/beauty-template.json");

function sqlString(value) {
  return String(value).replace(/'/g, "''");
}

/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE preset_templates
      ADD COLUMN IF NOT EXISTS data_schema TEXT NOT NULL DEFAULT 'landing_page',
      ADD COLUMN IF NOT EXISTS renderer TEXT NOT NULL DEFAULT 'standard';

    ALTER TABLE preset_templates
      DROP CONSTRAINT IF EXISTS preset_templates_data_schema_check,
      DROP CONSTRAINT IF EXISTS preset_templates_renderer_check;

    ALTER TABLE preset_templates
      ADD CONSTRAINT preset_templates_data_schema_check
        CHECK (data_schema IN ('landing_page', 'extracted_template')),
      ADD CONSTRAINT preset_templates_renderer_check
        CHECK (renderer IN ('standard', 'beauty_extracted'));

    INSERT INTO preset_templates
      (id, name, description, category, accent_color, gradient, data_schema, renderer, data, sort_order)
    VALUES
      (
        'tpl_extracted_beauty',
        'RadiantGlow Beauty',
        'Extracted beauty lead-generation landing page with original module data and styling preserved.',
        'Beauty Lead Generation',
        '#db2777',
        'from-pink-500 to-rose-500',
        'extracted_template',
        'beauty_extracted',
        '${sqlString(JSON.stringify(beautyTemplate))}'::jsonb,
        0
      )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      category = EXCLUDED.category,
      accent_color = EXCLUDED.accent_color,
      gradient = EXCLUDED.gradient,
      data_schema = EXCLUDED.data_schema,
      renderer = EXCLUDED.renderer,
      data = EXCLUDED.data,
      sort_order = EXCLUDED.sort_order,
      updated_at = NOW();
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM preset_templates WHERE id = 'tpl_extracted_beauty';

    ALTER TABLE preset_templates
      DROP CONSTRAINT IF EXISTS preset_templates_data_schema_check,
      DROP CONSTRAINT IF EXISTS preset_templates_renderer_check,
      DROP COLUMN IF EXISTS data_schema,
      DROP COLUMN IF EXISTS renderer;
  `);
};
