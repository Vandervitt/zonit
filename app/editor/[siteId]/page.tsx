"use client"

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Globe, Check, Loader2, EyeOff, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BlockEditorPanel } from "@/components/sites/BlockEditorPanel";
import { PreviewPane } from "@/components/sites/PreviewPane";
import { PublishDialog } from "@/components/sites/PublishDialog";
import { getSiteById, updateSite, isSiteNameUnique, dbRowToSite } from "@/lib/site-store";
import type { LandingPageTemplate } from "@/types/schema";
import { Routes, apiSitePath, sitePath } from "@/lib/constants";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function SiteEditorPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const router = useRouter();

  const [name, setName] = useState("");
  const [data, setData] = useState<LandingPageTemplate | null>(null);
  const [published, setPublished] = useState(false);
  const [slug, setSlug] = useState<string | undefined>(undefined);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [nameError, setNameError] = useState("");
  const [expandedKey, setExpandedKey] = useState("hero");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiSitePath(siteId));
        if (res.ok) {
          const site = dbRowToSite(await res.json());
          setName(site.name);
          setData(site.data);
          setPublished(site.published);
          setSlug(site.slug);
          return;
        }
      } catch { /* fall through to localStorage */ }

      const site = getSiteById(siteId!);
      if (!site) { router.push(Routes.Sites); return; }
      setName(site.name);
      setData(site.data);
      setPublished(site.published);
      setSlug(site.slug);
    }
    void load();
  }, [siteId, router]);

  const autoSave = useCallback(
    (newData: LandingPageTemplate, newName: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (!siteId) return;
        updateSite(siteId, { data: newData, name: newName });
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
      }, 1500);
      setSaveState("saving");
    },
    [siteId],
  );

  const handleDataChange = (newData: LandingPageTemplate) => {
    setData(newData);
    autoSave(newData, name);
  };

  const handleSave = () => {
    if (!siteId || !data) return;
    const trimmed = name.trim();
    if (!trimmed) { setNameError("站点名称不能为空"); return; }
    if (!isSiteNameUnique(trimmed, siteId)) { setNameError("站点名称已存在"); return; }
    setSaveState("saving");
    updateSite(siteId, { data, name: trimmed });
    setTimeout(() => setSaveState("saved"), 500);
    setTimeout(() => setSaveState("idle"), 2500);
  };

  const handlePublish = () => {
    if (!siteId || !data) return;
    if (!published) {
      setPublishDialogOpen(true);
    } else {
      updateSite(siteId, { published: false, data, name });
      setPublished(false);
    }
  };

  const handlePublishSuccess = (newSlug: string) => {
    updateSite(siteId!, { published: true, data: data!, name });
    setPublished(true);
    setSlug(newSlug);
  };

  if (!data) return null;

  return (
    <div className="flex flex-col h-screen bg-zinc-100 overflow-hidden">
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <header className="flex items-center h-12 px-3 bg-zinc-950 border-b border-zinc-800 shrink-0 gap-2">

        {/* Back */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800 shrink-0"
              onClick={() => router.push(Routes.Sites)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">返回站点列表</TooltipContent>
        </Tooltip>

        <div className="w-px h-5 bg-zinc-800 shrink-0" />

        {/* Site name */}
        <div className="flex flex-col min-w-0">
          <Input
            value={name}
            onChange={e => {
              setName(e.target.value);
              setNameError("");
            }}
            className="h-8 text-sm w-48 border-0 shadow-none bg-transparent text-white placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:bg-zinc-900 rounded-md px-2 transition-colors"
            placeholder="站点名称"
          />
          {nameError && <p className="text-[10px] text-red-400 mt-0.5 px-2">{nameError}</p>}
        </div>

        {/* Status dot + browse link */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${published ? "bg-emerald-400" : "bg-zinc-600"}`} />
          <span className={`text-xs font-medium ${published ? "text-emerald-400" : "text-zinc-500"}`}>
            {published ? "已发布" : "草稿"}
          </span>
          {published && slug && (
            <a
              href={sitePath(slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 text-xs text-emerald-400/70 hover:text-emerald-300 transition-colors ml-0.5"
            >
              · 查看站点
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>

        {/* Auto-save indicator */}
        <div className="flex items-center h-8 min-w-[64px]">
          {saveState === "saving" && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              保存中
            </span>
          )}
          {saveState === "saved" && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <Check className="w-3 h-3" />
              已保存
            </span>
          )}
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 gap-1.5"
            onClick={handleSave}
            disabled={saveState === "saving"}
          >
            <Save className="w-3.5 h-3.5" />
            保存
          </Button>

          <Button
            size="sm"
            className={`h-8 px-4 text-xs gap-1.5 font-medium transition-all ${
              published
                ? "bg-zinc-700 hover:bg-zinc-600 text-zinc-200 border border-zinc-600"
                : "bg-emerald-500 hover:bg-emerald-400 text-white border-0"
            }`}
            onClick={handlePublish}
          >
            {published ? (
              <><EyeOff className="w-3.5 h-3.5" />取消发布</>
            ) : (
              <><Globe className="w-3.5 h-3.5" />发布</>
            )}
          </Button>
        </div>
      </header>

      {/* ── Main Body ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-100 shrink-0 h-full flex flex-col overflow-hidden bg-zinc-950 border-r border-zinc-800/60">
          <BlockEditorPanel data={data} onChange={handleDataChange} expandedKey={expandedKey} onExpandedKeyChange={setExpandedKey} />
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-zinc-100">
          <PreviewPane data={data} expandedKey={expandedKey} />
        </main>
      </div>

      <PublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        siteId={siteId!}
        siteName={name}
        siteData={data}
        initialSlug={slug}
        onSuccess={handlePublishSuccess}
      />
    </div>
  );
}
