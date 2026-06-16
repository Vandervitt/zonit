"use client";
// landing-editor/components/PreviewPane.tsx
// 右栏实时预览面板：订阅编辑器 state，经 toDraft 产出 LandingPageDraft，
// 用渲染器 LandingPage 在隔离 iframe 内实时呈现。支持桌面/移动宽度切换。
import { useState } from "react";
import { useEditorState, toDraft } from "../store/editorStore";
import { LandingPage } from "@/landing-renderer/LandingPage";
import { PreviewFrame } from "./PreviewFrame";

type Device = "desktop" | "mobile";
const DEVICE_WIDTH: Record<Device, number> = { desktop: 1280, mobile: 390 };

export function PreviewPane() {
  const state = useEditorState();
  const draft = toDraft(state);
  const [device, setDevice] = useState<Device>("desktop");

  const tab = (d: Device, label: string) => (
    <button
      type="button"
      onClick={() => setDevice(d)}
      className={
        "rounded-md px-2.5 py-1 text-xs font-medium transition " +
        (device === d ? "bg-brand-600 text-white" : "text-ink-soft hover:bg-canvas")
      }
    >
      {label}
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-canvas">
      <div className="flex shrink-0 items-center justify-between border-b border-edge bg-panel px-4 py-2.5">
        <span className="text-xs font-medium text-ink">实时预览</span>
        <div className="flex items-center gap-1">
          {tab("desktop", "桌面")}
          {tab("mobile", "移动")}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <PreviewFrame virtualWidth={DEVICE_WIDTH[device]}>
          <LandingPage page={draft} />
        </PreviewFrame>
      </div>
    </div>
  );
}
