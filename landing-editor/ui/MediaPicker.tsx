"use client";
// landing-editor/ui/MediaPicker.tsx
// 选图入口：外层文本框（可直接贴 URL）+「选图」按钮 + 预览 + 三 Tab 弹窗。
// onChange(src, suggestedAlt?)：媒体库/上传只回传 src；Unsplash 额外回传 alt 建议。
import { useState } from "react";
import { TextInput } from "./TextInput";
import { Button } from "./Button";
import { MediaLibraryTab } from "./media/MediaLibraryTab";
import { UploadTab } from "./media/UploadTab";
import { UnsplashTab } from "./media/UnsplashTab";

type Tab = "library" | "upload" | "unsplash";

export function MediaPicker({
  value,
  onChange,
  accept,
  placeholder = "https://… 或 /static/…",
}: {
  value: string;
  onChange: (src: string, suggestedAlt?: string) => void;
  accept: "image" | "video";
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("library");

  const tabs: { key: Tab; label: string }[] =
    accept === "image"
      ? [
          { key: "library", label: "媒体库" },
          { key: "upload", label: "上传" },
          { key: "unsplash", label: "Unsplash" },
        ]
      : [
          { key: "library", label: "媒体库" },
          { key: "upload", label: "上传" },
        ];

  const close = () => { setOpen(false); setTab("library"); };
  const pickSrc = (src: string) => { onChange(src); close(); };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <TextInput value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
        <Button variant="subtle" className="shrink-0" onClick={() => setOpen(true)}>选图</Button>
      </div>
      {value ? (
        <div className="overflow-hidden rounded-md border border-edge">
          {accept === "video" ? (
            <video src={value} className="h-20 w-full bg-canvas object-contain" muted />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-20 w-full bg-canvas object-contain" />
          )}
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" aria-label="关闭" className="absolute inset-0 bg-ink/40" onClick={close} />
          <div className="relative z-10 flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-edge bg-panel shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-edge px-4 py-3">
              <div className="flex gap-1">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={
                      "rounded-md px-2.5 py-1 text-xs font-medium transition " +
                      (tab === t.key ? "bg-brand-600 text-white" : "text-ink-soft hover:bg-canvas")
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <Button variant="ghost" onClick={close} aria-label="关闭">✕</Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {tab === "library" ? (
                <MediaLibraryTab accept={accept} onPick={pickSrc} />
              ) : tab === "upload" ? (
                <UploadTab accept={accept} onUploaded={pickSrc} />
              ) : (
                <UnsplashTab onPick={({ src, alt }) => { onChange(src, alt); close(); }} />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
