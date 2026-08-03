"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Routes, pageCheckReportPath } from "@/lib/constants";
import { localePath } from "@/lib/i18n/routes";
import type { Locale } from "@/lib/i18n/config";

type Copy = {
  heading: string;
  bodyAnon: string;
  bodyUser: string;
  cta: string;
  running: string;
  signIn: string;
  errors: Record<string, string>;
};

/**
 * 实测确认入口——楔子的转化点。
 *
 * 匿名用户看到的是「为什么值得登录」而不是一个会失败的按钮：
 * 让人点了才发现要登录，比一开始就说清楚更糟。
 */
export function PageCheckVerify({
  reportId,
  signedIn,
  copy,
  locale,
}: {
  reportId: string;
  signedIn: boolean;
  copy: Copy;
  locale: Locale;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verify() {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/tools/page-check/${reportId}/verify`, { method: "POST" });
      const data = (await res.json()) as { id?: string; error?: string };
      if (data.id) {
        router.push(localePath(locale, pageCheckReportPath(data.id)));
        return;
      }
      setError(copy.errors[data.error ?? "generic"] ?? copy.errors.generic);
    } catch {
      setError(copy.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-aqua-200 bg-aqua-50/40 p-6">
      <h2 className="text-base font-semibold text-foreground">{copy.heading}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {signedIn ? copy.bodyUser : copy.bodyAnon}
      </p>
      {signedIn ? (
        <button
          type="button"
          onClick={verify}
          disabled={busy}
          className="mt-4 rounded-xl bg-gradient-to-r from-aqua-600 to-tech px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-aqua-600/25 transition-all hover:brightness-105 disabled:opacity-60"
        >
          {busy ? copy.running : copy.cta}
        </button>
      ) : (
        <Link
          href={localePath(locale, Routes.Login)}
          className="mt-4 inline-block rounded-xl bg-gradient-to-r from-aqua-600 to-tech px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-aqua-600/25 transition-all hover:brightness-105"
        >
          {copy.signIn}
        </Link>
      )}
      {error && (
        <p id="page-check-verify-error" role="status" className="mt-3 text-sm text-rose-600">
          {error}
        </p>
      )}
    </section>
  );
}
