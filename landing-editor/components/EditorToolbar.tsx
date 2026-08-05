"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useMeta } from "../MetaContext";
import { useEditorState, useEditorDispatch, useEditorHistory, toDraft } from "../store/editorStore";
import { collectPublishIssues } from "../lib/publishIssues";
import { ValidationBar } from "./ValidationBar";
import { ComplianceHintsBar } from "./ComplianceHintsBar";
import { PublishDialog } from "./PublishDialog";
import { TrackingPanel } from "./TrackingPanel";
import { AntiBanPanel } from "./AntiBanPanel";
import { SharePreviewPanel } from "./SharePreviewPanel";
import { landingPreviewPath, Routes } from "@/lib/constants";
import { useAdminT } from "@/lib/i18n/admin/context";

export function EditorToolbar() {
  const t = useAdminT().editor.toolbar;
  // 保存态文案：idle 不显示任何字（刚进页面就出现「已保存」会让人以为刚发生过写入）。
  const saveLabel: Record<string, string> = { idle: "", saving: t.saving, saved: t.saved };
  const { pageId, name, setName, saveState, saveError, status, publishedDirty, setGenerateOpen, flushSaveRef } = useMeta();
  const state = useEditorState();
  const dispatch = useEditorDispatch();
  const { canUndo, canRedo } = useEditorHistory();
  const [publishOpen, setPublishOpen] = useState(false);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [antiBanOpen, setAntiBanOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState("");

  async function handleRestoreLive() {
    setRestoring(true);
    setRestoreError("");
    try {
      // 先落库防抖窗口/在途的草稿，避免旧草稿 PUT 在 restore-live 之后 resolve 覆盖恢复结果（同 PublishDialog）
      const flushed = await flushSaveRef.current?.();
      if (flushed === false) {
        setRestoreError(t.saveNetworkError);
        return;
      }
      const res = await fetch(`/api/landing-pages/${pageId}/restore-live`, { method: "POST" });
      if (!res.ok) {
        setRestoreError(t.restoreConfirm.failed);
        return;
      }
      const { page } = await res.json();
      dispatch({ kind: "replaceDraft", draft: page.data }); // 入 undo 历史，可一步撤销
      setRestoreOpen(false);
    } catch {
      setRestoreError(t.restoreConfirm.networkFailed);
    } finally {
      setRestoring(false);
    }
  }

  // Cmd/Ctrl+Z 撤销、Shift+Cmd/Ctrl+Z 重做（拦截浏览器默认，编辑器内容均为受控输入）。
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      dispatch({ kind: e.shiftKey ? "redo" : "undo" });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dispatch]);

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
      <Link href={Routes.LandingPages} className="text-sm text-ink-soft hover:text-ink">← {t.back}</Link>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-56 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-ink hover:border-edge focus:border-brand-500 focus:outline-none"
        placeholder={t.namePlaceholder}
      />
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => dispatch({ kind: "undo" })}
          disabled={!canUndo}
          title={t.undoTitle}
          aria-label={t.undo}
          className="rounded-md px-2 py-1 text-sm text-ink-soft hover:bg-canvas disabled:opacity-30"
        >
          ↺
        </button>
        <button
          onClick={() => dispatch({ kind: "redo" })}
          disabled={!canRedo}
          title={t.redoTitle}
          aria-label={t.redo}
          className="rounded-md px-2 py-1 text-sm text-ink-soft hover:bg-canvas disabled:opacity-30"
        >
          ↻
        </button>
      </div>
      {saveState === "error" ? (
        <button onClick={() => void flushSaveRef.current?.()} className="text-xs text-red-500 underline underline-offset-2 hover:text-red-600">
          {saveError || t.saveFailed}
        </button>
      ) : (
        <span className="text-xs text-ink-muted">{saveLabel[saveState]}</span>
      )}
      {status === "published" && (
        publishedDirty ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {t.unpublishedChanges}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t.published}
          </span>
        )
      )}
      {status === "published" && publishedDirty && (
        <div className="relative">
          <button
            onClick={() => setRestoreOpen((v) => !v)}
            className="rounded-md border border-edge px-2 py-1 text-xs text-ink-soft hover:bg-canvas"
          >
            {t.restore}
          </button>
          {restoreOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-edge bg-panel p-3 shadow-xl">
              <p className="text-sm text-ink">{t.restoreConfirm.title}</p>
              <p className="mt-1 text-xs text-ink-muted">{t.restoreConfirm.hint}</p>
              {restoreError && <p className="mt-2 text-xs text-red-500">{restoreError}</p>}
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => { setRestoreOpen(false); setRestoreError(""); }} className="rounded-md px-2.5 py-1 text-xs text-ink-soft hover:bg-canvas">{t.restoreConfirm.cancel}</button>
                <button
                  onClick={() => void handleRestoreLive()}
                  disabled={restoring}
                  className="rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {restoring ? t.restoreConfirm.restoring : t.restoreConfirm.confirm}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="flex-1" />
      <ValidationBar />
      <ComplianceHintsBar />
      <div className="relative">
        <button
          onClick={() => setRegenOpen((v) => !v)}
          className="rounded-md border border-edge px-3 py-1.5 text-sm text-ink-soft hover:bg-canvas"
        >
          {t.aiGenerate}
        </button>
        {regenOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-edge bg-panel p-3 shadow-xl">
            <p className="text-sm text-ink">{t.regenConfirm.title}</p>
            <p className="mt-1 text-xs text-ink-muted">{t.regenConfirm.hint}</p>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setRegenOpen(false)} className="rounded-md px-2.5 py-1 text-xs text-ink-soft hover:bg-canvas">{t.regenConfirm.cancel}</button>
              <button
                onClick={() => { setRegenOpen(false); setGenerateOpen(true); }}
                className="rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"
              >
                {t.regenConfirm.confirm}
              </button>
            </div>
          </div>
        )}
      </div>
      <button
        onClick={() => setTrackingOpen(true)}
        className="rounded-md border border-edge px-3 py-1.5 text-sm text-ink-soft hover:bg-canvas"
      >
        {t.tracking}
      </button>
      <button
        onClick={() => setAntiBanOpen(true)}
        className="rounded-md border border-edge px-3 py-1.5 text-sm text-ink-soft hover:bg-canvas"
      >
        {t.antiBan}
      </button>
      <Link
        href={landingPreviewPath(pageId)}
        target="_blank"
        className="rounded-md border border-edge px-3 py-1.5 text-sm text-ink-soft hover:bg-canvas"
      >
        {t.preview}
      </Link>
      <button
        onClick={() => setShareOpen(true)}
        className="rounded-md border border-edge px-3 py-1.5 text-sm text-ink-soft hover:bg-canvas"
      >
        {t.sharePreview}
      </button>
      <div className="relative">
        <button
          onClick={handlePublish}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          {status === "published" ? t.republish : t.publish}
        </button>
        {blockers.length > 0 && (
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-edge bg-panel p-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-amber-700">{t.blockers(blockers.length)}</p>
              <button onClick={() => setBlockers([])} className="shrink-0 text-xs text-ink-muted hover:text-ink">{t.closeBlockers}</button>
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
