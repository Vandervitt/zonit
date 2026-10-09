import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: () => authMock() }));
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: { query } }));
vi.mock("@/lib/email", () => ({ sendAdminDirectEmail: vi.fn(async () => ({ success: true })) }));
vi.mock("@/lib/super-admin/users-db", () => ({ addUserNote: vi.fn(async () => true) }));
vi.mock("@/lib/platform-settings", () => ({ getFounderContact: vi.fn(async () => ({ email: "witt@urgizat.com" })) }));

import { POST } from "./route";
import { sendAdminDirectEmail } from "@/lib/email";
import { addUserNote } from "@/lib/super-admin/users-db";

const SUPER = { user: { id: "admin1", role: "SUPER_ADMIN" } };
const req = (body: unknown) =>
  new Request("http://x", { method: "POST", body: JSON.stringify(body) }) as unknown as import("next/server").NextRequest;
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const OK = { subject: "Quick question", body: "Hi there,\n\nHello" };

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue(SUPER);
  query.mockResolvedValue({ rows: [{ email: "user@example.com", disabled_at: null }] });
});

describe("POST /api/super-admin/users/[id]/email", () => {
  it("非超管 403，不发信", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "USER" } });
    expect((await POST(req(OK), params("u2"))).status).toBe(403);
    expect(sendAdminDirectEmail).not.toHaveBeenCalled();
  });

  it("主题或正文为空 / 超长 → 400", async () => {
    expect((await POST(req({ subject: " ", body: "x" }), params("u2"))).status).toBe(400);
    expect((await POST(req({ subject: "x", body: "" }), params("u2"))).status).toBe(400);
    expect((await POST(req({ subject: "x".repeat(201), body: "x" }), params("u2"))).status).toBe(400);
    expect(sendAdminDirectEmail).not.toHaveBeenCalled();
  });

  it("收件地址取自库里的用户邮箱，忽略请求体里的 to", async () => {
    const res = await POST(req({ ...OK, to: "attacker@evil.com" }), params("u2"));
    expect(res.status).toBe(200);
    expect(sendAdminDirectEmail).toHaveBeenCalledWith({
      to: "user@example.com", subject: "Quick question", text: OK.body, replyTo: "witt@urgizat.com",
    });
  });

  it("发送成功后自动记一条跟进备注", async () => {
    await POST(req(OK), params("u2"));
    expect(addUserNote).toHaveBeenCalledWith("u2", "admin1", "发送邮件：Quick question");
  });

  it("用户不存在 404；已禁用 409；均不发信", async () => {
    query.mockResolvedValueOnce({ rows: [] });
    expect((await POST(req(OK), params("nope"))).status).toBe(404);
    query.mockResolvedValueOnce({ rows: [{ email: "a@b.c", disabled_at: "2026-10-01" }] });
    expect((await POST(req(OK), params("u2"))).status).toBe(409);
    expect(sendAdminDirectEmail).not.toHaveBeenCalled();
  });

  it("发送失败 502 且不记备注（避免以为发了）", async () => {
    vi.mocked(sendAdminDirectEmail).mockResolvedValueOnce({ error: "boom" } as never);
    expect((await POST(req(OK), params("u2"))).status).toBe(502);
    expect(addUserNote).not.toHaveBeenCalled();
  });
});
