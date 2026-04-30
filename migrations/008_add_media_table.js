/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS media (
      id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      url        TEXT        NOT NULL,
      filename   TEXT        NOT NULL,
      type       TEXT        NOT NULL CHECK (type IN ('image', 'video')),
      size       INTEGER     NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_media_user_id ON media(user_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_media_user_id;
    DROP TABLE IF EXISTS media;
  `);
};
