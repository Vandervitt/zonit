"use client";

import { useState } from "react";
import { Card, Button, Popconfirm, Image } from "antd";
import { DeleteOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { apiMediaPath } from "@/lib/constants";
import type { MediaItem } from "@/lib/media-db";

interface MediaGridProps {
  items: MediaItem[];
  onDeleted: (id: string) => void;
  onSelect?: (item: MediaItem) => void;
  selectedId?: string;
  variant?: "light" | "dark";
}

export function MediaGrid({
  items,
  onDeleted,
  onSelect,
  selectedId,
  variant = "light",
}: MediaGridProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (item: MediaItem) => {
    setDeletingId(item.id);
    try {
      const res = await fetch(apiMediaPath(item.id), { method: "DELETE" });
      if (res.ok) onDeleted(item.id);
    } finally {
      setDeletingId(null);
    }
  };

  // dark variant: keep original class-based rendering for backward compat
  if (variant === "dark") {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-zinc-500 text-sm">
          还没有素材，点击 上传素材 开始
        </div>
      );
    }
    return (
      <div className="grid grid-cols-3 gap-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            className={`group relative rounded-md overflow-hidden border-2 transition-colors ${
              onSelect ? "cursor-pointer" : ""
            } ${selectedId === item.id ? "border-aqua-500" : "border-transparent hover:border-zinc-500"}`}
            onClick={() => onSelect?.(item)}
          >
            <div className="aspect-square bg-zinc-800">
              {item.type === "image" ? (
                <img src={item.url} alt={item.filename} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center gap-1">
                  <PlayCircleOutlined style={{ fontSize: 28, color: "#71717a" }} />
                  <span className="text-[10px] text-zinc-500 px-1 text-center truncate w-full leading-tight">
                    {item.filename}
                  </span>
                </div>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[10px] text-white truncate">{item.filename}</p>
            </div>
            <Popconfirm
              title={`确认删除"${item.filename}"？`}
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(item)}
            >
              <Button
                danger
                size="small"
                type="text"
                icon={<DeleteOutlined />}
                loading={deletingId === item.id}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  opacity: 0,
                  background: "rgba(0,0,0,0.6)",
                }}
                className="group-hover:opacity-100"
              />
            </Popconfirm>
          </div>
        ))}
      </div>
    );
  }

  // light variant: antd Card-based grid
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        还没有素材，点击 上传素材 开始
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: 12,
      }}
    >
      {items.map((item) => (
        <div key={item.id} style={{ position: "relative" }}>
          <Card
            hoverable={!!onSelect}
            onClick={() => onSelect?.(item)}
            style={{
              cursor: onSelect ? "pointer" : "default",
              outline: selectedId === item.id ? "2px solid #06b6d4" : undefined,
            }}
            styles={{ body: { padding: 0 } }}
            cover={
              item.type === "image" ? (
                <Image
                  src={item.url}
                  alt={item.filename}
                  preview={false}
                  style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }}
                />
              ) : (
                <div
                  style={{
                    aspectRatio: "1/1",
                    background: "#18181b",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <PlayCircleOutlined style={{ fontSize: 28, color: "#71717a" }} />
                  <span
                    style={{
                      fontSize: 10,
                      color: "#71717a",
                      padding: "0 4px",
                      textAlign: "center",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      width: "100%",
                    }}
                  >
                    {item.filename}
                  </span>
                </div>
              )
            }
          >
            <div style={{ padding: "4px 8px", fontSize: 11, color: "#8c8c8c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.filename}
            </div>
            {item.source === "unsplash" && item.creditName ? (
              <div style={{ padding: "0 8px 4px", fontSize: 10, color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                © {item.creditUrl ? (
                  <a href={item.creditUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>{item.creditName}</a>
                ) : item.creditName} · Unsplash
              </div>
            ) : null}
          </Card>
          <Popconfirm
            title={`确认删除"${item.filename}"？`}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(item)}
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              loading={deletingId === item.id}
              onClick={(e) => e.stopPropagation()}
              style={{ position: "absolute", top: 4, right: 4, zIndex: 1 }}
            />
          </Popconfirm>
        </div>
      ))}
    </div>
  );
}
