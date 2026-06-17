"use client";
import { BlockList } from "./BlockList";
import { EditorDetail } from "./EditorDetail";
import { PreviewPane } from "./PreviewPane";
import { EditorToolbar } from "./EditorToolbar";

export function EditorLayout() {
  return (
    <div className="flex h-screen flex-col bg-canvas">
      <EditorToolbar />
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
