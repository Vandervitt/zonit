// landing-editor/ui/RepeatableList.tsx
// 通用可重复列表：增 / 删 / 上下移；每项内容由 renderItem 渲染 prop 决定。
import { useAdminT } from "@/lib/i18n/admin/context";
import type { ReactNode } from "react";
import { Button } from "./Button";
import { Group } from "./Field";

interface RepeatableListProps<T> {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  addLabel?: string;
  renderItem: (item: T, onItemChange: (next: T) => void, index: number) => ReactNode;
}

export function RepeatableList<T>({
  label,
  items,
  onChange,
  create,
  addLabel,
  renderItem,
}: RepeatableListProps<T>) {
  const t = useAdminT().editor.ui;
  const update = (i: number, next: T) => onChange(items.map((it, idx) => (idx === i ? next : it)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <Group
      label={label}
      action={
        <Button variant="subtle" onClick={() => onChange([...items, create()])}>
          + {addLabel}
        </Button>
      }
    >
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-edge py-4 text-center text-xs text-ink-muted">
          {t.emptyList}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="rounded-lg border border-edge bg-canvas/60 p-2.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium text-ink-muted">#{i + 1}</span>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t.moveUp}>
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    aria-label={t.moveDown}
                  >
                    ↓
                  </Button>
                  <Button variant="danger" onClick={() => remove(i)} aria-label={t.delete}>
                    ✕
                  </Button>
                </div>
              </div>
              <div className="space-y-2">{renderItem(item, (next) => update(i, next), i)}</div>
            </div>
          ))}
        </div>
      )}
    </Group>
  );
}
