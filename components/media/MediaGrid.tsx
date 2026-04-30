"use client";

import { useState } from "react";
import { Trash2, PlayCircle } from "lucide-react";
import { apiMediaPath } from "@/lib/constants";
import type { MediaItem } from "@/lib/media-db";

interface MediaGridProps {
  items: MediaItem[];
  onDeleted: (id: string) => void;
  onSelect?: (item: MediaItem) => void;
  selectedId?: string;
  variant?: "light" | "dark";
}

export function MediaGrid({
  items,
  onDeleted,
  onSelect,
  selectedId,
  variant = "light",
}: MediaGridProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, item: MediaItem) => {
    e.stopPropagation();
    if (!confirm(`确认删除"${item.filename}"？`)) return;
    setDeletingId(item.id);
    try {
      const res = await fetch(apiMediaPath(item.id), { method: "DELETE" });
      if (res.ok) onDeleted(item.id);
    } finally {
      setDeletingId(null);
    }
  };

  const emptyClass =
    variant === "dark"
      ? "text-center py-8 text-zinc-500 text-sm"
      : "text-center py-12 text-slate-400 text-sm";

  const cardBg = variant === "dark" ? "bg-zinc-800" : "bg-slate-200";
  const videoBg = variant === "dark" ? "bg-zinc-900" : "bg-slate-800";
  const borderSelected = "border-blue-500";
  const borderHover = variant === "dark" ? "hover:border-zinc-500" : "hover:border-slate-400";

  if (items.length === 0) {
    return (
      <div className={emptyClass}>
        还没有素材，点击"上传素材"开始
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {items.map((item) => (
        <div
          key={item.id}
          className={`group relative rounded-md overflow-hidden border-2 transition-colors ${
            onSelect ? "cursor-pointer" : ""
          } ${selectedId === item.id ? borderSelected : `border-transparent ${borderHover}`}`}
          onClick={() => onSelect?.(item)}
        >
          <div className={`aspect-square ${cardBg}`}>
            {item.type === "image" ? (
              <img
                src={item.url}
                alt={item.filename}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full ${videoBg} flex flex-col items-center justify-center gap-1`}>
                <PlayCircle className="w-7 h-7 text-slate-400" />
                <span className="text-[10px] text-slate-500 px-1 text-center truncate w-full leading-tight">
                  {item.filename}
                </span>
              </div>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-[10px] text-white truncate">{item.filename}</p>
          </div>
          <button
            className="absolute top-1 right-1 w-5 h-5 rounded bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 disabled:opacity-30"
            onClick={(e) => handleDelete(e, item)}
            disabled={deletingId === item.id}
            title="删除"
          >
            <Trash2 className="w-3 h-3 text-white" />
          </button>
        </div>
      ))}
    </div>
  );
}
