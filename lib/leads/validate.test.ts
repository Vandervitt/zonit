import { describe, it, expect } from "vitest";
import { validateLeadSubmission } from "./validate";

describe("validateLeadSubmission", () => {
  it("有联系方式 → ok，清洗后只留非空字段并截断", () => {
    const r = validateLeadSubmission({ name: "  Tom ", email: "tom@x.com", phone: "", message: "hi" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.payload).toEqual({ name: "Tom", email: "tom@x.com", message: "hi" });
  });
  it("无任何联系方式 → 拒（name/message 不算）", () => {
    const r = validateLeadSubmission({ name: "Tom", message: "hi" });
    expect(r.ok).toBe(false);
  });
  it("email 缺 @ → 拒", () => {
    const r = validateLeadSubmission({ email: "invalid" });
    expect(r.ok).toBe(false);
  });
  it("phone 非 E.164 → 拒（表单强制携带国码，缺国码的号码后台联系不了）", () => {
    expect(validateLeadSubmission({ phone: "abc123" }).ok).toBe(false);
    expect(validateLeadSubmission({ phone: "5551234567" }).ok).toBe(false);
    expect(validateLeadSubmission({ phone: "+1 555 123 4567" }).ok).toBe(false);
  });
  it("phone 为 E.164 → 通过", () => {
    const r = validateLeadSubmission({ phone: "+15551234567" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.payload.phone).toBe("+15551234567");
  });
  it("whatsapp 同样必须是 E.164", () => {
    expect(validateLeadSubmission({ whatsapp: "+1 555 0100" }).ok).toBe(false);
    expect(validateLeadSubmission({ whatsapp: "+15550100999" }).ok).toBe(true);
  });
  it("telegram 归一为裸用户名；跳不了 t.me 的输入 → 拒", () => {
    const r = validateLeadSubmission({ telegram: "https://t.me/johndoe" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.payload.telegram).toBe("johndoe");
    expect(validateLeadSubmission({ telegram: "13800138000" }).ok).toBe(false);
  });
  it("超长字段被截断", () => {
    const long = "x".repeat(300);
    const r = validateLeadSubmission({ email: "a@b.com", name: long });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.payload.name!.length).toBe(200);
  });
});
