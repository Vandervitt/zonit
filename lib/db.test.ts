import { describe, expect, it, vi } from "vitest";
import pool from "./db";

describe("db pool", () => {
  it("swallows idle client errors instead of letting them become unhandled", () => {
    // EventEmitter throws synchronously if an 'error' event is emitted with no
    // listener attached. This reproduces the production symptom: an idle pg
    // connection dropped in the background ("Connection terminated unexpectedly")
    // bubbled up as an unhandled error into Sentry.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() =>
      pool.emit("error", new Error("Connection terminated unexpectedly")),
    ).not.toThrow();
    expect(warn).toHaveBeenCalledWith(
      "[db] idle pool client error:",
      "Connection terminated unexpectedly",
    );
    warn.mockRestore();
  });
});
