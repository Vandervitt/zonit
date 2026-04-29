"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { Plus, Globe, Trash2, ToggleLeft, ToggleRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QueryState } from "@/components/ui/QueryState";
import { AddDomainDialog } from "@/components/domains/AddDomainDialog";
import { UpgradeDialog } from "@/components/billing/UpgradeDialog";
import { ApiRoutes, apiDomainPath, apiDomainStatusPath } from "@/lib/constants";
import { jsonRequest, fetcher } from "@/lib/api/fetcher";
import { useMutation } from "@/lib/api/use-mutation";
import { PLANS } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

interface Domain {
  id: string;
  domain: string;
  site_id: string | null;
  site_name?: string;
  enabled: boolean;
  verified: boolean;
  created_at: string;
}

interface Site {
  id: string;
  name: string;
}

export default function DomainsPage() {
  const { data: session } = useSession();
  const [addOpen, setAddOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const currentPlan = (session?.user?.plan ?? "free") as PlanId;
  const domainsLimit = PLANS[currentPlan].domainsLimit;

  const domainsQuery = useSWR<Domain[]>(ApiRoutes.Domains);
  const sitesQuery = useSWR<Site[]>(ApiRoutes.Sites);
  const domains = domainsQuery.data ?? [];
  const sites = sitesQuery.data ?? [];
  const enabledCount = domains.filter(d => d.enabled).length;

  // 后台轮询所有未验证的域名（每 5s）；命中已验证后立刻刷新整张列表
  const hasUnverified = domains.some(d => !d.verified);
  useSWR(
    hasUnverified ? [ApiRoutes.Domains, "poll"] : null,
    async () => {
      const unverified = domains.filter(d => !d.verified);
      const results = await Promise.all(
        unverified.map(async (d) => {
          const { status } = await fetcher<{ status: string }>(apiDomainStatusPath(d.id));
          return { id: d.id, verified: status === "verified" };
        }),
      );
      if (results.some(r => r.verified)) void domainsQuery.mutate();
    },
    { refreshInterval: 5000 },
  );

  const toggleMutation = useMutation(
    (d: Domain) => jsonRequest(apiDomainPath(d.id), "PATCH", { enabled: !d.enabled }),
    { onSuccess: () => { void domainsQuery.mutate(); } },
  );

  const deleteMutation = useMutation(
    (d: Domain) => jsonRequest(apiDomainPath(d.id), "DELETE"),
    { onSuccess: () => { void domainsQuery.mutate(); } },
  );

  const checkStatusMutation = useMutation(
    (d: Domain) => fetcher<{ status: string }>(apiDomainStatusPath(d.id)),
    { onSuccess: (res) => { if (res.status === "verified") { void domainsQuery.mutate(); } } },
  );

  const [pendingCheckId, setPendingCheckId] = useState<string | null>(null);

  function handleToggle(domain: Domain) {
    if (!domain.enabled && domainsLimit !== Infinity && enabledCount >= domainsLimit) {
      setUpgradeOpen(true);
      return;
    }
    void toggleMutation.trigger(domain);
  }

  async function handleCheckStatus(domain: Domain) {
    setPendingCheckId(domain.id);
    await checkStatusMutation.trigger(domain);
    setPendingCheckId(null);
  }

  return (
    <main className="flex flex-col w-full">
      <header className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-slate-800 text-2xl">域名</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            已启用 {enabledCount}{domainsLimit === Infinity ? "" : `/${domainsLimit}`} 个域名
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} className="rounded-full gap-1.5">
          <Plus className="w-4 h-4" />
          添加域名
        </Button>
      </header>

      <div className="px-6 pb-6">
        <QueryState
          query={domainsQuery}
          isEmpty={(d) => d.length === 0}
          empty={
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Globe className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-slate-500">还没有绑定任何域名</p>
              <p className="text-sm text-muted-foreground mt-1">点击「添加域名」开始绑定你的品牌域名</p>
            </div>
          }
        >
          {(list) => (
            <div className="rounded-xl border bg-white/80 divide-y">
              {list.map(domain => (
                <div key={domain.id} className="flex items-center gap-4 px-4 py-3">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 truncate">{domain.domain}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {domain.site_name ?? "未绑定站点"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {domain.verified ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">已验证</Badge>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">待验证</Badge>
                        <button
                          onClick={() => handleCheckStatus(domain)}
                          className="text-slate-400 hover:text-slate-600"
                          title="刷新验证状态"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${pendingCheckId === domain.id ? "animate-spin" : ""}`} />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => handleToggle(domain)}
                      disabled={toggleMutation.isMutating}
                      className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
                      title={domain.enabled ? "停用" : "启用"}
                    >
                      {domain.enabled
                        ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                        : <ToggleLeft className="w-5 h-5" />
                      }
                    </button>
                    <button
                      onClick={() => deleteMutation.trigger(domain)}
                      disabled={deleteMutation.isMutating}
                      className="text-slate-400 hover:text-destructive disabled:opacity-50"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </QueryState>
      </div>

      <AddDomainDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        sites={sites}
        onAdded={() => domainsQuery.mutate()}
      />
      <UpgradeDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        currentPlan={currentPlan}
      />
    </main>
  );
}
