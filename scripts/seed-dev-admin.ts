// scripts/seed-dev-admin.ts
// 本地 dev 用：种一个默认管理员账号，配合登录页预填账密一键登录联调。
// 用法：pnpm db:seed-dev （读取 .env.local 的 DATABASE_URL，仅用于本地 docker 库）
import { config } from "dotenv";
config({ path: ".env.local", override: true, quiet: true });

import { Pool } from "pg";
import bcrypt from "bcryptjs";

const EMAIL = "admin@zapbridge.com";
const PASSWORD = "Password1!";
const NAME = "Dev Admin";

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) throw new Error("DATABASE_URL 未配置（.env.local）");
  const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
  const pool = new Pool({ connectionString: url, ssl: isLocal ? false : { rejectUnauthorized: false } });

  const hash = await bcrypt.hash(PASSWORD, 12);
  await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name`,
    [NAME, EMAIL, hash],
  );
  console.log(`Seeded dev admin: ${EMAIL} / ${PASSWORD}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
