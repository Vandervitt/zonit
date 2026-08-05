"use client";

import { useState } from "react";
import { Modal, Input, Spin, Empty, App } from "antd";
import { ApiRoutes } from "@/lib/constants";
import { importUnsplashMedia } from "@/lib/media-upload";
import { toImportInput } from "@/landing-editor/ui/media/unsplash";
import type { UnsplashPhoto } from "@/landing-editor/ui/media/unsplash";
import type { MediaItem } from "@/lib/media-db";
import { useAdminT } from "@/lib/i18n/admin/context";

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: (item: MediaItem) => void;
}

type Status = "idle" | "loading" | "demo" | "error" | "done";

export function UnsplashModal({ open, onClose, onImported }: Props) {
  const t = useAdminT().media;
  const { message } = App.useApp();
  const [status, setStatus] = useState<Status>("idle");
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [importingId, setImportingId] = useState<string | null>(null);

  const search = async (q: string) => {
    if (!q.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch(`${ApiRoutes.UnsplashSearch}?q=${encodeURIComponent(q)}`);
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
    try {
      const item = await importUnsplashMedia(toImportInput(p));
      onImported(item);
      void message.success(t.unsplash.added);
    } catch (e) {
      void message.error(e instanceof Error ? e.message : t.unsplash.addFailed);
    } finally {
      setImportingId(null);
    }
  };

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={720} title={t.unsplash.title} destroyOnClose>
      <Input.Search
        placeholder={t.unsplash.searchPlaceholder}
        allowClear
        enterButton={t.unsplash.searchButton}
        aria-label={t.unsplash.searchAria}
        onSearch={search}
        style={{ marginBottom: 12 }}
      />
      {status === "loading" ? (
        <div style={{ padding: 40, textAlign: "center" }}><Spin /></div>
      ) : status === "demo" ? (
        <Empty description={t.unsplash.notConfigured} />
      ) : status === "error" ? (
        <Empty description={t.unsplash.searchFailed} />
      ) : photos.length === 0 ? (
        <Empty description={t.unsplash.prompt} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
          {photos.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={importingId !== null}
              onClick={() => void pick(p)}
              aria-label={t.unsplash.addAria(p.user.name)}
              style={{ position: "relative", padding: 0, border: "none", background: "none", cursor: "pointer", borderRadius: 8, overflow: "hidden" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.urls.small} alt={p.alt_description ?? ""} style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block", opacity: importingId !== null ? 0.6 : 1 }} />
              <span style={{ display: "block", fontSize: 11, color: "#8c8c8c", padding: "2px 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.user.name}
              </span>
              {importingId === p.id ? (
                <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.4)", color: "#fff", fontSize: 12 }}>{t.unsplash.adding}</span>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
