"use client";
// landing-editor/components/ComplianceHintsBar.tsx
// 合规提示（不阻断发布）。与 ValidationBar 并列但视觉刻意更轻：
// 琥珀色是「发不出去」，这里用中性蓝，避免把「平台可能拒你」误读成「校验失败」。
import { useState } from "react";
import { useEditorState, useEditorDispatch, toDraft } from "../store/editorStore";
import { collectComplianceHints } from "../lib/complianceHints";
import type { IssueTarget } from "../lib/publishIssues";

export function ComplianceHintsBar() {
  const state = useEditorState();
  const dispatch = useEditorDispatch();
  const hints = collectComplianceHints(toDraft(state));
  const [open, setOpen] = useState(false);

  if (hints.length === 0) return null;

  function jump(target: IssueTarget) {
    const id = target.kind === "fixed" ? target.id : state.sections[target.index]?._key;
    if (!id) return;
    dispatch({ kind: "select", id });
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
        title="投放平台的合规要求，不影响发布"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
        {hints.length} 项合规提示
        <span className="text-sky-500">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-lg border border-edge bg-panel p-3 shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-sky-700">投放平台可能关注（不影响发布）</p>
            <button onClick={() => setOpen(false)} className="shrink-0 text-xs text-ink-muted hover:text-ink">关闭</button>
          </div>
          <ul className="mt-2 max-h-72 space-y-1.5 overflow-auto text-xs text-ink-soft">
            {hints.map((hint, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-sky-500" />
                {hint.target ? (
                  <button
                    onClick={() => jump(hint.target!)}
                    className="text-left underline decoration-sky-300 underline-offset-2 hover:text-ink"
                    title="点击定位到对应模块"
                  >
                    {hint.message}
                  </button>
                ) : (
                  <span>{hint.message}</span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 border-t border-edge pt-2 text-[11px] text-ink-muted">
            这些是各平台政策明文要求的项，不是我们的评分，也不预测过不过审。
          </p>
        </div>
      )}
    </div>
  );
}
