"use client";

import { useState } from "react";
import { Typography, Segmented, Empty, Spin, Button, Space } from "antd";
import { PictureOutlined } from "@ant-design/icons";
import useSWR from "swr";
import { ApiRoutes } from "@/lib/constants";
import { MediaGrid } from "@/components/media/MediaGrid";
import { UploadZone } from "@/components/media/UploadZone";
import { UnsplashModal } from "@/components/media/UnsplashModal";
import type { MediaItem } from "@/lib/media-db";
import { LoadErrorAlert } from "../_shell/LoadErrorAlert";
import { useAdminT } from "@/lib/i18n/admin/context";

type FilterTab = "all" | "image" | "video";

export default function MediaPage() {
  const t = useAdminT().media;
  const [filter, setFilter] = useState<FilterTab>("all");
  const [unsplashOpen, setUnsplashOpen] = useState(false);

  const apiUrl =
    filter === "all" ? ApiRoutes.Media : `${ApiRoutes.Media}?type=${filter}`;

  const { data, error, mutate } = useSWR<MediaItem[]>(apiUrl);
  const items = data ?? [];

  const handleUploaded = (item: MediaItem) => {
    void mutate([item, ...items]);
  };

  const handleDeleted = (id: string) => {
    void mutate(items.filter((i) => i.id !== id));
  };

  const segmentedOptions = [
    { label: t.filter.all, value: "all" },
    { label: t.filter.image, value: "image" },
    { label: t.filter.video, value: "video" },
  ];

  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
        }}
      >
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {t.title}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {t.count(items.length)}
          </Typography.Text>
        </div>
        <Space>
          <Button icon={<PictureOutlined />} onClick={() => setUnsplashOpen(true)} aria-label={t.unsplash.open}>
            {t.unsplash.open}
          </Button>
          <UploadZone onUploaded={handleUploaded} />
        </Space>
      </header>

      {/* Filter */}
      <div style={{ padding: "0 24px 12px" }}>
        <Segmented
          options={segmentedOptions}
          value={filter}
          onChange={(val) => setFilter(val as FilterTab)}
        />
      </div>

      {/* Grid */}
      <div style={{ flex: 1, padding: "0 24px 20px", overflow: "auto" }}>
        <LoadErrorAlert error={error} onRetry={() => void mutate()} label={t.loadErrorLabel} />
        {error ? null : !data ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
            <Spin size="large" />
          </div>
        ) : items.length === 0 ? (
          <Empty description={t.empty} style={{ paddingTop: 60 }} />
        ) : (
          <MediaGrid items={items} onDeleted={handleDeleted} />
        )}
      </div>

      <UnsplashModal open={unsplashOpen} onClose={() => setUnsplashOpen(false)} onImported={handleUploaded} />
    </main>
  );
}
