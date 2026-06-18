"use client"; // 错误边界必须是 Client Component

import { useEffect } from "react";
import "./globals.css";

// 根布局级错误回退：替换 root layout，必须自带 html/body。
export default function GlobalError({
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
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
        <p className="text-3xl font-semibold tracking-tight text-slate-900">Something went wrong</p>
        <p className="text-base text-slate-500">A server error occurred. Please try again.</p>
        <button
          onClick={() => unstable_retry()}
          className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
