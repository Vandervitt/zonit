// scripts/seed-dev-admin.ts
// 本地 dev 用：种默认管理员账号 + 必要联调数据（已验证自有域名），
// 配合登录页预填账密，本地即可跑通「登录→建页→编辑→预览→发布→公开渲染」全流程。
// 用法：pnpm db:seed-dev （读取 .env.local 的 DATABASE_URL，仅用于本地 docker 库）
//
// 发布后在浏览器查看公开页，需把测试域名指到本机，将下面两行加入 /etc/hosts：
//   127.0.0.1 dev-acme.test
//   127.0.0.1 dev-demo.test
// 然后访问 http://dev-acme.test:3001/ （由 handleTenancy 按 host 渲染已发布落地页）。
import { config } from "dotenv";
config({ path: ".env.local", override: true, quiet: true });

import { Pool } from "pg";
import bcrypt from "bcryptjs";

const EMAIL = "admin@zapbridge.com";
const PASSWORD = "Password1!";
const NAME = "Dev Admin";

/** 预置的「已验证启用」自有域名，供发布时选择（一域名一已发布页）。 */
const DEV_DOMAINS = ["dev-acme.test", "dev-demo.test"];

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) throw new Error("DATABASE_URL 未配置（.env.local）");
  const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
  const pool = new Pool({ connectionString: url, ssl: isLocal ? false : { rejectUnauthorized: false } });

  // 1) admin 用户（幂等 upsert，返回 id）
  const hash = await bcrypt.hash(PASSWORD, 12);
  const userRes = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name
     RETURNING id`,
    [NAME, EMAIL, hash],
  );
  const userId: string = userRes.rows[0].id;
  console.log(`✓ dev admin: ${EMAIL} / ${PASSWORD}  (id=${userId})`);

  // 2) 已验证启用的自有域名（幂等：按 domain 唯一约束 upsert，重置为本用户的 verified+enabled，并解绑旧页）
  for (const domain of DEV_DOMAINS) {
    await pool.query(
      `INSERT INTO domains (user_id, domain, enabled, verified)
       VALUES ($1, $2, true, true)
       ON CONFLICT (domain) DO UPDATE
         SET user_id = EXCLUDED.user_id, enabled = true, verified = true, landing_page_id = NULL`,
      [userId, domain],
    );
    console.log(`✓ verified domain: ${domain}`);
  }

  console.log("\nSeed 完成。发布后浏览器访问公开页前，请把测试域名加入 /etc/hosts（见脚本顶部注释）。");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
