import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: () => authMock() }));
vi.mock("@/lib/super-admin/users-db", () => ({ addUserNote: vi.fn(async () => true) }));

import { POST } from "./route";
import { addUserNote } from "@/lib/super-admin/users-db";

const SUPER = { user: { id: "admin1", role: "SUPER_ADMIN" } };
const req = (body: unknown) =>
  new Request("http://x", { method: "POST", body: JSON.stringify(body) }) as unknown as import("next/server").NextRequest;
const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => { vi.clearAllMocks(); authMock.mockResolvedValue(SUPER); });

describe("POST /api/super-admin/users/[id]/notes", () => {
  it("非超管 403、未登录 401，均不写入", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "USER" } });
    expect((await POST(req({ body: "x" }), params("u2"))).status).toBe(403);
    authMock.mockResolvedValue(null);
    expect((await POST(req({ body: "x" }), params("u2"))).status).toBe(401);
    expect(addUserNote).not.toHaveBeenCalled();
  });

  it("空白或超长内容 400", async () => {
    expect((await POST(req({ body: "   " }), params("u2"))).status).toBe(400);
    expect((await POST(req({ body: "a".repeat(2001) }), params("u2"))).status).toBe(400);
    expect((await POST(req({}), params("u2"))).status).toBe(400);
    expect(addUserNote).not.toHaveBeenCalled();
  });

  it("合法内容去首尾空白后写入，作者取会话用户", async () => {
    const res = await POST(req({ body: "  10-08 已发回访邮件 " }), params("u2"));
    expect(res.status).toBe(201);
    expect(addUserNote).toHaveBeenCalledWith("u2", "admin1", "10-08 已发回访邮件");
  });

  it("目标用户不存在 404", async () => {
    vi.mocked(addUserNote).mockResolvedValueOnce(false);
    expect((await POST(req({ body: "x" }), params("nope"))).status).toBe(404);
  });
});
