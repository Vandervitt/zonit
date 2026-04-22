"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  BarChart2,
  CheckSquare,
  FileText,
  Bell,
  Settings,
  HelpCircle,
  Grid2x2,
  Globe,
  LogOut,
  CreditCard,
  Link2,
} from "lucide-react";
import { PlanBadge } from "./billing/PlanBadge";
import { Routes } from "@/lib/constants";
import type { PlanId } from "@/lib/plans";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Globe, label: "Sites", href: "/sites" },
  { icon: Link2, label: "Domains", href: "/domains" },
  { icon: BarChart2, label: "Statistics", href: "/statistics" },
  { icon: CheckSquare, label: "Task list", href: "/tasks" },
  { icon: FileText, label: "Report", href: "/reports" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
];

const otherItems = [
  { icon: CreditCard, label: "Billing", href: Routes.Billing },
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: HelpCircle, label: "Help", href: "/help" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

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
      <div className="flex items-center gap-2 px-2 py-2">
        {session?.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name ?? ""}
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center shrink-0 text-white text-sm font-medium">
            {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="overflow-hidden flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm text-slate-800 truncate">{session?.user?.name ?? ""}</p>
            {session?.user?.plan && (
              <PlanBadge plan={(session.user.plan) as PlanId} />
            )}
          </div>
          <p className="text-xs text-slate-400 truncate">{session?.user?.email ?? ""}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
