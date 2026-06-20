"use client";

import { useRef, useState } from "react";
import { Button, App } from "antd";
import { UploadOutlined, LoadingOutlined } from "@ant-design/icons";
import { ApiRoutes } from "@/lib/constants";
import type { MediaItem } from "@/lib/media-db";

interface UploadZoneProps {
  onUploaded: (item: MediaItem) => void;
  compact?: boolean;
  accept?: "image" | "video" | "all";
}

export function UploadZone({ onUploaded, compact = false, accept = "all" }: UploadZoneProps) {
  const { message } = App.useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const acceptAttr =
    accept === "image" ? "image/*" : accept === "video" ? "video/*" : "image/*,video/*";

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(ApiRoutes.Media, { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json();
        void message.error(data.error ?? "上传失败");
        return;
      }
      const item: MediaItem = await res.json();
      onUploaded(item);
    } catch {
      void message.error("上传失败，请重试");
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
        style={{ display: "none" }}
        onChange={handleChange}
      />
      <Button
        icon={uploading ? <LoadingOutlined /> : <UploadOutlined />}
        loading={uploading}
        size={compact ? "small" : "middle"}
        type={compact ? "default" : "primary"}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "上传中…" : "上传素材"}
      </Button>
    </div>
  );
}
