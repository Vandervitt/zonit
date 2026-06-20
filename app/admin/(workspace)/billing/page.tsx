"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Check, ArrowRight, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlanBadge } from "@/components/billing/PlanBadge";
import { PLANS, PLAN_ORDER } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import { Routes, ApiRoutes } from "@/lib/constants";
import { fetcher, jsonRequest } from "@/lib/api/fetcher";
import { useMutation } from "@/lib/api/use-mutation";

function SuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast.success("订阅成功！套餐将在几秒内生效。");
      router.replace(Routes.Billing);
    }
  }, [searchParams, router]);
  return null;
}

export default function BillingPage() {
  const { data: session } = useSession();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const currentPlanId = (session?.user?.plan ?? "free") as PlanId;
  const currentPlan = PLANS[currentPlanId];
  const currentIdx = PLAN_ORDER.indexOf(currentPlanId);

  const checkout = useMutation(
    (planId: string) => jsonRequest<{ checkoutUrl?: string }>(ApiRoutes.BillingCheckout, "POST", { planId }),
    {
      errorToast: () => "无法创建结账链接，请稍后重试",
      onSuccess: (res) => {
        if (res.checkoutUrl) window.location.href = res.checkoutUrl;
        else toast.error("无法创建结账链接，请稍后重试");
      },
    },
  );

  const portal = useMutation(
    () => fetcher<{ portalUrl?: string }>(ApiRoutes.BillingPortal),
    {
      errorToast: () => "无法获取管理链接，请稍后重试",
      onSuccess: (res) => {
        if (res.portalUrl) window.location.href = res.portalUrl;
        else toast.error("无法获取管理链接，请稍后重试");
      },
    },
  );

  async function handleUpgrade(planId: string) {
    setLoadingPlan(planId);
    await checkout.trigger(planId);
    setLoadingPlan(null);
  }

  const portalLoading = portal.isMutating;

  return (
    <main className="flex flex-col w-full px-6 py-6 max-w-3xl">
      <Suspense><SuccessToast /></Suspense>
      <div className="mb-6">
        <h1 className="text-foreground text-2xl">Billing</h1>
        <p className="text-sm text-muted-foreground mt-0.5">管理你的订阅套餐</p>
      </div>

      <div className="rounded-2xl border border-bloom-100 bg-white p-6 mb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">当前套餐</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PlanBadge plan={currentPlanId} className="text-sm px-3 py-1" />
            <span className="text-2xl font-bold text-foreground">{currentPlan.priceText}</span>
          </div>
          <div className="flex items-center gap-2">
            {currentPlanId !== "free" && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => void portal.trigger()}
                disabled={portalLoading}
              >
                <Settings className="w-3.5 h-3.5" />
                {portalLoading ? "加载中…" : "管理订阅"}
              </Button>
            )}
            <Link
              href={Routes.Pricing}
              target="_blank"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-muted-foreground transition-colors"
            >
              查看完整对比 <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-bloom-100 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-1">落地页上限</p>
            <p className="text-foreground/80 font-medium">
              {currentPlan.landingPagesLimit === Infinity ? "无限" : `${currentPlan.landingPagesLimit} 张`}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">域名上限</p>
            <p className="text-foreground/80 font-medium">
              {currentPlan.domainsLimit === 0
                ? "不支持"
                : currentPlan.domainsLimit === Infinity
                ? "无限"
                : `${currentPlan.domainsLimit} 个`}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">品牌水印</p>
            <p className="text-foreground/80 font-medium">{currentPlan.hasWatermark ? "有" : "无"}</p>
          </div>
        </div>
      </div>

      {currentIdx < PLAN_ORDER.length - 1 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">可升级套餐</p>
          {PLAN_ORDER.slice(currentIdx + 1).map(planId => {
            const plan = PLANS[planId];
            const highlights = plan.highlights;
            const isLoading = loadingPlan === planId;
            return (
              <div
                key={planId}
                className="rounded-2xl border border-bloom-100 bg-white p-5 flex items-start justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <PlanBadge plan={planId} />
                    <span className="text-foreground/80 font-semibold">{plan.priceText}</span>
                  </div>
                  <ul className="space-y-1">
                    {highlights.map(h => (
                      <li key={h} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  size="sm"
                  variant={planId === "pro" ? "default" : "outline"}
                  className="shrink-0 gap-1"
                  onClick={() => handleUpgrade(planId)}
                  disabled={!!loadingPlan}
                >
                  {isLoading ? "跳转中…" : <><span>升级</span> <ArrowRight className="w-3.5 h-3.5" /></>}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {currentPlanId !== "free" && (
        <p className="mt-6 text-xs text-muted-foreground text-center">
          如需取消订阅，请通过 管理订阅 进入 Lemon Squeezy 操作
        </p>
      )}
    </main>
  );
}
