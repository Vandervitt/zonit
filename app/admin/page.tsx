import pool from "@/lib/db";
import { 
  Users, 
  Globe, 
  CreditCard, 
  ArrowUpRight, 
  Activity,
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getStats() {
  const usersCount = await pool.query("SELECT COUNT(*) FROM users");
  const sitesCount = await pool.query("SELECT COUNT(*) FROM sites");
  const activeSubscriptions = await pool.query("SELECT COUNT(*) FROM users WHERE plan != 'free'");
  const latestSites = await pool.query(`
    SELECT s.*, u.email as user_email 
    FROM sites s 
    JOIN users u ON s.user_id = u.id 
    ORDER BY s.created_at DESC 
    LIMIT 5
  `);

  return {
    totalUsers: parseInt(usersCount.rows[0].count),
    totalSites: parseInt(sitesCount.rows[0].count),
    activeSubs: parseInt(activeSubscriptions.rows[0].count),
    latestSites: latestSites.rows
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      description: "Registered accounts",
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Total Sites",
      value: stats.totalSites,
      icon: Globe,
      description: "Created by users",
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubs,
      icon: CreditCard,
      description: "Paid plans",
      color: "text-violet-600",
      bg: "bg-violet-50"
    },
    {
      title: "Conversion Rate",
      value: `${((stats.activeSubs / (stats.totalUsers || 1)) * 100).toFixed(1)}%`,
      icon: Activity,
      description: "Free to Paid",
      color: "text-amber-600",
      bg: "bg-amber-50"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Platform Overview</h1>
        <p className="text-slate-500 mt-2">Real-time performance metrics and recent activities.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-500">
                {card.title}
              </CardTitle>
              <div className={`${card.bg} p-2 rounded-lg`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{card.value}</div>
              <p className="text-xs text-slate-400 mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recently Created Sites</CardTitle>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.latestSites.map((site: any) => (
                <div key={site.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-slate-200 text-lg">
                      🎨
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{site.name}</p>
                      <p className="text-xs text-slate-500">{site.user_email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${
                      site.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {site.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(site.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm flex flex-col justify-center items-center p-8 text-center bg-indigo-600 text-white">
          <div className="w-16 h-16 rounded-full bg-indigo-500/50 flex items-center justify-center mb-4">
            <Plus className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold">New Platform feature?</h3>
          <p className="text-indigo-100 mt-2 mb-6 max-w-[280px]">
            You can extend the admin panel to manage templates, blocks, or global system settings.
          </p>
          <button className="px-6 py-2.5 bg-white text-indigo-600 rounded-lg font-semibold text-sm hover:bg-indigo-50 transition-colors">
            Read Docs
          </button>
        </Card>
      </div>
    </div>
  );
}
