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

interface LatestPageRow {
  id: string;
  name: string;
  status: string;
  created_at: string | Date;
  user_email: string;
}

async function getStats() {
  const usersCount = await pool.query("SELECT COUNT(*) FROM users");
  const pagesCount = await pool.query("SELECT COUNT(*) FROM landing_pages");
  const activeSubscriptions = await pool.query("SELECT COUNT(*) FROM users WHERE plan != 'free'");
  const latestPages = await pool.query(`
    SELECT lp.*, u.email as user_email
    FROM landing_pages lp
    JOIN users u ON lp.user_id = u.id
    ORDER BY lp.created_at DESC
    LIMIT 5
  `);

  return {
    totalUsers: parseInt(usersCount.rows[0].count),
    totalPages: parseInt(pagesCount.rows[0].count),
    activeSubs: parseInt(activeSubscriptions.rows[0].count),
    latestPages: latestPages.rows as LatestPageRow[],
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
      color: "text-tech",
      bg: "bg-tech-soft/20"
    },
    {
      title: "Total Pages",
      value: stats.totalPages,
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
      color: "text-bloom-600",
      bg: "bg-bloom-50"
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Platform Overview</h1>
        <p className="text-muted-foreground mt-2">Real-time performance metrics and recent activities.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`${card.bg} p-2 rounded-lg`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recently Created Pages</CardTitle>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.latestPages.map((site) => (
                <div key={site.id} className="flex items-center justify-between p-3 rounded-xl bg-bloom-50 border border-bloom-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-bloom-100 text-lg">
                      🎨
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{site.name}</p>
                      <p className="text-xs text-muted-foreground">{site.user_email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${
                      site.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-bloom-100 text-muted-foreground'
                    }`}>
                      {site.status}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(site.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg shadow-bloom-500/20 flex flex-col justify-center items-center p-8 text-center bg-gradient-to-br from-bloom-500 to-tech text-white">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
            <Plus className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold">New Platform feature?</h3>
          <p className="text-white/80 mt-2 mb-6 max-w-[280px]">
            You can extend the admin panel to manage templates, blocks, or global system settings.
          </p>
          <button className="px-6 py-2.5 bg-white text-bloom-600 rounded-lg font-semibold text-sm hover:bg-bloom-50 transition-colors">
            Read Docs
          </button>
        </Card>
      </div>
    </div>
  );
}
