"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Plus, Globe, Trash2, ToggleLeft, ToggleRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddDomainDialog } from "@/components/domains/AddDomainDialog";
import { UpgradeDialog } from "@/components/billing/UpgradeDialog";
import { ApiRoutes, apiDomainPath, apiDomainStatusPath } from "@/lib/constants";
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
  const [domains, setDomains] = useState<Domain[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [polling, setPolling] = useState<Set<string>>(new Set());

  const currentPlan = (session?.user?.plan ?? "free") as PlanId;
  const domainsLimit = PLANS[currentPlan].domainsLimit;
  const enabledCount = domains.filter(d => d.enabled).length;

  const loadDomains = useCallback(async () => {
    const res = await fetch(ApiRoutes.Domains);
    if (res.ok) setDomains(await res.json());
  }, []);

  const loadSites = useCallback(async () => {
    const res = await fetch(ApiRoutes.Sites);
    if (res.ok) setSites(await res.json());
  }, []);

  useEffect(() => {
    void loadDomains();
    void loadSites();
  }, [loadDomains, loadSites]);

  useEffect(() => {
    const unverified = domains.filter(d => !d.verified);
    if (unverified.length === 0) return;

    const timers = unverified.map(d => {
      return setInterval(async () => {
        const res = await fetch(apiDomainStatusPath(d.id));
        if (!res.ok) return;
        const { status } = await res.json();
        if (status === "verified") {
          setDomains(prev => prev.map(x => x.id === d.id ? { ...x, verified: true } : x));
        }
      }, 5000);
    });

    return () => timers.forEach(clearInterval);
  }, [domains]);

  async function handleToggleEnabled(domain: Domain) {
    if (!domain.enabled) {
      if (domainsLimit !== Infinity && enabledCount >= domainsLimit) {
        setUpgradeOpen(true);
        return;
      }
    }
    const res = await fetch(apiDomainPath(domain.id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !domain.enabled }),
    });
    if (res.ok) {
      setDomains(prev => prev.map(d => d.id === domain.id ? { ...d, enabled: !d.enabled } : d));
    }
  }

  async function handleDelete(domain: Domain) {
    const res = await fetch(apiDomainPath(domain.id), { method: "DELETE" });
    if (res.ok) setDomains(prev => prev.filter(d => d.id !== domain.id));
  }

  async function handleCheckStatus(domain: Domain) {
    setPolling(prev => new Set(prev).add(domain.id));
    const res = await fetch(apiDomainStatusPath(domain.id));
    if (res.ok) {
      const { status } = await res.json();
      if (status === "verified") {
        setDomains(prev => prev.map(d => d.id === domain.id ? { ...d, verified: true } : d));
      }
    }
    setPolling(prev => { const s = new Set(prev); s.delete(domain.id); return s; });
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
        {domains.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Globe className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-slate-500">还没有绑定任何域名</p>
            <p className="text-sm text-muted-foreground mt-1">点击「添加域名」开始绑定你的品牌域名</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-white/80 divide-y">
            {domains.map(domain => (
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
                        <RefreshCw className={`w-3.5 h-3.5 ${polling.has(domain.id) ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => handleToggleEnabled(domain)}
                    className="text-slate-400 hover:text-slate-600"
                    title={domain.enabled ? "停用" : "启用"}
                  >
                    {domain.enabled
                      ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                      : <ToggleLeft className="w-5 h-5" />
                    }
                  </button>
                  <button
                    onClick={() => handleDelete(domain)}
                    className="text-slate-400 hover:text-destructive"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddDomainDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        sites={sites}
        onAdded={loadDomains}
      />
      <UpgradeDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        currentPlan={currentPlan}
      />
    </main>
  );
}
