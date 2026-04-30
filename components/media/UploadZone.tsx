"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { ApiRoutes } from "@/lib/constants";
import type { MediaItem } from "@/lib/media-db";

interface UploadZoneProps {
  onUploaded: (item: MediaItem) => void;
  compact?: boolean;
  accept?: "image" | "video" | "all";
}

export function UploadZone({ onUploaded, compact = false, accept = "all" }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptAttr =
    accept === "image" ? "image/*" : accept === "video" ? "video/*" : "image/*,video/*";

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(ApiRoutes.Media, { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "上传失败");
        return;
      }
      const item: MediaItem = await res.json();
      onUploaded(item);
    } catch {
      setError("上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        className="hidden"
        onChange={handleChange}
      />
      {compact ? (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="h-7 px-3 text-xs bg-zinc-800 border border-zinc-700 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          {uploading ? "上传中…" : "上传素材"}
        </button>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 h-9 px-4 text-sm rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {uploading ? "上传中…" : "上传素材"}
        </button>
      )}
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
    </div>
  );
}
