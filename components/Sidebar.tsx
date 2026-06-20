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
  LogOut,
  CreditCard,
  Link2,
  Image,
} from "lucide-react";
import { PlanBadge } from "./billing/PlanBadge";
import { Routes } from "@/lib/constants";
import type { PlanId } from "@/lib/plans";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: Routes.Dashboard },
  { icon: FileText, label: "落地页", href: Routes.LandingPages },
  { icon: Link2, label: "Domains", href: Routes.Domains },
  { icon: Image, label: "素材库", href: Routes.Media },
  { icon: BarChart2, label: "Statistics", href: "/admin/statistics" },
  { icon: CheckSquare, label: "Task list", href: "/admin/tasks" },
  { icon: FileText, label: "Report", href: "/admin/reports" },
  { icon: Bell, label: "Notifications", href: "/admin/notifications" },
];

const otherItems = [
  { icon: CreditCard, label: "Billing", href: Routes.Billing },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
  { icon: HelpCircle, label: "Help", href: "/admin/help" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-52 min-h-screen bg-white/70 backdrop-blur-sm flex flex-col py-6 px-4 shrink-0 border-r border-bloom-100">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-bloom-500 to-tech flex items-center justify-center shadow-sm shadow-bloom-500/30">
          <Grid2x2 className="w-4 h-4 text-white" />
        </div>
        <span className="text-foreground tracking-widest text-sm uppercase">
          Zap Bridge
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
                  ? "bg-bloom-50 text-bloom-700 ring-1 ring-bloom-100"
                  : "text-muted-foreground hover:bg-bloom-50/60 hover:text-bloom-600"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${active ? "text-bloom-600" : "text-muted-foreground"}`}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Other */}
      <div className="mt-6">
        <p className="text-xs text-muted-foreground px-3 mb-2 uppercase tracking-wider">
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
                    ? "bg-bloom-50 text-bloom-700 ring-1 ring-bloom-100"
                    : "text-muted-foreground hover:bg-bloom-50/60 hover:text-bloom-600"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-bloom-600" : "text-muted-foreground"}`} />
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
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-bloom-500 to-tech flex items-center justify-center shrink-0 text-white text-sm font-medium">
            {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="overflow-hidden flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm text-foreground truncate">{session?.user?.name ?? ""}</p>
            {session?.user?.plan && (
              <PlanBadge plan={(session.user.plan) as PlanId} />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{session?.user?.email ?? ""}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-muted-foreground hover:text-bloom-600 transition-colors shrink-0"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
