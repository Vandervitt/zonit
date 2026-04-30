"use client";

import { useState } from "react";
import useSWR from "swr";
import { Image as ImageIcon } from "lucide-react";
import { ApiRoutes } from "@/lib/constants";
import { MediaGrid } from "@/components/media/MediaGrid";
import { UploadZone } from "@/components/media/UploadZone";
import type { MediaItem } from "@/lib/media-db";

type FilterTab = "all" | "image" | "video";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MediaPage() {
  const [filter, setFilter] = useState<FilterTab>("all");

  const apiUrl =
    filter === "all" ? ApiRoutes.Media : `${ApiRoutes.Media}?type=${filter}`;

  const { data, mutate } = useSWR<MediaItem[]>(apiUrl, fetcher);
  const items = data ?? [];

  const handleUploaded = (item: MediaItem) => {
    void mutate([item, ...items]);
  };

  const handleDeleted = (id: string) => {
    void mutate(items.filter((i) => i.id !== id));
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "全部" },
    { key: "image", label: "图片" },
    { key: "video", label: "视频" },
  ];

  return (
    <main className="flex-1 flex flex-col overflow-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-slate-800 text-2xl">素材库</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} 个素材</p>
        </div>
        <UploadZone onUploaded={handleUploaded} />
      </header>

      {/* Filter tabs */}
      <div className="flex gap-1 px-6 border-b border-slate-200">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === key
                ? "border-slate-800 text-slate-800"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 px-6 py-5 overflow-auto">
        {!data ? (
          <div className="text-slate-400 text-sm">加载中…</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <ImageIcon className="w-10 h-10 text-slate-300" />
            <p className="text-sm">还没有素材，点击右上角"上传素材"开始</p>
          </div>
        ) : (
          <MediaGrid items={items} onDeleted={handleDeleted} />
        )}
      </div>
    </main>
  );
}
