import pool from "@/lib/db";
import { SuperAdminOverview, type OverviewStats } from "./_overview-client";

async function getStats(): Promise<OverviewStats> {
  const usersCount = await pool.query("SELECT COUNT(*) FROM users");
  const pagesCount = await pool.query("SELECT COUNT(*) FROM landing_pages");
  const activeSubscriptions = await pool.query("SELECT COUNT(*) FROM users WHERE plan != 'free'");
  const latestPages = await pool.query(`
    SELECT lp.id, lp.name, lp.status, lp.created_at, u.email as user_email
    FROM landing_pages lp
    JOIN users u ON lp.user_id = u.id
    ORDER BY lp.created_at DESC
    LIMIT 5
  `);

  return {
    totalUsers: parseInt(usersCount.rows[0].count),
    totalPages: parseInt(pagesCount.rows[0].count),
    activeSubs: parseInt(activeSubscriptions.rows[0].count),
    latestPages: latestPages.rows.map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      created_at: new Date(r.created_at).toISOString(),
      user_email: r.user_email,
    })),
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();
  return <SuperAdminOverview stats={stats} />;
}
