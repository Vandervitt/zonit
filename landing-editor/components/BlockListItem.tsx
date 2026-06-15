"use client";
// landing-editor/components/BlockListItem.tsx
// 可拖拽排序的 section 行（react-dnd）。
import { useDrag, useDrop } from "react-dnd";
import { SECTION_REGISTRY } from "@/types/schema.draft";
import { useEditorDispatch, type EditorSection } from "../store/editorStore";
import { Button } from "../ui/Button";

const DND_TYPE = "landing-section";

interface DragItem {
  index: number;
}

export function SectionRow({
  section,
  index,
  selected,
}: {
  section: EditorSection;
  index: number;
  selected: boolean;
}) {
  const dispatch = useEditorDispatch();

  const [, drop] = useDrop<DragItem>({
    accept: DND_TYPE,
    hover(item) {
      if (item.index === index) return;
      dispatch({ kind: "reorderSection", fromIndex: item.index, toIndex: index });
      item.index = index;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: DND_TYPE,
    item: { index } as DragItem,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  // 用回调 ref 在提交阶段连接 dnd 连接器，避免在渲染期访问 ref.current
  const attachRef = (node: HTMLDivElement | null) => {
    drag(drop(node));
  };

  return (
    <div
      ref={attachRef}
      className={`group flex items-center gap-2 rounded-lg border px-2 py-2 transition-colors ${
        selected ? "border-brand-500 bg-brand-50" : "border-edge bg-panel hover:border-edge-strong"
      } ${isDragging ? "opacity-40" : ""}`}
    >
      <span className="cursor-grab select-none text-ink-muted" aria-hidden>
        ⠿
      </span>
      <button
        type="button"
        onClick={() => dispatch({ kind: "select", id: section._key })}
        className="flex-1 truncate text-left text-sm text-ink-soft"
      >
        {SECTION_REGISTRY[section.type].label}
      </button>
      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" onClick={() => dispatch({ kind: "moveSection", key: section._key, dir: -1 })} aria-label="上移">
          ↑
        </Button>
        <Button
          variant="ghost"
          onClick={() => dispatch({ kind: "moveSection", key: section._key, dir: 1 })}
          aria-label="下移"
        >
          ↓
        </Button>
        <Button variant="danger" onClick={() => dispatch({ kind: "removeSection", key: section._key })} aria-label="删除">
          ✕
        </Button>
      </div>
    </div>
  );
}
