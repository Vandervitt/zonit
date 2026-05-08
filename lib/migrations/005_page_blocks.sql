-- v5: 拆分 sites.data 中的 blocks 和 theme_config
-- 目的：blocks 独立成表支持排序/可见性控制；theme_config 与内容分离便于独立演化

-- 1. sites 表新增 theme_config 列
--    存储视觉主题（颜色、字体、圆角、间距），与内容数据 data 解耦
ALTER TABLE sites ADD COLUMN IF NOT EXISTS theme_config JSONB;

-- 2. page_blocks 表：存储页面的可选 section，保留独立排序和可见性控制
CREATE TABLE IF NOT EXISTS page_blocks (
  id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  site_id    TEXT        NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL,           -- BlockType 枚举值，如 'Features' / 'Reviews' / 'FAQ'
  sort_order INTEGER     NOT NULL DEFAULT 0, -- 渲染顺序，编辑器拖拽排序写此字段
  data       JSONB       NOT NULL,           -- 对应 BlockType 的 Schema 数据
  visible    BOOLEAN     NOT NULL DEFAULT true, -- false 时渲染器跳过该 block，不删除数据
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_blocks_site_id
  ON page_blocks(site_id, sort_order)
  WHERE visible = true;

-- 3. 迁移存量数据：将 sites.data.blocks 写入 page_blocks 表
--    假设 data.blocks 是 [{id, type, data}, ...] 结构
INSERT INTO page_blocks (id, site_id, type, sort_order, data)
SELECT
  COALESCE(block->>'id', gen_random_uuid()::TEXT),
  s.id,
  block->>'type',
  (row_number() OVER (PARTITION BY s.id ORDER BY ordinality) - 1) * 10,
  block->'data'
FROM sites s,
     jsonb_array_elements(
       CASE
         WHEN s.data ? 'blocks' AND jsonb_typeof(s.data->'blocks') = 'array'
         THEN s.data->'blocks'
         ELSE '[]'::jsonb
       END
     ) WITH ORDINALITY AS arr(block, ordinality)
WHERE block->>'type' IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 4. 迁移存量数据：将 sites.data.themeConfig 写入 sites.theme_config
UPDATE sites
SET theme_config = data->'themeConfig'
WHERE data ? 'themeConfig'
  AND theme_config IS NULL;

-- 5. 从 sites.data 中清除已迁移的字段，保持 data 只含页面内容结构
--    （blocks 和 themeConfig 已有独立存储，data 中保留 hero/offer/footer 等核心字段）
UPDATE sites
SET data = data - 'blocks' - 'themeConfig'
WHERE data ? 'blocks' OR data ? 'themeConfig';
