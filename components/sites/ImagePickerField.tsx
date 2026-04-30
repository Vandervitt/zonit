// components/sites/ImagePickerField.tsx
"use client";

import { useState, useEffect } from "react";
import { ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaGrid } from "@/components/media/MediaGrid";
import { UploadZone } from "@/components/media/UploadZone";
import { ApiRoutes } from "@/lib/constants";
import type { MediaItem } from "@/lib/media-db";

const di =
  "h-9 text-sm bg-zinc-800/60 border-zinc-700/70 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-500/60 focus-visible:border-zinc-600";

interface UnsplashPhoto {
  id: string;
  urls: { small: string; regular: string };
  alt_description: string | null;
  user: { name: string; username: string };
}

interface ImagePickerFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: "image" | "video" | "all";
}

export function ImagePickerField({
  label,
  value,
  onChange,
  accept = "image",
}: ImagePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"unsplash" | "media">("unsplash");

  // Unsplash state
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<UnsplashPhoto | null>(null);
  const [loading, setLoading] = useState(false);
  const [noKey, setNoKey] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Media library state
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const mediaType = accept === "all" ? undefined : accept;

  const fetchMedia = async () => {
    setMediaLoading(true);
    try {
      const url = mediaType
        ? `${ApiRoutes.Media}?type=${mediaType}`
        : ApiRoutes.Media;
      const res = await fetch(url);
      if (res.ok) setMediaItems(await res.json());
    } finally {
      setMediaLoading(false);
    }
  };

  useEffect(() => {
    if (open && tab === "media") fetchMedia();
  }, [open, tab]);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `/api/unsplash/search?q=${encodeURIComponent(query)}&per_page=8`,
      );
      if (!res.ok) {
        setSearchError("搜索失败，请重试");
        return;
      }
      const data = await res.json();
      if (data._demo) {
        setNoKey(true);
        setPhotos([]);
      } else {
        setPhotos(data.results);
        setNoKey(false);
      }
    } catch {
      setSearchError("搜索失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setSelectedPhoto(null);
    setSelectedMedia(null);
    setOpen(true);
  };

  const confirm = () => {
    if (tab === "unsplash" && selectedPhoto) {
      onChange(selectedPhoto.urls.regular);
    } else if (tab === "media" && selectedMedia) {
      onChange(selectedMedia.url);
    }
    setOpen(false);
    setSelectedPhoto(null);
    setSelectedMedia(null);
  };

  const handleMediaUploaded = (item: MediaItem) => {
    setMediaItems((prev) => [item, ...prev]);
    setSelectedMedia(item);
  };

  const handleMediaDeleted = (id: string) => {
    setMediaItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedMedia?.id === id) setSelectedMedia(null);
  };

  const confirmDisabled =
    tab === "unsplash" ? !selectedPhoto : !selectedMedia;

  const confirmLabel = accept === "video" ? "使用此视频" : "使用此图片";

  const fieldId = `img-picker-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={fieldId}
        className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium block"
      >
        {label}
      </label>

      <div className="flex items-center gap-2">
        {value ? (
          <>
            <div className="w-12 h-12 rounded-md overflow-hidden shrink-0 border border-zinc-700/50">
              <img src={value} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-zinc-500 truncate mb-1.5">
                {value.split("/").pop()?.split("?")[0]}
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={handleOpen}
                  className="h-6 px-2 text-[11px] bg-zinc-800 border border-zinc-700 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
                >
                  更换
                </button>
                <button
                  onClick={() => onChange("")}
                  className="h-6 px-2 text-[11px] bg-zinc-800 border border-zinc-700 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  移除
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-md border border-dashed border-zinc-700 flex items-center justify-center shrink-0">
              <ImageIcon className="w-4 h-4 text-zinc-600" />
            </div>
            <button
              id={fieldId}
              onClick={handleOpen}
              className="h-7 px-3 text-xs bg-zinc-800 border border-zinc-700 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              选择图片
            </button>
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100 max-w-lg p-0 gap-0">
          <DialogHeader className="px-5 py-4 border-b border-zinc-800">
            <DialogTitle className="text-sm font-semibold">选择图片</DialogTitle>
          </DialogHeader>

          {/* Tab 切换 */}
          <div className="flex border-b border-zinc-800 px-5 gap-1">
            {(["unsplash", "media"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  tab === t
                    ? "border-white text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {t === "unsplash" ? "🔍 Unsplash" : "🗂 我的素材库"}
              </button>
            ))}
          </div>

          <div className="p-5 min-h-[260px]">
            {tab === "unsplash" ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    className={`${di} flex-1`}
                    placeholder="搜索图片，如 beauty, skincare, product…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && search()}
                  />
                  <Button
                    size="sm"
                    onClick={search}
                    disabled={loading}
                    className="h-9 px-4 bg-zinc-100 text-zinc-900 hover:bg-white text-xs shrink-0"
                  >
                    {loading ? "搜索中…" : "搜索"}
                  </Button>
                </div>

                {noKey && (
                  <p className="text-xs text-amber-400 text-center py-4">
                    请先配置{" "}
                    <code className="bg-zinc-800 px-1 rounded">
                      UNSPLASH_ACCESS_KEY
                    </code>{" "}
                    环境变量
                  </p>
                )}

                {searchError && (
                  <p className="text-xs text-rose-400 text-center py-4">
                    {searchError}
                  </p>
                )}

                {photos.length > 0 && (
                  <>
                    <div className="grid grid-cols-4 gap-1.5">
                      {photos.map((photo) => (
                        <button
                          key={photo.id}
                          onClick={() => setSelectedPhoto(photo)}
                          title={photo.user.name}
                          className={`aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                            selectedPhoto?.id === photo.id
                              ? "border-blue-500"
                              : "border-transparent hover:border-zinc-500"
                          }`}
                        >
                          <img
                            src={photo.urls.small}
                            alt={photo.alt_description ?? ""}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-zinc-600 text-center">
                      Photos by{" "}
                      <a
                        href="https://unsplash.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-zinc-400"
                      >
                        Unsplash
                      </a>{" "}
                      · 免费商用 · 使用后需标注来源
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-500">
                    {mediaLoading ? "加载中…" : `${mediaItems.length} 个素材`}
                  </p>
                  <UploadZone
                    onUploaded={handleMediaUploaded}
                    compact
                    accept={accept}
                  />
                </div>
                {!mediaLoading && (
                  <MediaGrid
                    items={mediaItems}
                    onDeleted={handleMediaDeleted}
                    onSelect={setSelectedMedia}
                    selectedId={selectedMedia?.id}
                    variant="dark"
                  />
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 px-5 py-3 border-t border-zinc-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 text-xs text-zinc-400 hover:text-zinc-200"
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={confirm}
              disabled={confirmDisabled}
              className="h-8 px-4 text-xs bg-zinc-100 text-zinc-900 hover:bg-white disabled:opacity-40"
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
