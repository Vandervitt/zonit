"use client";
// landing-editor/components/EditorLayout.tsx
import { BlockList } from "./BlockList";
import { EditorDetail } from "./EditorDetail";
import { PreviewPane } from "./PreviewPane";
import { ValidationBar } from "./ValidationBar";

export function EditorLayout() {
  return (
    <div className="flex h-screen flex-col bg-canvas">
      <header className="flex shrink-0 items-center gap-3 border-b border-edge bg-panel px-5 py-3">
        <h1 className="text-sm font-semibold text-ink">
          落地页编辑器 <span className="font-normal text-ink-muted">/ 新 schema</span>
        </h1>
        <div className="flex-1" />
        <ValidationBar />
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 shrink-0 overflow-hidden border-r border-edge bg-panel">
          <BlockList />
        </aside>
        <main className="w-[420px] shrink-0 overflow-hidden border-r border-edge bg-panel">
          <EditorDetail />
        </main>
        <aside className="min-w-0 flex-1 overflow-hidden">
          <PreviewPane />
        </aside>
      </div>
    </div>
  );
}
