/** @type {import('node-pg-migrate').MigrationBuilder} */
// CAPI 凭据：用户的服务端 Access Token，仅服务端读、永不下发客户端。
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS page_capi_credentials (
      id           BIGSERIAL   PRIMARY KEY,
      page_id      TEXT        NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
      provider     TEXT        NOT NULL CHECK (provider IN ('meta','tiktok')),
      access_token TEXT        NOT NULL,
      external_id  TEXT        NOT NULL,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (page_id, provider)
    );
  `);
};
exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS page_capi_credentials;`);
};
