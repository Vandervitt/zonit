"use client";

import type { LeadFormSchema } from "@/types/schema";

const HIGHLIGHT_STYLE = "0 0 0 3px #3b82f6";

const BASE_FIELD_META = {
  name:     { label: "Full Name",  type: "text",  placeholder: "Jane Doe" },
  phone:    { label: "Phone",      type: "tel",   placeholder: "+1 555 000 1234" },
  email:    { label: "Email",      type: "email", placeholder: "you@example.com" },
  whatsapp: { label: "WhatsApp",   type: "text",  placeholder: "+1 555 000 1234" },
  telegram: { label: "Telegram",   type: "text",  placeholder: "@username" },
} as const;

export function LeadFormBlock({
  data,
  primaryColor,
  id,
  highlight,
}: {
  data: LeadFormSchema;
  primaryColor: string;
  id?: string;
  highlight?: boolean;
}) {
  const required = data.requiredFields.map(f => ({ id: f, ...BASE_FIELD_META[f], required: true }));
  const optional = (data.optionalFields ?? [])
    .filter(f => !data.requiredFields.includes(f))
    .map(f => ({ id: f, ...BASE_FIELD_META[f], required: false }));

  return (
    <section id={id} className="px-5 py-10" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <p className="text-lg text-center text-slate-800 mb-1">{data.title}</p>
      {data.subtitle && <p className="text-xs text-center text-slate-500 mb-5">{data.subtitle}</p>}
      <form id={data.id} className="space-y-2.5 max-w-md mx-auto" onSubmit={e => e.preventDefault()}>
        {[...required, ...optional].map(field => (
          <div key={field.id}>
            <label htmlFor={`${data.id}-${field.id}`} className="text-xs text-slate-600 mb-1 block">
              {field.label}
              {field.required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
            <input
              id={`${data.id}-${field.id}`}
              name={field.id}
              type={field.type}
              required={field.required}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 placeholder:text-slate-400"
            />
          </div>
        ))}
        {data.extraFields?.map(field =>
          field.type === "select" ? (
            <div key={field.id}>
              <label htmlFor={`${data.id}-${field.id}`} className="text-xs text-slate-600 mb-1 block">
                {field.label}
                {field.required && <span className="text-rose-500 ml-0.5">*</span>}
              </label>
              <select
                id={`${data.id}-${field.id}`}
                name={field.fieldKey}
                required={field.required}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
              >
                {(field.options ?? []).map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          ) : (
            <div key={field.id}>
              <label htmlFor={`${data.id}-${field.id}`} className="text-xs text-slate-600 mb-1 block">
                {field.label}
                {field.required && <span className="text-rose-500 ml-0.5">*</span>}
              </label>
              <input
                id={`${data.id}-${field.id}`}
                name={field.fieldKey}
                type="text"
                required={field.required}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 placeholder:text-slate-400"
              />
            </div>
          )
        )}
        {data.includeMessage !== false && (
          <div>
            <label htmlFor={`${data.id}-message`} className="text-xs text-slate-600 mb-1 block">Message</label>
            <textarea
              id={`${data.id}-message`}
              name="message"
              placeholder="Tell us what you need help with..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 placeholder:text-slate-400 min-h-[60px] resize-none"
            />
          </div>
        )}
        {data.consentText && (
          <p className="text-[10px] text-slate-400 leading-relaxed pt-1">{data.consentText}</p>
        )}
        <button
          type="submit"
          className="w-full py-2.5 rounded-full text-sm text-white mt-2"
          style={{ backgroundColor: primaryColor }}
        >
          {data.submitText}
        </button>
      </form>
    </section>
  );
}
