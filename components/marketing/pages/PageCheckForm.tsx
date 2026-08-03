"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pageCheckReportPath } from "@/lib/constants";
import { localePath } from "@/lib/i18n/routes";
import type { Locale } from "@/lib/i18n/config";

type Copy = {
  urlLabel: string;
  urlPlaceholder: string;
  submit: string;
  submitting: string;
  note: string;
  errors: Record<string, string>;
};

/**
 * 自检器输入表单。
 *
 * 服务端返回的错误一律是**机器可读的 code**（url_required / invalid_url + reason
 * / rate_limited …），文案由本组件按 code 从字典取——接口不返回面向用户的句子，
 * 否则双语与 API 就耦合了。
 */
export function PageCheckForm({ copy, locale }: { copy: Copy; locale: Locale }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (!url.trim()) {
      setError(copy.errors.url_required);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/tools/page-check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim(), locale }),
      });
      const data = (await res.json()) as { id?: string; error?: string; reason?: string };
      if (data.id) {
        router.push(localePath(locale, pageCheckReportPath(data.id)));
        return;
      }
      // reason 比 error 更具体（如 scheme_not_https），优先用它取文案。
      const key = data.reason ?? data.error ?? "generic";
      setError(copy.errors[key] ?? copy.errors.generic);
    } catch {
      setError(copy.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8">
      <label htmlFor="page-check-url" className="block text-sm font-medium text-foreground">
        {copy.urlLabel}
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <input
          id="page-check-url"
          type="url"
          inputMode="url"
          autoComplete="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={copy.urlPlaceholder}
          className="min-w-0 flex-1 rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-aqua-400"
          aria-describedby={error ? "page-check-error" : "page-check-note"}
          aria-invalid={error ? true : undefined}
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-xl bg-gradient-to-r from-aqua-600 to-tech px-6 py-3 text-sm font-medium text-white shadow-sm shadow-aqua-600/25 transition-all hover:brightness-105 disabled:opacity-60"
        >
          {busy ? copy.submitting : copy.submit}
        </button>
      </div>
      {error ? (
        <p id="page-check-error" role="alert" className="mt-3 text-sm text-rose-600">
          {error}
        </p>
      ) : (
        <p id="page-check-note" className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {copy.note}
        </p>
      )}
    </form>
  );
}
