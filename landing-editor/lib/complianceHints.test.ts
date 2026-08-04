import { describe, it, expect } from "vitest";
import { collectComplianceHints } from "./complianceHints";
import { collectPublishIssues } from "./publishIssues";
import { hairTransplantDraft } from "@/landing-editor/samples/hairTransplantDraft";
import type { LandingPageDraft } from "@/types/schema.draft";

const withCompany = (): LandingPageDraft => ({
  ...hairTransplantDraft,
  footer: { ...hairTransplantDraft.footer, companyProfileId: "cp1" },
  contact: { ...hairTransplantDraft.contact, email: "hi@acme.example" },
});

describe("合规提示", () => {
  it("模板本身（未选主体）会提示补经营主体", () => {
    const messages = collectComplianceHints(hairTransplantDraft).map((h) => h.message);
    expect(messages.some((m) => m.includes("经营主体"))).toBe(true);
  });

  it("选了主体后该提示消失", () => {
    const messages = collectComplianceHints(withCompany()).map((h) => h.message);
    expect(messages.some((m) => m.includes("经营主体"))).toBe(false);
  });

  it("政策文字过短会被点出来", () => {
    const draft = { ...withCompany(), footer: { ...withCompany().footer, privacyPolicy: "Privacy" } };
    expect(collectComplianceHints(draft).some((h) => h.message.includes("隐私政策"))).toBe(true);
  });

  it("只有即时通讯渠道时提示缺可核实联系方式", () => {
    const base = withCompany();
    const draft: LandingPageDraft = {
      ...base,
      contact: { primary: "whatsapp", whatsapp: "+441234567890" },
    };
    expect(collectComplianceHints(draft).some((h) => h.message.includes("邮箱或电话"))).toBe(true);
  });

  it("有邮箱或电话即视为可核实", () => {
    const base = withCompany();
    const onlyPhone: LandingPageDraft = {
      ...base,
      contact: { primary: "whatsapp", whatsapp: "+441234567890", phone: "+441234567890" },
    };
    expect(collectComplianceHints(onlyPhone).some((h) => h.message.includes("邮箱或电话"))).toBe(false);
  });

  // 这条是分界线：提示是「平台可能拒你」，发布门槛是「技术上发不出去」。
  // 混进门槛就等于我们替平台判定过不过审 —— 既做不到，也不该做。
  it("提示不进发布门槛：有提示的页面照样可发布", () => {
    expect(collectComplianceHints(hairTransplantDraft).length).toBeGreaterThan(0);
    expect(collectPublishIssues(hairTransplantDraft)).toEqual([]);
  });
});
