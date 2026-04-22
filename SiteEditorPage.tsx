import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Save, Globe, Check } from "lucide-react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./components/ui/tooltip";
import { BlockEditorPanel } from "./components/sites/BlockEditorPanel";
import { PreviewPane } from "./components/sites/PreviewPane";
import { getSiteById, updateSite, isSiteNameUnique } from "./lib/site-store";
import type { LandingPageTemplate } from "./types/schema";

type SaveState = "idle" | "saving" | "saved" | "error";

export function SiteEditorPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();

  const site = getSiteById(siteId!);
  const [name, setName] = useState(site?.name ?? "");
  const [data, setData] = useState<LandingPageTemplate | null>(site?.data ?? null);
  const [published, setPublished] = useState(site?.published ?? false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [nameError, setNameError] = useState("");
  const [expandedKey, setExpandedKey] = useState("hero");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!site) navigate("/sites");
  }, [site, navigate]);

  // Auto-save on data change (debounced)
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
    const newPublished = !published;
    updateSite(siteId, { published: newPublished, data, name });
    setPublished(newPublished);
  };

  if (!data) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-border shrink-0">
        {/* Left: Back */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate("/sites")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>返回站点列表</TooltipContent>
        </Tooltip>

        {/* Site name */}
        <div className="flex flex-col">
          <Input
            value={name}
            onChange={e => {
              setName(e.target.value);
              setNameError("");
            }}
            className="h-8 text-sm w-56 border-0 shadow-none bg-slate-50 focus-visible:ring-0 focus-visible:border focus-visible:border-ring px-2"
            placeholder="站点名称"
          />
          {nameError && <p className="text-[10px] text-destructive mt-0.5 px-2">{nameError}</p>}
        </div>

        {/* Status */}
        {published ? (
          <Badge className="bg-emerald-500 text-white border-0 text-xs">已发布</Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">草稿</Badge>
        )}

        {/* Save state indicator */}
        {saveState === "saving" && (
          <span className="text-xs text-muted-foreground animate-pulse">保存中…</span>
        )}
        {saveState === "saved" && (
          <span className="text-xs text-emerald-500 flex items-center gap-1">
            <Check className="w-3 h-3" /> 已保存
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: Save + Publish */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={handleSave}
          disabled={saveState === "saving"}
        >
          <Save className="w-3.5 h-3.5" />
          保存
        </Button>
        <Button
          size="sm"
          className={`h-8 text-xs gap-1.5 ${published ? "bg-slate-700 hover:bg-slate-800" : ""}`}
          onClick={handlePublish}
        >
          <Globe className="w-3.5 h-3.5" />
          {published ? "取消发布" : "发布"}
        </Button>
      </header>

      {/* ── Main Body ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left 40%: Block Editor */}
        <div className="w-[40%] flex flex-col overflow-hidden border-r border-border">
          <BlockEditorPanel data={data} onChange={handleDataChange} expandedKey={expandedKey} onExpandedKeyChange={setExpandedKey} />
        </div>

        {/* Right 60%: Preview */}
        <div className="w-[60%] flex flex-col overflow-hidden">
          <PreviewPane data={data} expandedKey={expandedKey} />
        </div>
      </div>
    </div>
  );
}
