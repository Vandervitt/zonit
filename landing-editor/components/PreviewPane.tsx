"use client";
// landing-editor/components/PreviewPane.tsx
// 右栏实时预览面板：订阅编辑器 state，经 toDraft 产出 LandingPageDraft，
// 用渲染器 LandingPage 在隔离 iframe 内实时呈现。
// 落地页为移动端优先，故默认手机视图——把预览包进居中手机卡片（圆角 + 深色边框 +
// 投影 + 内部滚动），iframe 以 390 宽渲染，命中纯移动端断面；保留桌面切换以查看宽屏版式。
import { useState } from "react";
import { useEditorState, toDraft } from "../store/editorStore";
import { LandingPage } from "@/landing-renderer/LandingPage";
import { PreviewFrame } from "./PreviewFrame";

type Device = "mobile" | "desktop";
const DEVICE_WIDTH: Record<Device, number> = { mobile: 390, desktop: 1280 };

export function PreviewPane() {
  const state = useEditorState();
  const draft = toDraft(state);
  const [device, setDevice] = useState<Device>("mobile");

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

  const preview = (
    <PreviewFrame virtualWidth={DEVICE_WIDTH[device]}>
      <LandingPage page={draft} pageId="preview" preview />
    </PreviewFrame>
  );

  return (
    <div className="flex h-full flex-col bg-canvas">
      <div className="flex shrink-0 items-center justify-between border-b border-edge bg-panel px-4 py-2.5">
        <span className="text-xs font-medium text-ink">实时预览</span>
        <div className="flex items-center gap-1">
          {tab("mobile", "移动")}
          {tab("desktop", "桌面")}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <div className="flex h-full justify-center overflow-hidden p-5">
          {device === "mobile" ? (
            // 手机卡片：深色细边框 + 大圆角 + 投影
            <div className="h-full w-[390px] max-w-full overflow-hidden rounded-[2.25rem] border-[6px] border-slate-900 bg-white shadow-2xl">
              {preview}
            </div>
          ) : (
            // 桌面浏览器窗口：圆角边框 + 顶部三圆点标题栏 + 投影
            <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-edge bg-white shadow-2xl">
              <div className="flex shrink-0 items-center gap-1.5 border-b border-edge bg-canvas px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              </div>
              <div className="min-h-0 flex-1">{preview}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
