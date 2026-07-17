"use client";
// landing-editor/Editor.tsx
import { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { LandingPageDraft } from "@/types/schema.draft";
import type { PlanId } from "@/lib/plans";
import { EditorProvider } from "./store/editorStore";
import { fromDraft } from "./sampleDraft";
import { MetaProvider } from "./MetaContext";
import { EditorLayout } from "./components/EditorLayout";
import { AutoSave } from "./components/AutoSave";
import { GenerateBriefDialog } from "./components/GenerateBriefDialog";

export function Editor({
  pageId,
  initialName,
  initialDraft,
  plan,
  autoGenerate = false,
}: {
  pageId: string;
  initialName: string;
  initialDraft: LandingPageDraft;
  plan: PlanId;
  /** 从「AI 一键成页」进入（?ai=1）时为 true：默认弹出生成表单。 */
  autoGenerate?: boolean;
}) {
  const [initial] = useState(() => fromDraft(initialDraft));
  return (
    <DndProvider backend={HTML5Backend}>
      <EditorProvider initial={initial}>
        <MetaProvider pageId={pageId} initialName={initialName} plan={plan}>
          <AutoSave />
          <EditorLayout />
          <GenerateBriefDialog defaultOpen={autoGenerate} />
        </MetaProvider>
      </EditorProvider>
    </DndProvider>
  );
}
