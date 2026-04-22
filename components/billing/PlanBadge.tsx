"use client";

import { cn } from "@/components/ui/utils";
import { PLANS } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

const COLOR_MAP: Record<PlanId, string> = {
  free: "bg-slate-100 text-slate-500",
  starter: "bg-blue-50 text-blue-600",
  pro: "bg-violet-50 text-violet-600",
  agency: "bg-amber-50 text-amber-600",
};

interface Props {
  plan: PlanId;
  className?: string;
}

export function PlanBadge({ plan, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide",
        COLOR_MAP[plan],
        className,
      )}
    >
      {PLANS[plan].label}
    </span>
  );
}
