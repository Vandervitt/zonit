import { describe, it, expect, vi, beforeEach } from "vitest";

const listTrialEmailCandidates = vi.fn();
const markTrialEmailSent = vi.fn();
const sendTrialEmail = vi.fn();

vi.mock("./trial-emails-db", () => ({ listTrialEmailCandidates, markTrialEmailSent }));
vi.mock("@/lib/email", () => ({ sendTrialEmail }));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

const { sweepTrialEmails } = await import("./trial-emails-sweep");

const NOW = new Date("2026-08-03T03:00:00Z");
const DAY = 86_400_000;

const candidate = (over: Partial<Record<string, unknown>> = {}) => ({
  userId: "u1",
  email: "a@example.com",
  expiresAt: new Date(NOW.getTime() + 2 * DAY),
  grantedPlan: "pro",
  fallbackPlan: "free",
  overQuota: false,
  sentStages: [],
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  markTrialEmailSent.mockResolvedValue(undefined);
});

describe("sweepTrialEmails", () => {
  it("发出后才标记，并计入对应阶段", async () => {
    listTrialEmailCandidates.mockResolvedValue([candidate()]);
    sendTrialEmail.mockResolvedValue({ success: true, data: {} });

    const r = await sweepTrialEmails(NOW, "https://app.test");

    expect(sendTrialEmail).toHaveBeenCalledOnce();
    expect(markTrialEmailSent).toHaveBeenCalledWith("u1", "t_minus_3", expect.any(Date));
    expect(r.sent.t_minus_3).toBe(1);
    expect(r.failed).toBe(0);
  });

  // 标记了却没发出去 = 这封信永远不会再发。宁可漏发也不能标记成功。
  it("发送失败不标记，计入 failed", async () => {
    listTrialEmailCandidates.mockResolvedValue([candidate()]);
    sendTrialEmail.mockResolvedValue({ error: "boom" });

    const r = await sweepTrialEmails(NOW, "https://app.test");

    expect(markTrialEmailSent).not.toHaveBeenCalled();
    expect(r.failed).toBe(1);
    expect(r.sent.t_minus_3).toBe(0);
  });

  it("不在任何窗口内的候选不发信", async () => {
    listTrialEmailCandidates.mockResolvedValue([
      candidate({ expiresAt: new Date(NOW.getTime() - 10 * DAY) }),
    ]);

    const r = await sweepTrialEmails(NOW, "https://app.test");

    expect(sendTrialEmail).not.toHaveBeenCalled();
    expect(r.scanned).toBe(1);
  });

  it("单个用户异常不影响其余用户", async () => {
    listTrialEmailCandidates.mockResolvedValue([
      candidate({ userId: "bad" }),
      candidate({ userId: "good", email: "b@example.com" }),
    ]);
    sendTrialEmail
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ success: true, data: {} });

    const r = await sweepTrialEmails(NOW, "https://app.test");

    expect(r.failed).toBe(1);
    expect(r.sent.t_minus_3).toBe(1);
  });
});
