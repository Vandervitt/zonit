CREATE TABLE IF NOT EXISTS domains (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_id    TEXT REFERENCES sites(id) ON DELETE SET NULL,
  domain     TEXT NOT NULL UNIQUE,
  enabled    BOOLEAN NOT NULL DEFAULT false,
  verified   BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_lookup ON domains(domain) WHERE enabled = true AND verified = true;
