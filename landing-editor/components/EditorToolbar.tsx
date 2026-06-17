"use client";
import { useState } from "react";
import Link from "next/link";
import { useMeta } from "../MetaContext";
import { ValidationBar } from "./ValidationBar";
import { PublishDialog } from "./PublishDialog";
import { landingPreviewPath, Routes } from "@/lib/constants";

const SAVE_LABEL: Record<string, string> = {
  idle: "", saving: "保存中…", saved: "已保存", error: "保存失败，重试",
};

export function EditorToolbar() {
  const { pageId, name, setName, saveState } = useMeta();
  const [publishOpen, setPublishOpen] = useState(false);

  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-edge bg-panel px-5 py-3">
      <Link href={Routes.LandingPages} className="text-sm text-ink-soft hover:text-ink">← 返回</Link>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-56 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-ink hover:border-edge focus:border-brand-500 focus:outline-none"
        placeholder="页面名称"
      />
      <span className={`text-xs ${saveState === "error" ? "text-red-500" : "text-ink-muted"}`}>
        {SAVE_LABEL[saveState]}
      </span>
      <div className="flex-1" />
      <ValidationBar />
      <Link
        href={landingPreviewPath(pageId)}
        target="_blank"
        className="rounded-md border border-edge px-3 py-1.5 text-sm text-ink-soft hover:bg-canvas"
      >
        预览
      </Link>
      <button
        onClick={() => setPublishOpen(true)}
        className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        发布
      </button>
      {publishOpen && <PublishDialog onClose={() => setPublishOpen(false)} />}
    </header>
  );
}
