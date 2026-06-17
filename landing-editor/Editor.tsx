"use client";
// landing-editor/Editor.tsx
import { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { LandingPageDraft } from "@/types/schema.draft";
import { EditorProvider } from "./store/editorStore";
import { fromDraft } from "./sampleDraft";
import { MetaProvider } from "./MetaContext";
import { EditorLayout } from "./components/EditorLayout";
import { AutoSave } from "./components/AutoSave";

export function Editor({
  pageId,
  initialName,
  initialDraft,
}: {
  pageId: string;
  initialName: string;
  initialDraft: LandingPageDraft;
}) {
  const [initial] = useState(() => fromDraft(initialDraft));
  return (
    <DndProvider backend={HTML5Backend}>
      <EditorProvider initial={initial}>
        <MetaProvider pageId={pageId} initialName={initialName}>
          <AutoSave />
          <EditorLayout />
        </MetaProvider>
      </EditorProvider>
    </DndProvider>
  );
}
