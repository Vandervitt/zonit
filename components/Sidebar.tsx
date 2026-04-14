"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart2,
  CheckSquare,
  FileText,
  Bell,
  Settings,
  HelpCircle,
  Grid2x2,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: BarChart2, label: "Statistics", href: "/statistics" },
  { icon: CheckSquare, label: "Task list", href: "/tasks" },
  { icon: FileText, label: "Report", href: "/reports" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
];

const otherItems = [
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: HelpCircle, label: "Help", href: "/help" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-52 min-h-screen bg-white/80 backdrop-blur-sm flex flex-col py-6 px-4 shrink-0 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center">
          <Grid2x2 className="w-4 h-4 text-white" />
        </div>
        <span className="text-slate-800 tracking-widest text-sm uppercase">
          PULSAR
        </span>
      </div>

      {/* Main Nav */}
      <nav className="flex flex-col gap-1">
        {navItems.map(({ icon: Icon, label, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                active
                  ? "bg-slate-100 text-slate-800"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${active ? "text-slate-700" : "text-slate-400"}`}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Other */}
      <div className="mt-6">
        <p className="text-xs text-slate-400 px-3 mb-2 uppercase tracking-wider">
          Other
        </p>
        <div className="flex flex-col gap-1">
          {otherItems.map(({ icon: Icon, label, href }) => {
            const active = pathname === href;
            return (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? "bg-slate-100 text-slate-800"
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-slate-700" : "text-slate-400"}`} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User */}
      <div className="flex items-center gap-3 px-2 py-2">
        <img
          src="https://images.unsplash.com/photo-1672685667592-0392f458f46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW4lMjBwb3J0cmFpdCUyMGhlYWRzaG90fGVufDF8fHx8MTc3NjEwOTcxM3ww&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Darrell Steward"
          className="w-9 h-9 rounded-full object-cover shrink-0"
        />
        <div className="overflow-hidden">
          <p className="text-sm text-slate-800 truncate">Darrell Steward</p>
          <p className="text-xs text-slate-400 truncate">dsteward@gmail.com</p>
        </div>
      </div>
    </aside>
  );
}
