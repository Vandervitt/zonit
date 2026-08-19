"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pageCheckBatchPath } from "@/lib/constants";
import { localePath } from "@/lib/i18n/routes";
import type { Locale } from "@/lib/i18n/config";

type Copy = {
  heading: string;
  body: string;
  label: string;
  placeholder: string;
  submit: string;
  submitting: string;
  note: string;
  errors: Record<string, string>;
};

/** 与接口的 MAX_BATCH_URLS 对应。服务端仍会独立校验，这里只是提前拦住。 */
const MAX_URLS = 5;

function fill(text: string, data: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in data ? String(data[k]) : m));
}

/**
 * 多页对比的提交表单。
 *
 * 与单页表单一样，服务端只返回**机器可读的 code**，文案由本组件按 code 取字典。
 * 逐行输入而不是多个输入框：代运营方的 URL 通常已经在某个表格里，粘贴一列最省事。
 */
export function PageCheckBatchForm({ copy, locale }: { copy: Copy; locale: Locale }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urls = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (urls.length < 2) {
      setError(copy.errors.too_few_urls);
      return;
    }
    if (urls.length > MAX_URLS) {
      setError(fill(copy.errors.too_many_urls, { max: MAX_URLS }));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/tools/page-check/batch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ urls, locale }),
      });
      const data = (await res.json()) as { id?: string; error?: string; reason?: string };
      if (data.id) {
        router.push(localePath(locale, pageCheckBatchPath(data.id)));
        return;
      }
      // reason 比 error 更具体（如 scheme_not_https），优先用它取文案。
      const key = data.reason ?? data.error ?? "generic";
      setError(fill(copy.errors[key] ?? copy.errors.generic, { max: MAX_URLS }));
    } catch {
      setError(copy.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-12 rounded-2xl border border-border bg-white/60 p-6">
      <h2 className="text-base font-semibold text-foreground">{copy.heading}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {fill(copy.body, { max: MAX_URLS })}
      </p>
      <form onSubmit={submit} className="mt-5">
        <label htmlFor="page-check-batch" className="block text-sm font-medium text-foreground">
          {copy.label}
        </label>
        <textarea
          id="page-check-batch"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={copy.placeholder}
          className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 font-mono text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-aqua-400"
          aria-describedby={error ? "page-check-batch-error" : "page-check-batch-note"}
          aria-invalid={error ? true : undefined}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-gradient-to-r from-aqua-600 to-tech px-6 py-3 text-sm font-medium text-white shadow-sm shadow-aqua-600/25 transition-all hover:brightness-105 disabled:opacity-60"
          >
            {busy ? fill(copy.submitting, { n: urls.length }) : copy.submit}
          </button>
        </div>
        {error ? (
          <p id="page-check-batch-error" role="alert" className="mt-3 text-sm text-rose-600">
            {error}
          </p>
        ) : (
          <p
            id="page-check-batch-note"
            className="mt-3 text-xs leading-relaxed text-muted-foreground"
          >
            {copy.note}
          </p>
        )}
      </form>
    </section>
  );
}
