/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql(`
    DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'USER'
      CHECK (role IN ('USER', 'ADMIN', 'SUPER_ADMIN'));
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE users DROP COLUMN IF EXISTS role;
    DROP TYPE IF EXISTS user_role;
  `);
};
