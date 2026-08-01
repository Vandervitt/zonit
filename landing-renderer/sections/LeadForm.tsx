"use client";
// landing-renderer/sections/LeadForm.tsx
// 兜底留资表单：按 fields 配置渲染输入，含 honeypot，提交 POST /api/leads。
import { useCallback, useEffect, useRef, useState } from "react";
import { LEAD_FORM_ANCHOR_ID } from "./leadFormAnchor";
import type { LeadForm as LeadFormData } from "@/types/schema.draft";
import type { DialCode } from "@/lib/leads/dial-codes";
import { composeE164 } from "@/lib/leads/contact-format";
import type { RendererTheme } from "../theme";
import { parseUtm } from "../tracking/utm";
import { useFormTracking } from "../tracking/TrackingProvider";

// 落地页面向海外访客，故缺省标签为英文；需要其它语言时由 schema 的
// LeadFormFieldConfig.label 逐字段覆盖（见 types/schema.draft.ts）。
const FIELD_LABELS: Record<string, string> = {
  name: "Name", email: "Email", phone: "Phone", whatsapp: "WhatsApp", telegram: "Telegram", message: "Message",
};
const FIELD_ORDER = ["name", "email", "phone", "whatsapp", "telegram", "message"] as const;

/** 带国码选择器的字段。国码强制携带，故这两个字段的值在提交前会被拼成 E.164。 */
const DIAL_FIELDS = ["phone", "whatsapp"] as const;
type DialField = (typeof DIAL_FIELDS)[number];
const isDialField = (k: string): k is DialField => (DIAL_FIELDS as readonly string[]).includes(k);

/** 访客 IP 无法判定国家时的兜底，与服务端 dial-codes 的默认值一致。 */
const FALLBACK_DIAL: DialCode = { iso: "US", dial: "+1", name: "United States" };

/**
 * 服务端校验错误码 → 访客可读提示。
 * 校验收紧后 400 会变多（缺国码的号码、跳不了 t.me 的 Telegram），
 * 一律回落到「Something went wrong」会让访客不知道该改哪里。
 */
const ERROR_MESSAGES: Record<string, string> = {
  need_contact: "Please leave at least one way to reach you.",
  bad_email: "Please check your email address.",
  bad_phone: "Please check your phone number.",
  bad_whatsapp: "Please check your WhatsApp number.",
  bad_telegram: "Please enter your Telegram username, e.g. @yourname.",
  rate_limited: "Too many attempts. Please try again in a minute.",
};
const GENERIC_ERROR = "Something went wrong. Please try again.";

/**
 * 留资表单锚点：CTA 以 `#lead-form` 直达表单，使表单能作为主转化路径。
 * schema 保证每页至多一个 leadForm，故固定 id 不会重复。
 * 校验与发布门槛引用同一常量，见 landing-editor/lib/contactIssues.ts。
 */
// 锚点 id 的定义已移到 leadFormAnchor.ts —— 本文件是 "use client"，
// 服务端若从这里 import 常量会拿到客户端引用代理而非字符串值。
// 保留再导出仅为兼容既有 import；服务端代码请直接引 leadFormAnchor。
export { LEAD_FORM_ANCHOR_ID };

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

export function LeadForm({ data, pageId, theme, preview = false, defaultDial = FALLBACK_DIAL }: {
  data: LeadFormData;
  pageId: string;
  theme: RendererTheme;
  preview?: boolean;
  /** 服务端按访客 IP（x-vercel-ip-country）解析出的国码，作为选择器初值。 */
  defaultDial?: DialCode;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [honey, setHoney] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState(GENERIC_ERROR);
  // 首屏只揣着被选中的这一个国码；全表（200+ 项）在 idle 时按需拉取，见 loadDialCodes。
  const [dialCodes, setDialCodes] = useState<DialCode[]>([defaultDial]);
  const [dialIso, setDialIso] = useState<Record<DialField, string>>({ phone: defaultDial.iso, whatsapp: defaultDial.iso });
  const loadedRef = useRef(false);

  // 表单漏斗：访客第一次动表单就记一次 form_start，之后提交成功/失败各记一次。
  // 没有这三个事件就只能看到「有多少人来」，看不到「多少人开始填却没提交」。
  const trackForm = useFormTracking();
  const startedRef = useRef(false);
  const markStarted = useCallback(() => {
    if (startedRef.current || preview) return;
    startedRef.current = true;
    trackForm("form_start");
  }, [trackForm, preview]);

  const loadDialCodes = useCallback(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    // 动态 import：全量国码表落到独立 chunk，不进落地页首屏 bundle。
    import("@/lib/leads/dial-codes").then((m) => setDialCodes(m.DIAL_CODES)).catch(() => { loadedRef.current = false; });
  }, []);

  const needsDial = DIAL_FIELDS.some((k) => data.fields[k].enabled);
  useEffect(() => {
    if (!needsDial) return;
    // 空闲时预取，保证访客真正点开选择器时已经就绪；不占首屏关键路径。
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number; cancelIdleCallback?: (h: number) => void };
    if (w.requestIdleCallback) {
      const handle = w.requestIdleCallback(loadDialCodes);
      return () => w.cancelIdleCallback?.(handle);
    }
    const timer = window.setTimeout(loadDialCodes, 1200);
    return () => window.clearTimeout(timer);
  }, [needsDial, loadDialCodes]);

  const dialOf = (iso: string): string => dialCodes.find((c) => c.iso === iso)?.dial ?? defaultDial.dial;

  const active = FIELD_ORDER.filter((k) => data.fields[k].enabled);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (preview) return; // 预览模式：不写入真实线索
    setStatus("sending");
    try {
      // 号码在提交前拼成 E.164，落库即可直接用于 wa.me / 拨号，无需事后猜国码。
      const fields: Record<string, string> = { ...values };
      for (const k of DIAL_FIELDS) {
        if (fields[k]) fields[k] = composeE164(dialOf(dialIso[k]), fields[k]);
      }
      const utm = typeof window !== "undefined" ? parseUtm(window.location.search) : {};
      const eventId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      const consent = fireClientPixels(eventId); // 同时作为"追踪是否允许"信号
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId, channel: "form", fields, utm, company_url: honey,
          event_id: eventId,
          fbp: readCookie("_fbp"),
          fbc: readCookie("_fbc"),
          ttp: readCookie("_ttp"),
          ttclid: readCookie("ttclid"),
          source_url: typeof window !== "undefined" ? window.location.href : undefined,
          consent,
        }),
      });
      if (!res.ok && res.status !== 204) {
        const code = await res.json().then((d) => (typeof d?.error === "string" ? d.error : "")).catch(() => "");
        setErrorMsg(ERROR_MESSAGES[code] ?? GENERIC_ERROR);
        setStatus("error");
        trackForm("form_error", code || "unknown");
        return;
      }
      setStatus("done");
      setValues({});
      trackForm("form_submit");
    } catch {
      setErrorMsg(GENERIC_ERROR);
      setStatus("error");
      trackForm("form_error", "network");
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
    <section id={LEAD_FORM_ANCHOR_ID} className="scroll-mt-16 px-6 py-12">
      <div className="mx-auto max-w-md">
        <h2 className="text-center text-2xl font-bold text-slate-900">{data.title}</h2>
        {data.description ? <p className="mt-2 text-center text-sm text-slate-600">{data.description}</p> : null}
        <form className="mt-6 space-y-3" onSubmit={submit}>
          {active.map((k) => (
            <div key={k}>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {data.fields[k].label?.trim() || FIELD_LABELS[k]}{data.fields[k].required ? " *" : ""}
              </label>
              {k === "message" ? (
                <textarea
                  required={data.fields[k].required}
                  value={values[k] ?? ""}
                  onChange={(e) => { markStarted(); setValues((v) => ({ ...v, [k]: e.target.value })); }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                  rows={3}
                />
              ) : isDialField(k) ? (
                // 国码与本地号是一个整体控件：国码只能改选，不能清空，提交时拼成 E.164。
                <div className="flex gap-2">
                  <select
                    aria-label={`${data.fields[k].label?.trim() || FIELD_LABELS[k]} country code`}
                    value={dialIso[k]}
                    onChange={(e) => { markStarted(); setDialIso((d) => ({ ...d, [k]: e.target.value })); }}
                    onFocus={loadDialCodes}
                    className="w-20 shrink-0 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm focus:border-slate-500 focus:outline-none"
                  >
                    {dialCodes.map((c) => {
                      const full = `${c.dial} ${c.name}`;
                      // 被选中的那项只显示国码：原生 select 收起态显示的就是它，带上国名会被
                      // 浏览器截断成「+1 United Sta…」。展开时其余项仍显示全称，便于按国名找。
                      // aria-label 恒为全称，屏幕阅读器不会因此丢掉国家信息。
                      return (
                        <option key={c.iso} value={c.iso} aria-label={full}>
                          {c.iso === dialIso[k] ? c.dial : full}
                        </option>
                      );
                    })}
                  </select>
                  <input
                    type="tel"
                    inputMode="tel"
                    required={data.fields[k].required}
                    value={values[k] ?? ""}
                    onChange={(e) => { markStarted(); setValues((v) => ({ ...v, [k]: e.target.value })); }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                  />
                </div>
              ) : (
                <input
                  type={k === "email" ? "email" : "text"}
                  required={data.fields[k].required}
                  placeholder={k === "telegram" ? "@yourname" : undefined}
                  value={values[k] ?? ""}
                  onChange={(e) => { markStarted(); setValues((v) => ({ ...v, [k]: e.target.value })); }}
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
            {preview ? "Preview only" : status === "sending" ? "Sending…" : data.submitText}
          </button>
          {preview ? <p className="text-center text-xs text-slate-500">Preview mode — submissions are disabled until the page is published.</p> : null}
          {status === "error" ? <p className="text-center text-sm text-red-600">{errorMsg}</p> : null}
        </form>
      </div>
    </section>
  );
}
