import { describe, it, expect, vi, beforeEach } from "vitest";

// mock Resend SDK 捕获 send 入参：验证周报邮件的主题与正文组装（本地网络发不出真件）。
// env 必须在 vi.hoisted 里设：lib/email 在模块顶层读 RESEND_API_KEY，import 会被提升到赋值之前。
const { sendMock } = vi.hoisted(() => {
  process.env.RESEND_API_KEY = "re_test_key";
  return { sendMock: vi.fn() };
});
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

import { sendWeeklyDigestEmail } from "./email";

beforeEach(() => {
  sendMock.mockReset();
  sendMock.mockResolvedValue({ data: { id: "email-1" }, error: null });
});

describe("sendWeeklyDigestEmail", () => {
  const pages = [
    { name: "Page <A>", views: 12, ctaClicks: 5, leads: 3, viewsTrend: "↑50%", ctaTrend: "新增", leadsTrend: "↑200%" },
    { name: "Page B", views: 0, ctaClicks: 0, leads: 0, viewsTrend: "—", ctaTrend: "—", leadsTrend: "—" },
  ];

  it("主题含总线索数，正文含各页名称、指标与环比，页名做 HTML 转义", async () => {
    const r = await sendWeeklyDigestEmail({
      to: "a@x.com",
      pages,
      dashboardUrl: "https://app.example/admin/analytics",
      settingsUrl: "https://app.example/admin/settings",
    });
    expect(r).toMatchObject({ success: true });
    const arg = sendMock.mock.calls[0][0];
    expect(arg.to).toEqual(["a@x.com"]);
    expect(arg.subject).toContain("3 条新线索");
    expect(arg.html).toContain("Page &lt;A&gt;");
    expect(arg.html).toContain("↑50%");
    expect(arg.html).toContain("https://app.example/admin/analytics");
    expect(arg.html).toContain("https://app.example/admin/settings");
  });

  it("Resend API 层报错时返回 error 而非静默成功", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "boom" } });
    const r = await sendWeeklyDigestEmail({ to: "a@x.com", pages, dashboardUrl: "u", settingsUrl: "s" });
    expect("error" in r).toBe(true);
  });
});
