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

describe("LeadForm 国码选择器", () => {
  const withPhone = data({ phone: on(), whatsapp: on() });

  it("phone / whatsapp 各带一个国码选择器，且没有空选项（国码不可移除）", () => {
    const out = html(withPhone);
    expect(out.match(/<select/g)?.length).toBe(2);
    expect(out).not.toContain("<option value=\"\"");
  });

  it("收起态只显示国码（长国名会被浏览器截断），但 aria-label 保留全称", () => {
    const out = html(withPhone);
    // 被选中项的可见文本只有国码
    expect(out).toContain(">+1</option>");
    expect(out).not.toContain(">+1 United States</option>");
    // 屏幕阅读器仍能拿到国家名
    expect(out).toContain('aria-label="+1 United States"');
  });

  it("默认国码来自服务端按访客 IP 解析的结果", () => {
    const out = renderToStaticMarkup(
      createElement(LeadForm, {
        data: withPhone,
        pageId: "p1",
        theme,
        preview: true,
        defaultDial: { iso: "BR", dial: "+55", name: "Brazil" },
      }),
    );
    expect(out).toContain("+55");
    expect(out).not.toContain("+1</option>");
  });

  it("首屏 HTML 只含被选中的那一个国码，全量表不进关键路径", () => {
    const out = html(withPhone);
    // 每个选择器只渲染 1 个 option；全表（200+ 项）由客户端 idle 时 import() 拉取
    expect(out.match(/<option/g)?.length).toBe(2);
    expect(out).not.toContain("Zimbabwe");
  });
});

describe("LeadForm 锚点", () => {
  it("渲染出稳定锚点 id，供 CTA 以 #lead-form 直达", () => {
    expect(LEAD_FORM_ANCHOR_ID).toBe("lead-form");
    expect(html()).toContain(`id="${LEAD_FORM_ANCHOR_ID}"`);
  });
});
