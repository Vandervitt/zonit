"use client";

import { useState } from "react";
import { Typography, Segmented, Empty, Spin } from "antd";
import useSWR from "swr";
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

  const segmentedOptions = [
    { label: "全部", value: "all" },
    { label: "图片", value: "image" },
    { label: "视频", value: "video" },
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
            素材库
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {items.length} 个素材
          </Typography.Text>
        </div>
        <UploadZone onUploaded={handleUploaded} />
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
        {!data ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
            <Spin size="large" />
          </div>
        ) : items.length === 0 ? (
          <Empty description="还没有素材" style={{ paddingTop: 60 }} />
        ) : (
          <MediaGrid items={items} onDeleted={handleDeleted} />
        )}
      </div>
    </main>
  );
}
