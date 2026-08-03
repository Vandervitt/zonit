// 开发期辅助：清空自检器的限频计数。仅用于本地联调 / e2e 前置，不在生产运行。
import pool from "@/lib/db";

async function main() {
  const before = await pool.query(
    "SELECT bucket, count(*)::int AS n FROM rate_limit_hits WHERE bucket LIKE 'pagecheck%' GROUP BY bucket",
  );
  console.log("清理前:", before.rows);
  const d = await pool.query("DELETE FROM rate_limit_hits WHERE bucket LIKE 'pagecheck%'");
  console.log("已清理:", d.rowCount);
  process.exit(0);
}

void main();
