"use client";
import { useState } from "react";
import Link from "next/link";
import { useMeta } from "../MetaContext";
import { useEditorState, toDraft } from "../store/editorStore";
import { collectPublishIssues } from "../lib/publishIssues";
import { ValidationBar } from "./ValidationBar";
import { PublishDialog } from "./PublishDialog";
import { TrackingPanel } from "./TrackingPanel";
import { AntiBanPanel } from "./AntiBanPanel";
import { SharePreviewPanel } from "./SharePreviewPanel";
import { landingPreviewPath, Routes } from "@/lib/constants";

const SAVE_LABEL: Record<string, string> = {
  idle: "", saving: "保存中…", saved: "已保存",
};

export function EditorToolbar() {
  const { pageId, name, setName, saveState, saveError, status, publishedDirty, flushSaveRef } = useMeta();
  const state = useEditorState();
  const [publishOpen, setPublishOpen] = useState(false);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [antiBanOpen, setAntiBanOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  function handlePublish() {
    const issues = collectPublishIssues(toDraft(state));
    if (issues.length > 0) {
      setBlockers(issues);
      return;
    }
    setBlockers([]);
    setPublishOpen(true);
  }

  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-edge bg-panel px-5 py-3">
      <Link href={Routes.LandingPages} className="text-sm text-ink-soft hover:text-ink">← 返回</Link>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-56 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-ink hover:border-edge focus:border-brand-500 focus:outline-none"
        placeholder="页面名称"
      />
      {saveState === "error" ? (
        <button onClick={() => void flushSaveRef.current?.()} className="text-xs text-red-500 underline underline-offset-2 hover:text-red-600">
          {saveError || "保存失败，点击重试"}
        </button>
      ) : (
        <span className="text-xs text-ink-muted">{SAVE_LABEL[saveState]}</span>
      )}
      {status === "published" && (
        publishedDirty ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            有未发布的修改，线上仍是上次发布的版本
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            已发布
          </span>
        )
      )}
      <div className="flex-1" />
      <ValidationBar />
      <button
        onClick={() => setTrackingOpen(true)}
        className="rounded-md border border-edge px-3 py-1.5 text-sm text-ink-soft hover:bg-canvas"
      >
        追踪
      </button>
      <button
        onClick={() => setAntiBanOpen(true)}
        className="rounded-md border border-edge px-3 py-1.5 text-sm text-ink-soft hover:bg-canvas"
      >
        反同质化
      </button>
      <Link
        href={landingPreviewPath(pageId)}
        target="_blank"
        className="rounded-md border border-edge px-3 py-1.5 text-sm text-ink-soft hover:bg-canvas"
      >
        预览
      </Link>
      <button
        onClick={() => setShareOpen(true)}
        className="rounded-md border border-edge px-3 py-1.5 text-sm text-ink-soft hover:bg-canvas"
      >
        分享预览
      </button>
      <div className="relative">
        <button
          onClick={handlePublish}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          {status === "published" ? "更新发布" : "发布"}
        </button>
        {blockers.length > 0 && (
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-edge bg-panel p-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-amber-700">校验未通过，无法发布（{blockers.length} 项）</p>
              <button onClick={() => setBlockers([])} className="shrink-0 text-xs text-ink-muted hover:text-ink">关闭</button>
            </div>
            <ul className="mt-2 max-h-60 space-y-1 overflow-auto text-xs text-ink-soft">
              {blockers.map((b, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {publishOpen && <PublishDialog onClose={() => setPublishOpen(false)} />}
      {trackingOpen && <TrackingPanel onClose={() => setTrackingOpen(false)} />}
      {antiBanOpen && <AntiBanPanel onClose={() => setAntiBanOpen(false)} />}
      {shareOpen && <SharePreviewPanel onClose={() => setShareOpen(false)} />}
    </header>
  );
}
