ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
  CHECK (plan IN ('free', 'starter', 'pro', 'agency'));

ALTER TABLE sites ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;
