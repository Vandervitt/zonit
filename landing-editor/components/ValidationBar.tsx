"use client";
// landing-editor/components/ValidationBar.tsx
import { useEditorState } from "../store/editorStore";
import { validateSections, SECTION_REGISTRY, type RequiredGroup } from "@/types/schema.draft";

const groupLabels: Record<RequiredGroup, string> = {
  "core-value": "套餐 或 特性",
};

export function ValidationBar() {
  const state = useEditorState();
  const result = validateSections(state.sections);

  const issues: string[] = [];
  result.unsatisfiedGroups.forEach((g) => issues.push(`需至少一个：${groupLabels[g] ?? g}`));
  result.duplicatedSingletons.forEach((t) => issues.push(`「${SECTION_REGISTRY[t].label}」应唯一，出现多次`));
  result.missingRequired.forEach((t) => issues.push(`缺少必须模块「${SECTION_REGISTRY[t].label}」`));

  if (issues.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        结构校验通过
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700" title={issues.join("；")}>
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      {issues.length} 项校验提示：{issues[0]}
      {issues.length > 1 ? ` 等` : ""}
    </span>
  );
}
