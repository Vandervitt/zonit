"use client";
// landing-editor/ui/media/UnsplashTab.tsx
// Unsplash 搜索：GET /api/unsplash/search → 网格；点选即下载落库（importUnsplashMedia），
// 回传 Blob url 作 src、alt_description 作 alt。后端无 key 时显示提示。
import { useState } from "react";
import { TextInput } from "../TextInput";
import { Button } from "../Button";
import { importUnsplashMedia } from "@/lib/media-upload";
import { toImportInput, type UnsplashPhoto } from "./unsplash";

type Status = "idle" | "loading" | "demo" | "error" | "done";

export function UnsplashTab({ onPick }: { onPick: (picked: { src: string; alt: string }) => void }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const search = async () => {
    if (!q.trim()) return;
    setStatus("loading");
    setImportError(null);
    try {
      const res = await fetch(`/api/unsplash/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data._demo) { setStatus("demo"); setPhotos([]); return; }
      if (!res.ok) { setStatus("error"); setPhotos([]); return; }
      setPhotos((data.results ?? []) as UnsplashPhoto[]);
      setStatus("done");
    } catch {
      setStatus("error");
      setPhotos([]);
    }
  };

  const pick = async (p: UnsplashPhoto) => {
    if (importingId) return;
    setImportingId(p.id);
    setImportError(null);
    try {
      const item = await importUnsplashMedia(toImportInput(p));
      onPick({ src: item.url, alt: p.alt_description ?? "" });
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "从 Unsplash 添加失败");
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <form
        className="flex items-center gap-1.5"
        onSubmit={(e) => { e.preventDefault(); void search(); }}
      >
        <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索 Unsplash 图片（英文更准）" />
        <Button type="submit" variant="subtle" className="shrink-0">搜索</Button>
      </form>

      {importError ? <div className="text-center text-sm text-red-600">{importError}</div> : null}

      {status === "demo" ? (
        <div className="py-8 text-center text-sm text-ink-muted">
          未配置 Unsplash，可用「媒体库 / 上传」，或直接在上方填写图片 URL。
        </div>
      ) : status === "error" ? (
        <div className="py-8 text-center text-sm text-red-600">搜索失败，请重试</div>
      ) : status === "loading" ? (
        <div className="py-8 text-center text-sm text-ink-muted">搜索中…</div>
      ) : photos.length === 0 ? (
        <div className="py-8 text-center text-sm text-ink-muted">输入关键词后搜索图片</div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={importingId !== null}
              onClick={() => void pick(p)}
              aria-label={`添加 Unsplash 图片 by ${p.user.name}`}
              title={p.alt_description ?? `by ${p.user.name}`}
              className="group relative overflow-hidden rounded-lg border border-edge transition-colors hover:border-brand-500 disabled:opacity-60"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.urls.small} alt={p.alt_description ?? ""} className="aspect-square w-full bg-canvas object-cover" />
              {importingId === p.id ? (
                <span className="absolute inset-0 grid place-items-center bg-black/40 text-xs text-white">添加中…</span>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
