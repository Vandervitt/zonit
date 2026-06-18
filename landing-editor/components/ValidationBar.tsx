"use client";
// landing-editor/components/ValidationBar.tsx
import { useEditorState, toDraft } from "../store/editorStore";
import { collectPublishIssues } from "../lib/publishIssues";

export function ValidationBar() {
  const state = useEditorState();
  const issues = collectPublishIssues(toDraft(state));

  if (issues.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        校验通过
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700" title={issues.join("；")}>
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      {issues.length} 项校验未通过：{issues[0]}
      {issues.length > 1 ? ` 等` : ""}
    </span>
  );
}
