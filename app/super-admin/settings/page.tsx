import pool from "@/lib/db";
import { effectivePlan, activeCompPlan, type PlanId } from "@/lib/plans";
import { UserRole } from "@/lib/constants";
import { hostnameOf, appHostname } from "@/lib/host";
import { SuperAdminSettingsClient, type SettingsData, type SuperAdminRow } from "./_client";

async function getSuperAdmins(): Promise<SuperAdminRow[]> {
  const result = await pool.query(
    `SELECT id, email, plan, comp_plan, comp_plan_expires_at, disabled_at FROM users WHERE role = $1 ORDER BY email`,
    [UserRole.SUPER_ADMIN],
  );
  const now = new Date();
  return result.rows.map((u) => ({
    id: u.id as string,
    email: u.email as string,
    effectivePlan: effectivePlan(
      (u.plan ?? "free") as PlanId,
      activeCompPlan(u.comp_plan as PlanId | null, u.comp_plan_expires_at, now),
    ),
    disabled: Boolean(u.disabled_at),
  }));
}

// 白名单邮箱数量（只取数量，不外泄明文）。
function adminWhitelistCount(): number {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean).length;
}

export default async function SuperAdminSettingsPage() {
  const admins = await getSuperAdmins();

  const data: SettingsData = {
    env: {
      nodeEnv: process.env.NODE_ENV ?? "—",
      region: process.env.VERCEL_REGION ?? "—",
      appHost: appHostname || hostnameOf(process.env.NEXT_PUBLIC_APP_URL) || "—",
      aiProvider: process.env.AI_PROVIDER ?? "—",
    },
    admins,
    adminWhitelistCount: adminWhitelistCount(),
  };

  return <SuperAdminSettingsClient data={data} />;
}
