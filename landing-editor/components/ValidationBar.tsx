"use client";
// landing-editor/components/ValidationBar.tsx
import { useState } from "react";
import { useEditorState, useEditorDispatch, toDraft } from "../store/editorStore";
import { collectPublishIssueItems, type IssueTarget } from "../lib/publishIssues";

export function ValidationBar() {
  const state = useEditorState();
  const dispatch = useEditorDispatch();
  const issues = collectPublishIssueItems(toDraft(state));
  const [open, setOpen] = useState(false);

  /** 把校验项落点换算成编辑器 selectedId（section 按序号取 _key）。 */
  function resolveTarget(target: IssueTarget): string | null {
    if (target.kind === "fixed") return target.id;
    return state.sections[target.index]?._key ?? null;
  }

  function jump(target: IssueTarget) {
    const id = resolveTarget(target);
    if (!id) return;
    dispatch({ kind: "select", id });
    setOpen(false);
  }

  if (issues.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        校验通过
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        {issues.length} 项校验未通过
        <span className="text-amber-500">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-edge bg-panel p-3 shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-amber-700">发布前需解决（{issues.length} 项）</p>
            <button onClick={() => setOpen(false)} className="shrink-0 text-xs text-ink-muted hover:text-ink">关闭</button>
          </div>
          <ul className="mt-2 max-h-60 space-y-1 overflow-auto text-xs text-ink-soft">
            {issues.map((issue, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                {issue.target && resolveTarget(issue.target) ? (
                  <button
                    onClick={() => jump(issue.target!)}
                    className="text-left underline decoration-amber-300 underline-offset-2 hover:text-ink"
                    title="点击定位到对应模块"
                  >
                    {issue.message}
                  </button>
                ) : (
                  <span>{issue.message}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
