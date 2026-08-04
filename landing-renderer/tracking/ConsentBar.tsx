// landing-renderer/tracking/ConsentBar.tsx
"use client";

// 缺省文案为英文：生成页面向海外访客（52 套模板全为英文），而同意的前提是访客
// 读得懂 —— 原先这里硬编码中文，欧盟访客拿到的是一条看不懂的中文同意条，既谈不上
// 有效同意，观感也直接崩。需要其它语言时由 tracking.consent.text 逐页覆盖。
const DEFAULT_TEXT =
  "We use cookies and third-party analytics to measure how this page performs. Click “Accept” to agree.";

export function ConsentBar({ text, onAccept, onDecline }: { text?: string; onAccept: () => void; onDecline: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-slate-200 bg-white/95 px-5 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">{text || DEFAULT_TEXT}</p>
        <div className="flex shrink-0 gap-2">
          <button onClick={onDecline} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Decline</button>
          <button onClick={onAccept} className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">Accept</button>
        </div>
      </div>
    </div>
  );
}
