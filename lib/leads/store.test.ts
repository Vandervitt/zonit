import { describe, it, expect, vi, beforeEach } from "vitest";

const queryMock = vi.fn();
vi.mock("@/lib/db", () => ({ default: { query: (...a: unknown[]) => queryMock(...a) } }));

import { insertLead } from "./store";

const pgError = (code: string) => Object.assign(new Error(`pg ${code}`), { code });
const PAGE = "11111111-1111-4111-8111-111111111111";
const insert = () => insertLead(PAGE, { name: "Ann" } as never, { channel: "form" });

beforeEach(() => {
  vi.clearAllMocks();
  queryMock.mockResolvedValue({ rows: [{ id: "lead-1" }] });
});

describe("insertLead", () => {
  it("首次成功不重试，并返回线索 id（通知结果要回写到它上面）", async () => {
    expect(await insert()).toBe("lead-1");
    expect(queryMock).toHaveBeenCalledOnce();
  });

  it("瞬时故障重试一次即成功", async () => {
    queryMock.mockRejectedValueOnce(new Error("Connection terminated unexpectedly"));
    await insert();
    expect(queryMock).toHaveBeenCalledTimes(2);
  });

  it("重试仍失败 → 抛给调用方走兜底", async () => {
    queryMock.mockRejectedValue(pgError("57P01"));
    await expect(insert()).rejects.toMatchObject({ code: "57P01" });
    expect(queryMock).toHaveBeenCalledTimes(2);
  });

  it("坏 pageId 立即抛出，不浪费一次重试", async () => {
    queryMock.mockRejectedValue(pgError("23503"));
    await expect(insert()).rejects.toMatchObject({ code: "23503" });
    expect(queryMock).toHaveBeenCalledOnce();
  });
});
