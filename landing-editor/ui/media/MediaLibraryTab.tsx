"use client";
// landing-editor/ui/media/MediaLibraryTab.tsx
// 媒体库网格：GET /api/media?type= 拉取当前用户素材，点选回传 url。
import { useAdminT } from "@/lib/i18n/admin/context";
import { useEffect, useState } from "react";
import type { MediaItem } from "@/lib/media-db";

export function MediaLibraryTab({
  accept,
  onPick,
}: {
  accept: "image" | "video";
  onPick: (url: string) => void;
}) {
  const t = useAdminT().editor.ui;
  const [items, setItems] = useState<MediaItem[] | null>(null);
  // 存错误**种类**而非已翻译的文案：在 effect 里翻译会把当时的语言固化下来，
  // 且会让 t 成为 effect 依赖，语言一变就重新拉一次媒体库。
  const [error, setError] = useState<"unauthorized" | "failed" | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/media?type=${accept}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 401 ? "unauthorized" : "failed");
        return res.json() as Promise<MediaItem[]>;
      })
      .then((data) => active && setItems(data))
      .catch((e) => active && setError(e instanceof Error && e.message === "unauthorized" ? "unauthorized" : "failed"));
    return () => {
      active = false;
    };
  }, [accept]);

  if (error) return <div className="py-10 text-center text-sm text-red-600">{error === "unauthorized" ? t.unauthorized : t.loadFailed}</div>;
  if (items === null) return <div className="py-10 text-center text-sm text-ink-muted">{t.loading}</div>;
  if (items.length === 0)
    return <div className="py-10 text-center text-sm text-ink-muted">{t.emptyLibrary}</div>;

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onPick(item.url)}
          title={item.filename}
          className="group overflow-hidden rounded-lg border border-edge transition-colors hover:border-brand-500"
        >
          {item.type === "video" ? (
            <video src={item.url} className="aspect-square w-full bg-canvas object-cover" muted />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.url} alt={item.filename} className="aspect-square w-full bg-canvas object-cover" />
          )}
          <span className="block truncate px-1.5 py-1 text-left text-[10px] text-ink-muted">{item.filename}</span>
        </button>
      ))}
    </div>
  );
}
