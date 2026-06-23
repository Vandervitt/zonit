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
  it("phone 非法字符 → 拒", () => {
    const r = validateLeadSubmission({ phone: "abc123" });
    expect(r.ok).toBe(false);
  });
  it("whatsapp 作为联系方式即可通过", () => {
    const r = validateLeadSubmission({ whatsapp: "+1 555 0100" });
    expect(r.ok).toBe(true);
  });
  it("超长字段被截断", () => {
    const long = "x".repeat(300);
    const r = validateLeadSubmission({ email: "a@b.com", name: long });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.payload.name!.length).toBe(200);
  });
});
