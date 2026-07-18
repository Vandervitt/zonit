import { describe, it, expect } from "vitest";
import { decideNotify } from "./notify";

const base = { email: "a@b.com", email_enabled: true, webhook_enabled: true, webhook_url: "https://h", planAllowsWebhook: true };

describe("decideNotify 门控", () => {
  it("全开 → 邮件+webhook", () => expect(decideNotify(base)).toEqual({ email: true, webhook: true }));
  it("套餐不允许 webhook → 仅邮件", () => expect(decideNotify({ ...base, planAllowsWebhook: false })).toEqual({ email: true, webhook: false }));
  it("webhook 开关关 → 仅邮件", () => expect(decideNotify({ ...base, webhook_enabled: false })).toEqual({ email: true, webhook: false }));
  it("无 webhook URL → 仅邮件", () => expect(decideNotify({ ...base, webhook_url: null })).toEqual({ email: true, webhook: false }));
  it("邮件开关关 → 无邮件", () => expect(decideNotify({ ...base, email_enabled: false }).email).toBe(false));
  it("无邮箱 → 无邮件", () => expect(decideNotify({ ...base, email: null }).email).toBe(false));
});
