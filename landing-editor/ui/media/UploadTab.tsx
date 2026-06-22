"use client";
// landing-editor/ui/media/UploadTab.tsx
// 上传 Tab：选文件 → uploadMedia → 成功回传新素材 url（壳负责选中并关闭）。
import { useRef, useState } from "react";
import { uploadMedia } from "@/lib/media-upload";
import { Button } from "../Button";

export function UploadTab({
  accept,
  onUploaded,
}: {
  accept: "image" | "video";
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const item = await uploadMedia(file);
      onUploaded(item.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <input
        ref={inputRef}
        type="file"
        accept={accept === "video" ? "video/*" : "image/*"}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
      <Button variant="primary" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? "上传中…" : `上传${accept === "video" ? "视频" : "图片"}`}
      </Button>
      <p className="text-xs text-ink-muted">上传后自动入库并选中（≤100MB，不支持 SVG）</p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
