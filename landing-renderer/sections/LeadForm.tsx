"use client";
// landing-renderer/sections/LeadForm.tsx
// 兜底留资表单：按 fields 配置渲染输入，含 honeypot，提交 POST /api/leads。
import { useState } from "react";
import type { LeadForm as LeadFormData } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { parseUtm } from "../tracking/utm";

const FIELD_LABELS: Record<string, string> = {
  name: "姓名", email: "邮箱", phone: "电话", whatsapp: "WhatsApp", telegram: "Telegram", message: "留言",
};
const FIELD_ORDER = ["name", "email", "phone", "whatsapp", "telegram", "message"] as const;

export function LeadForm({ data, pageId, theme }: { data: LeadFormData; pageId: string; theme: RendererTheme }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [honey, setHoney] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const active = FIELD_ORDER.filter((k) => data.fields[k].enabled);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const utm = typeof window !== "undefined" ? parseUtm(window.location.search) : {};
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, channel: "form", fields: values, utm, company_url: honey }),
      });
      if (!res.ok && res.status !== 204) { setStatus("error"); return; }
      setStatus("done");
      setValues({});
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <section className="px-6 py-12 text-center">
        <p className="text-lg font-semibold text-slate-900">{data.successMessage}</p>
      </section>
    );
  }

  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-md">
        <h2 className="text-center text-2xl font-bold text-slate-900">{data.title}</h2>
        {data.description ? <p className="mt-2 text-center text-sm text-slate-600">{data.description}</p> : null}
        <form className="mt-6 space-y-3" onSubmit={submit}>
          {active.map((k) => (
            <div key={k}>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {FIELD_LABELS[k]}{data.fields[k].required ? " *" : ""}
              </label>
              {k === "message" ? (
                <textarea
                  required={data.fields[k].required}
                  value={values[k] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                  rows={3}
                />
              ) : (
                <input
                  type={k === "email" ? "email" : "text"}
                  required={data.fields[k].required}
                  value={values[k] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              )}
            </div>
          ))}
          {/* honeypot：正常用户不可见 */}
          <input
            type="text"
            name="company_url"
            value={honey}
            onChange={(e) => setHoney(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white transition disabled:opacity-60 ${theme.accentGradient} ${theme.accentGradientHover} ${theme.accentShadow}`}
          >
            {status === "sending" ? "提交中…" : data.submitText}
          </button>
          {status === "error" ? <p className="text-center text-sm text-red-600">提交失败，请检查后重试</p> : null}
        </form>
      </div>
    </section>
  );
}
