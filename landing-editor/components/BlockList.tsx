"use client";
// landing-editor/components/BlockList.tsx
// 左栏：Hero 置顶、sections 可排序、Footer 置底、悬浮按钮开关。
import { useEditorState, useEditorDispatch, HERO_ID, FOOTER_ID, FLOATING_ID, LEADFORM_ID, BRANDING_ID, SEO_ID } from "../store/editorStore";
import { SectionRow } from "./BlockListItem";
import { AddSectionMenu } from "./AddSectionMenu";

function FixedRow({
  label,
  hint,
  selected,
  onSelect,
}: {
  label: string;
  hint: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left transition-colors ${
        selected ? "border-brand-500 bg-brand-50" : "border-edge bg-panel hover:border-edge-strong"
      }`}
    >
      <span className="text-sm font-medium text-ink">{label}</span>
      <span className="text-[10px] uppercase tracking-wide text-ink-muted">{hint}</span>
    </button>
  );
}

export function BlockList() {
  const state = useEditorState();
  const dispatch = useEditorDispatch();

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-edge px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">页面结构</h2>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <FixedRow
          label="首屏 Hero"
          hint="固定置顶"
          selected={state.selectedId === HERO_ID}
          onSelect={() => dispatch({ kind: "select", id: HERO_ID })}
        />

        <div className="space-y-2">
          {state.sections.map((section, index) => (
            <SectionRow
              key={section._key}
              section={section}
              index={index}
              selected={state.selectedId === section._key}
            />
          ))}
          {state.sections.length === 0 ? (
            <div className="rounded-lg border border-dashed border-edge py-4 text-center text-xs text-ink-muted">
              暂无中部区块
            </div>
          ) : null}
        </div>

        <AddSectionMenu />

        <FixedRow
          label="页脚 Footer"
          hint="固定置底"
          selected={state.selectedId === FOOTER_ID}
          onSelect={() => dispatch({ kind: "select", id: FOOTER_ID })}
        />

        <FixedRow
          label="品牌主题"
          hint="配色 / Logo"
          selected={state.selectedId === BRANDING_ID}
          onSelect={() => dispatch({ kind: "select", id: BRANDING_ID })}
        />

        <FixedRow
          label="SEO"
          hint="标题 / 描述 / 分享图"
          selected={state.selectedId === SEO_ID}
          onSelect={() => dispatch({ kind: "select", id: SEO_ID })}
        />

        <div className="rounded-lg border border-edge bg-panel p-2.5">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={state.floatingButton !== null}
              onChange={(e) => dispatch({ kind: "toggleFloating", on: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-edge-strong text-brand-600 focus:ring-brand-500/30"
            />
            悬浮按钮
          </label>
          {state.floatingButton !== null ? (
            <button
              type="button"
              onClick={() => dispatch({ kind: "select", id: FLOATING_ID })}
              className={`mt-2 w-full rounded-md border px-2 py-1.5 text-left text-xs transition-colors ${
                state.selectedId === FLOATING_ID
                  ? "border-brand-500 bg-brand-50 text-ink"
                  : "border-edge text-ink-soft hover:border-edge-strong"
              }`}
            >
              编辑悬浮按钮
            </button>
          ) : null}
        </div>

        <div className="rounded-lg border border-edge bg-panel p-2.5">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={state.leadForm !== null}
              onChange={(e) => dispatch({ kind: "toggleLeadForm", on: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-edge-strong text-brand-600 focus:ring-brand-500/30"
            />
            留资表单
          </label>
          {state.leadForm !== null ? (
            <button
              type="button"
              onClick={() => dispatch({ kind: "select", id: LEADFORM_ID })}
              className={`mt-2 w-full rounded-md border px-2 py-1.5 text-left text-xs transition-colors ${
                state.selectedId === LEADFORM_ID
                  ? "border-brand-500 bg-brand-50 text-ink"
                  : "border-edge text-ink-soft hover:border-edge-strong"
              }`}
            >
              编辑留资表单
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
