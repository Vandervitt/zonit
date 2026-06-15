"use client";
// landing-editor/Editor.tsx
// 编辑器顶层：DnD 后端 + 状态 Provider + 布局。
import { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { EditorProvider } from "./store/editorStore";
import { createInitialState } from "./sampleDraft";
import { EditorLayout } from "./components/EditorLayout";

export function Editor() {
  const [initial] = useState(createInitialState);

  return (
    <DndProvider backend={HTML5Backend}>
      <EditorProvider initial={initial}>
        <EditorLayout />
      </EditorProvider>
    </DndProvider>
  );
}
