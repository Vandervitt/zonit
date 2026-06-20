import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@/lib/constants";
import Link from "next/link";
import {
  Users,
  Settings,
  BarChart3,
  ShieldCheck,
  LogOut,
  ChevronRight
} from "lucide-react";

async function AdminSidebar() {
  const session = await auth();
  
  const navItems = [
    { icon: BarChart3, label: "Overview", href: "/super-admin" },
    { icon: Users, label: "Users", href: "/super-admin/users" },
    { icon: Settings, label: "Platform Settings", href: "/super-admin/settings" },
  ];

  return (
    <aside className="w-64 min-h-screen bg-foreground text-white/60 flex flex-col py-6 px-4 shrink-0 shadow-xl">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-bloom-500 to-tech flex items-center justify-center shadow-sm shadow-tech/40">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-white font-bold tracking-tight block">ZONIT ADMIN</span>
          <span className="text-[10px] text-tech-soft font-medium uppercase tracking-widest">Management</span>
        </div>
      </div>

      <nav className="flex flex-col gap-1.5 flex-1">
        {navItems.map(({ icon: Icon, label, href }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center justify-between group px-3 py-2.5 rounded-lg text-sm transition-all hover:bg-white/10 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-white/50 group-hover:text-tech-soft" />
              <span>{label}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </nav>

      <div className="pt-6 border-t border-white/10">
        <div className="px-3 mb-4">
          <p className="text-[10px] text-white/50 uppercase font-semibold tracking-wider">Operator</p>
          <p className="text-sm text-white/40 truncate mt-1">{session?.user?.email}</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Admin</span>
        </Link>
      </div>
    </aside>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user?.role !== UserRole.SUPER_ADMIN) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-bloom-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
