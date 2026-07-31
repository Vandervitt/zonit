// 通知结果回写：客户要能分清「平台没发」和「发了没到」。
import { describe, it, expect, vi, beforeEach } from "vitest";

const queryMock = vi.fn();
const sendEmailMock = vi.fn();
const insertDeliveryMock = vi.fn();
const setEmailNotifyMock = vi.fn();
const setWebhookDeliveryMock = vi.fn();
const getUserPlanMock = vi.fn();

// after()：测试里直接同步执行回调，等价于响应发出后的那段。
vi.mock("next/server", () => ({ after: (fn: () => unknown) => fn() }));
vi.mock("@/lib/db", () => ({ default: { query: (...a: unknown[]) => queryMock(...a) } }));
vi.mock("@/lib/email", () => ({ sendLeadNotificationEmail: (...a: unknown[]) => sendEmailMock(...a) }));
vi.mock("@/lib/webhooks/deliveries-store", () => ({ insertDelivery: (...a: unknown[]) => insertDeliveryMock(...a) }));
vi.mock("@/lib/webhooks/dispatch", () => ({ enqueueAndFlush: vi.fn() }));
vi.mock("@/lib/plans-db", () => ({ getUserPlan: (...a: unknown[]) => getUserPlanMock(...a) }));
vi.mock("./store", () => ({
  setLeadEmailNotify: (...a: unknown[]) => setEmailNotifyMock(...a),
  setLeadWebhookDelivery: (...a: unknown[]) => setWebhookDeliveryMock(...a),
}));

import { notifyNewLead } from "./notify";

const owner = (over: Record<string, unknown> = {}) => ({
  rows: [{
    user_id: "u1", page_name: "Solar", email: "owner@example.com",
    email_enabled: true, webhook_enabled: false, webhook_url: null, ...over,
  }],
});

const input = {
  pageId: "p1", leadId: "lead-1", fields: { name: "Ann" }, channel: "form",
  utm: {}, createdAt: new Date().toISOString(), dashboardUrl: "https://app/admin/leads",
};

beforeEach(() => {
  vi.clearAllMocks();
  queryMock.mockResolvedValue(owner());
  sendEmailMock.mockResolvedValue({ success: true });
  insertDeliveryMock.mockResolvedValue("42");
  getUserPlanMock.mockResolvedValue("pro");
});

describe("notifyNewLead 结果回写", () => {
  it("邮件发出 → 记 sent", async () => {
    await notifyNewLead(input);
    expect(setEmailNotifyMock).toHaveBeenCalledWith("lead-1", "sent", undefined);
  });

  it("邮件失败 → 记 failed 并带上错误文本", async () => {
    sendEmailMock.mockResolvedValue({ error: { message: "domain not verified" } });
    await notifyNewLead(input);
    expect(setEmailNotifyMock).toHaveBeenCalledWith("lead-1", "failed", "domain not verified");
  });

  it("Resend 未配置（error 为字符串）→ 同样记 failed", async () => {
    sendEmailMock.mockResolvedValue({ error: "not_configured" });
    await notifyNewLead(input);
    expect(setEmailNotifyMock).toHaveBeenCalledWith("lead-1", "failed", "not_configured");
  });

  it("开关关闭 → 记 off 而非留空（空白分不清没发还是没到）", async () => {
    queryMock.mockResolvedValue(owner({ email_enabled: false }));
    await notifyNewLead(input);
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(setEmailNotifyMock).toHaveBeenCalledWith("lead-1", "off");
  });

  it("webhook 入队 → 关联投递行 id（状态本身不复制，读取时联查）", async () => {
    queryMock.mockResolvedValue(owner({ webhook_enabled: true, webhook_url: "https://hook" }));
    await notifyNewLead(input);
    expect(setWebhookDeliveryMock).toHaveBeenCalledWith("lead-1", "42");
  });

  it("没有 leadId（兜底重投等旧调用）→ 不回写，也不报错", async () => {
    await notifyNewLead({ ...input, leadId: undefined });
    expect(setEmailNotifyMock).not.toHaveBeenCalled();
  });
});
