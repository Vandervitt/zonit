// landing-renderer/tracking/ConsentBar.tsx
"use client";

const DEFAULT_TEXT = "我们使用 Cookie 与第三方分析像素来改善投放效果。点击「接受」即表示同意。";

export function ConsentBar({ text, onAccept, onDecline }: { text?: string; onAccept: () => void; onDecline: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-slate-200 bg-white/95 px-5 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">{text || DEFAULT_TEXT}</p>
        <div className="flex shrink-0 gap-2">
          <button onClick={onDecline} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">拒绝</button>
          <button onClick={onAccept} className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">接受</button>
        </div>
      </div>
    </div>
  );
}
