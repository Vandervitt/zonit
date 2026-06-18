"use client"; // 错误边界必须是 Client Component

import { useEffect } from "react";

// 段级错误边界：包裹 dashboard 与公开落地页渲染；保持中立英文文案（对外域名友好）。
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <p className="text-3xl font-semibold tracking-tight text-slate-900">Something went wrong</p>
      <p className="text-base text-slate-500">An error occurred while loading this page. Please try again.</p>
      <button
        onClick={() => unstable_retry()}
        className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        Try again
      </button>
    </main>
  );
}
