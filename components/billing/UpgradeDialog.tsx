"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Routes } from "@/lib/constants";
import { PLANS } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: PlanId;
}

const UPGRADE_TARGET: Record<PlanId, PlanId | null> = {
  free: "starter",
  starter: "pro",
  pro: "agency",
  agency: null,
};

export function UpgradeDialog({ open, onOpenChange, currentPlan }: Props) {
  const router = useRouter();
  const targetPlan = UPGRADE_TARGET[currentPlan];

  if (!targetPlan) return null;

  const current = PLANS[currentPlan];
  const target = PLANS[targetPlan];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" aria-describedby="upgrade-desc">
        <DialogHeader>
          <DialogTitle>已达到站点上限</DialogTitle>
          <DialogDescription id="upgrade-desc">
            {current.label} 套餐最多创建 {current.sitesLimit} 个站点。升级到{" "}
            <span className="font-medium text-slate-800">{target.label}</span> 即可最多管理{" "}
            {target.sitesLimit === Infinity ? "无限个" : `${target.sitesLimit} 个`}站点。
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-1 text-sm">
          <p className="text-slate-500">升级后还可获得：</p>
          {current.hasWatermark && !target.hasWatermark && (
            <p className="text-slate-700">✓ 去除品牌水印</p>
          )}
          {target.domainsLimit > current.domainsLimit && (
            <p className="text-slate-700">
              ✓ 绑定最多 {target.domainsLimit === Infinity ? "无限个" : target.domainsLimit} 个自定义域名
            </p>
          )}
          {target.allTemplates && !current.allTemplates && (
            <p className="text-slate-700">✓ 解锁全部 15+ 行业模板</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            稍后再说
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              router.push(Routes.Billing);
            }}
          >
            查看 {target.label} 套餐 · {target.price}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
