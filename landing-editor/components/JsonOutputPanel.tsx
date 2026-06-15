"use client";
// landing-editor/components/JsonOutputPanel.tsx
// 实时展示产出的 LandingPageDraft（剥离 _key）。深色科技蓝黑代码面板。
import { useEditorState, toDraft } from "../store/editorStore";

export function JsonOutputPanel() {
  const state = useEditorState();
  const json = JSON.stringify(toDraft(state), null, 2);

  return (
    <div className="flex h-full flex-col bg-code-bg">
      <div className="flex shrink-0 items-center justify-between border-b border-code-edge px-4 py-2.5">
        <span className="text-xs font-medium text-code-fg">LandingPageDraft · 实时产出</span>
        <span className="text-[10px] text-code-muted">{json.length} 字符</span>
      </div>
      <pre className="flex-1 overflow-auto p-4 text-xs leading-relaxed text-code-fg">
        <code>{json}</code>
      </pre>
    </div>
  );
}
