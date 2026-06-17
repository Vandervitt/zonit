"use client";
export function PublishDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="rounded-xl bg-panel p-6 text-sm text-ink" onClick={(e) => e.stopPropagation()}>
        发布弹框（待 Task 12 实现）
      </div>
    </div>
  );
}
