"use client";

import { cn } from "@/components/ui/utils";
import { PLANS } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

const COLOR_MAP: Record<PlanId, string> = {
  free: "bg-bloom-50 text-muted-foreground",
  starter: "bg-tech-soft/20 text-tech",
  pro: "bg-bloom-50 text-bloom-600",
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
