// landing-renderer/sections/LeadForm.test.ts
// 留资表单的两条硬约束：
//  1) 字段标签必须是英文（面向海外访客的落地页，渲染出中文标签属于产品缺陷）；
//  2) 必须带稳定锚点 id，否则 CTA 无法把访客送到表单，表单永远做不成主转化路径。
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LeadForm } from "./LeadForm";
import { LEAD_FORM_ANCHOR_ID } from "./LeadForm";
import type { RendererTheme } from "../theme";
import type { LeadForm as LeadFormData, LeadFormFieldConfig } from "@/types/schema.draft";

const theme = { accentGradient: "bg-a", accentShadow: "shadow-c" } as RendererTheme;

const on = (label?: string): LeadFormFieldConfig => ({ enabled: true, required: false, label });
const off: LeadFormFieldConfig = { enabled: false, required: false };

const data = (fields: Partial<LeadFormData["fields"]> = {}): LeadFormData => ({
  enabled: true,
  title: "Get a free quote",
  submitText: "Send",
  successMessage: "Thanks — we'll be in touch shortly.",
  fields: {
    name: on(),
    email: on(),
    phone: off,
    whatsapp: off,
    telegram: off,
    message: on(),
    ...fields,
  },
});

const html = (d: LeadFormData = data()) =>
  renderToStaticMarkup(createElement(LeadForm, { data: d, pageId: "p1", theme, preview: true }));

describe("LeadForm 字段标签", () => {
  it("缺省标签为英文，不得渲染出中文", () => {
    const out = html();
    expect(out).toContain("Name");
    expect(out).toContain("Email");
    expect(out).toContain("Message");
    // 中文标签会直接出现在面向海外访客的公开页上
    expect(out).not.toMatch(/姓名|邮箱|留言|电话/);
  });

  it("所有渠道字段的缺省标签都是英文", () => {
    const out = html(data({ phone: on(), whatsapp: on(), telegram: on() }));
    expect(out).toContain("Phone");
    expect(out).toContain("WhatsApp");
    expect(out).toContain("Telegram");
    expect(out).not.toMatch(/姓名|邮箱|留言|电话/);
  });

  it("字段自带 label 时覆盖缺省值（供非英语市场自定义）", () => {
    const out = html(data({ name: on("Nombre"), email: on("Correo") }));
    expect(out).toContain("Nombre");
    expect(out).toContain("Correo");
    expect(out).not.toContain(">Name<");
  });
});

describe("LeadForm 锚点", () => {
  it("渲染出稳定锚点 id，供 CTA 以 #lead-form 直达", () => {
    expect(LEAD_FORM_ANCHOR_ID).toBe("lead-form");
    expect(html()).toContain(`id="${LEAD_FORM_ANCHOR_ID}"`);
  });
});
