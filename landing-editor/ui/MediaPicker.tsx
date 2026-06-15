"use client";
// landing-editor/ui/MediaPicker.tsx
// 媒体资源输入：① 直接填写资源路径；② 从媒体库选择。
// 媒体库经 GET /api/media?type= 拉取（编辑器已鉴权），仅做选择，不在此处上传。
import { useEffect, useState } from "react";
import type { MediaItem } from "@/lib/media-db"; // 仅类型，编译期擦除，不会引入服务端代码
import { TextInput } from "./TextInput";
import { Button } from "./Button";

export function MediaPicker({
  value,
  onChange,
  accept,
  placeholder = "https://… 或 /static/…",
}: {
  value: string;
  onChange: (url: string) => void;
  accept: "image" | "video";
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <TextInput value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
        <Button variant="subtle" className="shrink-0" onClick={() => setOpen(true)}>
          媒体库
        </Button>
      </div>
      {value ? (
        <div className="overflow-hidden rounded-md border border-edge">
          {accept === "video" ? (
            <video src={value} className="h-20 w-full bg-canvas object-contain" muted />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-20 w-full bg-canvas object-contain" />
          )}
        </div>
      ) : null}

      {open ? (
        <MediaLibraryModal
          accept={accept}
          onSelect={(url) => {
            onChange(url);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

function MediaLibraryModal({
  accept,
  onSelect,
  onClose,
}: {
  accept: "image" | "video";
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 模态每次打开都会重新挂载，初始即为加载态，无需在此同步重置 state
    let active = true;
    fetch(`/api/media?type=${accept}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 401 ? "未登录或无权限" : `HTTP ${res.status}`);
        return res.json() as Promise<MediaItem[]>;
      })
      .then((data) => active && setItems(data))
      .catch((e) => active && setError(e instanceof Error ? e.message : "加载失败"));
    return () => {
      active = false;
    };
  }, [accept]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="关闭" className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative z-10 flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-edge bg-panel shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-edge px-4 py-3">
          <h3 className="text-sm font-semibold text-ink">媒体库 · {accept === "video" ? "视频" : "图片"}</h3>
          <Button variant="ghost" onClick={onClose} aria-label="关闭">
            ✕
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {error ? (
            <div className="py-10 text-center text-sm text-red-600">{error}</div>
          ) : items === null ? (
            <div className="py-10 text-center text-sm text-ink-muted">加载中…</div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-ink-muted">媒体库暂无素材，可直接在上方填写资源路径。</div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.url)}
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
          )}
        </div>
      </div>
    </div>
  );
}
