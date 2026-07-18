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

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : undefined;
}

interface FbqWin {
  fbq?: (...a: unknown[]) => void;
  ttq?: { track?: (n: string, p?: unknown, o?: unknown) => void };
}

/** 表单转化双发客户端 pixel（与服务端 CAPI 同 event_id 去重）；返回 tracking 是否被允许（pixel 全局存在即视为已同意）。 */
function fireClientPixels(eventId: string): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as FbqWin;
  let fired = false;
  if (typeof w.fbq === "function") { w.fbq("track", "Lead", {}, { eventID: eventId }); fired = true; }
  if (w.ttq?.track) { w.ttq.track("SubmitForm", {}, { event_id: eventId }); fired = true; }
  return fired;
}

export function LeadForm({ data, pageId, theme, preview = false }: { data: LeadFormData; pageId: string; theme: RendererTheme; preview?: boolean }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [honey, setHoney] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const active = FIELD_ORDER.filter((k) => data.fields[k].enabled);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (preview) return; // 预览模式：不写入真实线索
    setStatus("sending");
    try {
      const utm = typeof window !== "undefined" ? parseUtm(window.location.search) : {};
      const eventId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      const consent = fireClientPixels(eventId); // 同时作为"追踪是否允许"信号
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId, channel: "form", fields: values, utm, company_url: honey,
          event_id: eventId,
          fbp: readCookie("_fbp"),
          fbc: readCookie("_fbc"),
          ttp: readCookie("_ttp"),
          ttclid: readCookie("ttclid"),
          source_url: typeof window !== "undefined" ? window.location.href : undefined,
          consent,
        }),
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
            disabled={status === "sending" || preview}
            className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white transition disabled:opacity-60 ${theme.accentGradient} ${theme.accentGradientHover} ${theme.accentShadow}`}
          >
            {preview ? "预览模式不可提交" : status === "sending" ? "提交中…" : data.submitText}
          </button>
          {preview ? <p className="text-center text-xs text-slate-500">预览模式：留资表单已停用，正式发布后可正常收集线索</p> : null}
          {status === "error" ? <p className="text-center text-sm text-red-600">提交失败，请检查后重试</p> : null}
        </form>
      </div>
    </section>
  );
}
