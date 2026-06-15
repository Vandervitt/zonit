"use client";
// landing-editor/components/AddSectionMenu.tsx
import { useState } from "react";
import { SECTION_REGISTRY } from "@/types/schema.draft";
import { useEditorState, useEditorDispatch } from "../store/editorStore";
import { Button } from "../ui/Button";

export function AddSectionMenu() {
  const state = useEditorState();
  const dispatch = useEditorDispatch();
  const [open, setOpen] = useState(false);

  const present = new Set(state.sections.map((s) => s.type));
  const metas = Object.values(SECTION_REGISTRY);

  return (
    <div className="space-y-1.5">
      <Button variant="subtle" className="w-full" onClick={() => setOpen((o) => !o)}>
        + 添加区块
      </Button>
      {open ? (
        <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-edge bg-panel p-2">
          {metas.map((meta) => {
            const disabled = meta.singleton && present.has(meta.type);
            return (
              <button
                key={meta.type}
                type="button"
                disabled={disabled}
                title={disabled ? "该区块只能存在一个" : undefined}
                onClick={() => {
                  dispatch({ kind: "addSection", sectionType: meta.type });
                  setOpen(false);
                }}
                className="rounded-md border border-edge px-2 py-1.5 text-xs text-ink-soft transition-colors hover:border-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {meta.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
