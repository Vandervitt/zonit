import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: () => authMock() }));
vi.mock("@/lib/super-admin/users-db", () => ({
  updateUserAdminFields: vi.fn(async () => true),
  getUserAdminDetail: vi.fn(async () => ({ id: "u2", email: "a@b.c", pages: [], leads_count: 0 })),
}));

import { PATCH, GET } from "./route";
import { updateUserAdminFields } from "@/lib/super-admin/users-db";

const SUPER = { user: { id: "admin1", role: "SUPER_ADMIN" } };
const NORMAL = { user: { id: "u1", role: "USER" } };

function patchReq(body: unknown) {
  return new Request("http://x/api/super-admin/users/u2", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}
const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => { vi.clearAllMocks(); authMock.mockResolvedValue(SUPER); });

describe("PATCH /api/super-admin/users/[id]", () => {
  it("非超管 → 403 且不更新", async () => {
    authMock.mockResolvedValue(NORMAL);
    const res = await PATCH(patchReq({ disabled: true }), params("u2"));
    expect(res.status).toBe(403);
    expect(updateUserAdminFields).not.toHaveBeenCalled();
  });
  it("未登录 → 401", async () => {
    authMock.mockResolvedValue(null);
    const res = await PATCH(patchReq({ disabled: true }), params("u2"));
    expect(res.status).toBe(401);
  });
  it("对自己改角色/禁用 → 400 且不更新", async () => {
    const res = await PATCH(patchReq({ disabled: true }), params("admin1"));
    expect(res.status).toBe(400);
    const res2 = await PATCH(patchReq({ role: "USER" }), params("admin1"));
    expect(res2.status).toBe(400);
    expect(updateUserAdminFields).not.toHaveBeenCalled();
  });
  it("非法 compPlan / role 值 → 400", async () => {
    expect((await PATCH(patchReq({ compPlan: "vip" }), params("u2"))).status).toBe(400);
    expect((await PATCH(patchReq({ role: "ADMIN" }), params("u2"))).status).toBe(400);
    expect((await PATCH(patchReq({}), params("u2"))).status).toBe(400);
  });
  it("合法更新（赠送 pro + 禁用，不带到期）→ 200 并透传数据层（到期不动）", async () => {
    const res = await PATCH(patchReq({ compPlan: "pro", disabled: true }), params("u2"));
    expect(res.status).toBe(200);
    expect(updateUserAdminFields).toHaveBeenCalledWith("u2", { compPlan: "pro", disabled: true });
  });
  it("取消赠送（compPlan: null）→ 200 并强制清空到期", async () => {
    const res = await PATCH(patchReq({ compPlan: null }), params("u2"));
    expect(res.status).toBe(200);
    expect(updateUserAdminFields).toHaveBeenCalledWith("u2", { compPlan: null, compPlanExpiresAt: null });
  });

  const future = new Date(Date.now() + 7 * 86400_000).toISOString();
  const past = new Date(Date.now() - 86400_000).toISOString();

  it("赠送 pro + 未来到期 → 200 并透传到期", async () => {
    const res = await PATCH(patchReq({ compPlan: "pro", compPlanExpiresAt: future }), params("u2"));
    expect(res.status).toBe(200);
    expect(updateUserAdminFields).toHaveBeenCalledWith("u2", { compPlan: "pro", compPlanExpiresAt: future });
  });
  it("赠送 pro + 到期为 null（永久）→ 200", async () => {
    const res = await PATCH(patchReq({ compPlan: "pro", compPlanExpiresAt: null }), params("u2"));
    expect(res.status).toBe(200);
    expect(updateUserAdminFields).toHaveBeenCalledWith("u2", { compPlan: "pro", compPlanExpiresAt: null });
  });
  it("赠送 + 过去到期 → 400 且不更新", async () => {
    const res = await PATCH(patchReq({ compPlan: "pro", compPlanExpiresAt: past }), params("u2"));
    expect(res.status).toBe(400);
    expect(updateUserAdminFields).not.toHaveBeenCalled();
  });
  it("赠送 + 非法日期 → 400", async () => {
    const res = await PATCH(patchReq({ compPlan: "pro", compPlanExpiresAt: "not-a-date" }), params("u2"));
    expect(res.status).toBe(400);
    expect(updateUserAdminFields).not.toHaveBeenCalled();
  });
});

describe("GET /api/super-admin/users/[id]", () => {
  it("非超管 → 403", async () => {
    authMock.mockResolvedValue(NORMAL);
    const res = await GET(patchReq({}), params("u2"));
    expect(res.status).toBe(403);
  });
  it("超管 → 200 返回详情", async () => {
    const res = await GET(patchReq({}), params("u2"));
    expect(res.status).toBe(200);
    expect((await res.json()).user.id).toBe("u2");
  });
});
