"use client"

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, Search } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import { CreateSiteDialog } from "../../../components/sites/CreateSiteDialog";
import { SiteCard } from "../../../components/sites/SiteCard";
import { EmptyState } from "../../../components/sites/EmptyState";
import { UpgradeDialog } from "../../../components/billing/UpgradeDialog";
import { getSites, deleteSite, dbRowToSite, Site } from "../../../lib/site-store";
import { ApiRoutes, siteEditorPath } from "../../../lib/constants";
import { PLANS } from "../../../lib/plans";
import type { PlanId } from "../../../lib/plans";

export default function SitesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [sites, setSites] = useState<Site[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const currentPlan = (session?.user?.plan ?? "free") as PlanId;

  function handleNewSite() {
    const limit = PLANS[currentPlan].sitesLimit;
    if (sites.length >= limit) {
      setUpgradeOpen(true);
    } else {
      setCreateOpen(true);
    }
  }

  const loadSites = useCallback(async () => {
    try {
      const res = await fetch(ApiRoutes.Sites);
      if (res.ok) {
        const rows = await res.json();
        setSites(rows.map(dbRowToSite));
        return;
      }
    } catch { /* fall through */ }
    setSites(getSites());
  }, []);

  useEffect(() => {
    void loadSites();
  }, [loadSites]);

  const handleCreated = useCallback((siteId: string) => {
    void loadSites();
    router.push(siteEditorPath(siteId));
  }, [router, loadSites]);

  const handleDelete = () => {
    if (!deleteId) return;
    deleteSite(deleteId);
    setSites(prev => prev.filter(s => s.id !== deleteId));
    setDeleteId(null);
  };

  const filtered = sites.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="flex-col w-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-slate-800 text-2xl">Sites</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{sites.length} 个站点</p>
        </div>
        <div className="flex flex-1 items-center gap-3 justify-end">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="搜索站点…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-8 w-48 rounded-full bg-white/80 border-0 shadow-sm text-sm"
            />
          </div>
          <Button size="sm" onClick={handleNewSite} className="rounded-full gap-1.5">
            <Plus className="w-4 h-4" />
            新建站点
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-6 pb-6 overflow-auto">
        {filtered.length === 0 ? (
          <EmptyState onNew={handleNewSite} hasSearch={!!search} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(site => (
              <SiteCard key={site.id} site={site} onDelete={setDeleteId} />
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <CreateSiteDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />

      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        currentPlan={currentPlan}
      />

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除站点？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销，站点的所有数据将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
