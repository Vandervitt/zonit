"use client";

import { Tag } from "antd";
import { PLANS } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

const COLOR_MAP: Record<PlanId, string> = {
  free: "default",
  starter: "blue",
  pro: "blue",
  agency: "gold",
};

export function PlanBadge({ plan, className }: { plan: PlanId; className?: string }) {
  return (
    <Tag color={COLOR_MAP[plan]} className={className}>
      {PLANS[plan].label}
    </Tag>
  );
}
