"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useMeta } from "../MetaContext";
import { useEditorState, useEditorDispatch, useEditorHistory, toDraft } from "../store/editorStore";
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
  const dispatch = useEditorDispatch();
  const { canUndo, canRedo } = useEditorHistory();
  const [publishOpen, setPublishOpen] = useState(false);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [antiBanOpen, setAntiBanOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
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
        setRestoreError("草稿保存失败，请检查网络后重试");
        return;
      }
      const res = await fetch(`/api/landing-pages/${pageId}/restore-live`, { method: "POST" });
      if (!res.ok) {
        setRestoreError("恢复失败，请重试");
        return;
      }
      const { page } = await res.json();
      dispatch({ kind: "replaceDraft", draft: page.data }); // 入 undo 历史，可一步撤销
      setRestoreOpen(false);
    } catch {
      setRestoreError("恢复失败，请检查网络后重试");
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
      <Link href={Routes.LandingPages} className="text-sm text-ink-soft hover:text-ink">← 返回</Link>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-56 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-ink hover:border-edge focus:border-brand-500 focus:outline-none"
        placeholder="页面名称"
      />
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => dispatch({ kind: "undo" })}
          disabled={!canUndo}
          title="撤销（⌘Z / Ctrl+Z）"
          aria-label="撤销"
          className="rounded-md px-2 py-1 text-sm text-ink-soft hover:bg-canvas disabled:opacity-30"
        >
          ↺
        </button>
        <button
          onClick={() => dispatch({ kind: "redo" })}
          disabled={!canRedo}
          title="重做（⇧⌘Z / Ctrl+Shift+Z）"
          aria-label="重做"
          className="rounded-md px-2 py-1 text-sm text-ink-soft hover:bg-canvas disabled:opacity-30"
        >
          ↻
        </button>
      </div>
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
      {status === "published" && publishedDirty && (
        <div className="relative">
          <button
            onClick={() => setRestoreOpen((v) => !v)}
            className="rounded-md border border-edge px-2 py-1 text-xs text-ink-soft hover:bg-canvas"
          >
            恢复为线上版本
          </button>
          {restoreOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-edge bg-panel p-3 shadow-xl">
              <p className="text-sm text-ink">将当前草稿恢复为线上正在展示的版本？</p>
              <p className="mt-1 text-xs text-ink-muted">当前未发布的修改会被覆盖，可用撤销（⌘Z）找回。</p>
              {restoreError && <p className="mt-2 text-xs text-red-500">{restoreError}</p>}
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => { setRestoreOpen(false); setRestoreError(""); }} className="rounded-md px-2.5 py-1 text-xs text-ink-soft hover:bg-canvas">取消</button>
                <button
                  onClick={() => void handleRestoreLive()}
                  disabled={restoring}
                  className="rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {restoring ? "恢复中…" : "确认恢复"}
                </button>
              </div>
            </div>
          )}
        </div>
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
