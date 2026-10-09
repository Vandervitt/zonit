import { describe, it, expect, vi, beforeAll } from "vitest";

// Resend SDK v6 发送失败时不抛错，而是返回 { data: null, error }。
// 回归：曾有发信函数只 try/catch 不看返回值，把拒发当成「已发送」。
const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("resend", () => ({ Resend: class { emails = { send }; } }));

let email: typeof import("./email");
beforeAll(async () => {
  process.env.RESEND_API_KEY = "re_test";
  email = await import("./email");
});

const rejected = { data: null, error: { name: "validation_error", message: "domain not verified" } };

describe("Resend 以返回值报告的失败必须被识别", () => {
  it("线索通知邮件：拒发时返回 error（否则线索会被误记为已送达）", async () => {
    send.mockResolvedValueOnce(rejected);
    const r = await email.sendLeadNotificationEmail({
      to: "owner@example.com", pageName: "P", fields: { name: "A" }, dashboardUrl: "https://x",
    });
    expect("success" in r && r.success).toBeFalsy();
    expect(r).toHaveProperty("error");
  });

  it("反馈通知邮件：拒发时返回 error", async () => {
    send.mockResolvedValueOnce(rejected);
    const r = await email.sendFeedbackNotificationEmail({
      to: "admin@example.com", source: "general", message: "m", meta: {}, dashboardUrl: "https://x",
    });
    expect("success" in r && r.success).toBeFalsy();
  });

  it("超管一对一邮件：拒发时返回 error", async () => {
    send.mockResolvedValueOnce(rejected);
    const r = await email.sendAdminDirectEmail({ to: "u@example.com", subject: "s", text: "t", replyTo: null });
    expect("success" in r && r.success).toBeFalsy();
  });

  it("发送成功时仍返回 success", async () => {
    send.mockResolvedValueOnce({ data: { id: "e1" }, error: null });
    const r = await email.sendLeadNotificationEmail({
      to: "owner@example.com", pageName: "P", fields: {}, dashboardUrl: "https://x",
    });
    expect("success" in r && r.success).toBe(true);
  });
});
