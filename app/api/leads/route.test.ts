import { describe, it, expect, vi, beforeEach } from "vitest";

const insertLeadMock = vi.fn();
const spoolLeadMock = vi.fn();
const captureExceptionMock = vi.fn();
const enqueueCapiEventsMock = vi.fn();
const notifyNewLeadMock = vi.fn();
const recordFirstLeadMilestoneMock = vi.fn();

vi.mock("@/auth", () => ({ auth: vi.fn() }));
// 只替换 insertLead（要注入故障）；错误分类沿用真实实现，保证测的是真逻辑。
vi.mock("@/lib/leads/store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/leads/store")>()),
  insertLead: (...a: unknown[]) => insertLeadMock(...a),
}));
vi.mock("@/lib/leads/spool", () => ({ spoolLead: (...a: unknown[]) => spoolLeadMock(...a) }));
vi.mock("@sentry/nextjs", () => ({ captureException: (...a: unknown[]) => captureExceptionMock(...a) }));
vi.mock("@/lib/capi/dispatch", () => ({ enqueueCapiEvents: (...a: unknown[]) => enqueueCapiEventsMock(...a) }));
vi.mock("@/lib/leads/notify", () => ({ notifyNewLead: (...a: unknown[]) => notifyNewLeadMock(...a) }));
vi.mock("@/lib/platform-milestones", () => ({
  recordFirstLeadMilestone: (...a: unknown[]) => recordFirstLeadMilestoneMock(...a),
}));

import { POST } from "./route";
import type { NextRequest } from "next/server";

/** 每个用例换一个 IP：限频是进程内单例，跨用例累计会误触 429。 */
let ipSeq = 0;
const req = (body: unknown): NextRequest =>
  new Request("https://tenant.example/api/leads", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${++ipSeq}` },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;

const VALID = { pageId: "11111111-1111-4111-8111-111111111111", fields: { name: "Ann", email: "ann@example.com" } };

/** 模拟 pg 驱动错误：带 code 字段。 */
const pgError = (code: string) => Object.assign(new Error(`pg ${code}`), { code });

beforeEach(() => {
  vi.clearAllMocks();
  insertLeadMock.mockResolvedValue(undefined);
  spoolLeadMock.mockResolvedValue(undefined);
  enqueueCapiEventsMock.mockResolvedValue(undefined);
  notifyNewLeadMock.mockResolvedValue(undefined);
  recordFirstLeadMilestoneMock.mockResolvedValue(undefined);
});

describe("POST /api/leads 落库失败处理", () => {
  it("落库成功 → 204", async () => {
    const res = await POST(req(VALID));
    expect(res.status).toBe(204);
    expect(insertLeadMock).toHaveBeenCalledOnce();
    expect(spoolLeadMock).not.toHaveBeenCalled();
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("非坏 pageId 的落库失败（连接中断等）→ 503 而非假成功，且上报 Sentry", async () => {
    insertLeadMock.mockRejectedValue(new Error("Connection terminated unexpectedly"));
    const res = await POST(req(VALID));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "lead_store_failed" });
    expect(captureExceptionMock).toHaveBeenCalledOnce();
  });

  it("非坏 pageId 的落库失败 → payload 进兜底留存待重投", async () => {
    insertLeadMock.mockRejectedValue(pgError("57P01")); // admin_shutdown
    await POST(req(VALID));
    expect(spoolLeadMock).toHaveBeenCalledOnce();
    expect(spoolLeadMock.mock.calls[0][0]).toMatchObject({
      pageId: VALID.pageId,
      payload: { name: "Ann", email: "ann@example.com" },
    });
  });

  it("兜底留存也失败 → 仍返回 503（不吞成 204）", async () => {
    insertLeadMock.mockRejectedValue(new Error("pool exhausted"));
    spoolLeadMock.mockRejectedValue(new Error("blob down"));
    const res = await POST(req(VALID));
    expect(res.status).toBe(503);
    expect(captureExceptionMock).toHaveBeenCalledTimes(2);
  });

  it("坏 pageId（FK 违约 23503）→ 静默 204，不上报不留存", async () => {
    insertLeadMock.mockRejectedValue(pgError("23503"));
    const res = await POST(req(VALID));
    expect(res.status).toBe(204);
    expect(captureExceptionMock).not.toHaveBeenCalled();
    expect(spoolLeadMock).not.toHaveBeenCalled();
  });

  it("坏 pageId（非法 uuid 22P02）→ 静默 204，不上报不留存", async () => {
    insertLeadMock.mockRejectedValue(pgError("22P02"));
    const res = await POST(req({ ...VALID, pageId: "not-a-uuid" }));
    expect(res.status).toBe(204);
    expect(captureExceptionMock).not.toHaveBeenCalled();
    expect(spoolLeadMock).not.toHaveBeenCalled();
  });

  it("里程碑记录失败不影响已落库线索 → 仍 204 且不重复留存", async () => {
    recordFirstLeadMilestoneMock.mockRejectedValue(new Error("milestone table locked"));
    const res = await POST(req(VALID));
    expect(res.status).toBe(204);
    expect(spoolLeadMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/leads 旁路失败仍留日志", () => {
  it("CAPI 入队失败 → 不阻塞 204，但上报 Sentry", async () => {
    enqueueCapiEventsMock.mockRejectedValue(new Error("capi boom"));
    const res = await POST(req(VALID));
    expect(res.status).toBe(204);
    expect(captureExceptionMock).toHaveBeenCalledOnce();
  });

  it("通知失败 → 不阻塞 204，但上报 Sentry", async () => {
    notifyNewLeadMock.mockRejectedValue(new Error("smtp boom"));
    const res = await POST(req(VALID));
    expect(res.status).toBe(204);
    expect(captureExceptionMock).toHaveBeenCalledOnce();
  });
});
