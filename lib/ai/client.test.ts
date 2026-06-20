import { describe, it, expect, beforeEach } from "vitest";
import { setAiClient, getAiClient, resetAiClient } from "@/lib/ai/client";

describe("ai client 注入", () => {
  beforeEach(() => resetAiClient());

  it("可注入 fake 并被 getAiClient 返回", async () => {
    setAiClient({
      async completeJson<T>(): Promise<T> {
        return { slots: [{ id: "hero.title", text: "FAKE" }] } as unknown as T;
      },
    });
    const out = await getAiClient().completeJson({ system: "s", user: "u", schema: {}, schemaName: "x" });
    expect(out).toEqual({ slots: [{ id: "hero.title", text: "FAKE" }] });
  });
});
