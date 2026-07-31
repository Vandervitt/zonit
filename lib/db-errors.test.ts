import { describe, it, expect } from "vitest";
import { isBadPageIdError } from "./db-errors";

const pgError = (code: string) => Object.assign(new Error(`pg ${code}`), { code });

describe("isBadPageIdError", () => {
  it("FK 违约与非法 uuid 判为坏 pageId", () => {
    expect(isBadPageIdError(pgError("23503"))).toBe(true);
    expect(isBadPageIdError(pgError("22P02"))).toBe(true);
  });

  it("连接类/未知错误不得被当成坏 pageId 丢弃", () => {
    expect(isBadPageIdError(pgError("57P01"))).toBe(false);
    expect(isBadPageIdError(pgError("53300"))).toBe(false);
    expect(isBadPageIdError(new Error("Connection terminated unexpectedly"))).toBe(false);
    expect(isBadPageIdError(null)).toBe(false);
    expect(isBadPageIdError(undefined)).toBe(false);
  });
});
