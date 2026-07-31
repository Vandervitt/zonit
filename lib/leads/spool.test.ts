import { describe, it, expect, vi, beforeEach } from "vitest";

const putMock = vi.fn();
const listMock = vi.fn();
const getMock = vi.fn();
const delMock = vi.fn();
const insertLeadMock = vi.fn();

vi.mock("@vercel/blob", () => ({
  put: (...a: unknown[]) => putMock(...a),
  list: (...a: unknown[]) => listMock(...a),
  get: (...a: unknown[]) => getMock(...a),
  del: (...a: unknown[]) => delMock(...a),
}));
vi.mock("./store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./store")>()),
  insertLead: (...a: unknown[]) => insertLeadMock(...a),
}));

import { spoolLead, replaySpooledLeads, type SpooledLead } from "./spool";

const pgError = (code: string) => Object.assign(new Error(`pg ${code}`), { code });
const PAGE = "11111111-1111-4111-8111-111111111111";

const entry = (over: Partial<SpooledLead> = {}): SpooledLead => ({
  pageId: PAGE,
  payload: { name: "Ann", email: "ann@example.com" } as never,
  attr: { channel: "form" },
  spooledAt: new Date().toISOString(),
  ...over,
});

/** 模拟 blob get 的流式返回。 */
const blobOf = (e: SpooledLead) => ({
  statusCode: 200 as const,
  stream: new Response(JSON.stringify(e)).body,
});

beforeEach(() => {
  vi.clearAllMocks();
  putMock.mockResolvedValue({ url: "https://blob/x" });
  delMock.mockResolvedValue(undefined);
  insertLeadMock.mockResolvedValue(undefined);
});

describe("spoolLead", () => {
  it("写入 lead-spool/ 前缀且必须是 private（含访客 PII）", async () => {
    await spoolLead(entry());
    const [pathname, body, opts] = putMock.mock.calls[0];
    expect(pathname).toMatch(/^lead-spool\//);
    expect(JSON.parse(body as string)).toMatchObject({ pageId: PAGE });
    expect(opts).toMatchObject({ access: "private" });
  });
});

describe("replaySpooledLeads", () => {
  it("重投成功 → 落库并删除留存", async () => {
    const e = entry();
    listMock.mockResolvedValue({ blobs: [{ url: "https://blob/a", pathname: "lead-spool/a.json" }] });
    getMock.mockResolvedValue(blobOf(e));

    expect(await replaySpooledLeads()).toEqual({ replayed: 1, dropped: 0, pending: 0 });
    expect(insertLeadMock).toHaveBeenCalledWith(PAGE, e.payload, e.attr);
    expect(delMock).toHaveBeenCalledWith("https://blob/a");
  });

  it("重投仍失败 → 保留待下次，不删", async () => {
    listMock.mockResolvedValue({ blobs: [{ url: "https://blob/a", pathname: "lead-spool/a.json" }] });
    getMock.mockResolvedValue(blobOf(entry()));
    insertLeadMock.mockRejectedValue(new Error("still down"));

    expect(await replaySpooledLeads()).toEqual({ replayed: 0, dropped: 0, pending: 1 });
    expect(delMock).not.toHaveBeenCalled();
  });

  it("坏 pageId → 无救，丢弃留存", async () => {
    listMock.mockResolvedValue({ blobs: [{ url: "https://blob/a", pathname: "lead-spool/a.json" }] });
    getMock.mockResolvedValue(blobOf(entry()));
    insertLeadMock.mockRejectedValue(pgError("23503"));

    expect(await replaySpooledLeads()).toEqual({ replayed: 0, dropped: 1, pending: 0 });
    expect(delMock).toHaveBeenCalledOnce();
  });

  it("超过 7 天的留存直接丢弃，不再重投", async () => {
    const old = entry({ spooledAt: new Date(Date.now() - 8 * 86_400_000).toISOString() });
    listMock.mockResolvedValue({ blobs: [{ url: "https://blob/a", pathname: "lead-spool/a.json" }] });
    getMock.mockResolvedValue(blobOf(old));

    expect(await replaySpooledLeads()).toEqual({ replayed: 0, dropped: 1, pending: 0 });
    expect(insertLeadMock).not.toHaveBeenCalled();
  });

  it("单条读取异常不影响其余条目", async () => {
    listMock.mockResolvedValue({
      blobs: [
        { url: "https://blob/bad", pathname: "lead-spool/bad.json" },
        { url: "https://blob/ok", pathname: "lead-spool/ok.json" },
      ],
    });
    getMock.mockRejectedValueOnce(new Error("read fail")).mockResolvedValueOnce(blobOf(entry()));

    expect(await replaySpooledLeads()).toEqual({ replayed: 1, dropped: 0, pending: 1 });
  });
});
