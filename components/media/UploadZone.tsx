"use client";

import { useRef, useState } from "react";
import { Button, App } from "antd";
import { UploadOutlined, LoadingOutlined } from "@ant-design/icons";
import { uploadMedia } from "@/lib/media-upload";
import type { MediaItem } from "@/lib/media-db";
import { useAdminT } from "@/lib/i18n/admin/context";

interface UploadZoneProps {
  onUploaded: (item: MediaItem) => void;
  compact?: boolean;
  accept?: "image" | "video" | "all";
}

export function UploadZone({ onUploaded, compact = false, accept = "all" }: UploadZoneProps) {
  const t = useAdminT().media;
  const { message } = App.useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const acceptAttr =
    accept === "image" ? "image/*" : accept === "video" ? "video/*" : "image/*,video/*";

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const item = await uploadMedia(file);
      onUploaded(item);
    } catch (e) {
      void message.error(e instanceof Error ? e.message : t.upload.failed);
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
        {uploading ? t.upload.uploading : t.upload.button}
      </Button>
    </div>
  );
}
